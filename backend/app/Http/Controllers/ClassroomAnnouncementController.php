<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\ClassroomAnnouncement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Exception;

class ClassroomAnnouncementController extends Controller
{
    /**
     * Display announcements for a classroom
     */
    public function index(Request $request, $classroomId)
    {
        try {
            $classroom = Classroom::findOrFail($classroomId);

            $validator = Validator::make($request->all(), [
                'priority' => 'nullable|in:low,normal,high,urgent',
                'search' => 'nullable|string|max:255',
                'is_pinned' => 'nullable|boolean',
                'per_page' => 'nullable|integer|min:1|max:100',
                'page' => 'nullable|integer|min:1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Parameter tidak valid',
                    'errors' => $validator->errors()
                ], 422);
            }

            $perPage = (int) $request->input('per_page', 10);
            $search = $request->input('search');
            $priority = $request->input('priority');
            $isPinned = $request->input('is_pinned');

            $query = $classroom->announcements()
                ->with('author:id,name,email')
                ->where('is_published', true)
                ->orderBy('is_pinned', 'desc')
                ->orderBy('created_at', 'desc');

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('content', 'like', "%{$search}%");
                });
            }

            if ($priority) {
                $query->where('priority', $priority);
            }

            if ($isPinned !== null) {
                $query->where('is_pinned', $isPinned);
            }

            $announcements = $query->paginate($perPage);

            $transformedAnnouncements = $announcements->getCollection()->map(function ($announcement) {
                return [
                    'id' => $announcement->id,
                    'title' => $announcement->title,
                    'content' => $announcement->content,
                    'priority' => $announcement->priority,
                    'is_pinned' => $announcement->is_pinned,
                    'is_published' => $announcement->is_published,
                    'published_at' => $announcement->published_at,
                    'views_count' => $announcement->views_count,
                    'attachments' => $announcement->attachments,
                    'author' => $announcement->author ? [
                        'id' => $announcement->author->id,
                        'name' => $announcement->author->name,
                        'email' => $announcement->author->email,
                    ] : null,
                    'created_at' => $announcement->created_at->toISOString(),
                    'updated_at' => $announcement->updated_at->toISOString(),
                ];
            });

            return response()->json([
                'status' => 'success',
                'message' => 'Data pengumuman berhasil diambil',
                'data' => [
                    'announcements' => $transformedAnnouncements,
                    'pagination' => [
                        'current_page' => $announcements->currentPage(),
                        'last_page' => $announcements->lastPage(),
                        'per_page' => $announcements->perPage(),
                        'total' => $announcements->total(),
                        'has_more' => $announcements->hasMorePages(),
                    ]
                ]
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kelas tidak ditemukan'
            ], 404);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil data pengumuman',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get single announcement
     */
    public function show($classroomId, $announcementId)
    {
        try {
            $classroom = Classroom::findOrFail($classroomId);
            $announcement = $classroom->announcements()
                ->with('author:id,name,email')
                ->findOrFail($announcementId);

            // Increment view count
            $announcement->increment('views_count');

            return response()->json([
                'status' => 'success',
                'message' => 'Detail pengumuman berhasil diambil',
                'data' => [
                    'id' => $announcement->id,
                    'title' => $announcement->title,
                    'content' => $announcement->content,
                    'priority' => $announcement->priority,
                    'is_pinned' => $announcement->is_pinned,
                    'is_published' => $announcement->is_published,
                    'published_at' => $announcement->published_at,
                    'views_count' => $announcement->views_count,
                    'attachments' => $announcement->attachments,
                    'author' => $announcement->author ? [
                        'id' => $announcement->author->id,
                        'name' => $announcement->author->name,
                        'email' => $announcement->author->email,
                    ] : null,
                    'created_at' => $announcement->created_at->toISOString(),
                    'updated_at' => $announcement->updated_at->toISOString(),
                ]
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengumuman tidak ditemukan'
            ], 404);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil detail pengumuman',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Store a new announcement
     */
    public function store(Request $request, $classroomId)
    {
        try {
            $classroom = Classroom::findOrFail($classroomId);

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'priority' => 'nullable|in:low,normal,high,urgent',
                'is_pinned' => 'nullable|boolean',
                'is_published' => 'nullable|boolean',
                'published_at' => 'nullable|date',
                'attachments' => 'nullable|array',
                'attachments.*' => 'file|max:5120', // 5MB max per file
            ], [
                'title.required' => 'Judul pengumuman harus diisi',
                'content.required' => 'Isi pengumuman harus diisi',
                'priority.in' => 'Prioritas tidak valid',
                'attachments.*.max' => 'Ukuran file maksimal 5MB',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $announcementData = [
                'classroom_id' => $classroomId,
                'author_id' => Auth::id(),
                'title' => $request->title,
                'content' => $request->content,
                'priority' => $request->priority ?? 'normal',
                'is_pinned' => $request->is_pinned ?? false,
                'is_published' => $request->is_published ?? true,
                'published_at' => $request->is_published ? ($request->published_at ?? now()) : null,
            ];

            // Handle attachments
            if ($request->hasFile('attachments')) {
                $attachmentPaths = [];
                foreach ($request->file('attachments') as $file) {
                    $fileName = time() . '_' . $file->getClientOriginalName();
                    $filePath = $file->storeAs('announcements/' . $classroomId, $fileName, 'public');
                    $attachmentPaths[] = [
                        'name' => $file->getClientOriginalName(),
                        'path' => $filePath,
                        'size' => $file->getSize(),
                        'type' => $file->getMimeType(),
                    ];
                }
                $announcementData['attachments'] = json_encode($attachmentPaths);
            }

            $announcement = ClassroomAnnouncement::create($announcementData);

            $announcement = ClassroomAnnouncement::with('author:id,name,email')
                ->find($announcement->id);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Pengumuman berhasil dibuat',
                'data' => [
                    'id' => $announcement->id,
                    'title' => $announcement->title,
                    'content' => $announcement->content,
                    'priority' => $announcement->priority,
                    'is_pinned' => $announcement->is_pinned,
                    'is_published' => $announcement->is_published,
                    'published_at' => $announcement->published_at,
                    'author' => $announcement->author ? [
                        'id' => $announcement->author->id,
                        'name' => $announcement->author->name,
                        'email' => $announcement->author->email,
                    ] : null,
                    'created_at' => $announcement->created_at->toISOString(),
                ]
            ], 201);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Kelas tidak ditemukan'
            ], 404);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat pengumuman',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Update announcement
     */
    public function update(Request $request, $classroomId, $announcementId)
    {
        try {
            $classroom = Classroom::findOrFail($classroomId);
            $announcement = $classroom->announcements()->findOrFail($announcementId);

            // Check if user is the author or has permission
            if ($announcement->author_id !== Auth::id()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Anda tidak memiliki izin untuk mengupdate pengumuman ini'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'priority' => 'nullable|in:low,normal,high,urgent',
                'is_pinned' => 'nullable|boolean',
                'is_published' => 'nullable|boolean',
                'published_at' => 'nullable|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = $request->only([
                'title', 'content', 'priority',
                'is_pinned', 'is_published', 'published_at'
            ]);

            if ($request->is_published && !$announcement->published_at) {
                $updateData['published_at'] = now();
            }

            $announcement->update($updateData);

            return response()->json([
                'status' => 'success',
                'message' => 'Pengumuman berhasil diupdate',
                'data' => $announcement->fresh()->load('author:id,name,email')
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengumuman tidak ditemukan'
            ], 404);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengupdate pengumuman',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Delete announcement
     */
    public function destroy($classroomId, $announcementId)
    {
        try {
            $classroom = Classroom::findOrFail($classroomId);
            $announcement = $classroom->announcements()->findOrFail($announcementId);

            // Check if user is the author or has permission
            if ($announcement->author_id !== Auth::id()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Anda tidak memiliki izin untuk menghapus pengumuman ini'
                ], 403);
            }

            DB::beginTransaction();

            // Delete attachments if exist
            if ($announcement->attachments) {
                $attachments = json_decode($announcement->attachments, true);
                foreach ($attachments as $attachment) {
                    if (isset($attachment['path']) && \Storage::disk('public')->exists($attachment['path'])) {
                        \Storage::disk('public')->delete($attachment['path']);
                    }
                }
            }

            $announcement->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Pengumuman berhasil dihapus'
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Pengumuman tidak ditemukan'
            ], 404);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus pengumuman',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Toggle pin status
     */
    public function togglePin($classroomId, $announcementId)
    {
        try {
            $classroom = Classroom::findOrFail($classroomId);
            $announcement = $classroom->announcements()->findOrFail($announcementId);

            $announcement->update([
                'is_pinned' => !$announcement->is_pinned
            ]);

            return response()->json([
                'status' => 'success',
                'message' => $announcement->is_pinned ? 'Pengumuman berhasil di-pin' : 'Pin pengumuman berhasil dihapus',
                'data' => [
                    'id' => $announcement->id,
                    'is_pinned' => $announcement->is_pinned
                ]
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengumuman tidak ditemukan'
            ], 404);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengubah status pin',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}
