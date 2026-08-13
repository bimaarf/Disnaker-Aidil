<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\ClassroomAssignment;
use App\Models\ClassroomAssignmentFile;
use App\Models\ClassroomAssignmentSubmission;
use App\Models\ClassroomAssignmentSubmissionFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;
use App\Jobs\UpdateViewCountJob;
use Carbon\Carbon;

class ClassroomAssignmentController extends Controller
{
    /**
     * Generate a secure hash for file access
     */
    private function generateFileHash($fileId, $classroomId)
    {
        $payload = [
            'file_id' => $fileId,
            'classroom_id' => $classroomId,
            'timestamp' => now()->timestamp,
            'salt' => Str::random(16)
        ];

        // Use URL-safe base64 encoding
        $encrypted = Crypt::encrypt(json_encode($payload));
        return rtrim(strtr(base64_encode($encrypted), '+/', '-_'), '=');
    }

    /**
     * Decode and validate file hash
     */
    private function decodeFileHash($hash)
    {
        try {
            // Convert URL-safe base64 back to regular base64
            $base64 = str_pad(strtr($hash, '-_', '+/'), strlen($hash) % 4, '=', STR_PAD_RIGHT);
            $decoded = base64_decode($base64);

            if ($decoded === false) {
                Log::warning('Failed to decode base64 hash');
                return null;
            }

            $decrypted = Crypt::decrypt($decoded);
            $payload = json_decode($decrypted, true);

            // Validate payload structure
            if (!isset($payload['file_id'], $payload['classroom_id'], $payload['timestamp'])) {
                Log::warning('Invalid payload structure in hash');
                return null;
            }

            // Optional: Add timestamp validation for expiry (uncomment if needed)
            // $maxAge = 24 * 60 * 60; // 24 hours
            // if (now()->timestamp - $payload['timestamp'] > $maxAge) {
            //     Log::warning('Hash has expired');
            //     return null;
            // }

            return $payload;
        } catch (\Exception $e) {
            Log::warning('Invalid file hash: ' . $e->getMessage(), [
                'hash' => $hash,
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }

    /**
     * Generate a secure hash for submission file access
     */
   private function generateSubmissionFileHash($fileId, $classroomId, $submissionId = null, $assignmentId = null)
    {
        $payload = [
            'file_id' => $fileId,
            'classroom_id' => $classroomId,
            'submission_id' => $submissionId, // PERBAIKAN: Tambahkan submission_id
            'assignment_id' => $assignmentId, // PERBAIKAN: Tambahkan assignment_id
            'timestamp' => now()->timestamp,
            'salt' => Str::random(16)
        ];

        $encrypted = Crypt::encrypt(json_encode($payload));
        return rtrim(strtr(base64_encode($encrypted), '+/', '-_'), '=');
    }

    /**
     * Decode and validate submission file hash
     */
    private function decodeSubmissionFileHash($hash)
    {
        try {
            $base64 = str_pad(strtr($hash, '-_', '+/'), strlen($hash) % 4, '=', STR_PAD_RIGHT);
            $decoded = base64_decode($base64);

            if ($decoded === false) {
                Log::warning('Failed to decode base64 submission hash');
                return null;
            }

            $decrypted = Crypt::decrypt($decoded);
            $payload = json_decode($decrypted, true);

            if (!isset($payload['file_id'], $payload['classroom_id'], $payload['timestamp'])) {
                Log::warning('Invalid payload structure in submission hash');
                return null;
            }

            return $payload;
        } catch (\Exception $e) {
            Log::warning('Invalid submission file hash: ' . $e->getMessage(), [
                'hash' => $hash,
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }

    /**
     * Generate hashed URLs for files and format links properly
     */
    private function generateHashedFileUrls($files, $classroomId)
    {
        $fileUrls = [];
        $linkObjects = [];

        foreach ($files as $file) {
            if ($file->type === 'file') {
                $hash = $this->generateFileHash($file->id, $classroomId);

                // Log the generated hash for debugging
                Log::info('Generated hash for file', [
                    'file_id' => $file->id,
                    'classroom_id' => $classroomId,
                    'hash' => $hash,
                    'hash_length' => strlen($hash)
                ]);

                $fileUrls[] = [
                    'id' => $file->id,
                    'type' => $file->file_type ?? 'application/octet-stream',
                    'size' => $file->file_size ?? 0,
                    'path' => url("/api/classrooms/assignments/secure-file/{$hash}"),
                    'download_url' => url("/api/classrooms/assignments/secure-download/{$hash}"),
                    'file_name' => pathinfo($file->path, PATHINFO_BASENAME),
                    'view_count' => $file->view_count ?? 0,
                    'download_count' => $file->download_count ?? 0,
                ];
            } else {
                // For links, format as objects with id and url
                $linkObjects[] = [
                    'id' => $file->id,
                    'url' => $file->path,
                    'view_count' => $file->view_count ?? 0,
                ];
            }
        }

        return [
            'files' => collect($fileUrls),
            'links' => collect($linkObjects)
        ];
    }

    /**
     * Generate hashed URLs for submission files
     */
        private function generateHashedSubmissionFileUrls($files, $classroomId, $submissionId = null, $assignmentId = null)
    {
        if (!$files || (is_countable($files) && count($files) === 0)) {
            return collect([]);
        }

        $fileUrls = [];

        // Pastikan $files adalah collection atau array yang bisa di-iterate
        $fileCollection = is_array($files) ? collect($files) : $files;

        foreach ($fileCollection as $file) {
            // PERBAIKAN: Pastikan $file adalah object, bukan array
            if (is_array($file)) {
                $file = (object) $file;
            }

            if (!isset($file->id)) {
                Log::warning('File object missing id property', [
                    'file' => $file,
                    'submission_id' => $submissionId,
                    'assignment_id' => $assignmentId
                ]);
                continue;
            }

            $hash = $this->generateSubmissionFileHash(
                $file->id,
                $classroomId,
                $submissionId,
                $assignmentId
            );

            $fileUrls[] = [
                'id' => $file->id,
                'original_name' => $file->original_name ?? '',
                'file_name' => $file->file_name ?? '',
                'file_size' => $file->file_size ?? 0,
                'file_type' => $file->file_type ?? '',
                'mime_type' => $file->mime_type ?? '',
                'uploaded_at' => $file->uploaded_at ?? null,
                'is_active' => $file->is_active ?? true,
                'path' => url("/api/classrooms/assignments/submissions/secure-file/{$hash}"),
                'download_url' => url("/api/classrooms/assignments/submissions/secure-download/{$hash}"),
            ];
        }

        return collect($fileUrls);
    }


    /**
     * Get current user submission for assignment
     */
    /**
     * Get all submissions for assignment
     */
    private function getAllAssignmentSubmissions($assignmentId, $type, $classroomId)
    {
        return ClassroomAssignmentSubmission::where('assignment_id', $assignmentId)
            ->where('type', $type)
            ->with([
                'files' => function($query) {
                    $query->where('is_active', true)->orderBy('uploaded_at', 'desc');
                },
                'student:id,name,email'
            ])
            ->orderBy('submitted_at', 'desc')
            ->get();
    }


    /**
     * Get current user submission for assignment (keep original method intact)
     */
    private function getCurrentUserSubmission($assignmentId, $type, $classroomId)
    {
        if (!Auth::check()) {
            return [];
        }

        $user = Auth::user();

        // Kalau admin / super admin / teacher → ambil semua submissions
        if ($user->hasRole(['administrator', 'super admin', 'teacher'])) {
            $submissions = ClassroomAssignmentSubmission::where('assignment_id', $assignmentId)
                ->where('type', $type)
                ->with([
                    'files' => function($query) {
                        $query->where('is_active', true)->orderBy('uploaded_at', 'desc');
                    },
                    'student:id,name,email',
                    'gradedBy:id,name,email'
                ])
                ->orderBy('submitted_at', 'desc')
                ->get();

            if ($submissions->isEmpty()) {
                return [];
            }

            $formatted = [];
            foreach ($submissions as $submission) {
                $submissionFiles = $this->generateHashedSubmissionFileUrls(
                    $submission->files,
                    $classroomId,
                    $submission->id,
                    $assignmentId
                );

                $formatted[] = [
                    'id' => $submission->id,
                    'assignment_id' => $submission->assignment_id,
                    'student_id' => $submission->student_id,
                    'student' => $submission->student,
                    'submission_text' => $submission->submission_text,
                    'status' => $submission->status,
                    'type' => $submission->type,
                    'submitted_at' => $submission->submitted_at,
                    'graded_at' => $submission->graded_at,
                    'graded_by' => $submission->gradedBy,
                    'points' => $submission->points,
                    'max_points' => $submission->max_points,
                    'teacher_feedback' => $submission->teacher_feedback,
                    'is_late' => $submission->is_late,
                    'attempt_number' => $submission->attempt_number,
                    'files' => $submissionFiles->values()->all(),
                    'files_count' => $submissionFiles->count(),
                    'created_at' => $submission->created_at,
                    'updated_at' => $submission->updated_at,
                    'metadata' => $submission->metadata,
                ];
            }

            return $formatted;
        }

        // Kalau user biasa → ambil hanya submission miliknya
        $submission = ClassroomAssignmentSubmission::where('assignment_id', $assignmentId)
            ->where('type', $type)
            ->where('student_id', $user->id)
            ->with([
                'files' => function($query) {
                    $query->where('is_active', true)->orderBy('uploaded_at', 'desc');
                },
                'gradedBy:id,name,email'
            ])
            ->first();

        if (!$submission) {
            return [];
        }

        $submissionFiles = $this->generateHashedSubmissionFileUrls(
            $submission->files,
            $classroomId,
            $submission->id,
            $assignmentId
        );

        return [[
            'id' => $submission->id,
            'assignment_id' => $submission->assignment_id,
            'student_id' => $submission->student_id,
            'student' => $submission->student,
            'submission_text' => $submission->submission_text,
            'status' => $submission->status,
            'submitted_at' => $submission->submitted_at,
            'graded_at' => $submission->graded_at,
            'graded_by' => $submission->gradedBy,
            'points' => $submission->points,
            'max_points' => $submission->max_points,
            'teacher_feedback' => $submission->teacher_feedback,
            'is_late' => $submission->is_late,
            'attempt_number' => $submission->attempt_number,
            'files' => $submissionFiles->values()->all(),
            'files_count' => $submissionFiles->count(),
            'created_at' => $submission->created_at,
            'updated_at' => $submission->updated_at,
            'metadata' => $submission->metadata,
        ]];
    }

    /**
     * Display a listing of the assignments for a classroom.
     */
    public function index(Request $request, $code)
    {
        try {
            $classroom = Classroom::where('code', $code)->first();
            if (!$classroom) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Kelas tidak ditemukan!'
                ], 404);
            }

            $query = ClassroomAssignment::where('classroom_id', $classroom->id)
                ->with(['uploader:id,name,email', 'files'])
                ->available();

            // Search filter
            if ($request->filled('search')) {
                $query->search($request->search);
            }

            // Type filter
            if ($request->filled('type')) {
                $query->byType($request->type);
            }

            // Sorting
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');
            $allowedSorts = ['created_at', 'title', 'type'];
            if (in_array($sortBy, $allowedSorts)) {
                $query->orderBy($sortBy, $sortOrder);
            }

            $perPage = min($request->input('per_page', 10), 50);
            $assignments = $query->paginate($perPage);

            $assignments->getCollection()->transform(function ($assignment) use ($classroom) {
            // Generate hashed URLs for assignment files
            $result = $this->generateHashedFileUrls($assignment->files, $assignment->classroom_id);

            // Get current user submission if authenticated
            $submissionArray = $this->getCurrentUserSubmission($assignment->id, $assignment->type, $classroom->id);
            $submissionData = [];

            if (!empty($submissionArray) && Auth::check()) {
                $user = auth()->user();

                if (!$user->hasRole(['administrator', 'teacher', 'super admin'])) {
                    $userSubmission = collect($submissionArray)->firstWhere('student_id', $user->id);
                    if ($userSubmission) {
                        $submissionFiles = $this->generateHashedSubmissionFileUrls(
                            collect($userSubmission['files'] ?? []),
                            $assignment->classroom_id,
                            $userSubmission['id'],
                            $assignment->id
                        );

                        $submissionData = [[
                            'id' => $userSubmission['id'],
                            'student_id' => $userSubmission['student_id'],
                            'student' => $userSubmission['student'] ?? null,
                            'submission_text' => $userSubmission['submission_text'],
                            'status' => $userSubmission['status'],
                            'submitted_at' => $userSubmission['submitted_at'],
                            'graded_at' => $userSubmission['graded_at'],
                            'points' => $userSubmission['points'],
                            'max_points' => $userSubmission['max_points'],
                            'teacher_feedback' => $userSubmission['teacher_feedback'],
                            'is_late' => $userSubmission['is_late'],
                            'files' => $submissionFiles->values()->all(),
                            'files_count' => $submissionFiles->count(),
                            'created_at' => $userSubmission['created_at'],
                            'updated_at' => $userSubmission['updated_at'],
                        ]];
                    }
                } else {
                    $formattedSubmissions = [];
                    foreach ($submissionArray as $submissionItem) {
                        $submissionFiles = $this->generateHashedSubmissionFileUrls(
                            collect($submissionItem['files'] ?? []),
                            $assignment->classroom_id,
                            $submissionItem['id'],
                            $assignment->id
                        );

                        $submissionItem['files'] = $submissionFiles->values()->all();
                        $submissionItem['files_count'] = $submissionFiles->count();
                        $formattedSubmissions[] = $submissionItem;
                    }
                    $submissionData = $formattedSubmissions;
                }
            }

            // Tambahin questions kalau assignment type = form
            $questions = [];
            if ($assignment->type === 'form') {
                $questions = $assignment->questions()->get()->toArray();
            }

            // Tambahkan is_available dari available_from dan is_visible
            $isAvailable = $assignment->is_visible
                && (!$assignment->available_from || now()->gte($assignment->available_from));

            return [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'description' => $assignment->description,
                'type' => $assignment->type,
                'file_urls' => $result['files']->values()->all(),
                'links' => $result['links']->values()->all(),
                'available_from' => $assignment->available_from,
                'available_until' => $assignment->available_until,
                'is_visible' => $assignment->is_visible,
                'is_available' => $isAvailable, // ✅ tambahkan
                'uploader' => $assignment->uploader,
                'submissions' => $submissionData,
                'questions' => $questions,
                'created_at' => $assignment->created_at,
                'updated_at' => $assignment->updated_at,
            ];
        });


            return response()->json([
                'status' => 'success',
                'data' => [
                    'assignments' => $assignments->items(),
                    'pagination' => [
                        'current_page' => $assignments->currentPage(),
                        'last_page' => $assignments->lastPage(),
                        'per_page' => $assignments->perPage(),
                        'total' => $assignments->total(),
                        'from' => $assignments->firstItem(),
                        'to' => $assignments->lastItem()
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil data assignment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified assignment.
     * PERBAIKAN: Memastikan submissions selalu array di response
     */
    public function show($code, $assignmentId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            $assignment = ClassroomAssignment::where('classroom_id', $classroom->id)
                ->with(['uploader:id,name,email', 'classroom:id,name', 'files'])
                ->findOrFail($assignmentId);

            if (!$assignment->is_visible || !$assignment->is_available) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Tugas tidak tersedia saat ini',
                ], 403);
            }

            // Generate hashed URLs for assignment files
            $result = $this->generateHashedFileUrls($assignment->files, $assignment->classroom_id);

            // Get current user submission if authenticated
            $submissionArray = $this->getCurrentUserSubmission($assignment->id, $assignment->type, $classroom->id);

            // PERBAIKAN: Memastikan submissionData selalu array
            $submissionData = [];

            if (!empty($submissionArray)) {
                // getCurrentUserSubmission returns an array, so we process each submission
                $processedSubmissions = [];

                foreach ($submissionArray as $submissionItem) {
                    // PERBAIKAN: Use secure submission file URLs with proper parameters
                    $submissionFiles = $this->generateHashedSubmissionFileUrls(
                        collect($submissionItem['files'] ?? []),
                        $assignment->classroom_id,
                        $submissionItem['id'], // submission_id
                        $assignment->id // assignment_id
                    );

                    $processedSubmissions[] = [
                        'id' => $submissionItem['id'],
                        'student_id' => $submissionItem['student_id'],
                        'student' => $submissionItem['student'] ?? null,
                        'submission_text' => $submissionItem['submission_text'],
                        'status' => $submissionItem['status'],
                        'submitted_at' => $submissionItem['submitted_at'],
                        'graded_at' => $submissionItem['graded_at'],
                        'points' => $submissionItem['points'],
                        'max_points' => $submissionItem['max_points'],
                        'teacher_feedback' => $submissionItem['teacher_feedback'],
                        'is_late' => $submissionItem['is_late'],
                        'files' => $submissionFiles->values()->all(),
                        'files_count' => $submissionFiles->count(),
                        'created_at' => $submissionItem['created_at'],
                        'updated_at' => $submissionItem['updated_at'],
                    ];
                }

                $submissionData = $processedSubmissions; // PERBAIKAN: Selalu array
            }

            $assignmentData = [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'description' => $assignment->description,
                'type' => $assignment->type,
                'file_urls' => $result['files']->values()->all(),
                'links' => $result['links']->values()->all(),
                'available_from' => $assignment->available_from,
                'available_until' => $assignment->available_until,
                'is_visible' => $assignment->is_visible,
                'uploader' => $assignment->uploader,
                'submissions' => $submissionData, // PERBAIKAN: SELALU array
                'created_at' => $assignment->created_at,
                'updated_at' => $assignment->updated_at,
            ];

            return response()->json([
                'status' => 'success',
                'data' => $assignmentData,
            ]);

        } catch (\Exception $e) {
            Log::error('Assignment show error', [
                'code' => $code,
                'assignment_id' => $assignmentId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Tugas tidak ditemukan',
                'error' => $e->getMessage()
            ], 404);
        }
    }
    /**
     * Secure file access via hash
     */
    public function secureFileAccess($hash)
    {
        try {
            Log::info('Secure file access attempt', ['hash' => $hash]);

            $payload = $this->decodeFileHash($hash);
            if (!$payload) {
                Log::warning('Invalid hash payload', ['hash' => $hash]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid or expired file access token'
                ], 403);
            }

            Log::info('Hash decoded successfully', $payload);

            $file = ClassroomAssignmentFile::whereHas('assignment', function ($query) use ($payload) {
                $query->where('classroom_id', $payload['classroom_id']);
            })->find($payload['file_id']);

            if (!$file) {
                Log::warning('File not found', [
                    'file_id' => $payload['file_id'],
                    'classroom_id' => $payload['classroom_id']
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'File tidak ditemukan'
                ], 404);
            }

            if ($file->type !== 'file') {
                Log::warning('Invalid file type', [
                    'file_id' => $file->id,
                    'type' => $file->type
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid file type'
                ], 400);
            }

            if (!$file->assignment->is_visible || !$file->assignment->is_available) {
                Log::warning('Assignment not available', [
                    'assignment_id' => $file->assignment->id,
                    'is_visible' => $file->assignment->is_visible,
                    'is_available' => $file->assignment->is_available
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Tugas tidak tersedia saat ini',
                ], 403);
            }

            $filePathAbsolute = Storage::disk('public')->path($file->path);
            if (!file_exists($filePathAbsolute)) {
                Log::warning('Physical file not found', [
                    'file_path' => $file->path
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'File tidak ditemukan',
                ], 404);
            }

            // PERBAIKAN: Increment view count hanya sekali per session untuk video
            $isVideo = $this->isVideoFile($file);
            if ($isVideo) {
                $sessionKey = 'viewed_video_' . $file->id;
                if (!session()->has($sessionKey)) {
                    $file->incrementViewCount();
                    session()->put($sessionKey, true);
                    Log::info('Video view count incremented', ['file_id' => $file->id]);
                }
            } else {
                // Non-video files increment setiap view
                $file->incrementViewCount();
            }

            $extension = strtolower(pathinfo($file->path, PATHINFO_EXTENSION));
            $fileName = $file->assignment->title . '.' . $extension;

            $viewableExtensions = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm', 'pdf'];
            $mimeType = Storage::disk('public')->mimeType($file->path) ?? [
                'pdf' => 'application/pdf',
                'doc' => 'application/msword',
                'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'ppt' => 'application/vnd.ms-powerpoint',
                'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'mp4' => 'video/mp4',
                'webm' => 'video/webm',
                'ogg' => 'video/ogg',
                'mp3' => 'audio/mpeg',
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'gif' => 'image/gif',
            ][$extension] ?? 'application/octet-stream';

            $disposition = in_array($extension, $viewableExtensions) ? 'inline' : 'attachment';

            // PERBAIKAN: Enhanced range streaming support
            $rangeHeader = request()->header('Range');
            $size = filesize($filePathAbsolute);
            $start = 0;
            $end = $size - 1;
            $status = 200;

            Log::info('File streaming request', [
                'file_size' => $size,
                'range_header' => $rangeHeader,
                'is_video' => $isVideo,
                'mime_type' => $mimeType
            ]);

            // Process range request
            if ($rangeHeader) {
                $status = 206; // Partial Content

                if (preg_match('/bytes=(\d+)-(\d*)/', $rangeHeader, $matches)) {
                    $start = intval($matches[1]);
                    if (isset($matches[2]) && $matches[2] !== '') {
                        $end = intval($matches[2]);
                    } else {
                        // PERBAIKAN: Untuk video, limit chunk size untuk kontrol bandwidth
                        if ($isVideo) {
                            $end = min($start + (2 * 1024 * 1024), $size - 1); // 2MB chunks
                        }
                    }

                    // Validate range
                    if ($start >= $size || $end >= $size || $start > $end) {
                        Log::warning('Invalid range request', [
                            'start' => $start,
                            'end' => $end,
                            'size' => $size
                        ]);

                        return response('Requested Range Not Satisfiable', 416)
                            ->header('Content-Range', "bytes */$size");
                    }
                }
            }

            $contentLength = $end - $start + 1;

            // PERBAIKAN: Optimized streaming dengan buffer
            $stream = new StreamedResponse(function () use ($filePathAbsolute, $start, $end, $isVideo, $file) {
                $chunkSize = $isVideo ? (256 * 1024) : (1024 * 1024); // 256KB untuk video, 1MB untuk file lain
                $handle = fopen($filePathAbsolute, 'rb');

                if (!$handle) {
                    Log::error('Failed to open file for streaming', ['file' => $filePathAbsolute]);
                    return;
                }

                // Set buffer untuk performance
                stream_set_read_buffer($handle, $chunkSize);

                if ($start > 0) {
                    fseek($handle, $start);
                }

                $bytesLeft = $end - $start + 1;
                $bytesServed = 0;

                while ($bytesLeft > 0 && !feof($handle) && !connection_aborted()) {
                    $read = min($chunkSize, $bytesLeft);
                    $data = fread($handle, $read);

                    if ($data === false) {
                        Log::error('Error reading file chunk', [
                            'file_id' => $file->id,
                            'bytes_served' => $bytesServed,
                            'bytes_left' => $bytesLeft
                        ]);
                        break;
                    }

                    echo $data;
                    flush();

                    $dataLength = strlen($data);
                    $bytesLeft -= $dataLength;
                    $bytesServed += $dataLength;

                    // PERBAIKAN: Rate limiting untuk video streaming
                    if ($isVideo && $dataLength > 0) {
                        // Small delay untuk kontrol bandwidth (optional)
                        usleep(1000); // 1ms delay
                    }
                }

                fclose($handle);

                Log::info('File streaming completed', [
                    'file_id' => $file->id,
                    'bytes_served' => $bytesServed,
                    'total_size' => $end - $start + 1
                ]);
            }, $status);

            // PERBAIKAN: Enhanced headers untuk video streaming
            $headers = [
                'Content-Type' => $mimeType,
                'Content-Disposition' => $disposition . '; filename="' . $fileName . '"',
                'Accept-Ranges' => 'bytes',
                'Content-Length' => $contentLength,
                'X-Content-Type-Options' => 'nosniff',
            ];

            // Add CORS headers
            $headers['Access-Control-Allow-Origin'] = '*';
            $headers['Access-Control-Allow-Headers'] = 'Range, Content-Range, Content-Length';
            $headers['Access-Control-Expose-Headers'] = 'Content-Range, Content-Length, Accept-Ranges';

            if ($status === 206) {
                $headers['Content-Range'] = "bytes $start-$end/$size";
            }

            // PERBAIKAN: Cache headers berdasarkan tipe file dan request
            if ($isVideo) {
                if ($rangeHeader && $this->isSmallRange($rangeHeader, $size)) {
                    // Cache small ranges (thumbnails/metadata) lebih lama
                    $headers['Cache-Control'] = 'public, max-age=3600, immutable';
                    $headers['ETag'] = '"' . md5($file->path . $file->updated_at) . '"';
                } else {
                    // Cache video chunks sebentar
                    $headers['Cache-Control'] = 'public, max-age=300';
                }
            } else {
                // Non-video files
                $headers['Cache-Control'] = 'public, max-age=86400'; // 24 hours
                $headers['ETag'] = '"' . md5_file($filePathAbsolute) . '"';
            }

            // Set semua headers
            foreach ($headers as $name => $value) {
                $stream->headers->set($name, $value);
            }

            Log::info('Serving file with enhanced streaming', [
                'file_id' => $file->id,
                'file_path' => basename($filePathAbsolute),
                'mime_type' => $mimeType,
                'disposition' => $disposition,
                'range' => "$start-$end/$size",
                'content_length' => $contentLength,
                'status' => $status,
                'is_video' => $isVideo
            ]);

            return $stream;

        } catch (\Exception $e) {
            Log::error('Secure file access error', [
                'hash' => $hash,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat mengakses file',
                'error' => app()->environment('local') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

// PERBAIKAN: Helper methods
    private function isVideoFile($file)
    {
        $videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'm4v'];
        $videoMimeTypes = [
            'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
            'video/x-msvideo', 'video/x-ms-wmv', 'video/x-flv', 'video/x-matroska'
        ];

        $extension = strtolower(pathinfo($file->path, PATHINFO_EXTENSION));

        return in_array($extension, $videoExtensions) ||
            in_array($file->mime_type ?? '', $videoMimeTypes);
    }

    private function isSmallRange($rangeHeader, $totalSize)
    {
        if (!$rangeHeader) return false;

        if (preg_match('/bytes=(\d+)-(\d*)/', $rangeHeader, $matches)) {
            $start = intval($matches[1]);
            $end = isset($matches[2]) && $matches[2] !== '' ? intval($matches[2]) : $totalSize - 1;
            $rangeSize = $end - $start + 1;

            // Consider ranges <= 2MB as small (likely thumbnails/metadata)
            return $rangeSize <= (2 * 1024 * 1024);
        }

        return false;
    }

    // PERBAIKAN: Method untuk optimize file serving
    public function optimizeFileServing()
    {
        // Set PHP configurations untuk streaming
        ini_set('memory_limit', '256M');
        ini_set('max_execution_time', 300); // 5 minutes
        ini_set('output_buffering', 0);

        if (ob_get_level()) {
            ob_end_clean();
        }

        // Disable gzip untuk video streaming
        if (extension_loaded('zlib')) {
            ini_set('zlib.output_compression', 0);
        }
    }

    /**
     * Secure file download via hash
     */
    public function secureFileDownload($hash)
    {
        try {
            $payload = $this->decodeFileHash($hash);
            if (!$payload) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid or expired download token'
                ], 403);
            }

            $file = ClassroomAssignmentFile::whereHas('assignment', function ($query) use ($payload) {
                $query->where('classroom_id', $payload['classroom_id']);
            })->findOrFail($payload['file_id']);

            if ($file->type !== 'file') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid file type'
                ], 400);
            }

            if (!$file->assignment->is_visible || !$file->assignment->is_available) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Tugas tidak tersedia untuk diunduh saat ini',
                ], 403);
            }

