<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

class ProductController extends Controller
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

        $query = Product::with(['categories', 'images', 'author', 'promotions'])
            ->orderBy($sortKey, $sortDirection);

        if ($isPublic === 'true') {
            $query->where('status', true);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                  ->orWhere('description', 'like', "%$search%")
                  ->orWhereHas('categories', fn ($q) =>
                      $q->where('name', 'like', "%$search%"))
                  ->orWhereHas('author', fn ($q) =>
                      $q->where('name', 'like', "%$search%"));
            });
        }

        if ($fromDate) {
            $query->whereDate('created_at', '>=', $fromDate);
        }

        if ($toDate) {
            $query->whereDate('created_at', '<=', $toDate);
        }

        $result = $query->paginate($perPage);
        $totalVisible = Product::where('status', '1')->count();
        $totalHidden = Product::where('status', '0')->count();

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
        $product = Product::with(['categories', 'images', 'author', 'promotions'])
            ->where('key', $key)
            ->firstOrFail();

        return response()->json(['data' => $product]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric',
            'status' => 'required|boolean',
            'category_ids' => 'required|array',
            'category_ids.*' => 'exists:tb_product_category,id',
            'promotion_ids' => 'nullable|array',
            'promotion_ids.*' => 'exists:tb_product_promotion,id',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:2048',
            'is_primary' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $product = Product::create([
                'key' => Str::uuid(),
                'name' => $request->name,
                'description' => $request->description,
                'status' => $request->status,
                'price' => $request->price,
                'author_id' => Auth::id(),
            ]);

            $product->categories()->attach($request->category_ids);

            if ($request->filled('promotion_ids')) {
                $product->promotions()->attach($request->promotion_ids);
            }

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $index => $file) {
                    $filename = time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
                    $file->move(public_path('products/images'), $filename);
                    $product->images()->create([
                        'image_data' => 'products/images/' . $filename,
                        'is_primary' => $request->is_primary[$index] ?? false,
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Product created successfully',
                'data' => $product->load(['categories', 'images', 'promotions', 'author']),
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
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric',
            'status' => 'required|boolean',
            'category_ids' => 'required|array',
            'category_ids.*' => 'exists:tb_product_category,id',
            'promotion_ids' => 'nullable|array',
            'promotion_ids.*' => 'exists:tb_product_promotion,id',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:2048',
            'existing_images' => 'nullable|array',
            'existing_images.*.id' => 'required|exists:product_images,id',
            'existing_images.*.is_primary' => 'required|boolean',
            'images_to_remove' => 'nullable|array',
            'images_to_remove.*' => 'exists:product_images,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $product = Product::where('key', $key)->firstOrFail();

            $product->update([
                'name' => $request->name,
                'description' => $request->description,
                'status' => $request->status,
                'price' => $request->price,
            ]);

            $product->categories()->sync($request->category_ids);

            if ($request->has('promotion_ids')) {
                $product->promotions()->sync($request->promotion_ids ?? []);
            } else {
                $product->promotions()->sync([]);
            }

            // Remove images
            if ($request->has('images_to_remove')) {
                foreach ($request->images_to_remove as $imgId) {
                    $img = $product->images()->find($imgId);
                    if ($img && file_exists(public_path($img->image_data))) {
                        unlink(public_path($img->image_data));
                    }
                    $img?->delete();
                }
            }

            // Update existing image's is_primary
            if ($request->has('existing_images')) {
                foreach ($request->existing_images as $imgData) {
                    $product->images()->where('id', $imgData['id'])->update([
                        'is_primary' => $imgData['is_primary'],
                    ]);
                }
            }

            // Upload new images
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $index => $file) {
                    $filename = time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
                    $file->move(public_path('products/images'), $filename);
                    $product->images()->create([
                        'image_data' => 'products/images/' . $filename,
                        'is_primary' => $request->is_primary[$index] ?? false,
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Product updated successfully',
                'data' => $product->load(['categories', 'images', 'promotions', 'author']),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
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

            $product = Product::where('key', $key)->firstOrFail();

            foreach ($product->images as $image) {
                $filePath = public_path($image->image_data);
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
            }

            $product->delete();

            DB::commit();

            return response()->json(['message' => 'Product deleted successfully']);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error deleting product', 'error' => $e->getMessage()], 500);
        }
    }
}
