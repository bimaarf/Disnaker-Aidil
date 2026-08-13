<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventImage;
use Illuminate\Http\Request;
use Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use DB;

class EventController extends Controller
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

        // Debug log
        Log::info('EventController::index', [
            'user' => Auth::user() ? Auth::user()->toArray() : null,
            'is_super admin' => Auth::user()?->hasRole(['super admin', 'administrator']),
            'isPublic' => $isPublic,
            'request_params' => $request->all(),
        ]);

        $query = Event::with(['categories', 'author', 'images'])
            ->orderBy($sortKey, $sortDirection);

        // Apply status filter only if isPublic=true or user is not a super admin
        if ($isPublic === 'true' ) {
            $query->where('status', 1);
        }

        if (!empty($searchQuery)) {
            $query->where(function ($q) use ($searchQuery) {
                $q->where('name', 'LIKE', "%$searchQuery%")
                  ->orWhere('description', 'LIKE', "%$searchQuery%")
                  ->orWhereHas('categories', function ($cat) use ($searchQuery) {
                      $cat->where('name', 'LIKE', "%$searchQuery%");
                  })
                  ->orWhereHas('author', function ($auth) use ($searchQuery) {
                      $auth->where('name', 'LIKE', "%$searchQuery%")
                           ->orWhere('email', 'LIKE', "%$searchQuery%");
                  });
            });
        }

        if (!empty($fromDate)) {
            $query->whereDate('created_at', '>=', $fromDate);
        }
        if (!empty($toDate)) {
            $query->whereDate('created_at', '<=', $toDate);
        }

        $result = $query->paginate($perPage);
        $total = $isPublic === 'true'
            ? Event::where('status', 1)->count()
            : Event::count();
        $totalVisible = Event::where('status', 1)->count();
        $totalHidden = Event::where('status', false)->count();

        // Debug log for response
        Log::info('EventController::index response', [
            'events' => $result->items(),
            'total' => $total,
            'total_visible' => $totalVisible,
            'total_hidden' => $totalHidden,
        ]);

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
        $event = Event::with(['categories', 'images', 'author'])
            ->where('key', $key)
            ->where('status', 1) // Only fetch public event (status = true)
            ->firstOrFail();

        return response()->json(['data' => $event]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'status' => 'required|boolean|in:0,1',
            'category_ids' => 'required|array',
            'category_ids.*' => 'exists:tb_event_category,id',
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

            // Create event
            $event = Event::create([
                'key' => Str::uuid(),
                'name' => $request->name,
                'description' => $request->description,
                'status' => $request->status,
                'author_id' => auth()->id(),
            ]);

            $event->categories()->attach($request->category_ids);

            // Handle images
            if ($request->hasFile('images')) {
                $isPrimary = $request->input('is_primary', []);
                foreach ($request->file('images') as $index => $file) {
                    $filename = time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
                    $file->move(public_path('enggang/events/images'), $filename);

                    $event->images()->create([
                        'image_data' => 'enggang/events/images/' . $filename,
                        'is_primary' => isset($isPrimary[$index]) ? (bool) $isPrimary[$index] : false,
                    ]);
                }
            }

            DB::commit();

            // Load relationships for response
            $event->load(['categories', 'images', 'author']);

            return response()->json([
                'status' => 201,
                'event' => $event,
                'message' => 'Event created successfully'
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
        \Log::info('Received update request for event', [
            'key' => $key,
            'all_data' => $request->all()
        ]);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'status' => 'required|boolean|in:0,1',
            'category_ids' => 'required|array',
            'category_ids.*' => 'exists:tb_event_category,id',
            'images' => 'nullable|array',
            'images.*' => 'file|image|mimes:jpeg,png,jpg,webp|max:2048',
            'is_primary' => 'nullable|array',
            'is_primary.*' => 'boolean',
            'existing_images' => 'nullable|array',
            'existing_images.*.id' => 'required|exists:event_images,id',
            'existing_images.*.is_primary' => 'required|boolean',
            'images_to_remove' => 'nullable|array',
            'images_to_remove.*' => 'exists:event_images,id',
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

            $event = Event::where('key', $key)->firstOrFail();

            // Update event details
            $event->update([
                'name' => $request->name,
                'description' => $request->description,
                'status' => $request->status
            ]);

            // Update categories
            $categoryIds = array_map('intval', $request->input('category_ids', []));
            $event->categories()->sync($categoryIds);

            // Reset all images to non-primary first
            $event->images()->update(['is_primary' => false]);

            // Remove images that need to be deleted
            if ($request->has('images_to_remove')) {
                $imagesToRemove = $request->input('images_to_remove');
                $event->images()->whereIn('id', $imagesToRemove)->get()->each(function($image) {
                    // Delete the image file from the server
                    if (file_exists(public_path($image->image_data))) {
                        unlink(public_path($image->image_data));
                    }
                    // Delete the image record
                    $image->delete();
                });
            }

            // Update existing images
            if ($request->has('existing_images')) {
                foreach ($request->existing_images as $imageData) {
                    $event->images()
                        ->where('id', $imageData['id'])
                        ->update(['is_primary' => $imageData['is_primary']]);
                }
            }

            // Handle new images
            if ($request->hasFile('images')) {
                $isPrimary = $request->input('is_primary', []);
                foreach ($request->file('images') as $index => $file) {
                    $filename = time() . '_' . Str::random(5) . '.' . $file->getClientOriginalExtension();
                    $file->move(public_path('enggang/events/images'), $filename);

                    $event->images()->create([
                        'image_data' => 'enggang/events/images/' . $filename,
                        'is_primary' => isset($isPrimary[$index]) ? (bool) $isPrimary[$index] : false,
                    ]);
                }
            }

            DB::commit();

            // Ensure we get fresh data with all relationships
            $event->refresh();

            return response()->json([
                'status' => 200,
                'message' => 'Event updated successfully',
                'data' => $event->load(['categories', 'images', 'author'])
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating event', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 500,
                'message' => 'Error updating event',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function delete($key)
    {
        try {
            DB::beginTransaction();

            $event = Event::where('key', $key)->firstOrFail();

            // Delete associated images from filesystem
            $event->images->each(function ($image) {
                $filePath = public_path($image->image_data);
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
            });

            $event->delete();

            DB::commit();

            return response()->json(['message' => 'Event deleted successfully']);
        } catch (\Throwable $th) {
            DB::rollBack();
            return response()->json([
                'status' => 500,
                'message' => $th->getMessage()
            ], 500);
        }
    }
}
