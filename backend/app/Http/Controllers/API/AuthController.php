<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Otp;
use App\Models\User;
use Carbon\Carbon;
use DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Str;
use Jenssegers\Agent\Agent;

class AuthController extends Controller
{
    public function updateLastOnline(Request $request)
    {
        $request->validate(['online' => 'required|boolean']);
        $user = Auth::user();
        $user->last_online_at = now('Asia/Jakarta');
        $user->save();

        return response()->json([
            'success' => true,
            'last_online_at' => $user->last_online_at,
        ]);
    }


    public function getUserById($id)
    {
        $user = User::findOrFail($id);
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'last_online_at' => $user->last_online_at,
        ]);
    }

    public function onload(Request $request)
    {
        return response()->json([
            'token' => $request->user()->currentAccessToken(),
            'role' => $request->user()->roles[0]->name
        ]);
    }

    public function updatePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'new_password' => 'required|min:6',
            'password_confirmation' => 'required|same:new_password',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'validation_errors' => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'status' => 401,
                'message' => 'User not found!',
            ], 401);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'status' => 200,
            'message' => 'Password updated successfully!',
        ], 200);
    }

    public function register(Request $request)
    {
        DB::beginTransaction();

        $validator = Validator::make($request->all(), [
            'name' => 'required|max:191|min:4|unique:users,name',
            'email' => 'required|email|max:191|unique:users,email',
            'phone_number' => [
                'required',
                'regex:/^(?:\+62|62|0|8)[0-9\s-]{8,15}$/'
            ],
            'password' => 'required|min:4',
            'passwordConfirm' => 'required|same:password|min:4',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        Log::info('Registration request data:', $request->all());

        if ($validator->fails()) {
            Log::warning('Validation failed', ['errors' => $validator->errors()]);
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Standarkan nomor telepon
            $cleanPhone = $this->standardizePhoneNumber($request->phone_number);

            // Validasi format akhir
            if (!preg_match('/^62\d{8,12}$/', $cleanPhone)) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Validation error',
                    'errors' => [
                        'phone_number' => [
                            'The phone number must start with 62 and contain 10–14 digits in total after cleaning.'
                        ],
                    ],
                ], 422);
            }

            // Buat user baru
            $user = new User();
            $user->name = $request->name;
            $user->email = $request->email;
            $user->phone_number = $cleanPhone;
            $user->password = Hash::make($request->password);
            $user->status = 1;
            $user->email_verified_at = null;

            // Upload gambar jika ada
            if ($request->hasFile('image')) {
                if ($user->avatar) {
                    // Ambil path relatif dari URL avatar
                    $relativePath = str_replace(url('storage') . '/', '', $user->avatar);

                    if (Storage::disk('public')->exists($relativePath)) {
                        Storage::disk('public')->delete($relativePath);
                    }
                }
                $avatarPath = $this->uploadAvatar($request->file('image'));
                $user->avatar = $avatarPath;
            }

            $user->save();

            // Simpan detail login

            // Assign role user
            try {
                $user->addRole('user');
            } catch (\Throwable $th) {
                Log::error('Failed to assign role', ['error' => $th->getMessage()]);
                throw new \Exception('Failed to assign user role.');
            }

            // Generate & kirim OTP
            $otp = $this->generateOtp($user, 'registration');
            if (!$this->sendOtp($user, $otp->otp_code, 'registration')) {
                Log::error('Failed to send OTP', [
                    'user_id' => $user->id,
                    'phone_number' => $user->phone_number
                ]);
                DB::rollBack();
                return response()->json([
                    'status' => 500,
                    'message' => 'Failed to send OTP via WhatsApp.',
                ], 500);
            }

            // Notifikasi internal
            $notification = new Notification();
            $notification->key = Str::random(5);
            $notification->label = 'New Registered';
            $notification->title = 'Registered#' . $user->name;
            $notification->user_id = $user->id;
            $notification->message = 'New user has joined, awaiting OTP verification';
            $notification->save();

            DB::commit();

            return response()->json([
                'status' => 201,
                'message' => 'User registered successfully. Please verify OTP sent to your WhatsApp.',
                'user_id' => $user->id,
                'phone_number' => $user->phone_number,
                'otp_expires_at' => $otp->expires_at,
            ], 201);

        } catch (\Illuminate\Database\QueryException $ex) {
            DB::rollBack();
            Log::error('Database error during registration', [
                'error' => $ex->getMessage(),
                'trace' => $ex->getTraceAsString(),
            ]);
            return response()->json([
                'status' => 500,
                'message' => 'Database error occurred while creating the user.',
                'error' => $ex->getMessage(),
            ], 500);

        } catch (\Throwable $th) {
            DB::rollBack();
            Log::error('Unexpected error during registration', [
                'error' => $th->getMessage(),
                'trace' => $th->getTraceAsString(),
            ]);
            return response()->json([
                'status' => 500,
                'message' => 'Registration failed. Please try again.',
                'error' => $th->getMessage(),
            ], 500);
        }
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'login' => 'required',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Tentukan apakah login via email atau no HP
            $loginField = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'phone_number';
            $loginValue = $loginField === 'phone_number'
                ? $this->standardizePhoneNumber($request->login)
                : $request->login;

            // Temukan user
            $user = User::where($loginField, $loginValue)->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json([
                    'status' => 401,
                    'message' => 'Invalid credentials.',
                ], 401);
            }

            // Simpan detail login
            $agent = new Agent();
            $agent->setUserAgent($request->header('User-Agent'));
            $device = [
                'platform' => $agent->platform(),
                'platform_version' => $agent->version($agent->platform()),
                'browser' => $agent->browser(),
                'browser_version' => $agent->version($agent->browser()),
                'is_mobile' => $agent->isMobile(),
                'is_desktop' => $agent->isDesktop(),
            ];

            // Jika sudah verifikasi OTP, langsung beri token
            if ($user->otp_verified) {
                $token = $user->createToken('auth_token')->plainTextToken;

                return response()->json([
                    'status' => 200,
                    'message' => 'Login successful.',
                    'token' => $token,
                    'user' => array_merge(
                        $user->only([
                            'id',
                            'name',
                            'email',
                            'phone_number',
                            'status',
                            'created_at',
                            'last_online_at',
                            'otp_verified',
                            'avatar',
                         ]),
                        [
                            'token' => $token,
                            'device' => $device,
                            'role' => $user->roles()->pluck('name')->first(),
                        ]
                    ),
                ], 200);
            }

            // Cek apakah masih ada OTP yang belum digunakan
            $existingOtp = Otp::where('user_id', $user->id)
                ->where('is_used', false)
                ->where('expires_at', '>', now())
                ->latest()
                ->first();

            if ($existingOtp) {
                if ($this->sendOtp($user, $existingOtp->otp_code, 'login')) {
                    return response()->json([
                        'status' => 200,
                        'message' => 'OTP resent successfully to WhatsApp.',
                        'otp_expires_at' => $existingOtp->expires_at,
                        'user_id' => $user->id,
                    ], 200);
                } else {
                    Log::error('Failed to resend OTP', [
                        'user_id' => $user->id,
                        'phone_number' => $user->phone_number,
                        'otp_code' => $existingOtp->otp_code,
                    ]);
                    $existingOtp->is_used = true;
                    $existingOtp->save();
                }
            }

            // Kirim OTP baru
            $otp = $this->generateOtp($user, 'login');
            if (!$this->sendOtp($user, $otp->otp_code, 'login')) {
                Log::error('Failed to send new OTP', [
                    'user_id' => $user->id,
                    'phone_number' => $user->phone_number,
                    'otp_code' => $otp->otp_code,
                ]);
                return response()->json([
                    'status' => 200,
                    'message' => 'OTP may have been sent to WhatsApp. Please check and verify, or contact support@yourapp.com if not received.',
                    'otp_expires_at' => $otp->expires_at,
                    'user_id' => $user->id,
                ], 200);
            }

            return response()->json([
                'status' => 200,
                'message' => 'OTP sent successfully to WhatsApp. Please verify to complete login.',
                'otp_expires_at' => $otp->expires_at,
                'user_id' => $user->id,
            ], 200);

        } catch (\Throwable $th) {
            Log::error('Login error', [
                'error' => $th->getMessage(),
                'trace' => $th->getTraceAsString(),
            ]);
            return response()->json([
                'status' => 500,
                'message' => 'Login failed. Please try again.',
                'error' => $th->getMessage(),
            ], 500);
        }
    }

    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'otp_code' => 'required|digits:6',
            'type' => 'required|in:registration,login,password_reset',
        ], [
            'user_id.required' => 'User ID is required.',
            'user_id.exists' => 'Invalid user ID.',
            'otp_code.required' => 'OTP code is required.',
            'otp_code.digits' => 'OTP code must be exactly 6 digits.',
            'type.required' => 'OTP type is required.',
            'type.in' => 'Invalid OTP type. Must be registration, login, or password_reset.',
        ]);

        if ($validator->fails()) {
            Log::warning('OTP verification validation failed', [
                'errors' => $validator->errors(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $otp = Otp::where('user_id', $request->user_id)
                ->where('otp_code', $request->otp_code)
                ->where('type', $request->type)
                ->where('is_used', false)
                ->where('expires_at', '>', now())
                ->first();

            if (!$otp) {
                Log::warning('Invalid or expired OTP', [
                    'user_id' => $request->user_id,
                    'otp_code' => $request->otp_code,
                    'type' => $request->type,
                ]);
                return response()->json([
                    'status' => 400,
                    'message' => 'Invalid or expired OTP.',
                ], 400);
            }

            $user = User::find($request->user_id);
            if (!$user) {
                Log::error('User not found', ['user_id' => $request->user_id]);
                return response()->json([
                    'status' => 404,
                    'message' => 'User not found.',
                ], 404);
            }

            // Mark OTP as used
            $otp->is_used = true;
            $otp->save();

            // Handle different OTP types
            if ($request->type === 'registration') {
                $user->email_verified_at = now();
                $user->otp_verified = true;
                $user->save();
            } elseif ($request->type === 'password_reset') {
                $user->otp_verified = true;
                $user->save();

                // Simpan detail login

                Log::info('Password reset OTP verified successfully', [
                    'user_id' => $user->id,
                    'type' => $request->type,
                ]);

                return response()->json([
                    'status' => 200,
                    'message' => 'Password reset OTP verified successfully.',
                    'user' => array_merge(
                        $user->only([
                            'id',
                            'name',
                            'email',
                            'phone_number',
                            'status',
                            'avatar',
                            'created_at',
                        ]),
                        [
                            'role' => $user->roles()->pluck('name')->first(),
                        ]
                    ),
                ], 200);
            } else {
                // For login type
                $user->otp_verified = true;
                $user->save();
            }

            // Issue token only for login or registration
            $token = null;
            if ($request->type !== 'password_reset') {
                $token = $user->createToken('auth_token')->plainTextToken;
            }

            // Simpan detail login

            Log::info('OTP verified successfully', [
                'user_id' => $user->id,
                'type' => $request->type,
            ]);

            return response()->json([
                'status' => 200,
                'message' => 'OTP verified successfully.',
                'token' => $token,
                'user' => array_merge(
                    $user->only([
                        'id',
                        'name',
                        'email',
                        'phone_number',
                        'status',
                        'avatar',
                        'created_at',
                    ]),
                    [
                        'role' => $user->roles()->pluck('name')->first(),
                    ]
                ),
            ], 200);

        } catch (\Throwable $th) {
            Log::error('Error during OTP verification', [
                'error' => $th->getMessage(),
                'trace' => $th->getTraceAsString(),
            ]);
            return response()->json([
                'status' => 500,
                'message' => 'OTP verification failed.',
                'error' => $th->getMessage(),
            ], 500);
        }
    }

    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'password' => 'required|min:8|confirmed',
        ], [
            'user_id.required' => 'User ID is required.',
            'user_id.exists' => 'Invalid user ID.',
            'password.required' => 'Password is required.',
            'password.min' => 'Password must be at least 8 characters.',
            'password.confirmed' => 'Password confirmation does not match.',
        ]);

        if ($validator->fails()) {
            Log::warning('Password change validation failed', [
                'errors' => $validator->errors(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = User::find($request->user_id);
            if (!$user) {
                Log::error('User not found', ['user_id' => $request->user_id]);
                return response()->json([
                    'status' => 404,
                    'message' => 'User not found.',
                ], 404);
            }

            // Verify that OTP was recently verified for password reset
            if (!$user->otp_verified) {
                Log::warning('Password reset attempted without OTP verification', [
                    'user_id' => $request->user_id,
                ]);
                return response()->json([
                    'status' => 403,
                    'message' => 'OTP verification required before changing password.',
                ], 403);
            }

            // Update password
            $user->password = bcrypt($request->password);
            $user->otp_verified = false;
            $user->save();

            // Simpan detail login

            // Revoke existing tokens
            $user->tokens()->delete();

            Log::info('Password changed successfully', ['user_id' => $user->id]);

            return response()->json([
                'status' => 200,
                'message' => 'Password changed successfully. Please login with your new password.',
            ], 200);

        } catch (\Throwable $th) {
            Log::error('Error during password change', [
                'error' => $th->getMessage(),
                'trace' => $th->getTraceAsString(),
            ]);
            return response()->json([
                'status' => 500,
                'message' => 'Password change failed.',
                'error' => $th->getMessage(),
            ], 500);
        }
    }

    public function requestPasswordResetOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'login' => 'required',
            'type' => 'required|in:email,phone',
        ]);

        if ($validator->fails()) {
            Log::warning('Request password reset OTP validation failed', ['errors' => $validator->errors()]);
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $field = $request->type === 'email' ? 'email' : 'phone_number';
            $loginValue = $field === 'phone_number'
                ? $this->standardizePhoneNumber($request->login)
                : $request->login;

            $user = User::where($field, $loginValue)->first();

            if (!$user) {
                Log::warning('User not found for password reset OTP', [
                    'login' => $request->login,
                    'type' => $request->type,
                ]);
                return response()->json([
                    'status' => 404,
                    'message' => 'User not found.',
                ], 404);
            }

            $existingOtp = Otp::where('user_id', $user->id)
                ->where('type', 'password_reset')
                ->where('is_used', false)
                ->where('expires_at', '>', now())
                ->latest()
                ->first();

            if ($existingOtp) {
                if ($this->sendOtp($user, $existingOtp->otp_code, 'password_reset')) {
                    return response()->json([
                        'status' => 200,
                        'message' => 'OTP resent successfully to WhatsApp.',
                        'otp_expires_at' => $existingOtp->expires_at,
                        'user_id' => $user->id,
                        'phone_number' => $user->phone_number,
                        'cooldown' => 60,
                    ], 200);
                } else {
                    Log::error('Failed to resend OTP', [
                        'user_id' => $user->id,
                        'phone_number' => $user->phone_number,
                        'otp_code' => $existingOtp->otp_code,
                    ]);
                    $existingOtp->is_used = true;
                    $existingOtp->save();
                    return response()->json([
                        'status' => 200,
                        'message' => 'OTP may have been sent to WhatsApp. Please check and verify, or contact support@yourapp.com if not received.',
                        'otp_expires_at' => $existingOtp->expires_at,
                        'user_id' => $user->id,
                        'phone_number' => $user->phone_number,
                        'cooldown' => 60,
                    ], 200);
                }
            }

            $otp = $this->generateOtp($user, 'password_reset');
            if (!$this->sendOtp($user, $otp->otp_code, 'password_reset')) {
                Log::error('Failed to send password reset OTP', [
                    'user_id' => $user->id,
                    'phone_number' => $user->phone_number,
                    'otp_code' => $otp->otp_code,
                ]);
                return response()->json([
                    'status' => 200,
                    'message' => 'OTP may have been sent to WhatsApp. Please check and verify, or contact support@yourapp.com if not received.',
                    'otp_expires_at' => $otp->expires_at,
                    'user_id' => $user->id,
                    'phone_number' => $user->phone_number,
                    'cooldown' => 60,
                ], 200);
            }

            return response()->json([
                'status' => 200,
                'message' => 'OTP sent successfully to WhatsApp.',
                'otp_expires_at' => $otp->expires_at,
                'user_id' => $user->id,
                'phone_number' => $user->phone_number,
                'cooldown' => 60,
            ], 200);
        } catch (\Throwable $th) {
            Log::error('Error during password reset OTP request', [
                'error' => $th->getMessage(),
                'trace' => $th->getTraceAsString(),
            ]);
            return response()->json([
                'status' => 500,
                'message' => 'Failed to request OTP.',
                'error' => $th->getMessage(),
            ], 500);
        }
    }

    public function requestLoginOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'login' => 'required',
            'type' => 'required|in:login,password_reset',
        ]);

        if ($validator->fails()) {
            Log::warning('Request login OTP validation failed', ['errors' => $validator->errors()]);
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = User::where('email', $request->login)->first();

            if (!$user) {
                Log::warning('User not found for OTP login', [
                    'login' => $request->login,
                    'type' => $request->type,
                ]);
                return response()->json([
                    'status' => 404,
                    'message' => 'User not found.',
                ], 404);
            }

            $existingOtp = Otp::where('user_id', $user->id)
                ->where('is_used', false)
                ->where('expires_at', '>', now())
                ->latest()
                ->first();

            if ($existingOtp) {
                if ($this->sendOtp($user, $existingOtp->otp_code, $request->type)) {
                    return response()->json([
                        'status' => 200,
                        'message' => 'OTP resent successfully to WhatsApp.',
                        'otp_expires_at' => $existingOtp->expires_at,
                        'user_id' => $user->id,
                    ], 200);
                } else {
                    Log::error('Failed to resend OTP', [
                        'user_id' => $user->id,
                        'phone_number' => $user->phone_number,
                        'otp_code' => $existingOtp->otp_code,
                    ]);
                    $existingOtp->is_used = true;
                    $existingOtp->save();
                    return response()->json([
                        'status' => 200,
                        'message' => 'OTP may have been sent to WhatsApp. Please check and verify, or contact support@yourapp.com if not received.',
                        'otp_expires_at' => $existingOtp->expires_at,
                        'user_id' => $user->id,
                    ], 200);
                }
            }

            $otp = $this->generateOtp($user, $request->type);

            if (!$this->sendOtp($user, $otp->otp_code, $request->type)) {
                Log::error('Failed to send login OTP', [
                    'user_id' => $user->id,
                    'phone_number' => $user->phone_number,
                    'otp_code' => $otp->otp_code,
                ]);
                return response()->json([
                    'status' => 200,
                    'message' => 'OTP may have been sent to WhatsApp. Please check and verify, or contact support@yourapp.com if not received.',
                    'otp_expires_at' => $otp->expires_at,
                    'user_id' => $user->id,
                ], 200);
            }

            // Simpan detail login

            return response()->json([
                'status' => 200,
                'message' => 'OTP sent successfully to WhatsApp.',
                'otp_expires_at' => $otp->expires_at,
                'user_id' => $user->id,
            ], 200);
        } catch (\Throwable $th) {
            Log::error('Error during login OTP request', [
                'error' => $th->getMessage(),
                'trace' => $th->getTraceAsString(),
            ]);
            return response()->json([
                'status' => 500,
                'message' => 'Failed to request OTP.',
                'error' => $th->getMessage(),
            ], 500);
        }
    }

    public function resendOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'type' => 'required|in:registration,login,password_reset',
        ]);

        if ($validator->fails()) {
            Log::warning('Resend OTP validation failed', ['errors' => $validator->errors()]);
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            DB::beginTransaction();

            $user = User::find($request->user_id);
            if (!$user) {
                Log::warning('User not found for resend OTP', ['user_id' => $request->user_id]);
                DB::rollBack();
                return response()->json([
                    'status' => 404,
                    'message' => 'User not found.',
                ], 404);
            }

            Log::info('Starting resend OTP process', [
                'user_id' => $user->id,
                'phone_number' => $user->phone_number,
                'type' => $request->type,
            ]);

            // Cek apakah ada OTP yang masih aktif
            $existingOtp = Otp::where('user_id', $user->id)
                ->where('type', $request->type)
                ->where('is_used', false)
                ->where('expires_at', '>', now())
                ->latest()
                ->first();

            if ($existingOtp) {
                Log::info('Found existing active OTP', [
                    'otp_id' => $existingOtp->id,
                    'user_id' => $user->id,
                    'type' => $request->type,
                    'expires_at' => $existingOtp->expires_at,
                ]);

                // Coba kirim ulang OTP yang sudah ada
                if ($this->sendOtp($user, $existingOtp->otp_code, $request->type)) {
                    DB::commit();

                    Log::info('Existing OTP resent successfully', [
                        'user_id' => $user->id,
                        'type' => $request->type,
                        'otp_id' => $existingOtp->id,
                    ]);

                    return response()->json([
                        'status' => 200,
                        'message' => 'OTP resent successfully to WhatsApp.',
                        'otp_expires_at' => $existingOtp->expires_at,
                        'user_id' => $user->id,
                        'phone_number' => $user->phone_number,
                        'cooldown' => 60,
                    ], 200);
                } else {
                    Log::error('Failed to resend existing OTP', [
                        'user_id' => $user->id,
                        'phone_number' => $user->phone_number,
                        'otp_id' => $existingOtp->id,
                        'type' => $request->type,
                    ]);

                    // Mark existing OTP as used since it failed to send
                    $existingOtp->is_used = true;
                    $existingOtp->save();
                }
            }

            // Generate OTP baru
            $otp = $this->generateOtp($user, $request->type);

            // Kirim OTP via WhatsApp
            if (!$this->sendOtp($user, $otp->otp_code, $request->type)) {
                Log::error('Failed to send new OTP during resend', [
                    'user_id' => $user->id,
                    'phone_number' => $user->phone_number,
                    'otp_id' => $otp->id,
                    'otp_code' => $otp->otp_code,
                    'type' => $request->type,
                ]);

                DB::commit();

                return response()->json([
                    'status' => 200,
                    'message' => 'OTP generated but may have failed to send via WhatsApp. Please check and verify, or contact support if not received.',
                    'otp_expires_at' => $otp->expires_at,
                    'user_id' => $user->id,
                    'phone_number' => $user->phone_number,
                    'cooldown' => 60,
                ], 200);
            }

            DB::commit();

            Log::info('New OTP sent successfully during resend', [
                'user_id' => $user->id,
                'type' => $request->type,
                'otp_id' => $otp->id,
            ]);

            return response()->json([
                'status' => 200,
                'message' => 'OTP sent successfully to WhatsApp.',
                'otp_expires_at' => $otp->expires_at,
                'user_id' => $user->id,
                'phone_number' => $user->phone_number,
                'cooldown' => 60,
            ], 200);

        } catch (\Illuminate\Database\QueryException $ex) {
            DB::rollBack();
            Log::error('Database error during OTP resend', [
                'user_id' => $request->user_id ?? null,
                'type' => $request->type ?? null,
                'error' => $ex->getMessage(),
                'sql' => $ex->getSql() ?? 'No SQL',
                'bindings' => $ex->getBindings() ?? [],
            ]);

            return response()->json([
                'status' => 500,
                'message' => 'Database error occurred. Please try again.',
                'error' => config('app.debug') ? $ex->getMessage() : 'Database error',
            ], 500);

        } catch (\Throwable $th) {
            DB::rollBack();
            Log::error('Unexpected error during OTP resend', [
                'user_id' => $request->user_id ?? null,
                'type' => $request->type ?? null,
                'error' => $th->getMessage(),
                'trace' => $th->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 500,
                'message' => 'Failed to resend OTP. Please try again.',
                'error' => config('app.debug') ? $th->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            $user = $request->user();

            // Jika user tidak ditemukan (token invalid), tetap anggap logout berhasil
            if (!$user) {
                Log::warning('Logout attempted with invalid token');
                return response()->json([
                    'status' => 200,
                    'message' => 'Logged out successfully!',
                ], 200);
            }

            // Update last online time
            $user->last_online_at = now('Asia/Jakarta');
            $user->save();

            // Hapus current token
            $request->user()->currentAccessToken()->delete();

            Log::info('User logged out successfully', ['user_id' => $user->id]);

            return response()->json([
                'status' => 200,
                'message' => 'Logged out successfully!',
            ], 200);
        } catch (\Throwable $th) {
            Log::error('Logout error', [
                'error' => $th->getMessage(),
                'trace' => $th->getTraceAsString(),
            ]);

            // Tetap return success karena tujuan logout adalah menghapus session
            return response()->json([
                'status' => 200,
                'message' => 'Logged out successfully!',
            ], 200);
        }
    }

    public function isAuthenticated(Request $request)
    {
        $user = $request->user(); // Autentikasi Sanctum

        if (!$user) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $agent = new \Jenssegers\Agent\Agent();
        $agent->setUserAgent($request->header('User-Agent'));

        $device = [
            'platform' => $agent->platform(),
            'platform_version' => $agent->version($agent->platform()),
            'browser' => $agent->browser(),
            'browser_version' => $agent->version($agent->browser()),
            'is_mobile' => $agent->isMobile(),
            'is_desktop' => $agent->isDesktop(),
        ];

        // Helper format tanggal
        $formatDate = function ($date) {
            if (!$date) return null;
            $carbon = \Carbon\Carbon::parse($date)->timezone('Asia/Jakarta');
            return $carbon->isToday()
                ? $carbon->format('H:i') . ' WIB'
                : $carbon->diffForHumans();
        };

        // Update last_online_at hanya jika lebih dari 2 menit lalu
        if (!$user->last_online_at || $user->last_online_at->diffInMinutes(now()) >= 2) {
            $user->forceFill([
                'last_online_at' => now('Asia/Jakarta'),
            ])->saveQuietly();
        }

        // Cegah error jika tidak ada role
        $roleName = $user->roles->first()->name ?? 'No role assigned';

        // Pastikan helper avatar aman
        return response()->json([
            'status' => 200,
            'message' => 'Token is valid',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone_number' => $user->phone_number,
                'avatar' => $user->avatar,
                'registered' => $formatDate($user->created_at),
                'last_online_at' => $formatDate($user->last_online_at),
                'status' => $user->status,
                'status_account' => $user->status_account,
                'role' => $roleName,
                'device' => $device,
            ],
        ]);
    }


    // ==================== PRIVATE HELPER METHODS ====================

    /**
     * Standarkan format nomor telepon ke format 62xxxxxxxxx
     */
    private function standardizePhoneNumber(string $phone): string
    {
        // Hapus semua karakter non-digit
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // Standardisasi ke format 62
        if (Str::startsWith($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        } elseif (Str::startsWith($phone, '8')) {
            $phone = '62' . $phone;
        } elseif (Str::startsWith($phone, '620')) {
            $phone = '62' . substr($phone, 2);
        }
        // Jika sudah 62xxxxx biarkan

        return $phone;
    }

    /**
     * Upload avatar dan return path
     */
    private function uploadAvatar($file): string
    {
        $storagePath = 'uploads/user/images';
        $disk = 'public';

        // Pastikan direktori ada
        if (!Storage::disk($disk)->exists($storagePath)) {
            Storage::disk($disk)->makeDirectory($storagePath);
        }

        // Periksa apakah direktori writable
        $absolutePath = storage_path('app/public/' . $storagePath);
        if (!is_writable($absolutePath)) {
            Log::error('Image storage directory is not writable', ['path' => $absolutePath]);
            throw new \Exception('Image storage directory is not writable.');
        }

        // Buat nama file unik
        $fileName = time() . '@' . Str::random(5) . '.' . $file->extension();

        // Simpan file
        $path = $file->storeAs($storagePath, $fileName, $disk);

        return $path;
    }

    /**
     * Simpan detail login user
     */
    /**
     * Generate OTP code baru untuk user
     */
    private function generateOtp($user, $type = 'registration')
    {
        try {
            DB::beginTransaction();

            // Invalidate semua OTP yang belum digunakan
            $invalidatedCount = Otp::where('user_id', $user->id)
                ->where('type', $type)
                ->where('is_used', false)
                ->update(['is_used' => true]);

            Log::info('Invalidated previous OTPs', [
                'user_id' => $user->id,
                'type' => $type,
                'invalidated_count' => $invalidatedCount,
            ]);

            // Generate OTP code baru
            $otpCode = mt_rand(100000, 999999);
            $expiresAt = now()->addMinutes(10);

            // Buat OTP baru
            $otp = Otp::create([
                'user_id' => $user->id,
                'otp_code' => $otpCode,
                'type' => $type,
                'expires_at' => $expiresAt,
                'is_used' => false,
            ]);

            if (!$otp) {
                Log::error('Failed to create OTP record', [
                    'user_id' => $user->id,
                    'type' => $type,
                    'otp_code' => $otpCode,
                ]);
                DB::rollBack();
                throw new \Exception('Failed to create OTP record');
            }

            DB::commit();

            Log::info('OTP generated successfully', [
                'otp_id' => $otp->id,
                'user_id' => $user->id,
                'type' => $type,
                'expires_at' => $expiresAt,
            ]);

            return $otp;

        } catch (\Illuminate\Database\QueryException $ex) {
            DB::rollBack();
            Log::error('Database error in generateOtp', [
                'user_id' => $user->id,
                'type' => $type,
                'error' => $ex->getMessage(),
                'sql' => $ex->getSql() ?? 'No SQL',
                'bindings' => $ex->getBindings() ?? [],
            ]);
            throw new \Exception('Database error while generating OTP: ' . $ex->getMessage());

        } catch (\Throwable $th) {
            DB::rollBack();
            Log::error('Unexpected error in generateOtp', [
                'user_id' => $user->id,
                'type' => $type,
                'error' => $th->getMessage(),
                'trace' => $th->getTraceAsString(),
            ]);
            throw new \Exception('Failed to generate OTP: ' . $th->getMessage());
        }
    }

    /**
     * Kirim OTP via WhatsApp
     */
    private function sendOtp($user, $otpCode, $type = 'registration')
    {
        try {
            $message = "Your OTP code for " . ucfirst($type) . " is: $otpCode. It is valid for 10 minutes. Do not share this code with anyone.";

            $response = $this->sendWhatsappMessage($user->phone_number, $message);

            if ($response['success']) {
                Log::info('OTP sent successfully', [
                    'user_id' => $user->id,
                    'phone_number' => $user->phone_number,
                    'otp_code' => $otpCode,
                    'type' => $type,
                    'whatsapp_response' => $response,
                ]);
                return true;
            } else {
                Log::error('Failed to send OTP via WhatsApp', [
                    'user_id' => $user->id,
                    'phone_number' => $user->phone_number,
                    'otp_code' => $otpCode,
                    'type' => $type,
                    'error' => $response['error'] ?? 'Invalid response structure',
                    'whatsapp_response' => $response,
                ]);
                return false;
            }
        } catch (\Exception $e) {
            Log::error('Exception in sendOtp', [
                'user_id' => $user->id,
                'phone_number' => $user->phone_number,
                'otp_code' => $otpCode,
                'type' => $type,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return false;
        }
    }

    /**
     * Kirim pesan WhatsApp via Socket Server
     */
    private function sendWhatsappMessage($phoneNumber, $message)
    {
        try {
            $http = Http::withHeaders([
                'Accept' => 'application/json',
            ])->asMultipart();
            $http->attach('phone_number', $phoneNumber);
            $http->attach('message', $message);

            Log::info('Sending WhatsApp message', [
                'phone_number' => $phoneNumber,
                'message' => $message,
                'url' => env('SOCKET_SERVER_URL') . '/send-whatsapp',
            ]);

            $response = $http->timeout(10)->post(env('SOCKET_SERVER_URL') . '/send-whatsapp');

            Log::info('WhatsApp server response', [
                'status' => $response->status(),
                'headers' => $response->headers(),
                'body' => $response->body(),
                'json' => $response->json() ?? 'No JSON response',
            ]);

            if ($response->successful()) {
                $jsonResponse = $response->json();
                if (isset($jsonResponse['success']) && $jsonResponse['success']) {
                    return [
                        'success' => true,
                        'message' => $jsonResponse['message'] ?? 'Message sent',
                        'details' => $jsonResponse,
                    ];
                }
                Log::warning('Invalid WhatsApp response structure', ['response' => $jsonResponse]);
                return [
                    'success' => false,
                    'error' => 'Invalid response structure: Missing success',
                    'details' => $jsonResponse,
                ];
            }

            Log::error('WhatsApp server error', [
                'status' => $response->status(),
                'body' => $response->body(),
                'json' => $response->json() ?? 'No JSON response',
            ]);
            return [
                'success' => false,
                'error' => 'HTTP request failed',
                'details' => $response->body(),
                'status' => $response->status(),
            ];
        } catch (\Exception $e) {
            Log::error('WhatsApp notification exception', [
                'phone_number' => $phoneNumber,
                'message' => $message,
                'url' => env('SOCKET_SERVER_URL') . '/send-whatsapp',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return [
                'success' => false,
                'error' => 'Failed to send WhatsApp notification',
                'details' => $e->getMessage(),
            ];
        }
    }
}
