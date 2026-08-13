<?php

namespace App\Http\Controllers;

use App\Models\ProductPromotion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProductPromotionController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('perPage', 20);
        $sortKey = $request->input('sortKey', 'id');
        $sortDirection = $request->input('sortDirection', 'desc');

        $data = ProductPromotion::orderBy($sortKey, $sortDirection)->paginate($perPage);

        return response()->json([
            'data' => $data->items(),
            'total' => $data->total(),
            'per_page' => $data->perPage(),
            'current_page' => $data->currentPage(),
            'last_page' => $data->lastPage(),
            'from' => $data->firstItem(),
            'to' => $data->lastItem(),
        ]);
    }

    public function view($key)
    {
        $data = ProductPromotion::where('key', $key)->firstOrFail();

        return response()->json(['data' => $data], 200);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'status' => 'required|boolean|in:0,1',
            'referral_code' => 'nullable|string|max:255',
            'expired' => 'nullable|date',
            'discount_percentage' => [
                'nullable',
                'numeric',
                'min:0',
                'max:100000',
                function ($attribute, $value, $fail) {
                    if (!preg_match('/^\d+\.\d{1}$/', $value)) {
                        $fail("The $attribute must be a decimal with exactly 1 digit after the decimal point (e.g., 12.3).");
                    }
                },
            ],

            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);


        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $input = new ProductPromotion();
            $input->key = Str::random(16);
            $input->title = $request->title;
            $input->status = $request->status ?? true;
            $input->referral_code = $request->referral_code;
            $input->expired = $request->expired;
            $input->discount_percentage = $request->discount_percentage;

            if ($request->hasFile('image')) {
                $filename = time() . '_' . Str::random(8) . '.' . $request->image->getClientOriginalExtension();
                $request->image->move(public_path('promotions/images'), $filename);
                $input->image = 'promotions/images/' . $filename;
            }

            $input->save();

            return response()->json(['status' => 201, 'promotion' => $input], 201);
        } catch (\Throwable $th) {
            return response()->json([
                'status' => 500,
                'message' => 'Internal Server Error',
                'error' => $th->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $key)
    {
        $promotion = ProductPromotion::where('key', $key)->firstOrFail();

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'status' => 'required|boolean|in:0,1',
            'referral_code' => 'nullable|string|max:255',
            'expired' => 'nullable|date',
            'discount_percentage' => [
                'nullable',
                'numeric',
                'min:0',
                'max:100000',
                function ($attribute, $value, $fail) {
                    if (!preg_match('/^\d+\.\d{1}$/', $value)) {
                        $fail("The $attribute must be a decimal with exactly 1 digit after the decimal point (e.g., 12.3).");
                    }
                },
            ],
                
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $promotion->title = $request->title;
            $promotion->status = $request->status ?? $promotion->status;
            $promotion->referral_code = $request->referral_code;
            $promotion->expired = $request->expired;
            $promotion->discount_percentage = $request->discount_percentage;

            if ($request->hasFile('image')) {
                if ($promotion->image && file_exists(public_path($promotion->image))) {
                    unlink(public_path($promotion->image));
                }

                $filename = time() . '_' . Str::random(8) . '.' . $request->image->getClientOriginalExtension();
                $request->image->move(public_path('promotions/images'), $filename);
                $promotion->image = 'promotions/images/' . $filename;
            }

            $promotion->save();

            return response()->json(['status' => 200, 'promotion' => $promotion], 200);
        } catch (\Throwable $th) {
            return response()->json([
                'status' => 500,
                'message' => 'Internal Server Error',
                'error' => $th->getMessage()
            ], 500);
        }
    }


    public function delete($id)
    {
        $data = ProductPromotion::find($id);

        if (!$data) {
            return response()->json(['status' => 404, 'message' => 'Category not found'], 404);
        }

        try {
            $data->delete();
            return response()->json(['message' => 'Category deleted successfully']);
        } catch (\Throwable $th) {
            return response()->json(['status' => 500, 'message' => $th->getMessage()], 500);
        }
    }
}
