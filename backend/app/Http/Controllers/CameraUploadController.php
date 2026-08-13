<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Carbon\Carbon;

class CameraUploadController extends Controller
{
    /**
     * Upload camera image (public - no auth)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function upload(Request $request)
    {
        return $this->handleUpload($request, null);
    }

    /**
     * Upload camera image (protected with Sanctum)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadAuth(Request $request)
    {
        $user = $request->user();
        return $this->handleUpload($request, $user->id);
    }

    /**
     * Core upload logic
     *
     * @param Request $request
     * @param int|null $userId
     * @return \Illuminate\Http\JsonResponse
     */
    private function handleUpload(Request $request, $userId = null)
    {
        // Validate request
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,jpg,png|max:10240', // max 10MB
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $image = $request->file('image');

            // Generate unique filename
            $timestamp = Carbon::now()->format('YmdHis');
            $randomString = Str::random(8);
            $extension = $image->getClientOriginalExtension();
            $filename = "camera_{$timestamp}_{$randomString}.{$extension}";

            // Define storage path (organized by date)
            $date = Carbon::now()->format('Y/m/d');
            $path = "shooting-files/{$date}";

            // Store image (using local disk to save to storage/app)
            $storedPath = $image->storeAs($path, $filename, 'local');

            // Optional: Save to database
            $upload = \App\Models\CameraUpload::create([
                'user_id' => $userId, // Will be null for public uploads
                'filename' => $filename,
                'path' => $storedPath,
                'size' => $image->getSize(),
                'mime_type' => $image->getMimeType(),
                'uploaded_at' => Carbon::now(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Image uploaded successfully',
                'data' => [
                    'id' => $upload->id,
                    'filename' => $filename,
                    'path' => $storedPath,
                    // 'url' => url("storage/shooting-files/{$date}/{$filename}"),
                    'url' => asset("storage/{$storedPath}"),

                    'size' => $upload->size,
                    'uploaded_at' => $upload->uploaded_at->toIso8601String(),
                ]
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Camera upload error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Upload failed',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get recent uploads (optional endpoint)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRecent(Request $request)
    {
        $limit = $request->input('limit', 20);

        $uploads = \App\Models\CameraUpload::latest('uploaded_at')
            ->take($limit)
            ->get()
            ->map(function ($upload) {
                $dateFromPath = dirname($upload->path);
                return [
                    'id' => $upload->id,
                    'filename' => $upload->filename,
                    'url' => url("storage/{$upload->path}"),
                    'size' => $upload->size,
                    'uploaded_at' => $upload->uploaded_at->toIso8601String(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $uploads
        ]);
    }

    /**
     * Get current user's uploads (protected with Sanctum)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMyUploads(Request $request)
    {
        $user = $request->user();
        $limit = $request->input('limit', 50);

        $uploads = \App\Models\CameraUpload::where('user_id', $user->id)
            ->latest('uploaded_at')
            ->take($limit)
            ->get()
            ->map(function ($upload) {
                return [
                    'id' => $upload->id,
                    'filename' => $upload->filename,
                    'url' => url("storage/{$upload->path}"),
                    'size' => $upload->size,
                    'formatted_size' => $upload->formatted_size,
                    'uploaded_at' => $upload->uploaded_at->toIso8601String(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $uploads,
            'total' => $uploads->count()
        ]);
    }

    /**
     * Delete old uploads (can be called via scheduled task)
     *
     * @param int $daysOld
     * @return int Number of deleted files
     */
    public function cleanupOldUploads($daysOld = 7)
    {
        $cutoffDate = Carbon::now()->subDays($daysOld);

        $oldUploads = \App\Models\CameraUpload::where('uploaded_at', '<', $cutoffDate)->get();

        $deletedCount = 0;
        foreach ($oldUploads as $upload) {
            // Delete file from storage/app
            if (Storage::disk('local')->exists($upload->path)) {
                Storage::disk('local')->delete($upload->path);
            }

            // Delete database record
            $upload->delete();
            $deletedCount++;
        }

        return $deletedCount;
    }
    public function showImage($hash)
    {
        // Temukan file berdasarkan hash
        $upload = \App\Models\CameraUpload::where('filename', 'like', "%{$hash}%")->first();

        if (!$upload || !Storage::disk('local')->exists($upload->path)) {
            abort(404, "Image not found");
        }

        // Ambil konten file
        $fileContents = Storage::disk('local')->get($upload->path);
        $mimeType = $upload->mime_type;

        return response($fileContents)
            ->header('Content-Type', $mimeType)
            ->header('Cache-Control', 'public, max-age=3600');
    }

}
