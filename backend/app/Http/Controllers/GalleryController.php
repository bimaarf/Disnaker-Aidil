<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BlogImage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use DB;

class GalleryController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->input('perPage', 10);
        $page = (int) $request->input('page', 1);
        $sortKey = $request->input('sortKey', 'id');
        $sortDirection = $request->input('sortDirection', 'desc');

        $banners = BlogImage::with(['blog.categories'])
            ->orderBy($sortKey, $sortDirection)
            ->paginate($perPage, ['*'], 'page', $page);

        // Map kategori ke setiap image
        $bannersData = $banners->map(function ($image) {
            return [
                'id' => $image->id,
                'blog_id' => $image->blog_id,
                'image_data' => $image->image_data,
                'is_primary' => $image->is_primary,
                'created_at' => $image->created_at,
                'updated_at' => $image->updated_at,
                'blog' => $image->blog ? [
                    'id' => $image->blog->id,
                    'key' => $image->blog->key,
                    'name' => $image->blog->name,
                    'categories' => $image->blog->categories->map(fn($c) => [
                        'id' => $c->id,
                        'name' => $c->name
                    ])
                ] : null,
            ];
        });

        return response()->json([
            'data' => $bannersData,
            'total' => $banners->total(),
            'per_page' => $banners->perPage(),
            'current_page' => $banners->currentPage(),
            'last_page' => $banners->lastPage(),
            'from' => $banners->firstItem(),
            'to' => $banners->lastItem(),
        ]);
    }


    public function view(Request $request, $id = null)
    {
        // Jika ada query image_data, cari berdasarkan itu
        if ($request->has('image_data')) {
            $imageUrl = $request->query('image_data');

            // Hapus base URL dan /storage prefix agar cocok dengan path di DB
            $parsedPath = str_replace(
                [url('/storage') . '/', 'storage/'],
                '',
                $imageUrl
            );

            $banner = BlogImage::with(['blog.categories'])
                ->where('image_data', $parsedPath)
                ->first();

            if (!$banner) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Banner not found for provided image_data'
                ], 404);
            }

            return response()->json([
                'status' => 200,
                'data' => $banner
            ], 200);
        }

        // Kalau tidak pakai image_data, fallback ke pencarian by ID
        if ($id) {
            $banner = BlogImage::with(['blog.categories'])->find($id);

            if (!$banner) {
                return response()->json(['status' => 404, 'message' => 'Banner not found'], 404);
            }

            return response()->json(['status' => 200, 'data' => $banner], 200);
        }

        return response()->json([
            'status' => 400,
            'message' => 'Missing id or image_data parameter'
        ], 400);
    }


    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'banners' => 'required|array',
            'banners.*' => 'required|image|mimes:jpeg,png,jpg,gif,webp',
            'blog_id' => 'nullable|integer|exists:tb_blog,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $uploadedBlogImage = [];

            foreach ($request->file('banners') as $file) {
                $filename = time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
                $file->move(storage_path('app/public/uploads/blogs/images'), $filename);

                $data = new BlogImage();
                $data->image_data = 'uploads/blogs/images/' . $filename;
                $data->blog_id = $request->input('blog_id');
                $data->save();

                // Load relationship untuk response
                $data->load('blog.categories');
                $uploadedBlogImage[] = $data;
            }

            DB::commit();

            return response()->json([
                'message' => 'Images uploaded successfully',
                'data' => $uploadedBlogImage,
                'status' => 201
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error uploading images', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 500,
                'message' => 'Error uploading images',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        \Log::info('Received update request for gallery', [
            'id' => $id,
            'all_data' => $request->all()
        ]);

        $validator = Validator::make($request->all(), [
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'blog_id' => 'nullable|integer|exists:tb_blog,id',
            'is_primary' => 'nullable|boolean'
        ]);

        if ($validator->fails()) {
            \Log::error('Validation failed', [
                'errors' => $validator->errors()->toArray(),
                'submitted_data' => $request->all()
            ]);

            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $data = BlogImage::find($id);

            if (!$data) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Banner not found'
                ], 404);
            }

            // Update blog_id jika disediakan
            if ($request->filled('blog_id')) {
                $data->blog_id = $request->blog_id;
            }else{
                $data->blog_id = null;
            }

            // Update is_primary jika disediakan
            if ($request->has('is_primary')) {
                $data->is_primary = $request->is_primary;
            }

            // Handle image upload jika ada file baru
            if ($request->hasFile('image')) {
                // Get original path from database (before accessor modifies it)
                $originalPath = $data->getRawOriginal('image_data');

                // Delete old image from storage if exists
                if ($originalPath && Storage::disk('public')->exists($originalPath)) {
                    Storage::disk('public')->delete($originalPath);
                    \Log::info('Deleted old image', ['path' => $originalPath]);
                }

                // Upload new image
                $file = $request->file('image');
                $fileName = time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
                $file->move(storage_path('app/public/uploads/blogs/images'), $fileName);

                // Save new path
                $data->image_data = 'uploads/blogs/images/' . $fileName;

                \Log::info('Uploaded new image', ['filename' => $fileName]);
            }

            $data->save();

            DB::commit();

            // Load relationships untuk response yang lengkap
            $data->load('blog.categories');

            \Log::info('Banner updated successfully', ['id' => $id]);

            return response()->json([
                'status' => 200,
                'message' => 'Banner updated successfully',
                'data' => $data,
            ], 200);

        } catch (ValidationException $e) {
            DB::rollBack();
            \Log::error('Validation error during update', [
                'errors' => $e->errors()
            ]);

            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating banner', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 500,
                'message' => 'Error updating banner',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function delete($id)
    {
        try {
            DB::beginTransaction();

            $banner = BlogImage::find($id);

            if (!$banner) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Banner not found'
                ], 404);
            }

            // Get original path from database (before accessor modifies it)
            $originalPath = $banner->getRawOriginal('image_data');

            // Delete image from storage if exists
            if ($originalPath && Storage::disk('public')->exists($originalPath)) {
                Storage::disk('public')->delete($originalPath);
                \Log::info('Deleted banner image', ['path' => $originalPath]);
            }

            $banner->delete();

            DB::commit();

            return response()->json([
                'status' => 200,
                'message' => 'Banner deleted successfully'
            ], 200);

        } catch (\Throwable $th) {
            DB::rollBack();
            \Log::error('Error deleting banner', [
                'error' => $th->getMessage(),
                'trace' => $th->getTraceAsString()
            ]);

            return response()->json([
                'status' => 500,
                'message' => 'Error deleting banner',
                'error' => $th->getMessage()
            ], 500);
        }
    }
}
