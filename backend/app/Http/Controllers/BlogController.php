<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use App\Models\BlogImage;
use Illuminate\Http\Request;
use Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Storage;
use DB;

class BlogController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('perPage', 10);
        $sortKey = $request->input('sortKey', 'created_at');
        $sortDirection = $request->input('sortDirection', 'desc');
        $searchQuery = $request->input('q');
        $fromDate = $request->input('fromDate');
        $toDate = $request->input('toDate');
        $isPublic = $request->input('isPublic');

        $query = Blog::with(['categories', 'author', 'images']);

        // Apply status filter
        if ($isPublic === 'true') {
            $query->where('status', 1);
        }

        // Search query
        if (!empty($searchQuery)) {
            $query->where(function ($q) use ($searchQuery) {
                $q->where('name', 'LIKE', "%{$searchQuery}%")
                    ->orWhereHas('categories', function ($cat) use ($searchQuery) {
                        $cat->where('name', 'LIKE', "%{$searchQuery}%");
                    })
                    ->orWhere('description', 'LIKE', "%{$searchQuery}%")
                    ->orWhereHas('author', function ($auth) use ($searchQuery) {
                        $auth->where('name', 'LIKE', "%{$searchQuery}%")
                            ->orWhere('email', 'LIKE', "%{$searchQuery}%");
                    });
            });
        }

        // Date range filters - PERBAIKAN DI SINI
        if (!empty($fromDate)) {
            try {
                // Parse tanggal dan set ke awal hari
                $from = \Carbon\Carbon::parse($fromDate)->startOfDay();
                $query->where('created_at', '>=', $from);
            } catch (\Exception $e) {
                // Log error jika format tanggal salah
                \Log::error('Invalid fromDate format: ' . $fromDate);
            }
        }

        if (!empty($toDate)) {
            try {
                // Parse tanggal dan set ke akhir hari
                $to = \Carbon\Carbon::parse($toDate)->endOfDay();
                $query->where('created_at', '<=', $to);
            } catch (\Exception $e) {
                // Log error jika format tanggal salah
                \Log::error('Invalid toDate format: ' . $toDate);
            }
        }

        // Sorting with stability
        $query->orderBy($sortKey, $sortDirection)
            ->orderBy('id', 'desc');

        // Execute paginated query
        $result = $query->paginate($perPage);

        // Count totals - GUNAKAN QUERY YANG SAMA
        $totalQuery = Blog::query();

        if ($isPublic === 'true') {
            $totalQuery->where('status', 1);
        }
        if (!empty($searchQuery)) {
            $totalQuery->where(function ($q) use ($searchQuery) {
                $q->where('name', 'LIKE', "%{$searchQuery}%")
                    ->orWhereHas('categories', function ($cat) use ($searchQuery) {
                        $cat->where('name', 'LIKE', "%{$searchQuery}%");
                    })
                    ->orWhere('description', 'LIKE', "%{$searchQuery}%")
                    ->orWhereHas('author', function ($auth) use ($searchQuery) {
                        $auth->where('name', 'LIKE', "%{$searchQuery}%")
                            ->orWhere('email', 'LIKE', "%{$searchQuery}%");
                    });
            });
        }

        // Tambahkan filter tanggal yang sama di totalQuery
        if (!empty($fromDate)) {
            try {
                $from = \Carbon\Carbon::parse($fromDate)->startOfDay();
                $totalQuery->where('created_at', '>=', $from);
            } catch (\Exception $e) {
                \Log::error('Invalid fromDate format in totalQuery: ' . $fromDate);
            }
        }

        if (!empty($toDate)) {
            try {
                $to = \Carbon\Carbon::parse($toDate)->endOfDay();
                $totalQuery->where('created_at', '<=', $to);
            } catch (\Exception $e) {
                \Log::error('Invalid toDate format in totalQuery: ' . $toDate);
            }
        }

        $totalVisible = Blog::where('status', 1)->count();
        $totalHidden = Blog::where('status', 0)->count();

        return response()->json([
            "success" => true,
            "message" => "Data fetched successfully",
            'data' => $result->items(),
            'total_visible' => $totalVisible,
            'total_hidden' => $totalHidden,
            'total' => $result->total(),
            'per_page' => $result->perPage(),
            'current_page' => $result->currentPage(),
            'last_page' => $result->lastPage(),
            'from' => $result->firstItem(),
            'to' => $result->lastItem()
        ]);
    }

    public function view($key)
    {
        $blog = Blog::with(['categories', 'images', 'author'])
            ->where('key', $key)
            ->where('status', 1) // Only fetch public blog (status = true)
            ->firstOrFail();

        return response()->json(['data' => $blog]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'status' => 'required|boolean|in:0,1',
            'category_ids' => 'required|array',
            'category_ids.*' => 'exists:tb_blog_category,id',
            'images' => 'nullable|array',
            'images.*' => 'file|image|mimes:jpeg,png,jpg,webp|max:2048',
            'is_primary' => 'nullable|array',
            'is_primary.*' => 'boolean',
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

            // Create blog
            $blog = Blog::create([
                'key' => Str::uuid(),
                'name' => $request->name,
                'description' => $request->description,
                'status' => $request->status,
                'author_id' => auth()->id(),
            ]);

            $blog->categories()->attach($request->category_ids);

            // Handle images
            if ($request->hasFile('images')) {
                $isPrimary = $request->input('is_primary', []);
                foreach ($request->file('images') as $index => $file) {
                    $filename = time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
                    $file->move(storage_path('app/public/uploads/blogs/images/'), $filename);

                    $blog->images()->create([
                        'image_data' => 'app/public/uploads/blogs/images/' . $filename,
                        'is_primary' => isset($isPrimary[$index]) ? (bool) $isPrimary[$index] : false,
                    ]);
                }
            }

            DB::commit();

            // Load relationships for response
            $blog->load(['categories', 'images', 'author']);

            return response()->json([
                'status' => 201,
                'blog' => $blog,
                'message' => 'Blog created successfully'
            ], 201);

        } catch (\Throwable $th) {
            DB::rollBack();
            return response()->json([
                'status' => 500,
                'message' => 'Internal Server Error',
                'error' => $th->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $key)
    {
        \Log::info('Received update request for blog', [
            'key' => $key,
            'all_data' => $request->all()
        ]);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'status' => 'required|boolean|in:0,1',
            'category_ids' => 'required|array',
            'category_ids.*' => 'exists:tb_blog_category,id',
            'images' => 'nullable|array',
            'images.*' => 'file|image|mimes:jpeg,png,jpg,webp|max:2048',
            'is_primary' => 'nullable|array',
            'is_primary.*' => 'boolean',
            'existing_images' => 'nullable|array',
            'existing_images.*.id' => 'required|exists:blog_images,id',
            'existing_images.*.is_primary' => 'required|boolean',
            'images_to_remove' => 'nullable|array',
            'images_to_remove.*' => 'exists:blog_images,id',
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

            $blog = Blog::where('key', $key)->firstOrFail();

            // Update blog details
            $blog->update([
                'name' => $request->name,
                'description' => $request->description,
                'status' => $request->status
            ]);

            // Update categories
            $categoryIds = array_map('intval', $request->input('category_ids', []));
            $blog->categories()->sync($categoryIds);

            // Reset all images to non-primary first
            $blog->images()->update(['is_primary' => false]);

            // Remove images that need to be deleted
            if ($request->filled('images_to_remove') && is_array($request->images_to_remove)) {
                foreach ($request->images_to_remove as $imgId) {
                    $img = BlogImage::where('id', $imgId)
                        ->where('blog_id', $blog->id)
                        ->first();

                    if ($img) {
                        // Get original path from database (before accessor modifies it)
                        $originalPath = $img->getRawOriginal('image_data');

                        // Delete file from storage using original path
                        if ($originalPath && Storage::disk('public')->exists($originalPath)) {
                            Storage::disk('public')->delete($originalPath);
                        }

                        // Delete database record
                        $img->delete();
                    }
                }
            }


            // Update existing images
            if ($request->filled('existing_images') && is_array($request->existing_images)) {
                foreach ($request->existing_images as $imgData) {
                    if (isset($imgData['id']) && isset($imgData['is_primary'])) {
                        BlogImage::where('id', $imgData['id'])
                            ->where('blog_id', $blog->id)
                            ->update([
                                'is_primary' => $imgData['is_primary'],
                            ]);
                    }
                }
            }


            // Handle new images
           if ($request->hasFile('images')) {
                foreach ($request->file('images') as $index => $file) {
                    $filename = time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
                    $file->move(storage_path('app/public/uploads/blogs/images'), $filename);
                    $blog->images()->create([
                        'image_data' => 'uploads/blogs/images/' . $filename,
                        'is_primary' => $request->is_primary[$index] ?? false,
                    ]);
                }
            }


            DB::commit();

            // Ensure we get fresh data with all relationships
            $blog->refresh();

            return response()->json([
                'status' => 200,
                'message' => 'Blog updated successfully',
                'data' => $blog->load(['categories', 'images', 'author'])
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating blog', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 500,
                'message' => 'Error updating blog',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function delete($key)
    {
        try {
            DB::beginTransaction();

            $blog = Blog::where('key', $key)->firstOrFail();

            // Delete associated images from filesystem
            $blog->images->each(function ($image) {
                $filePath = storage_path($image->image_data);
                if ($filePath && Storage::disk('public')->exists($image->image_data)) {
                    Storage::disk('public')->delete($filePath);
                    $image->delete();
                }
            });

            $blog->delete();

            DB::commit();

            return response()->json(['message' => 'Blog deleted successfully']);
        } catch (\Throwable $th) {
            DB::rollBack();
            return response()->json([
                'status' => 500,
                'message' => $th->getMessage()
            ], 500);
        }
    }
}
