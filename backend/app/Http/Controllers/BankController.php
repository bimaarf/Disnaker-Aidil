<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Bank;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;


class BankController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('perPage', 10);
        $sortKey = $request->input('sortKey', 'created_at');
        $sortDirection = $request->input('sortDirection', 'desc');
        $search = $request->input('q');
        $isPublic = $request->input('isPublic');
        $fromDate = $request->input('fromDate');
        $toDate = $request->input('toDate');

        $query = Bank::orderBy($sortKey, $sortDirection);

        if ($isPublic === 'true') {
            $query->where('status', true);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('bank_name', 'like', "%$search%")
                  ->orWhere('account_number', 'like', "%$search%");
            });
        }

        if ($fromDate) {
            $query->whereDate('created_at', '>=', $fromDate);
        }

        if ($toDate) {
            $query->whereDate('created_at', '<=', $toDate);
        }

        $result = $query->paginate($perPage);
        $totalVisible = Bank::where('status', '1')->count();
        $totalHidden = Bank::where('status', '0')->count();

        return response()->json([
            'data' => $result->items(),
            'current_page' => $result->currentPage(),
            'last_page' => $result->lastPage(),
            'per_page' => $result->perPage(),
            'total' => $result->total(),
            'total_visible' => $totalVisible,
            'total_hidden' => $totalHidden,
        ]);
    }

    public function view($key)
    {
        $result = Bank::where('key', $key)
            ->firstOrFail();

        return response()->json(['data' => $result]);
    }
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'bank_name' => 'required|string|max:255',
            'receiver_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp,svg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $bankAccount = Bank::create([
                'key' => Str::uuid(),
                'bank_name' => $request->bank_name,
                'receiver_name' => $request->receiver_name,
                'account_number' => $request->account_number,
                'description' => $request->description,
                'status' => $request->status,
            ]);

            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $filename = time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('bank_accounts/images'), $filename);

                // Simpan path gambar ke kolom 'image' di tabel tb_bank
                $bankAccount->update([
                    'image' => 'bank_accounts/images/' . $filename,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Bank account created successfully',
                'data' => $bankAccount,
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Internal server error',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function update(Request $request, $key)
    {
        $validator = Validator::make($request->all(), [
            'bank_name' => 'required|string|max:255',
            'receiver_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp,svg|max:2048',
        ]);

        // Jika validasi gagal
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $bankAccount = Bank::where('key', $key)->firstOrFail();

            $bankAccount->update([
                'bank_name' => $request->bank_name,
                'receiver_name' => $request->receiver_name,
                'account_number' => $request->account_number,
                'description' => $request->description,
                'status' => $request->status,
            ]);

            if ($request->hasFile('image')) {
                if ($bankAccount->image && file_exists(public_path($bankAccount->image))) {
                    unlink(public_path($bankAccount->image));
                }

                $file = $request->file('image');
                $filename = time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('bank_accounts/images'), $filename);

                $bankAccount->update([
                    'image' => 'bank_accounts/images/' . $filename,
                ]);
            }

            return response()->json([
                'message' => 'Bank account updated successfully',
                'data' => $bankAccount,
            ], 200);

        } catch (\Throwable $e) {
            // Menangani error dan rollback jika terjadi masalah
            return response()->json([
                'message' => 'Internal server error',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function delete($key)
    {
        try {
            DB::beginTransaction();

            $bank = Bank::where('key', $key)->firstOrFail();

            if ($bank->image && file_exists(public_path($bank->image))) {
                unlink(public_path($bank->image));
            }
            $bank->delete();

            DB::commit();

            return response()->json(['message' => 'Bank deleted successfully']);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error deleting bank', 'error' => $e->getMessage()], 500);
        }
    }

}
