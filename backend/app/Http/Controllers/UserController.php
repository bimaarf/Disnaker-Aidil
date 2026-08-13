<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Role;
use App\Models\User;
use Auth;
use DB;
use Hash;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class UserController extends Controller
{

    private function formatUserResponse($users)
    {
        $totalActive = User::where('status', true)->count();
        $totalSuspend = User::where('status', false)->count();

        return [
            'data' => $users->map(function ($user) {
                return $this->transformUserData($user);
            }),
            'total_active' => $totalActive,
            'total_suspend' => $totalSuspend,
            'total' => $users->total(),
            'per_page' => $users->perPage(),
            'current_page' => $users->currentPage(),
            'last_page' => $users->lastPage(),
            'from' => $users->firstItem(),
            'to' => $users->lastItem(),
        ];
    }
    private function transformAllUserData($user)
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'status' => $user->status,
            'avatar' => $user->avatar,
            'phone_number' => $user->phone_number,
            'roles' => $user->roles->pluck('name')->first(),
            'created_at' => $user->created_at,
        ];
    }
    private function formatAllUserResponse($users)
    {
        $totalActive = User::where('status', true)->count();
        $totalSuspend = User::where('status', false)->count();

        return [
            'data' => $users->map(function ($user) {
                return $this->transformAllUserData($user);
            }),
            'total_active' => $totalActive,
            'total_suspend' => $totalSuspend,
            'total' => $users->count(),
        ];
    }
    private function transformUserData($user)
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'status' => $user->status,
            'avatar' => $user->avatar,
            'phone_number' => $user->phone_number,
            'roles' => $user->roles->pluck('name')->first(),
            'created_at' => $user->created_at,
        ];
    }

    private function toggleUserStatus($id, $status)
    {
        $user = User::findOrFail($id);
        $user->status = $status;
        $user->save();
        return response()->json(['status' => 200, 'user' => $user], 200);
    }
    public function all(Request $request)
    {
        try {
            $sortKey = $request->input('sortKey', 'created_at');
            $sortDirection = $request->input('sortDirection', 'desc');
            $search = $request->input('search', '');

            $query = User::with('roles');

            // Jika user hanya punya role 'user', tampilkan hanya datanya sendiri
            if (auth()->user()->hasRole('user')) {
                $query->where('id', auth()->id());
            }

            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%')
                    ->orWhere('phone_number', 'like', '%' . $search . '%');
                });
            }

            $users = $query->orderBy($sortKey, $sortDirection)->get();

            return response()->json($this->formatAllUserResponse($users), 200);
        } catch (\Throwable $th) {
            return response()->json([
                'status' => 500,
                'message' => 'An error occurred while retrieving users.',
                'error' => $th->getMessage(),
            ], 500);
        }
    }


    public function index(Request $request)
    {
        $perPage = $request->input('perPage', 10);
        $sortKey = $request->input('sortKey', 'created_at');
        $sortDirection = $request->input('sortDirection', 'desc');
        $search = $request->input('search', '');

        $query = User::with('roles');

        // Jika user hanya punya role 'user', tampilkan hanya datanya sendiri
        if (!auth()->user()->hasRole(['super admin', 'administrator', 'user'])) {
            $query->where('id', auth()->id());
        }

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                ->orWhere('email', 'like', '%' . $search . '%')
                ->orWhere('phone_number', 'like', '%' . $search . '%');
            });
        }

        $users = $query->orderBy($sortKey, $sortDirection)->paginate($perPage);

        return response()->json($this->formatUserResponse($users), 200);
    }


    public function view($email)
    {
        $user = User::where('email', $email)->firstOrFail();

        // Jika bukan super admin, batasi akses hanya ke data sendiri
        if (!auth()->user()->hasRole('super admin') && auth()->id() !== $user->id) {
            return response()->json([
                'status' => 403,
                'message' => 'You can only view your own data.',
            ], 403);
        }

        return response()->json(['user' => $this->transformUserData($user)], 200);
    }

    public function actived($id)
    {
        if (!auth()->user()->hasRole('super admin')) {
            return response()->json([
                'status' => 403,
                'message' => 'Only super admin can activate users.',
            ], 403);
        }

        return $this->toggleUserStatus($id, true);
    }

    public function suspend($id)
    {
        if (!auth()->user()->hasRole('super admin')) {
            return response()->json([
                'status' => 403,
                'message' => 'Only super admin can suspend users.',
            ], 403);
        }

        return $this->toggleUserStatus($id, false);
    }
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|max:191|min:4|unique:users,name',
            'email' => 'required|email|max:191|unique:users,email',
            'password' => 'required|min:4',
            'passwordConfirm' => 'required|same:password|min:4',
            'role_id' => 'required|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }
        if (!auth()->user()->hasRole(['administrator', 'super admin'])) {
            return response()->json([
                'status' => 403,
                'message' => 'Only administrators can add users',
            ], 403);
        }
        DB::beginTransaction();

        try {
            $user = new User();
            $user->name = $request->name;
            $user->email = $request->email;
            $user->password = bcrypt($request->password);
            if ($request->hasFile('image')) {
                if ($user->avatar) {
                    // Ambil path relatif dari URL avatar
                    $relativePath = str_replace(url('storage') . '/', '', $user->avatar);

                    if (Storage::disk('public')->exists($relatibvePath)) {
                        Storage::disk('public')->delete($relativePath);
                    }
                }
                $fileName = time() . '@' . Str::random(5) . '.' . $request->file('image')->extension();

                $storagePath = 'uploads/user/images';

                $path = $request->file('image')->storeAs($storagePath, $fileName, 'local');

                $user->avatar = 'uploads/user/images/' . $path;
            }


            $user->save();

            $user->addRole($request->role_id);

            $notification = new Notification();
            $notification->key = Str::random(5);
            $notification->label = 'New Registered';
            $notification->title = 'Registered#' . $user->name;
            $notification->user_id = $user->id;
            $notification->message = 'new user has joined';
            $notification->save();

            DB::commit();
            $data = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'status' => $user->status,
                'avatar' => $user->avatar,
                'roles' => $user->roles->pluck('name')->first(),
                'phone_number' => $user->phone_number,
                'created_at' => $user->created_at,
                'current' => $user->id === Auth::id() ? true : false,
            ];
            return response()->json(['status' => 201, 'user' => $data], 201);
        } catch (\Illuminate\Database\QueryException $ex) {
            DB::rollBack();

            if ($ex->getCode() == 23000) {
                return response()->json([
                    'status' => 409,
                    'message' => 'Duplicate entry for user name.',
                ], 409);
            }

            return response()->json([
                'status' => 500,
                'message' => 'An error occurred while creating the user.',
                'error' => $ex->getMessage(),
            ], 500);
        } catch (\Throwable $th) {
            DB::rollBack();

            return response()->json([
                'status' => 500,
                'message' => 'An error occurred while creating the user.',
                'error' => $th->getMessage(),
            ], 500);
        }
    }

   public function updatePassword(Request $request, $id)
    {
        try {
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

            $user = User::find($id);

            if (!$user) {
                return response()->json([
                    'status' => 401,
                    'message' => 'User not found!',
                ], 401);
            }

            // Jika bukan super admin, batasi hanya bisa update kata sandi sendiri
            if (!auth()->user()->hasRole('super admin') && auth()->id() !== $user->id) {
                return response()->json([
                    'status' => 403,
                    'message' => 'You can only update your own password.',
                ], 403);
            }

            $user->password = Hash::make($request->new_password);
            $user->save();

            $data = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'status' => $user->status,
                'avatar' => $user->avatar,
                'roles' => $user->roles->pluck('name')->first(),
                'created_at' => $user->created_at,
            ];

            return response()->json([
                'status' => 200,
                'user' => $data,
                'message' => 'Password updated successfully!',
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $th) {
            return response()->json([
                'status' => 500,
                'message' => 'An error occurred while updating the user.',
                'error' => $th->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            // Validasi input
            $validatedData = $request->validate([
                'name' => 'nullable|max:191|min:4',
                'email' => 'nullable|email|max:191',
                'status' => 'nullable|integer|in:0,1',
                'role_id' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            ]);

            $user = User::find($id);
            if (!$user) {
                return response()->json(['status' => 404, 'message' => 'User not found'], 404);
            }

            // Jika bukan super admin, batasi hanya bisa update data sendiri
            if (!auth()->user()->hasRole('super admin') && auth()->id() !== $user->id) {
                return response()->json([
                    'status' => 403,
                    'message' => 'You can only update your own data.',
                ], 403);
            }

            // Hanya super admin yang boleh mengubah status atau role
            // if ($request->has('status') && !auth()->user()->hasRole('super admin')) {
            //     return response()->json([
            //         'status' => 403,
            //         'message' => 'Only super admin can update user status.',
            //     ], 403);
            // }

            // if ($request->has('role_id') && !auth()->user()->hasRole('super admin')) {
            //     return response()->json([
            //         'status' => 403,
            //         'message' => 'Only super admin can update user roles.',
            //     ], 403);
            // }

            $user->fill($request->only(['name', 'email', 'phone_number']));

            // Normalisasi nomor telepon
            if ($request->filled('phone_number')) {
                $rawPhone = $request->input('phone_number');
                $cleanPhone = preg_replace('/[^0-9]/', '', $rawPhone);
                if (Str::startsWith($cleanPhone, '0')) {
                    $cleanPhone = '62' . substr($cleanPhone, 1);
                } elseif (Str::startsWith($cleanPhone, '620')) {
                    $cleanPhone = '62' . substr($cleanPhone, 2);
                }
                $user->phone_number = $cleanPhone;
            }

            // Update status hanya oleh super admin
            if ($request->has('status') && auth()->user()->hasRole('super admin')) {
                $user->status = (bool) $validatedData['status'];

                $notification = new Notification();
                $notification->key = Str::random(5);
                $notification->label = 'Account';
                $notification->title = (bool) $validatedData['status']
                    ? 'This Account has been activated'
                    : 'This Account has been suspended';
                $notification->user_id = $user->id;
                $notification->message = (bool) $validatedData['status']
                    ? 'Contact admin for more information'
                    : 'Contact admin to reactivate your account.';
                $notification->save();
            }

            // Update role hanya oleh super admin
            if ($request->has('role_id') && auth()->user()->hasRole('super admin')) {
                $role = Role::where('name', $request->role_id)->first();
                if ($role) {
                    $user->roles()->sync([$role->id]);
                }
            }

            // Upload dan replace gambar
            if ($request->hasFile('image')) {
                if ($user->avatar) {
                    // Ambil path relatif dari URL avatar
                    $relativePath = str_replace(url('storage') . '/', '', $user->avatar);

                    if (Storage::disk('public')->exists($relativePath)) {
                        Storage::disk('public')->delete($relativePath);
                    }
                }

                $fileName = time() . '@' . Str::random(5) . '.' . $request->file('image')->extension();
                $request->file('image')->move(storage_path('app/public/uploads/user/images/'), $fileName);
                $user->avatar = 'uploads/user/images/' . $fileName;
            }

            $user->save();


            $data = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'status' => $user->status,
                'avatar' => $user->avatar,
                'roles' => $user->roles->pluck('name')->first(),
                'phone_number' => $user->phone_number,
                'created_at' => $user->created_at,
                'current' => $user->id === Auth::id(),
            ];

            return response()->json(['status' => 200, 'user' => $data], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $th) {
            return response()->json([
                'status' => 500,
                'message' => 'An error occurred while updating the user.',
                'error' => $th->getMessage(),
            ], 500);
        }
    }


    public function delete($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['status' => 404, 'message' => 'User not found'], 404);
        }

        if (!auth()->user()->hasRole('super admin')) {
            return response()->json([
                'status' => 403,
                'message' => 'Only super admin can delete users.',
            ], 403);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }
}