            if (!Storage::disk('public')->exists($file->path)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'File tidak ditemukan',
                ], 404);
            }

            $file->incrementDownloadCount();

            $originalExtension = strtolower(pathinfo($file->path, PATHINFO_EXTENSION));
            $originalPath = Storage::disk('public')->path($file->path);
            $cleanTitle = preg_replace('/[^a-zA-Z0-9\-_\.]/', '_', $file->assignment->title);
            $fileName = $cleanTitle . '.' . $originalExtension;

            $mimeType = Storage::disk('public')->mimeType($file->path);
            if (!$mimeType || $mimeType === 'text/plain') {
                $mimeTypes = [
                    'pdf'  => 'application/pdf',
                    'doc'  => 'application/msword',
                    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'ppt'  => 'application/vnd.ms-powerpoint',
                    'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'xls'  => 'application/vnd.ms-excel',
                    'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'mp4'  => 'video/mp4',
                    'mp3'  => 'audio/mpeg',
                    'jpg'  => 'image/jpeg',
                    'jpeg' => 'image/jpeg',
                    'png'  => 'image/png',
                    'gif'  => 'image/gif',
                    'txt'  => 'text/plain',
                    'zip'  => 'application/zip',
                    'rar'  => 'application/vnd.rar',
                ];
                $mimeType = $mimeTypes[$originalExtension] ?? 'application/octet-stream';
            }

            if (!file_exists($originalPath)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'File fisik tidak ditemukan di storage',
                ], 404);
            }

            return response()->download(
                $originalPath,
                $fileName,
                [
                    'Content-Type' => $mimeType,
                    'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
                    'Cache-Control' => 'no-cache, must-revalidate, max-age=0',
                    'Pragma' => 'no-cache',
                    'Expires' => '0',
                    'Content-Transfer-Encoding' => 'binary',
                ]
            );

        } catch (\Exception $e) {
            Log::error('Secure download error:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'hash' => $hash
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengunduh file: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a newly created assignment in storage.
     */
    public function store(Request $request, $code)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            // Enhanced validation rules
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'type' => 'required|in:document,form',
                'files.*' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx,mp4,mp3,jpg,jpeg,png,gif,txt',
                'links' => 'nullable|array',
                'links.*' => 'nullable|url|max:2048',
                'available_from' => 'nullable|date|after_or_equal:today',
                'available_until' => 'nullable|date|after_or_equal:available_from',
                'is_visible' => 'required|in:true,false,1,0',
            ], [
                'title.required' => 'Judul assignment harus diisi',
                'title.max' => 'Judul tidak boleh lebih dari 255 karakter',
                'type.required' => 'Tipe assignment harus dipilih',
                'type.in' => 'Tipe assignment tidak valid',
                'links.*.url' => 'Format link tidak valid',
                'links.*.max' => 'Link terlalu panjang (maksimal 2048 karakter)',
                'files.*.mimes' => 'File harus berupa: pdf, doc, docx, ppt, pptx, mp4, mp3, jpg, jpeg, png, gif, txt',
                'available_from.after_or_equal' => 'Tanggal mulai tidak boleh kurang dari hari ini',
                'available_until.after_or_equal' => 'Tanggal akhir harus setelah atau sama dengan tanggal mulai',
                'is_visible.required' => 'Status visibilitas harus diisi',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data tidak valid',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Convert string boolean to actual boolean
            $isVisible = filter_var($request->is_visible, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($isVisible === null) {
                $isVisible = in_array($request->is_visible, ['1', 'true', true, 1], true);
            }

            // Validate content requirements based on assignment type
            $newLinksArray = $request->input('links', []);
            $newLinksArray = array_filter($newLinksArray, function($link) {
                return !empty(trim($link)) && filter_var(trim($link), FILTER_VALIDATE_URL);
            });
            $hasNewFiles = $request->hasFile('files');
            $hasNewLinks = !empty($newLinksArray);
            $totalContent = ($hasNewFiles ? (is_array($request->file('files')) ? count($request->file('files')) : 1) : 0) + count($newLinksArray);

            // if (in_array($request->type, ['document', 'video', 'assignment']) && $totalContent == 0) {
            //     return response()->json([
            //         'status' => 'error',
            //         'message' => 'Tipe ' . $request->type . ' harus memiliki minimal satu file atau link',
            //     ], 422);
            // }

            // if ($request->type === 'link' && !$hasNewLinks) {
            //     return response()->json([
            //         'status' => 'error',
            //         'message' => 'Tipe link harus memiliki minimal satu link',
            //     ], 422);
            // }

            // Create new assignment
            $assignment = ClassroomAssignment::create([
                'classroom_id' => $classroom->id,
                'uploaded_by' => Auth::id(),
                'title' => trim($request->title),
                'description' => trim($request->description),
                'type' => $request->type,
                'available_from' => $request->available_from ?: null,
                'available_until' => $request->available_until ?: null,
                'is_visible' => $isVisible,
            ]);

            // Handle file uploads
            $uploadedFileCount = 0;
            if ($hasNewFiles) {
                $uploadedFiles = $request->file('files');
                if (!is_array($uploadedFiles)) {
                    $uploadedFiles = [$uploadedFiles];
                }

                foreach ($uploadedFiles as $file) {
                    if ($file && $file->isValid()) {
                        try {
                            $originalName = $file->getClientOriginalName(); // "output.pdf"
                            $nameOnly = pathinfo($originalName, PATHINFO_FILENAME); // "output"

                            $fileName = $nameOnly . '_' . time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();

                            $filePath = $file->storeAs('assignments/' . $classroom->id, $fileName, 'public');

                            ClassroomAssignmentFile::create([
                                'assignment_id' => $assignment->id,
                                'type' => 'file',
                                'path' => $filePath,
                                'file_size' => $file->getSize(),
                                'file_type' => $file->getClientMimeType(),
                            ]);

                            $uploadedFileCount++;

                            Log::info("File uploaded successfully", [
                                'file_name' => $fileName,
                                'file_path' => $filePath,
                                'file_size' => $file->getSize(),
                                'assignment_id' => $assignment->id
                            ]);

                        } catch (\Exception $e) {
                            Log::error("File upload error: " . $e->getMessage(), [
                                'file_name' => $file->getClientOriginalName(),
                                'assignment_id' => $assignment->id,
                                'error_trace' => $e->getTraceAsString()
                            ]);

                            return response()->json([
                                'status' => 'error',
                                'message' => 'Gagal mengupload file: ' . $file->getClientOriginalName(),
                            ], 500);
                        }
                    }
                }
            }

            // Handle links
            $addedLinkCount = 0;
            foreach ($newLinksArray as $link) {
                $trimmedLink = trim($link);
                try {
                    ClassroomAssignmentFile::create([
                        'assignment_id' => $assignment->id,
                        'type' => 'link',
                        'path' => $trimmedLink,
                    ]);
                    $addedLinkCount++;
                } catch (\Exception $e) {
                    Log::error("Link creation error: " . $e->getMessage(), [
                        'link' => $trimmedLink,
                        'assignment_id' => $assignment->id
                    ]);
                }
            }

            // Refresh data for accurate response
            $assignment->load([
                'uploader:id,name,email',
                'files' => function($query) {
                    $query->orderBy('created_at', 'desc');
                }
            ]);

            // Generate hashed URLs for response
            $result = $this->generateHashedFileUrls($assignment->files, $assignment->classroom_id);

            // Format response data
            $assignmentData = [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'description' => $assignment->description,
                'type' => $assignment->type,
                'is_visible' => $assignment->is_visible,
                'available_from' => $assignment->available_from,
                'available_until' => $assignment->available_until,
                'created_at' => $assignment->created_at,
                'updated_at' => $assignment->updated_at,
                'uploader' => $assignment->uploader,
                'file_urls' => $result['files']->values()->all(),
                'links' => $result['links']->values()->all(),
            ];

            // Summary of changes
            $changesSummary = [
                'files_added' => $uploadedFileCount,
                'links_added' => $addedLinkCount,
                'total_files' => $assignment->files->where('type', 'file')->count(),
                'total_links' => $assignment->files->where('type', 'link')->count(),
                'created_at' => $assignment->created_at->toISOString(),
            ];

            $assignmentData['changes_summary'] = $changesSummary;

            // Success message
            $successMessage = 'Tugas berhasil ditambahkan';
            if ($changesSummary['files_added'] > 0 || $changesSummary['links_added'] > 0) {
                $successMessage .= '. ' . $changesSummary['files_added'] . ' file dan ' .
                                  $changesSummary['links_added'] . ' link ditambahkan';
            }

            return response()->json([
                'status' => 'success',
                'message' => $successMessage,
                'data' => $assignmentData,
            ], 201);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kelas tidak ditemukan',
            ], 404);

        } catch (\Exception $e) {
            Log::error('Assignment creation error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'classroom_code' => $code,
                'request_data' => $request->except(['files'])
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menambahkan assignment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update the specified assignment in storage.
     */
  public function update(Request $request, $code, $assignmentId)
{
    try {
        $classroom = Classroom::where('code', $code)->firstOrFail();
        $assignment = ClassroomAssignment::where('classroom_id', $classroom->id)
            ->with('files')
            ->findOrFail($assignmentId);

        // === Validasi ===
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:document,form',
            'files.*' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx,mp4,mp3,jpg,jpeg,png,gif,txt',
            'links' => 'nullable|array',
            'links.*' => 'nullable|url|max:2048',
            'remove_file_ids' => 'nullable',
            'remove_link_ids' => 'nullable',
            'available_from' => 'nullable|date',
            'available_until' => 'nullable|date|after_or_equal:available_from',
            'is_visible' => 'required|in:true,false,1,0',
        ], [
            'title.required' => 'Judul assignment harus diisi',
            'title.max' => 'Judul tidak boleh lebih dari 255 karakter',
            'type.required' => 'Tipe assignment harus dipilih',
            'type.in' => 'Tipe assignment tidak valid',
            'links.*.url' => 'Format link tidak valid',
            'links.*.max' => 'Link terlalu panjang (maksimal 2048 karakter)',
            'files.*.mimes' => 'File harus berupa: pdf, doc, docx, ppt, pptx, mp4, mp3, jpg, jpeg, png, gif, txt',
            'available_until.after_or_equal' => 'Tanggal akhir harus setelah atau sama dengan tanggal mulai',
            'is_visible.required' => 'Status visibilitas harus diisi',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Data tidak valid',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Konversi boolean string ke boolean asli
        $isVisible = filter_var($request->is_visible, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        if ($isVisible === null) {
            $isVisible = in_array($request->is_visible, ['1', 'true', true, 1], true);
        }

        // === Hapus file ===
        $removeFileIds = $request->input('remove_file_ids', []);
        $removedFileCount = 0;
        if (is_string($removeFileIds)) {
            $removeFileIds = array_filter(array_map('trim', explode(',', $removeFileIds)));
        }
        if (!empty($removeFileIds)) {
            $filesToRemove = ClassroomAssignmentFile::where('assignment_id', $assignment->id)
                ->whereIn('id', $removeFileIds)
                ->where('type', 'file')
                ->get();
            foreach ($filesToRemove as $file) {
                try {
                    if ($file->path && Storage::disk('public')->exists($file->path)) {
                        Storage::disk('public')->delete($file->path);
                    }
                    $file->delete();
                    $removedFileCount++;
                } catch (\Exception $e) {
                    Log::warning("Failed to delete file: " . $file->path, [
                        'error' => $e->getMessage(),
                        'file_id' => $file->id
                    ]);
                }
            }
        }

        // === Hapus & tambah links ===
        $newLinksArray = $request->input('links', []);
        $newLinksArray = array_filter($newLinksArray, function($link) {
            return !empty(trim($link)) && filter_var(trim($link), FILTER_VALIDATE_URL);
        });

        $existingLinksCount = ClassroomAssignmentFile::where('assignment_id', $assignment->id)
            ->where('type', 'link')
            ->count();

        ClassroomAssignmentFile::where('assignment_id', $assignment->id)
            ->where('type', 'link')
            ->delete();

        $addedLinkCount = 0;
        foreach ($newLinksArray as $link) {
            $trimmedLink = trim($link);
            try {
                ClassroomAssignmentFile::create([
                    'assignment_id' => $assignment->id,
                    'type' => 'link',
                    'path' => $trimmedLink,
                ]);
                $addedLinkCount++;
            } catch (\Exception $e) {
                Log::error("Link creation error: " . $e->getMessage(), [
                    'link' => $trimmedLink,
                    'assignment_id' => $assignment->id
                ]);
            }
        }

        // === Validasi konten minimal ===
        $currentFiles = ClassroomAssignmentFile::where('assignment_id', $assignment->id)
            ->where('type', 'file')
            ->count();
        $currentLinks = $addedLinkCount;
        $hasNewFiles = $request->hasFile('files');
        $hasNewLinks = $addedLinkCount > 0;

        $totalContentAfterUpdate = $currentFiles + $currentLinks;
        if ($hasNewFiles) {
            $newFilesCount = is_array($request->file('files')) ? count($request->file('files')) : 1;
            $totalContentAfterUpdate += $newFilesCount;
        }

        // if (in_array($request->type, ['document', 'video', 'assignment']) && $totalContentAfterUpdate == 0) {
        //     return response()->json([
        //         'status' => 'error',
        //         'message' => 'Tipe ' . $request->type . ' harus memiliki minimal satu file atau link',
        //     ], 422);
        // }

        // if ($request->type === 'link' && !$hasNewLinks) {
        //     return response()->json([
        //         'status' => 'error',
        //         'message' => 'Tipe link harus memiliki minimal satu link',
        //     ], 422);
        // }

        // === Update assignment (simpan UTC di DB) ===
        $assignment->update([
            'title' => trim($request->title),
            'description' => trim($request->description),
            'type' => $request->type,
            'available_from' => $request->available_from ?: null,
            'available_until' => $request->available_until ?: null,
            'is_visible' => $isVisible,
        ]);

        // === Upload file baru ===
        $uploadedFileCount = 0;
        if ($hasNewFiles) {
            $uploadedFiles = $request->file('files');
            if (!is_array($uploadedFiles)) {
                $uploadedFiles = [$uploadedFiles];
            }
            foreach ($uploadedFiles as $file) {
                if ($file && $file->isValid()) {
                    try {
                        $originalName = $file->getClientOriginalName();
                        $nameOnly = pathinfo($originalName, PATHINFO_FILENAME);
                        $fileName = $nameOnly . '_' . time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
                        $filePath = $file->storeAs('assignments/' . $classroom->id, $fileName, 'public');
                        ClassroomAssignmentFile::create([
                            'assignment_id' => $assignment->id,
                            'type' => 'file',
                            'path' => $filePath,
                            'file_size' => $file->getSize(),
                            'file_type' => $file->getClientMimeType(),
                        ]);
                        $uploadedFileCount++;
                    } catch (\Exception $e) {
                        Log::error("File upload error: " . $e->getMessage(), [
                            'file_name' => $file->getClientOriginalName(),
                            'assignment_id' => $assignment->id,
                        ]);
                        return response()->json([
                            'status' => 'error',
                            'message' => 'Gagal mengupload file: ' . $file->getClientOriginalName(),
                        ], 500);
                    }
                }
            }
        }

        // === Refresh data ===
        $assignment->load([
            'uploader:id,name,email',
            'files' => function($query) { $query->orderBy('created_at', 'desc'); },
            'submissions.student:id,name,email',
            'submissions.gradedBy:id,name,email',
            'submissions.files' => function($query) {
                $query->where('is_active', true)->orderBy('uploaded_at', 'desc');
            }
        ]);

        $result = $this->generateHashedFileUrls($assignment->files, $assignment->classroom_id);

        // === Format available_from / available_until untuk response ===
        $availableFromJakarta = $assignment->available_from
            ? Carbon::parse($assignment->available_from)->timezone('Asia/Jakarta')->format('Y-m-d H:i')
            : null;
        $availableUntilJakarta = $assignment->available_until
            ? Carbon::parse($assignment->available_until)->timezone('Asia/Jakarta')->format('Y-m-d H:i')
            : null;

        // === Format submissions (sesuai role) ===
        $submissionData = [];
        if (Auth::check()) {
            $user = auth()->user();
            if ($user->hasRole(['administrator', 'teacher', 'super admin'])) {
                foreach ($assignment->submissions as $submission) {
                    $submissionFiles = $this->generateHashedSubmissionFileUrls(
                        $submission->files,
                        $assignment->classroom_id,
                        $submission->id,
                        $assignment->id
                    );
                    $submissionData[] = [
                        'id' => $submission->id,
                        'student_id' => $submission->student_id,
                        'student' => $submission->student,
                        'submission_text' => $submission->submission_text,
                        'status' => $submission->status,
                        'submitted_at' => $submission->submitted_at,
                        'graded_at' => $submission->graded_at,
                        'points' => $submission->points,
                        'max_points' => $submission->max_points,
                        'teacher_feedback' => $submission->teacher_feedback,
                        'graded_by' => $submission->gradedBy,
                        'is_late' => $submission->is_late,
                        'files' => $submissionFiles->values()->all(),
                        'files_count' => $submissionFiles->count(),
                        'created_at' => $submission->created_at,
                        'updated_at' => $submission->updated_at,
                    ];
                }
            } else {
                $submission = $assignment->submissions->firstWhere('student_id', $user->id);
                if ($submission) {
                    $submissionFiles = $this->generateHashedSubmissionFileUrls(
                        $submission->files,
                        $assignment->classroom_id,
                        $submission->id,
                        $assignment->id
                    );
                    $submissionData[] = [
                        'id' => $submission->id,
                        'student_id' => $submission->student_id,
                        'student' => $submission->student,
                        'submission_text' => $submission->submission_text,
                        'status' => $submission->status,
                        'submitted_at' => $submission->submitted_at,
                        'graded_at' => $submission->graded_at,
                        'points' => $submission->points,
                        'max_points' => $submission->max_points,
                        'teacher_feedback' => $submission->teacher_feedback,
                        'graded_by' => $submission->gradedBy,
                        'is_late' => $submission->is_late,
                        'files' => $submissionFiles->values()->all(),
                        'files_count' => $submissionFiles->count(),
                        'created_at' => $submission->created_at,
                        'updated_at' => $submission->updated_at,
                    ];
                }
            }
        }

        // === Response data ===
        $assignmentData = [
            'id' => $assignment->id,
            'title' => $assignment->title,
            'description' => $assignment->description,
            'type' => $assignment->type,
            'is_visible' => $assignment->is_visible,
            'available_from' => $availableFromJakarta,
            'available_until' => $availableUntilJakarta,
            'created_at' => $assignment->created_at,
            'updated_at' => $assignment->updated_at,
            'uploader' => $assignment->uploader,
            'file_urls' => $result['files']->values()->all(),
            'links' => $result['links']->values()->all(),
            'submissions' => $submissionData,
        ];

        $changesSummary = [
            'files_removed' => $removedFileCount,
            'links_removed' => $existingLinksCount,
            'files_added' => $uploadedFileCount,
            'links_added' => $addedLinkCount,
            'total_files' => $assignment->files->where('type', 'file')->count(),
            'total_links' => $assignment->files->where('type', 'link')->count(),
            'updated_at' => now()->toISOString(),
        ];

        $assignmentData['changes_summary'] = $changesSummary;

        $successMessage = 'Tugas berhasil diupdate';
        if ($changesSummary['files_added'] > 0 || $changesSummary['links_added'] > 0) {
            $successMessage .= '. ' . $changesSummary['files_added'] . ' file dan ' .
                            $changesSummary['links_added'] . ' link ditambahkan';
        }
        if ($changesSummary['files_removed'] > 0 || $changesSummary['links_removed'] > 0) {
            $successMessage .= '. ' . $changesSummary['files_removed'] . ' file dan ' .
                            $changesSummary['links_removed'] . ' link dihapus';
        }

        return response()->json([
            'status' => 'success',
            'message' => $successMessage,
            'data' => $assignmentData,
        ]);

    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Tugas tidak ditemukan',
        ], 404);

    } catch (\Exception $e) {
        Log::error('Assignment update error:', [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'classroom_code' => $code,
            'assignment_id' => $assignmentId,
            'request_data' => $request->except(['files'])
        ]);

        return response()->json([
            'status' => 'error',
            'message' => 'Gagal mengupdate assignment: ' . $e->getMessage(),
        ], 500);
    }
}


    /**
     * Remove the specified assignment from storage.
     */
    public function destroy($code, $assignmentId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();
            $assignment = ClassroomAssignment::where('classroom_id', $classroom->id)
                ->with('files')
                ->findOrFail($assignmentId);

            // Delete associated files
            foreach ($assignment->files as $file) {
                if ($file->type === 'file' && $file->path) {
                    Storage::disk('public')->delete($file->path);
                }
                $file->delete();
            }

            $assignment->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Tugas berhasil dihapus',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus assignment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * View the specified assignment file by fileId (GET).
     */
    public function viewFile($code, $fileId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();
            $file = ClassroomAssignmentFile::whereHas('assignment', function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })->findOrFail($fileId);

            if ($file->type !== 'file') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Jenis file tidak valid, hanya file yang dapat ditampilkan',
                ], 400);
            }

            if (!$file->assignment->is_visible || !$file->assignment->is_available) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Tugas tidak tersedia saat ini',
                ], 403);
            }

            if (!Storage::disk('public')->exists($file->path)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'File tidak ditemukan',
                ], 404);
            }

            $file->incrementViewCount();
            $extension = pathinfo($file->path, PATHINFO_EXTENSION);
            $fileName = $file->assignment->title . '.' . $extension;
            $disposition = in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'mp4']) ? 'inline' : 'attachment';

            $mimeType = Storage::disk('public')->mimeType($file->path);
            if (!$mimeType) {
                $mimeTypes = [
                    'pdf' => 'application/pdf',
                    'doc' => 'application/msword',
                    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'ppt' => 'application/vnd.ms-powerpoint',
                    'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'mp4' => 'video/mp4',
                    'mp3' => 'audio/mpeg',
                    'jpg' => 'image/jpeg',
                    'jpeg' => 'image/jpeg',
                    'png' => 'image/png',
                    'gif' => 'image/gif',
                ];
                $mimeType = $mimeTypes[strtolower($extension)] ?? 'application/octet-stream';
            }

            return Storage::disk('public')->response($file->path, $fileName, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => $disposition,
                'Cache-Control' => 'max-age=3600',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menampilkan file',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download the specified assignment file by fileId (POST).
     */
    public function downloadFile(Request $request, $code, $fileId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();
            $file = ClassroomAssignmentFile::whereHas('assignment', function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })->findOrFail($fileId);

            if ($file->type !== 'file') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Jenis file tidak valid, hanya file yang dapat diunduh',
                ], 400);
            }

            if (!$file->assignment->is_visible || !$file->assignment->is_available) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Tugas tidak tersedia untuk diunduh saat ini',
                ], 403);
            }

            if (!Storage::disk('public')->exists($file->path)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'File tidak ditemukan',
                ], 404);
            }

            $file->incrementDownloadCount();
            $extension = pathinfo($file->path, PATHINFO_EXTENSION);
            $fileName = $file->assignment->title . '.' . $extension;

            $mimeType = Storage::disk('public')->mimeType($file->path);
            if (!$mimeType) {
                $mimeTypes = [
                    'pdf' => 'application/pdf',
                    'doc' => 'application/msword',
                    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'ppt' => 'application/vnd.ms-powerpoint',
                    'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'mp4' => 'video/mp4',
                    'mp3' => 'audio/mpeg',
                    'jpg' => 'image/jpeg',
                    'jpeg' => 'image/jpeg',
                    'png' => 'image/png',
                    'gif' => 'image/gif',
                ];
                $mimeType = $mimeTypes[strtolower($extension)] ?? 'application/octet-stream';
            }

            return response()->download(Storage::disk('public')->path($file->path), $fileName, [
                'Content-Type' => $mimeType,
                'Cache-Control' => 'no-cache, must-revalidate',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengunduh file',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * View the specified assignment link.
     */
    public function viewLink($code, $fileId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();
            $file = ClassroomAssignmentFile::whereHas('assignment', function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })->findOrFail($fileId);

            if ($file->type !== 'link') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid link type',
                ], 400);
            }

            if (!$file->assignment->is_visible || !$file->assignment->is_available) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Link tidak tersedia saat ini',
                ], 403);
            }

            $file->incrementViewCount();
            return redirect()->to($file->path);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengakses link',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function viewFileOrLink($code, $fileId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();
            $file = ClassroomAssignmentFile::whereHas('assignment', function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })->findOrFail($fileId);

            // Cek ketersediaan
            if (!$file->assignment->is_visible || !$file->assignment->is_available) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Tugas tidak tersedia saat ini',
                ], 403);
            }

            $file->incrementViewCount();

            // Kalau link → redirect
            if ($file->type === 'link') {
                return redirect()->away($file->path);
            }

            // Kalau file → stream inline
            if (!Storage::disk('public')->exists($file->path)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'File tidak ditemukan',
                ], 404);
            }

            $extension = pathinfo($file->path, PATHINFO_EXTENSION);
            $fileName = $file->assignment->title . '.' . $extension;
            $mimeType = Storage::disk('public')->mimeType($file->path);

            if (!$mimeType) {
                $mimeTypes = [
                    'pdf' => 'application/pdf',
                    'doc' => 'application/msword',
                    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'ppt' => 'application/vnd.ms-powerpoint',
                    'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'mp4' => 'video/mp4',
                    'mp3' => 'audio/mpeg',
                    'jpg' => 'image/jpeg',
                    'jpeg' => 'image/jpeg',
                    'png' => 'image/png',
                    'gif' => 'image/gif',
                ];
                $mimeType = $mimeTypes[strtolower($extension)] ?? 'application/octet-stream';
            }

            return response()->file(Storage::disk('public')->path($file->path), [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'inline',
                'Cache-Control' => 'max-age=3600',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengakses assignment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Increment the view count for the specified assignment file.
     */
    public function incrementView($code, $fileId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();
            $file = ClassroomAssignmentFile::whereHas('assignment', function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })->findOrFail($fileId);

            if (!$file->assignment->is_visible || !$file->assignment->is_available) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Tugas tidak tersedia saat ini',
                ], 403);
            }

            $file->incrementViewCount();

            return response()->json([
                'status' => 'success',
                'message' => 'View count berhasil diupdate',
                'data' => [
                    'view_count' => $file->fresh()->view_count
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengupdate view count',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get assignment types statistics
     */
    public function getStatistics($code)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            $stats = ClassroomAssignment::where('classroom_id', $classroom->id)
                ->leftJoin('classroom_assignment_files', 'classroom_assignments.id', '=', 'classroom_assignment_files.assignment_id')
                ->select(
                    'classroom_assignments.type',
                    \DB::raw('count(distinct classroom_assignments.id) as count'),
                    \DB::raw('sum(classroom_assignment_files.download_count) as total_downloads'),
                    \DB::raw('sum(classroom_assignment_files.view_count) as total_views')
                )
                ->groupBy('classroom_assignments.type')
                ->get();

            $totalAssignments = ClassroomAssignment::where('classroom_id', $classroom->id)->count();
            $totalDownloads = ClassroomAssignmentFile::whereHas('assignment', function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })->sum('download_count');
            $totalViews = ClassroomAssignmentFile::whereHas('assignment', function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })->sum('view_count');

            return response()->json([
                'status' => 'success',
                'data' => [
                    'total_assignments' => $totalAssignments,
                    'total_downloads' => $totalDownloads,
                    'total_views' => $totalViews,
                    'by_type' => $stats
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil statistik',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Serve assignment file securely by classroomId and filename (GET - View)
     */
    public function showAssignmentFile($classroomId, $filename)
    {
        try {
            $classroom = Classroom::findOrFail($classroomId);
            $filePath = "assignments/{$classroomId}/{$filename}";

            $file = ClassroomAssignmentFile::whereHas('assignment', function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })->where('path', $filePath)->firstOrFail();

            // Cek tipe file
            if ($file->type !== 'file') {
                return response()->json(['status' => 'error', 'message' => 'Invalid file type'], 400);
            }

            // Cek apakah assignment masih bisa diakses
            if (!$file->assignment->is_visible || !$file->assignment->is_available) {
                return response()->json(['status' => 'error', 'message' => 'Tugas tidak tersedia saat ini'], 403);
            }

            // Pastikan file ada
            if (!Storage::disk('public')->exists($file->path)) {
                return response()->json(['status' => 'error', 'message' => 'File tidak ditemukan'], 404);
            }

            // Tambah view count
            $file->incrementViewCount();

            // Ambil ekstensi & mime
            $extension = strtolower(pathinfo($file->path, PATHINFO_EXTENSION));
            $fileName = $file->assignment->title . '.' . $extension;

            $viewableExtensions = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'pdf', 'docx'];
            $mimeType = Storage::disk('public')->mimeType($file->path) ?? [
                'pdf' => 'application/pdf',
                'doc' => 'application/msword',
                'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'ppt' => 'application/vnd.ms-powerpoint',
                'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'mp4' => 'video/mp4',
                'mp3' => 'audio/mpeg',
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'gif' => 'image/gif',
            ][$extension] ?? 'application/octet-stream';

            // Tentukan inline atau attachment
            $disposition = in_array($extension, $viewableExtensions) ? 'inline' : 'attachment';

            // Ambil path absolut dari storage
            $filePathAbsolute = Storage::disk('public')->path($file->path);

            // Kirim file lewat Laravel (bukan direct URL)
            return response()->file($filePathAbsolute, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => $disposition . '; filename="' . $fileName . '"',
                'Cache-Control' => 'max-age=3600',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'File tidak ditemukan',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function downloadAssignmentFile($classroomCode, $assignmentFileId)
    {
        try {
            $classroom = Classroom::where('code', $classroomCode)->firstOrFail();
            $file = ClassroomAssignmentFile::where('id', $assignmentFileId)
                ->whereHas('assignment', function ($query) use ($classroom) {
                    $query->where('classroom_id', $classroom->id);
                })
                ->firstOrFail();

            if ($file->type !== 'file') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid file type',
                ], 400);
            }

            if (!$file->assignment->is_visible || !$file->assignment->is_available) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Tugas tidak tersedia untuk diunduh saat ini',
                ], 403);
            }

            if (!Storage::disk('public')->exists($file->path)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'File tidak ditemukan',
                ], 404);
            }

            $file->incrementDownloadCount();

            // Ambil ekstensi asli dari file path (bukan dari title)
            $originalExtension = strtolower(pathinfo($file->path, PATHINFO_EXTENSION));
            $originalPath = Storage::disk('public')->path($file->path);

            // Buat filename yang bersih
            $cleanTitle = preg_replace('/[^a-zA-Z0-9\-_\.]/', '_', $file->assignment->title);
            $fileName = $cleanTitle . '.' . $originalExtension;

            // Deteksi MIME type yang akurat
            $mimeType = Storage::disk('public')->mimeType($file->path);

            if (!$mimeType || $mimeType === 'text/plain') {
                // Manual mapping untuk ekstensi yang sering salah terdeteksi
                $mimeTypes = [
                    'pdf'  => 'application/pdf',
                    'doc'  => 'application/msword',
                    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'ppt'  => 'application/vnd.ms-powerpoint',
                    'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'xls'  => 'application/vnd.ms-excel',
                    'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'mp4'  => 'video/mp4',
                    'mp3'  => 'audio/mpeg',
                    'jpg'  => 'image/jpeg',
                    'jpeg' => 'image/jpeg',
                    'png'  => 'image/png',
                    'gif'  => 'image/gif',
                    'txt'  => 'text/plain',
                    'zip'  => 'application/zip',
                    'rar'  => 'application/vnd.rar',
                ];
                $mimeType = $mimeTypes[$originalExtension] ?? 'application/octet-stream';
            }

            // Log untuk debugging
            Log::info('Download file info:', [
                'file_id' => $assignmentFileId,
                'original_path' => $originalPath,
                'filename' => $fileName,
                'extension' => $originalExtension,
                'mime_type' => $mimeType,
                'file_exists' => file_exists($originalPath),
                'file_size' => file_exists($originalPath) ? filesize($originalPath) : 0
            ]);

            // Pastikan file benar-benar ada sebelum download
            if (!file_exists($originalPath)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'File fisik tidak ditemukan di storage',
                ], 404);
            }

            // Return download response dengan headers yang tepat
            return response()->download(
                $originalPath,
                $fileName,
                [
                    'Content-Type' => $mimeType,
                    'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
                    'Cache-Control' => 'no-cache, must-revalidate, max-age=0',
                    'Pragma' => 'no-cache',
                    'Expires' => '0',
                    'Content-Transfer-Encoding' => 'binary',
                ]
            );

        } catch (\Exception $e) {
            Log::error('Download error:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'classroom_code' => $classroomCode,
                'assignment_file_id' => $assignmentFileId
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengunduh file: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ==================== SUBMISSION METHODS ====================

    /**
     * Get student's submission for an assignment
    */
    public function secureFileAccessSubmissions($hash)
    {
        try {
            Log::info('Secure submission file access attempt', ['hash' => $hash]);

            $payload = $this->decodeSubmissionFileHash($hash);
            if (!$payload) {
                Log::warning('Invalid submission hash payload', ['hash' => $hash]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid or expired file access token'
                ], 403);
            }

            Log::info('Submission hash decoded successfully', $payload);

            // Cari file submission
            $file = ClassroomAssignmentSubmissionFile::where('id', $payload['file_id'])
                ->where('is_active', true)
                ->with(['submission.assignment'])
                ->first();

            if (!$file) {
                Log::warning('Submission file not found', [
                    'file_id' => $payload['file_id'],
                    'classroom_id' => $payload['classroom_id']
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'File tidak ditemukan'
                ], 404);
            }

            // Validasi classroom
            if ($file->submission->assignment->classroom_id != $payload['classroom_id']) {
                Log::warning('Classroom mismatch', [
                    'expected' => $payload['classroom_id'],
                    'actual' => $file->submission->assignment->classroom_id
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid file access'
                ], 403);
            }

            // Validasi submission id jika ada
            if (isset($payload['submission_id']) && $file->submission_id != $payload['submission_id']) {
                Log::warning('Submission ID mismatch', [
                    'expected' => $payload['submission_id'],
                    'actual' => $file->submission_id
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid file access'
                ], 403);
            }

            // Validasi assignment id jika ada
            if (isset($payload['assignment_id']) && $file->submission->assignment_id != $payload['assignment_id']) {
                Log::warning('Assignment ID mismatch', [
                    'expected' => $payload['assignment_id'],
                    'actual' => $file->submission->assignment_id
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid file access'
                ], 403);
            }

            // Validasi assignment visibility
            $assignment = $file->submission->assignment;
            if (!$assignment->is_visible) {
                Log::warning('Assignment not visible', [
                    'assignment_id' => $assignment->id,
                    'is_visible' => $assignment->is_visible
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Tugas tidak tersedia saat ini',
                ], 403);
            }

            // --- Authorization check ---
            if (Auth::check()) {
                $user = Auth::user();
                $canAccess = false;

                // Student yang upload
                if ($file->uploaded_by === $user->id) {
                    $canAccess = true;
                }

                // Teacher/admin
                if (!$canAccess && $user->hasRole(['administrator', 'teacher', 'super admin'])) {
                    $canAccess = true;
                }

                if (!$canAccess) {
                    Log::warning('Unauthorized submission file access attempt', [
                        'user_id' => $user->id,
                        'file_id' => $file->id,
                        'uploader_id' => $file->uploaded_by
                    ]);
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Unauthorized access to file'
                    ], 403);
                }
            }

            // Path absolute
            $filePathAbsolute = Storage::disk('public')->path($file->file_path);
            if (!file_exists($filePathAbsolute)) {
                Log::warning('Physical submission file not found', [
                    'file_path' => $file->file_path
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'File tidak ditemukan',
                ], 404);
            }

            // --- Range streaming support ---
            $extension = strtolower($file->file_type);
            $viewableExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'mp4'];

            $mimeType = $file->mime_type ?? [
                'pdf' => 'application/pdf',
                'doc' => 'application/msword',
                'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'ppt' => 'application/vnd.ms-powerpoint',
                'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'mp4' => 'video/mp4',
                'mp3' => 'audio/mpeg',
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'gif' => 'image/gif',
                'txt' => 'text/plain',
            ][$extension] ?? 'application/octet-stream';

            $disposition = in_array($extension, $viewableExtensions) ? 'inline' : 'attachment';
            $fileName = $file->original_name ?? ("submission_" . $file->id . "." . $extension);

            $rangeHeader = request()->header('Range');
            $size = filesize($filePathAbsolute);
            $start = 0;
            $end = $size - 1;

            $statusCode = 200;
            if ($rangeHeader && preg_match('/bytes=(\d+)-(\d*)/', $rangeHeader, $matches)) {
                $start = intval($matches[1]);
                if (isset($matches[2]) && $matches[2] !== '') {
                    $end = intval($matches[2]);
                }
                $statusCode = 206;
            }

            $stream = new StreamedResponse(function () use ($filePathAbsolute, $start, $end) {
                $chunkSize = 512 * 1024; // 512 KB
                $handle = fopen($filePathAbsolute, 'rb');
                fseek($handle, $start);
                $bytesLeft = $end - $start + 1;
                while ($bytesLeft > 0 && !feof($handle)) {
                    $read = min($chunkSize, $bytesLeft);
                    echo fread($handle, $read);
                    flush();
                    $bytesLeft -= $read;
                }
                fclose($handle);
            }, $statusCode);

            $stream->headers->set('Content-Type', $mimeType);
            $stream->headers->set('Content-Disposition', $disposition . '; filename="' . $fileName . '"');
            $stream->headers->set('Accept-Ranges', 'bytes');
            $stream->headers->set('Content-Length', $end - $start + 1);
            if ($statusCode === 206) {
                $stream->headers->set('Content-Range', "bytes {$start}-{$end}/{$size}");
            }
            $stream->headers->set('Cache-Control', 'no-cache, must-revalidate');

            Log::info('Serving submission file with range support', [
                'file_path' => $filePathAbsolute,
                'mime_type' => $mimeType,
                'disposition' => $disposition,
                'range' => "$start-$end/$size"
            ]);

            return $stream;

        } catch (\Exception $e) {
            Log::error('Secure submission file access error', [
                'hash' => $hash,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'File tidak ditemukan',
                'error' => $e->getMessage()
            ], 404);
        }
    }


    /**
     * Secure submission file download via hash
     */
    public function secureFileDownloadSubmissions($hash)
    {
        try {
            $payload = $this->decodeSubmissionFileHash($hash);
            if (!$payload) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid or expired download token'
                ], 403);
            }

            // Find the submission file
            $file = ClassroomAssignmentSubmissionFile::where('id', $payload['file_id'])
                ->where('is_active', true)
                ->with(['submission.assignment'])
                ->firstOrFail();

            // Validate classroom
            if ($file->submission->assignment->classroom_id != $payload['classroom_id']) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid file access'
                ], 403);
            }

            // Validate submission if provided
            if (isset($payload['submission_id']) && $file->submission_id != $payload['submission_id']) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid file access'
                ], 403);
            }

            // Check assignment availability
            $assignment = $file->submission->assignment;
            if (!$assignment->is_visible) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Tugas tidak tersedia untuk diunduh saat ini',
                ], 403);
            }

            // Authorization check
            if (Auth::check()) {
                $user = Auth::user();
                $canAccess = false;

                if ($file->uploaded_by === $user->id) {
                    $canAccess = true;
                }

                if (!$canAccess && $user->hasRole(['administrator', 'teacher', 'super admin'])) {
                    $canAccess = true;
                }

                if (!$canAccess) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Unauthorized access to file'
                    ], 403);
                }
            }

            // Check if file exists in storage
            if (!Storage::disk('public')->exists($file->file_path)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'File tidak ditemukan',
                ], 404);
            }

            // Increment download count if method exists
            if (method_exists($file, 'incrementDownloadCount')) {
                $file->incrementDownloadCount();
            }

            $originalPath = Storage::disk('public')->path($file->file_path);
            $fileName = $file->original_name;

            $mimeType = $file->mime_type;
            if (!$mimeType || $mimeType === 'text/plain') {
                $mimeTypes = [
                    'pdf'  => 'application/pdf',
                    'doc'  => 'application/msword',
                    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'ppt'  => 'application/vnd.ms-powerpoint',
                    'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'xls'  => 'application/vnd.ms-excel',
                    'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'jpg'  => 'image/jpeg',
                    'jpeg' => 'image/jpeg',
                    'png'  => 'image/png',
                    'gif'  => 'image/gif',
                    'txt'  => 'text/plain',
                ];
                $mimeType = $mimeTypes[strtolower($file->file_type)] ?? 'application/octet-stream';
            }

            if (!file_exists($originalPath)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'File fisik tidak ditemukan di storage',
                ], 404);
            }

            return response()->download(
                $originalPath,
                $fileName,
                [
                    'Content-Type' => $mimeType,
                    'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
                    'Cache-Control' => 'no-cache, must-revalidate, max-age=0',
                    'Pragma' => 'no-cache',
                    'Expires' => '0',
                    'Content-Transfer-Encoding' => 'binary',
                ]
            );

        } catch (\Exception $e) {
            Log::error('Secure submission download error:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'hash' => $hash
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengunduh file: ' . $e->getMessage(),
            ], 500);
        }
    }
    public function getSubmission($code, $assignmentId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();
            $assignment = ClassroomAssignment::where('classroom_id', $classroom->id)
                ->findOrFail($assignmentId);

            $submission = ClassroomAssignmentSubmission::where('assignment_id', $assignment->id)
                ->where('student_id', Auth::id())
                ->with(['files' => function($query) {
                    $query->where('is_active', true)->orderBy('uploaded_at', 'desc');
                }, 'assignment:id,title', 'student:id,name,email'])
                ->first();

            if (!$submission) {
                // Create a new draft submission if none exists
                $submission = ClassroomAssignmentSubmission::create([
                    'assignment_id' => $assignment->id,
                    'student_id' => Auth::id(),
                    'status' => 'draft',
                    'enrolled_date' => now(),
                ]);
                $submission->load(['files', 'assignment:id,title', 'student:id,name,email']);
            }

            // PERBAIKAN: Generate secure hashed URLs for submission files with proper parameters
            $hashedFiles = $this->generateHashedSubmissionFileUrls(
                $submission->files,
                $classroom->id,
                $submission->id, // submission_id
                $submission->assignment_id // assignment_id
            );

            $submissionData = [
                'id' => $submission->id,
                'assignment_id' => $submission->assignment_id,
                'student_id' => $submission->student_id,
                'submission_text' => $submission->submission_text,
                'status' => $submission->status,
                'submitted_at' => $submission->submitted_at,
                'graded_at' => $submission->graded_at,
                'points' => $submission->points,
                'max_points' => $submission->max_points,
                'teacher_feedback' => $submission->teacher_feedback,
                'is_late' => $submission->is_late,
                'files' => $hashedFiles->values()->all(),
                'files_count' => $hashedFiles->count(),
                'assignment' => $submission->assignment,
                'student' => $submission->student,
                'created_at' => $submission->created_at,
                'updated_at' => $submission->updated_at,
            ];

            return response()->json([
                'status' => 'success',
                'data' => $submissionData,
            ]);

        } catch (\Exception $e) {
            Log::error('Submission show error', [
                'code' => $code,
                'assignment_id' => $assignmentId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Submission tidak ditemukan',
                'error' => $e->getMessage()
            ], 404);
        }
    }
    public function removeSubmissionFile(Request $request, $code, $assignmentId, $fileId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();
            $assignment = ClassroomAssignment::where('classroom_id', $classroom->id)
                ->findOrFail($assignmentId);

            // Ambil submission file
            $file = ClassroomAssignmentSubmissionFile::whereHas('submission', function ($query) use ($assignment) {
                $query->where('assignment_id', $assignment->id);
            })->where('id', $fileId)
            ->where('is_active', true)
            ->firstOrFail();

            $submission = $file->submission;

            // Check ownership - student yang upload atau teacher/admin
            if (!Auth::check() ||
                (Auth::id() !== $file->uploaded_by &&
                !Auth::user()->hasRole(['administrator', 'teacher', 'super admin']))) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized access to file'
                ], 403);
            }

            // Check if submission can be edited
            if (in_array($submission->status, ['graded', 'returned']) &&
                !Auth::user()->hasRole(['administrator', 'teacher', 'super admin'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Submission yang sudah dinilai tidak dapat diubah'
                ], 403);
            }

            // Begin transaction for data consistency
            DB::beginTransaction();

            try {
                // Soft delete - mark as inactive instead of deleting
                $file->update([
                    'is_active' => false,
                    'deleted_at' => now(),
                    'deleted_by' => Auth::id()
                ]);

                // Delete physical file from storage
                if ($file->file_path && Storage::disk('public')->exists($file->file_path)) {
                    Storage::disk('public')->delete($file->file_path);
                }

                // Update submission timestamp
                $submission->touch();

                // Commit transaction
                DB::commit();

                // Refresh submission dengan files terbaru
                $submission->load(['files' => function($query) {
                    $query->where('is_active', true)->orderBy('uploaded_at', 'desc');
                }, 'assignment:id,title', 'student:id,name,email']);

                // Generate hashed URLs for response
                $hashedFiles = $this->generateHashedSubmissionFileUrls(
                    $submission->files,
                    $classroom->id
                );

                $submissionData = [
                    'id' => $submission->id,
                    'assignment_id' => $submission->assignment_id,
                    'student_id' => $submission->student_id,
                    'submission_text' => $submission->submission_text,
                    'status' => $submission->status,
                    'submitted_at' => $submission->submitted_at,
                    'graded_at' => $submission->graded_at,
                    'points' => $submission->points,
                    'max_points' => $submission->max_points,
                    'teacher_feedback' => $submission->teacher_feedback,
                    'is_late' => $submission->is_late,
                    'files' => $hashedFiles->values()->all(),
                    'files_count' => $hashedFiles->count(),
                    'assignment' => $submission->assignment,
                    'student' => $submission->student,
                    'created_at' => $submission->created_at,
                    'updated_at' => $submission->updated_at,
                ];

                return response()->json([
                    'status' => 'success',
                    'message' => 'File berhasil dihapus dari submission',
                    'data' => $submissionData,
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'File submission tidak ditemukan',
            ], 404);

        } catch (\Exception $e) {
            Log::error('Remove submission file error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'classroom_code' => $code,
                'assignment_id' => $assignmentId,
                'file_id' => $fileId,
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus file submission: ' . $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Submit or update assignment submission
     */
    public function submitAssignment(Request $request, $code, $assignmentId)
    {
        try {
            // TAMBAHAN: Validasi authentication terlebih dahulu
            if (!Auth::check()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Anda harus login untuk mengumpulkan tugas',
                ], 401);
            }

            $userId = Auth::id();
            if (!$userId) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Session tidak valid, silakan login kembali',
                ], 401);
            }

            $classroom = Classroom::where('code', $code)->firstOrFail();
            $assignment = ClassroomAssignment::where('classroom_id', $classroom->id)
                ->findOrFail($assignmentId);

            // TAMBAHAN: Verifikasi bahwa user adalah student di classroom ini
            $isStudent = DB::table('classroom_students')
                ->where('classroom_id', $classroom->id)
                ->where('student_id', $userId)
                ->where('status', 'active')
                ->exists();

            if (!$isStudent) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Anda tidak terdaftar sebagai siswa di kelas ini',
                ], 403);
            }

            // Check if assignment is still available for submission
            if (!$assignment->is_visible || !$assignment->is_available) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Tugas tidak tersedia untuk pengumpulan saat ini',
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'submission_text' => 'nullable|string',
                'files.*' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx,txt,jpg,jpeg,png,gif|max:20480', // 20MB
                'remove_file_ids' => 'nullable|array',
                'remove_file_ids.*' => 'exists:classroom_assignment_submission_files,id',
                'status' => 'required|in:draft,submitted',
            ], [
                'files.*.mimes' => 'File harus berupa: pdf, doc, doc, ppt, pptx, txt, jpg, jpeg, png, gif',
                'files.*.max' => 'Ukuran file maksimal 20MB',
                'status.required' => 'Status pengumpulan harus diisi',
                'status.in' => 'Status pengumpulan tidak valid',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data tidak valid',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $submission = ClassroomAssignmentSubmission::where('type', $assignment->type)
            ->firstOrCreate([
                'assignment_id' => $assignment->id,
                'student_id' => $userId,
            ], [
                'status' => 'draft',
                'enrolled_date' => now(),
            ]);

            // Check if submission is already graded (can't be modified)
            if ($submission->status === 'graded') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Submission yang sudah dinilai tidak dapat diubah',
                ], 403);
            }

            // Handle file removal
            $removeFileIds = $request->input('remove_file_ids', []);
            $removedFileCount = 0;

            if (!empty($removeFileIds) && is_array($removeFileIds)) {
                $filesToRemove = ClassroomAssignmentSubmissionFile::where('submission_id', $submission->id)
                    ->whereIn('id', $removeFileIds)
                    ->where('uploaded_by', $userId)
                    ->get();

                foreach ($filesToRemove as $file) {
                    try {
                        if ($file->file_path && Storage::disk('public')->exists($file->file_path)) {
                            Storage::disk('public')->delete($file->file_path);
                        }
                        $file->update(['is_active' => false]);
                        $removedFileCount++;
                    } catch (\Exception $e) {
                        Log::warning("Failed to remove submission file: " . $file->file_path, [
                            'error' => $e->getMessage(),
                            'file_id' => $file->id
                        ]);
                    }
                }
            }

            // Handle new file uploads
            $uploadedFileCount = 0;
            if ($request->hasFile('files')) {
                $uploadedFiles = $request->file('files');
                if (!is_array($uploadedFiles)) {
                    $uploadedFiles = [$uploadedFiles];
                }

                foreach ($uploadedFiles as $file) {
                    if ($file && $file->isValid()) {
                        try {
                            $originalName = $file->getClientOriginalName();
                            $nameOnly = pathinfo($originalName, PATHINFO_FILENAME);
                            $extension = $file->getClientOriginalExtension();

                            $fileName = $nameOnly . '_' . time() . '_' . Str::random(10) . '.' . $extension;
                            $filePath = $file->storeAs(
                                'submissions/' . $classroom->id . '/' . $assignment->id,
                                $fileName,
                                'public'
                            );

                            ClassroomAssignmentSubmissionFile::create([
                                'submission_id' => $submission->id,
                                'original_name' => $originalName,
                                'file_name' => $fileName,
                                'file_path' => $filePath,
                                'file_size' => $file->getSize(),
                                'file_type' => $extension,
                                'mime_type' => $file->getClientMimeType(),
                                'uploaded_by' => $userId,
                                'uploaded_at' => now(),
                                'is_active' => true,
                            ]);

                            $uploadedFileCount++;
                        } catch (\Exception $e) {
                            Log::error("Submission file upload error: " . $e->getMessage(), [
                                'file_name' => $file->getClientOriginalName(),
                                'submission_id' => $submission->id,
                                'error_trace' => $e->getTraceAsString()
                            ]);

                            return response()->json([
                                'status' => 'error',
                                'message' => 'Gagal mengupload file: ' . $file->getClientOriginalName(),
                            ], 500);
                        }
                    }
                }
            }

            // Check if assignment has deadline and submission is late
            $isLate = false;
            if ($assignment->available_until && $request->status === 'submitted') {
                $isLate = now() > $assignment->available_until;
            }

            // Update submission
            $submissionData = [
                'submission_text' => $request->submission_text,
                'status' => $request->status,
                'is_late' => $isLate,
            ];

            // Set submitted_at timestamp if status is submitted
            if ($request->status === 'submitted' && $submission->status !== 'submitted') {
                $submissionData['submitted_at'] = now();
            }

            $submission->update($submissionData);

            // Refresh data for response
            $submission->load(['files' => function($query) {
                $query->where('is_active', true)->orderBy('uploaded_at', 'desc');
            }, 'assignment:id,title', 'student:id,name,email']);

            // PERBAIKAN: Generate hashed URLs untuk response dengan parameter lengkap
            $hashedFiles = $this->generateHashedSubmissionFileUrls(
                $submission->files,
                $classroom->id,
                $submission->id, // submission_id
                $assignment->id  // assignment_id
            );

            $submissionResponseData = [
                'id' => $submission->id,
                'assignment_id' => $submission->assignment_id,
                'student_id' => $submission->student_id,
                'submission_text' => $submission->submission_text,
                'status' => $submission->status,
                'submitted_at' => $submission->submitted_at,
                'graded_at' => $submission->graded_at,
                'points' => $submission->points,
                'max_points' => $submission->max_points,
                'teacher_feedback' => $submission->teacher_feedback,
                'is_late' => $submission->is_late,
                'files' => $hashedFiles->values()->all(),
                'files_count' => $hashedFiles->count(),
                'assignment' => $submission->assignment,
                'student' => $submission->student,
                'created_at' => $submission->created_at,
                'updated_at' => $submission->updated_at,
            ];

            // Summary of changes
            $changesSummary = [
                'files_removed' => $removedFileCount,
                'files_added' => $uploadedFileCount,
                'total_files' => $submission->files->count(),
                'status' => $submission->status,
                'is_late' => $submission->is_late,
                'updated_at' => $submission->updated_at->toISOString(),
            ];

            $submissionResponseData['changes_summary'] = $changesSummary;

            // Success message
            $successMessage = $request->status === 'submitted'
                ? 'Tugas berhasil dikumpulkan'
                : 'Draft berhasil disimpan';

            if ($changesSummary['files_added'] > 0) {
                $successMessage .= '. ' . $changesSummary['files_added'] . ' file ditambahkan';
            }
            if ($changesSummary['files_removed'] > 0) {
                $successMessage .= '. ' . $changesSummary['files_removed'] . ' file dihapus';
            }
            if ($isLate && $request->status === 'submitted') {
                $successMessage .= ' (Terlambat)';
            }

            return response()->json([
                'status' => 'success',
                'message' => $successMessage,
                'data' => $submissionResponseData, // PERBAIKAN: Return single submission object, bukan array
            ], 200);

        } catch (\Exception $e) {
            Log::error('Assignment submission error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'classroom_code' => $code,
                'assignment_id' => $assignmentId,
                'request_data' => $request->except(['files']),
                'auth_check' => Auth::check(),
                'auth_id' => Auth::id(),
                'sql_error' => $e instanceof \Illuminate\Database\QueryException ? $e->getSql() : null,
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengumpulkan tugas: ' . $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Secure submission file access via hash
     */
    public function secureSubmissionFileAccess($hash)
    {
        try {
            Log::info('Secure submission file access attempt', ['hash' => $hash]);

            $payload = $this->decodeFileHash($hash);
            if (!$payload) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid or expired file access token'
                ], 403);
            }

            $file = ClassroomAssignmentSubmissionFile::whereHas('submission', function ($query) use ($payload) {
                $query->where('classroom_id', $payload['classroom_id']);
            })->find($payload['file_id']);

            if (!$file) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Submission file tidak ditemukan'
                ], 404);
            }

            // ✅ Authorization check
            $submission = $file->submission;
            $user = auth()->user();

            if ($user->id !== $submission->student_id && !$user->isTeacherOf($submission->classroom_id)) {
                Log::warning('Unauthorized submission file access', [
                    'user_id' => $user->id,
                    'submission_id' => $submission->id
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Anda tidak memiliki akses ke file ini'
                ], 403);
            }

            // ✅ Cek file fisik
            $filePathAbsolute = Storage::disk('public')->path($file->path);
            if (!file_exists($filePathAbsolute)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'File tidak ditemukan'
                ], 404);
            }

            // ✅ Increment download/view count
            $file->increment('download_count');

            $extension = strtolower(pathinfo($file->path, PATHINFO_EXTENSION));
            $fileName = 'submission_' . $submission->id . '.' . $extension;

            $mimeType = Storage::disk('public')->mimeType($file->path) ?? 'application/octet-stream';
            $disposition = 'attachment'; // default untuk submission: force download

            // ✅ Streaming response
            return response()->download($filePathAbsolute, $fileName, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => $disposition . '; filename="' . $fileName . '"',
                'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            ]);
        } catch (\Exception $e) {
            Log::error('Secure submission file access error', [
                'hash' => $hash,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengakses file submission'
            ], 500);
        }
    }

    /**
     * Secure submission file download via hash
     */
    public function secureSubmissionFileDownload($hash)
    {
        try {
            $payload = $this->decodeSubmissionFileHash($hash);
            if (!$payload) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid or expired download token'
                ], 403);
            }

            $file = ClassroomAssignmentSubmissionFile::whereHas('submission.assignment', function ($query) use ($payload) {
                $query->where('classroom_id', $payload['classroom_id']);
            })->where('id', $payload['file_id'])
              ->where('is_active', true)
              ->firstOrFail();

            // Check if user can access this file (student who uploaded or teacher)
            if ($file->uploaded_by !== Auth::id()) {
                // TODO: Add teacher permission check here if needed
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized access to file'
                ], 403);
            }

            if (!Storage::disk('public')->exists($file->file_path)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'File tidak ditemukan',
                ], 404);
            }

            $originalPath = Storage::disk('public')->path($file->file_path);
            $fileName = $file->original_name;

            $mimeType = $file->mime_type;
            if (!$mimeType || $mimeType === 'text/plain') {
                $mimeTypes = [
                    'pdf'  => 'application/pdf',
                    'doc'  => 'application/msword',
                    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'ppt'  => 'application/vnd.ms-powerpoint',
                    'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'xls'  => 'application/vnd.ms-excel',
                    'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'jpg'  => 'image/jpeg',
                    'jpeg' => 'image/jpeg',
                    'png'  => 'image/png',
                    'gif'  => 'image/gif',
                    'txt'  => 'text/plain',
                ];
                $mimeType = $mimeTypes[strtolower($file->file_type)] ?? 'application/octet-stream';
            }

            if (!file_exists($originalPath)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'File fisik tidak ditemukan di storage',
                ], 404);
            }

            return response()->download(
                $originalPath,
                $fileName,
                [
                    'Content-Type' => $mimeType,
                    'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
                    'Cache-Control' => 'no-cache, must-revalidate, max-age=0',
                    'Pragma' => 'no-cache',
                    'Expires' => '0',
                    'Content-Transfer-Encoding' => 'binary',
                ]
            );

        } catch (\Exception $e) {
            Log::error('Secure submission download error:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'hash' => $hash
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengunduh file: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update submission status and result (points, feedback) - NEW FEATURE
     */
    public function updateSubmission(Request $request, $code, $assignmentId, $submissionId)
    {
        try {
            // Validate teacher/admin role
            $user = Auth::user();
            if (!$user->hasRole(['administrator', 'teacher', 'super admin'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Anda tidak memiliki akses untuk mengupdate submission ini',
                ], 403);
            }

            $classroom = Classroom::where('code', $code)->firstOrFail();
            $assignment = ClassroomAssignment::where('classroom_id', $classroom->id)
                ->findOrFail($assignmentId);

            $submission = ClassroomAssignmentSubmission::where('assignment_id', $assignment->id)
                ->where('type', $assignment->type)
                ->where('id', $submissionId)
                ->with(['student:id,name,email'])
                ->firstOrFail();

            // PERBAIKAN: Enhanced validation
            $validator = Validator::make($request->all(), [
                'status' => 'required|in:submitted,graded,returned',
                'teacher_feedback' => 'nullable|string|max:2000',
            ], [
                'status.required' => 'Status harus diisi',
                'status.in' => 'Status tidak valid (submitted, graded atau returned)',
                'teacher_feedback.max' => 'Feedback maksimal 2000 karakter',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data tidak valid',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // PERBAIKAN: Additional business logic validation
            if ($request->status === 'graded' && !$request->filled('points')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Nilai harus diisi untuk status "Dinilai"',
                    'errors' => ['points' => ['Nilai wajib diisi untuk status dinilai']]
                ], 422);
            }

            // PERBAIKAN: Begin transaction for data consistency
            DB::beginTransaction();

            try {
                // Update data
                $updateData = [
                    'status' => $request->status,
                    'graded_at' => now(),
                    'graded_by' => $user->id,
                    'teacher_feedback' => $request->teacher_feedback,
                    'updated_at' => now(),
                ];

                if ($request->filled('points')) {
                    $updateData['points'] = $request->points;
                } else {
                    $updateData['points'] = null;
                    $updateData['max_points'] = null;
                }

                if ($request->filled('max_points')) {
                    $updateData['max_points'] = $request->max_points;
                } else {
                    $updateData['max_points'] = null;

                }

                // PERBAIKAN: Add attempt number if not exists
                if (!$submission->attempt_number) {
                    $updateData['attempt_number'] = 1;
                }

                $submission->update($updateData);

                // Commit transaction
                DB::commit();

                // PERBAIKAN: Load fresh data with all relationships
                $submission->load([
                    'files' => function($query) {
                        $query->where('is_active', true)->orderBy('uploaded_at', 'desc');
                    },
                    'student:id,name,email',
                    'gradedBy:id,name,email'
                ]);

                // PERBAIKAN: Generate hashed URLs for submission files
                $submissionFiles = $this->generateHashedSubmissionFileUrls(
                    $submission->files,
                    $assignment->classroom_id,
                    $submission->id,
                    $assignmentId
                );

                $formattedSubmission = [
                    'id' => $submission->id,
                    'assignment_id' => $submission->assignment_id,
                    'student_id' => $submission->student_id,
                    'student' => $submission->student,
                    'submission_text' => $submission->submission_text,
                    'status' => $submission->status,
                    'submitted_at' => $submission->submitted_at,
                    'graded_at' => $submission->graded_at,
                    'graded_by' => $submission->gradedBy,
                    'points' => $submission->points,
                    'max_points' => $submission->max_points,
                    'teacher_feedback' => $submission->teacher_feedback,
                    'is_late' => $submission->is_late,
                    'attempt_number' => $submission->attempt_number,
                    'files' => $submissionFiles->values()->all(),
                    'files_count' => $submissionFiles->count(),
                    'created_at' => $submission->created_at,
                    'updated_at' => $submission->updated_at,
                    'metadata' => $submission->metadata,
                ];

                // PERBAIKAN: Create activity log (optional)
                $activityMessage = $request->status === 'graded'
                    ? "Submission dinilai dengan nilai {$submission->points}"
                    : "Submission dikembalikan untuk revisi";

                Log::info("Submission updated", [
                    'submission_id' => $submission->id,
                    'assignment_id' => $assignmentId,
                    'classroom_code' => $code,
                    'graded_by' => $user->id,
                    'status' => $request->status,
                    'points' => $submission->points,
                    'activity' => $activityMessage
                ]);

                return response()->json([
                    'status' => 'success',
                    'message' => $request->status === 'graded'
                        ? 'Submission berhasil dinilai'
                        : 'Submission dikembalikan untuk revisi',
                    'data' => $formattedSubmission
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Submission tidak ditemukan',
            ], 404);

        } catch (\Exception $e) {
            Log::error('Update submission error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'classroom_code' => $code,
                'assignment_id' => $assignmentId,
                'submission_id' => $submissionId,
                'request_data' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengupdate submission: ' . $e->getMessage(),
            ], 500);
        }
    }
}
