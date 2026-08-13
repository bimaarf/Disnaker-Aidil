<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\EventCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class EventCategoryController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('perPage', 20);
        $sortKey = $request->input('sortKey', 'id');
        $sortDirection = $request->input('sortDirection', 'desc');

        $data = EventCategory::with(['images'])
            ->orderBy($sortKey, $sortDirection)
            ->paginate($perPage);

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
        $event = EventCategory::with('images')
            ->where('key', $key)
            ->firstOrFail();

        return response()->json(['data' => $event]);
    }


    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'        => 'required|string|max:255',
            'icon'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'images'      => 'nullable|array',
            'images.*'    => 'file|image|mimes:jpeg,png,jpg,webp|max:2048',
            'is_primary'  => 'nullable|array',
            'is_primary.*'=> 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 422,
                'message' => 'Validation error',
                'errors'  => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $input = EventCategory::create([
                'key'         => Str::uuid(),
                'name'        => $request->name,
                'icon'        => $request->icon,
                'description' => $request->description,
            ]);

            if ($request->hasFile('images')) {
                $isPrimary = $request->input('is_primary', []);
                foreach ($request->file('images') as $index => $file) {
                    $filename = time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
                    $file->move(public_path('enggang/events/category/images'), $filename);

                    $input->images()->create([
                        'image_data' => 'enggang/events/category/images/' . $filename,
                        'is_primary' => isset($isPrimary[$index]) ? (bool) $isPrimary[$index] : false,
                    ]);
                }
            }

            DB::commit();
            $input->load('images');

            return response()->json(['status' => 201, 'category' => $input], 201);
        } catch (\Throwable $th) {
            DB::rollBack();
            return response()->json([
                'status'  => 500,
                'message' => 'Internal Server Error',
                'error'   => $th->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $key)
    {
        // ✅ 1. Validasi input
        $validator = Validator::make($request->all(), [
            'name'        => 'required|string|max:255',
            'icon'        => 'required|string|max:255',
            'description' => 'nullable|string',
            // untuk upload gambar baru (opsional)
            'images'      => 'nullable|array',
            'images.*'    => 'file|image|mimes:jpeg,png,jpg,webp|max:2048',
            // penanda primary per index baru
            'is_primary'  => 'nullable|array',
            'is_primary.*'=> 'boolean',
            // optional: id gambar yang mau dihapus
            'images_to_remove'   => 'nullable|array',
            'images_to_remove.*' => 'integer|exists:event_category_images,id',
            // existing images untuk update primary
            'existing_images' => 'nullable|array',
            'existing_images.*.id' => 'required|integer|exists:event_category_images,id',
            'existing_images.*.is_primary' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 422,
                'message' => 'Validation error',
                'errors'  => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // ✅ 2. Ambil data kategori
            $data = EventCategory::where('key', $key)->firstOrFail();

            // ✅ 3. Update field dasar
            $data->update([
                'name'        => $request->name,
                'icon'        => $request->icon,
                'description' => $request->description,
            ]);

            // ✅ 4. Hapus gambar lama bila diminta
            if ($request->has('images_to_remove')) {
                foreach ($request->images_to_remove as $imageId) {
                    $img = $data->images()->find($imageId);
                    if ($img) {
                        // hapus file fisik bila perlu
                        $path = public_path($img->image_data);
                        if (file_exists($path)) {
                            @unlink($path);
                        }
                        $img->delete();
                    }
                }
            }

            // ✅ 5. Update is_primary untuk existing images
            if ($request->has('existing_images')) {
                foreach ($request->existing_images as $existing) {
                    $img = $data->images()->find($existing['id']);
                    if ($img) {
                        $img->update([
                            'is_primary' => (bool) $existing['is_primary'],
                        ]);
                    }
                }
            }

            // ✅ 6. Upload gambar baru
            if ($request->hasFile('images')) {
                $isPrimary = $request->input('is_primary', []);
                foreach ($request->file('images') as $index => $file) {
                    $filename = time().'_'.Str::random(8).'.'.$file->getClientOriginalExtension();
                    $file->move(public_path('enggang/events/category/images'), $filename);

                    $data->images()->create([
                        'image_data' => 'enggang/events/category/images/' . $filename,
                        'is_primary' => isset($isPrimary[$index]) ? (bool) $isPrimary[$index] : false,
                    ]);
                }
            }

            DB::commit();

            // reload relasi agar response langsung up to date
            $data->load('images');

            return response()->json([
                'status'   => 200,
                'message'  => 'Category updated successfully.',
                'category' => $data
            ]);
        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'status'  => 422,
                'message' => 'Validation error',
                'errors'  => $e->errors()
            ], 422);
        } catch (\Throwable $th) {
            DB::rollBack();
            return response()->json([
                'status'  => 500,
                'message' => 'An error occurred while updating the category.',
                'error'   => $th->getMessage()
            ], 500);
        }
    }

    public function delete($id)
    {
        $category = EventCategory::with('images')->find($id);

        if (!$category) {
            return response()->json([
                'status'  => 404,
                'message' => 'Category not found'
            ], 404);
        }

        try {
            DB::beginTransaction();

            // 🔑 Hapus file fisik tiap gambar
            foreach ($category->images as $image) {
                $path = public_path($image->image_data);
                if ($image->image_data && File::exists($path)) {
                    File::delete($path);
                }
            }

            // 🔑 Hapus kategori (relasi images otomatis terhapus karena onDelete('cascade'))
            $category->delete();

            DB::commit();

            return response()->json([
                'status'  => 200,
                'message' => 'Category and its images deleted successfully'
            ]);
        } catch (\Throwable $th) {
            DB::rollBack();
            return response()->json([
                'status'  => 500,
                'message' => 'Failed to delete category',
                'error'   => $th->getMessage()
            ], 500);
        }
    }
}
