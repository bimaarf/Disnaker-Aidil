<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\ClassroomMaterial;
use App\Models\ClassroomMaterialFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;

class ClassroomMaterialController extends Controller
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
                    'path' => url("/api/classrooms/materials/secure-file/{$hash}"),
                    'download_url' => url("/api/classrooms/materials/secure-download/{$hash}"),
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
     * Display a listing of the materials for a classroom.
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

            $query = ClassroomMaterial::where('classroom_id', $classroom->id)
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
            $materials = $query->paginate($perPage);

            $materials->getCollection()->transform(function ($material) {
                // Generate hashed URLs for files
                $result = $this->generateHashedFileUrls($material->files, $material->classroom_id);

                return [
                    'id' => $material->id,
                    'title' => $material->title,
                    'description' => $material->description,
                    'type' => $material->type,
                    'file_urls' => $result['files']->values()->all(),
                    'links' => $result['links']->values()->all(),
                    'available_from' => $material->available_from,
                    'available_until' => $material->available_until,
                    'is_visible' => $material->is_visible,
                    'uploader' => $material->uploader,
                    'created_at' => $material->created_at,
                    'updated_at' => $material->updated_at,
                ];
            });

            return response()->json([
                'status' => 'success',
                'data' => [
                    'materials' => $materials->items(),
                    'pagination' => [
                        'current_page' => $materials->currentPage(),
                        'last_page' => $materials->lastPage(),
                        'per_page' => $materials->perPage(),
                        'total' => $materials->total(),
                        'from' => $materials->firstItem(),
                        'to' => $materials->lastItem()
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil data materi',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified material.
     */
    public function show($code, $materialId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            $material = ClassroomMaterial::where('classroom_id', $classroom->id)
                ->with(['uploader:id,name,email', 'classroom:id,name', 'files'])
                ->findOrFail($materialId);

            if (!$material->is_visible || !$material->is_available) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Materi tidak tersedia saat ini',
                ], 403);
            }

            Log::info('Material show - before hash generation', [
                'material_id' => $material->id,
                'classroom_id' => $material->classroom_id,
                'files_count' => $material->files->count()
            ]);

            // Generate hashed URLs for files
            $result = $this->generateHashedFileUrls($material->files, $material->classroom_id);

            Log::info('Material show - after hash generation', [
                'files_generated' => $result['files']->count(),
                'links_generated' => $result['links']->count()
            ]);

            $materialData = [
                'id'             => $material->id,
                'title'          => $material->title,
                'description'    => $material->description,
                'type'           => $material->type,
                'file_urls'      => $result['files']->values()->all(),
                'links'          => $result['links']->values()->all(),
                'available_from' => $material->available_from,
                'available_until'=> $material->available_until,
                'is_visible'     => $material->is_visible,
                'uploader'       => $material->uploader,
                'created_at'     => $material->created_at,
                'updated_at'     => $material->updated_at,
            ];

            return response()->json([
                'status' => 'success',
                'data'   => $materialData,
            ]);

        } catch (\Exception $e) {
            Log::error('Material show error', [
                'code' => $code,
                'material_id' => $materialId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => 'Materi tidak ditemukan',
                'error'   => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Secure file access via hash
     */
    public function secureFileAccess($hash)
    {
        try {
            Log::info('Secure material file access attempt', ['hash' => $hash]);

            $payload = $this->decodeFileHash($hash);
            if (!$payload) {
                Log::warning('Invalid hash payload', ['hash' => $hash]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid or expired file access token'
                ], 403);
            }

            Log::info('Hash decoded successfully', $payload);

            $file = ClassroomMaterialFile::whereHas('material', function ($query) use ($payload) {
                $query->where('classroom_id', $payload['classroom_id']);
            })->find($payload['file_id']);

            if (!$file) {
                Log::warning('Material file not found', [
                    'file_id' => $payload['file_id'],
                    'classroom_id' => $payload['classroom_id']
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'File tidak ditemukan'
                ], 404);
            }

            if ($file->type !== 'file') {
                Log::warning('Invalid material file type', [
                    'file_id' => $file->id,
                    'type' => $file->type
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid file type'
                ], 400);
            }

            if (!$file->material->is_visible || !$file->material->is_available) {
                Log::warning('Material not available', [
                    'material_id' => $file->material->id,
                    'is_visible' => $file->material->is_visible,
                    'is_available' => $file->material->is_available
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Materi tidak tersedia saat ini',
                ], 403);
            }

            $filePathAbsolute = Storage::disk('public')->path($file->path);
            if (!file_exists($filePathAbsolute)) {
                Log::warning('Physical material file not found', [
                    'file_path' => $file->path
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'File tidak ditemukan',
                ], 404);
            }

            // --- Increment view count (1x per session untuk video) ---
            $isVideo = $this->isVideoFile($file);
            $sessionKey = 'viewed_material_' . $file->id;
            if ($isVideo) {
                if (!session()->has($sessionKey)) {
                    $file->incrementViewCount();
                    session()->put($sessionKey, true);
                }
            } else {
                $file->incrementViewCount();
            }

            $extension = strtolower(pathinfo($file->path, PATHINFO_EXTENSION));
            $fileName = $file->material->title . '.' . $extension;

            $viewableExtensions = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm', 'pdf'];
            $mimeType = Storage::disk('public')->mimeType($file->path) ?? 'application/octet-stream';
            $disposition = in_array($extension, $viewableExtensions) ? 'inline' : 'attachment';

            // --- Range streaming ---
            $rangeHeader = request()->header('Range');
            $size = filesize($filePathAbsolute);
            $start = 0;
            $end = $size - 1;
            $status = 200;

            if ($rangeHeader && preg_match('/bytes=(\d+)-(\d*)/', $rangeHeader, $matches)) {
                $start = intval($matches[1]);
                if (!empty($matches[2])) {
                    $end = intval($matches[2]);
                } else {
                    $end = min($start + (2 * 1024 * 1024), $size - 1); // 2MB chunk
                }
                $status = 206;
            }

            $contentLength = $end - $start + 1;

            $stream = new \Symfony\Component\HttpFoundation\StreamedResponse(function () use ($filePathAbsolute, $start, $end, $isVideo) {
                $chunkSize = $isVideo ? (256 * 1024) : (1024 * 1024); // 256KB utk video
                $handle = fopen($filePathAbsolute, 'rb');
                fseek($handle, $start);
                $bytesLeft = $end - $start + 1;

                while ($bytesLeft > 0 && !feof($handle)) {
                    $read = min($chunkSize, $bytesLeft);
                    $buffer = fread($handle, $read);
                    echo $buffer;
                    flush();
                    $bytesLeft -= strlen($buffer);

                    if ($isVideo) {
                        usleep(1000); // kontrol bandwidth
                    }
                }
                fclose($handle);
            }, $status);

            $headers = [
                'Content-Type' => $mimeType,
                'Content-Disposition' => $disposition . '; filename="' . $fileName . '"',
                'Accept-Ranges' => 'bytes',
                'Content-Length' => $contentLength,
                'Cache-Control' => $isVideo ? 'public, max-age=300' : 'public, max-age=86400'
            ];

            if ($status === 206) {
                $headers['Content-Range'] = "bytes $start-$end/$size";
            }

            foreach ($headers as $k => $v) {
                $stream->headers->set($k, $v);
            }

            Log::info('Serving material file', [
                'file_id' => $file->id,
                'mime_type' => $mimeType,
                'range' => "$start-$end/$size",
                'status' => $status,
            ]);

            return $stream;

        } catch (\Exception $e) {
            Log::error('Secure material file access error', [
                'hash' => $hash,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat mengakses file',
                'error' => app()->environment('local') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
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

            $file = ClassroomMaterialFile::whereHas('material', function ($query) use ($payload) {
                $query->where('classroom_id', $payload['classroom_id']);
            })->findOrFail($payload['file_id']);

            if ($file->type !== 'file') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid file type'
                ], 400);
            }

            if (!$file->material->is_visible || !$file->material->is_available) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Materi tidak tersedia untuk diunduh saat ini',
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
            $nameOnly = pathinfo($file->path, PATHINFO_FILENAME); // "output"

            $originalPath = Storage::disk('public')->path($file->path);
            $cleanTitle = preg_replace('/[^a-zA-Z0-9\-_\.]/', '_', $file->material->title);
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
                    'Content-Disposition' => 'attachment; filename="' . $nameOnly . '"',
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
    public function store(Request $request, $code)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            // Enhanced validation rules
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'type' => 'required|in:document,video,link,assignment,quiz',
                'files.*' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx,mp4,mp3,jpg,jpeg,png,gif,txt',
                'links' => 'nullable|array',
                'links.*' => 'nullable|url|max:2048',
                'available_from' => 'nullable|date|after_or_equal:today',
                'available_until' => 'nullable|date|after_or_equal:available_from',
                'is_visible' => 'required|in:true,false,1,0',
            ], [
                'title.required' => 'Judul materi harus diisi',
                'title.max' => 'Judul tidak boleh lebih dari 255 karakter',
                'type.required' => 'Tipe materi harus dipilih',
                'type.in' => 'Tipe materi tidak valid',
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

            // Validate content requirements based on material type
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

            // Create new material
            $material = ClassroomMaterial::create([
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

                            $filePath = $file->storeAs('materials/' . $classroom->id, $fileName, 'public');

                            ClassroomMaterialFile::create([
                                'material_id' => $material->id,
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
                                'material_id' => $material->id
                            ]);

                        } catch (\Exception $e) {
                            Log::error("File upload error: " . $e->getMessage(), [
                                'file_name' => $file->getClientOriginalName(),
                                'material_id' => $material->id,
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
                    ClassroomMaterialFile::create([
                        'material_id' => $material->id,
                        'type' => 'link',
                        'path' => $trimmedLink,
                    ]);
                    $addedLinkCount++;
                } catch (\Exception $e) {
                    Log::error("Link creation error: " . $e->getMessage(), [
                        'link' => $trimmedLink,
                        'material_id' => $material->id
                    ]);
                }
            }

            // Refresh data for accurate response
            $material->load([
                'uploader:id,name,email',
                'files' => function($query) {
                    $query->orderBy('created_at', 'desc');
                }
            ]);

            // Generate hashed URLs for response
            $result = $this->generateHashedFileUrls($material->files, $material->classroom_id);

            // Format response data
            $materialData = [
                'id' => $material->id,
                'title' => $material->title,
                'description' => $material->description,
                'type' => $material->type,
                'is_visible' => $material->is_visible,
                'available_from' => $material->available_from,
                'available_until' => $material->available_until,
                'created_at' => $material->created_at,
                'updated_at' => $material->updated_at,
                'uploader' => $material->uploader,
                'file_urls' => $result['files']->values()->all(),
                'links' => $result['links']->values()->all(),
            ];

            // Summary of changes
            $changesSummary = [
                'files_added' => $uploadedFileCount,
                'links_added' => $addedLinkCount,
                'total_files' => $material->files->where('type', 'file')->count(),
                'total_links' => $material->files->where('type', 'link')->count(),
                'created_at' => $material->created_at->toISOString(),
            ];

            $materialData['changes_summary'] = $changesSummary;

            // Success message
            $successMessage = 'Materi berhasil ditambahkan';
            if ($changesSummary['files_added'] > 0 || $changesSummary['links_added'] > 0) {
                $successMessage .= '. ' . $changesSummary['files_added'] . ' file dan ' .
                                  $changesSummary['links_added'] . ' link ditambahkan';
            }

            return response()->json([
                'status' => 'success',
                'message' => $successMessage,
                'data' => $materialData,
            ], 201);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kelas tidak ditemukan',
            ], 404);

        } catch (\Exception $e) {
            Log::error('Material creation error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'classroom_code' => $code,
                'request_data' => $request->except(['files'])
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menambahkan materi: ' . $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Update the specified material in storage.
     */
    /**
 * Update the specified material in storage.
 */
    public function update(Request $request, $code, $materialId)
{
    try {
        $classroom = Classroom::where('code', $code)->firstOrFail();
        $material = ClassroomMaterial::where('classroom_id', $classroom->id)
            ->with('files')
            ->findOrFail($materialId);

        // Enhanced validation rules
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:document,video,link,assignment,quiz',
            'files.*' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx,mp4,mp3,jpg,jpeg,png,gif,txt',
            'links' => 'nullable|array',
            'links.*' => 'nullable|url|max:2048',
            'remove_file_ids' => 'nullable',
            'remove_link_ids' => 'nullable',
            'available_from' => 'nullable|date',
            'available_until' => 'nullable|date|after_or_equal:available_from',
            'is_visible' => 'required|in:true,false,1,0',
        ], [
            'title.required' => 'Judul materi harus diisi',
            'title.max' => 'Judul tidak boleh lebih dari 255 karakter',
            'type.required' => 'Tipe materi harus dipilih',
            'type.in' => 'Tipe materi tidak valid',
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

        // Convert string boolean to actual boolean
        $isVisible = filter_var($request->is_visible, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        if ($isVisible === null) {
            $isVisible = in_array($request->is_visible, ['1', 'true', true, 1], true);
        }

        // Handle file removal
        $removeFileIds = $request->input('remove_file_ids', []);
        $removedFileCount = 0;

        // Convert comma-separated string to array if needed
        if (is_string($removeFileIds)) {
            $removeFileIds = array_filter(array_map('trim', explode(',', $removeFileIds)));
        }

        if (!empty($removeFileIds) && is_array($removeFileIds)) {
            $filesToRemove = ClassroomMaterialFile::where('material_id', $material->id)
                ->whereIn('id', $removeFileIds)
                ->where('type', 'file')
                ->get();

            foreach ($filesToRemove as $file) {
                try {
                    // Delete physical file from storage
                    if ($file->path && Storage::disk('public')->exists($file->path)) {
                        Storage::disk('public')->delete($file->path);
                    }
                    $file->delete();
                    $removedFileCount++;
                } catch (\Exception $e) {
                    \Log::warning("Failed to delete file: " . $file->path, [
                        'error' => $e->getMessage(),
                        'file_id' => $file->id
                    ]);
                }
            }
        }

        // Handle complete links replacement
        $newLinksArray = $request->input('links', []);

        // Filter out empty links
        $newLinksArray = array_filter($newLinksArray, function($link) {
            return !empty(trim($link)) && filter_var(trim($link), FILTER_VALIDATE_URL);
        });

        // Count existing links before deletion
        $existingLinksCount = ClassroomMaterialFile::where('material_id', $material->id)
            ->where('type', 'link')
            ->count();

        // Delete ALL existing links and replace with new ones
        ClassroomMaterialFile::where('material_id', $material->id)
            ->where('type', 'link')
            ->delete();

        // Add new links
        $addedLinkCount = 0;
        foreach ($newLinksArray as $link) {
            $trimmedLink = trim($link);
            try {
                ClassroomMaterialFile::create([
                    'material_id' => $material->id,
                    'type' => 'link',
                    'path' => $trimmedLink,
                ]);
                $addedLinkCount++;
            } catch (\Exception $e) {
                \Log::error("Link creation error: " . $e->getMessage(), [
                    'link' => $trimmedLink,
                    'material_id' => $material->id
                ]);
            }
        }

        // Check content requirements after operations
        $currentFiles = ClassroomMaterialFile::where('material_id', $material->id)
            ->where('type', 'file')
            ->count();

        $currentLinks = $addedLinkCount;
        $hasNewFiles = $request->hasFile('files');
        $hasNewLinks = $addedLinkCount > 0;

        // Validate content requirements based on material type
        $totalContentAfterUpdate = $currentFiles + $currentLinks;
        if ($hasNewFiles) {
            // Count how many new files will be added
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

        // Update material data
        $material->update([
            'title' => trim($request->title),
            'description' => trim($request->description),
            'type' => $request->type,
            'available_from' => $request->available_from ?: null,
            'available_until' => $request->available_until ?: null,
            'is_visible' => $isVisible,
        ]);

        // Handle new file uploads
        $uploadedFileCount = 0;
        if ($hasNewFiles) {
            $uploadedFiles = $request->file('files');

            // Ensure it's an array
            if (!is_array($uploadedFiles)) {
                $uploadedFiles = [$uploadedFiles];
            }

            foreach ($uploadedFiles as $file) {
                if ($file && $file->isValid()) {
                    try {
                        $originalName = $file->getClientOriginalName(); // "output.pdf"
                        $nameOnly = pathinfo($originalName, PATHINFO_FILENAME); // "output"


                        $fileName = $nameOnly . '_' . time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
                        $filePath = $file->storeAs('materials/' . $classroom->id, $fileName, 'public');

                        // Create file record with minimal required fields
                        ClassroomMaterialFile::create([
                            'material_id' => $material->id,
                            'type' => 'file',
                            'path' => $filePath,
                            'file_size' => $file->getSize(),
                            'file_type' => $file->getClientMimeType(),
                        ]);

                        $uploadedFileCount++;

                        \Log::info("File uploaded successfully", [
                            'file_name' => $fileName,
                            'file_path' => $filePath,
                            'file_size' => $file->getSize(),
                            'material_id' => $material->id
                        ]);

                    } catch (\Exception $e) {
                        \Log::error("File upload error: " . $e->getMessage(), [
                            'file_name' => $file->getClientOriginalName(),
                            'material_id' => $material->id,
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

        // Refresh data for accurate response
        $material->load([
            'uploader:id,name,email',
            'files' => function($query) {
                $query->orderBy('created_at', 'desc');
            }
        ]);

        // *** THIS IS THE KEY CHANGE - Use hash generation instead of model accessors ***
        $result = $this->generateHashedFileUrls($material->files, $material->classroom_id);

        // Format response data
        $materialData = [
            'id' => $material->id,
            'title' => $material->title,
            'description' => $material->description,
            'type' => $material->type,
            'is_visible' => $material->is_visible,
            'available_from' => $material->available_from,
            'available_until' => $material->available_until,
            'created_at' => $material->created_at,
            'updated_at' => $material->updated_at,
            'uploader' => $material->uploader,
            'file_urls' => $result['files']->values()->all(),  // Use hashed URLs
            'links' => $result['links']->values()->all(),      // Use formatted link objects
        ];

        // Enhanced summary of changes
        $changesSummary = [
            'files_removed' => $removedFileCount,
            'links_removed' => $existingLinksCount,
            'files_added' => $uploadedFileCount,
            'links_added' => $addedLinkCount,
            'total_files' => $material->files->where('type', 'file')->count(),
            'total_links' => $material->files->where('type', 'link')->count(),
            'updated_at' => now()->toISOString(),
        ];

        $materialData['changes_summary'] = $changesSummary;

        // Success message
        $successMessage = 'Materi berhasil diupdate';
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
            'data' => $materialData,
        ]);

    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Materi tidak ditemukan',
        ], 404);

    } catch (\Exception $e) {
        \Log::error('Material update error:', [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'classroom_code' => $code,
            'material_id' => $materialId,
            'request_data' => $request->except(['files'])
        ]);

        return response()->json([
            'status' => 'error',
            'message' => 'Gagal mengupdate materi: ' . $e->getMessage(),
        ], 500);
    }
}

/**
 * Helper method to format file size
 */
private function formatFileSize($bytes)
{
    if ($bytes >= 1073741824) {
        return number_format($bytes / 1073741824, 2) . ' GB';
    } elseif ($bytes >= 1048576) {
        return number_format($bytes / 1048576, 2) . ' MB';
    } elseif ($bytes >= 1024) {
        return number_format($bytes / 1024, 2) . ' KB';
    } else {
        return $bytes . ' bytes';
    }
}

    /**
     * Remove the specified material from storage.
     */
    public function destroy($code, $materialId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();
            $material = ClassroomMaterial::where('classroom_id', $classroom->id)
                ->with('files')
                ->findOrFail($materialId);

            // Delete associated files
            foreach ($material->files as $file) {
                if ($file->type === 'file' && $file->path) {
                    Storage::disk('public')->delete($file->path);
                }
                $file->delete();
            }

            $material->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Materi berhasil dihapus',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus materi',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * View the specified material file by fileId (GET).
     */
    public function viewFile($code, $fileId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();
            $file = ClassroomMaterialFile::whereHas('material', function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })->findOrFail($fileId);

            if ($file->type !== 'file') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Jenis file tidak valid, hanya file yang dapat ditampilkan',
                ], 400);
            }

            if (!$file->material->is_visible || !$file->material->is_available) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Materi tidak tersedia saat ini',
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
            $fileName = $file->material->title . '.' . $extension;
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
     * Download the specified material file by fileId (POST).
     */
    public function downloadFile(Request $request, $code, $fileId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();
            $file = ClassroomMaterialFile::whereHas('material', function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })->findOrFail($fileId);

            if ($file->type !== 'file') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Jenis file tidak valid, hanya file yang dapat diunduh',
                ], 400);
            }

            if (!$file->material->is_visible || !$file->material->is_available) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Materi tidak tersedia untuk diunduh saat ini',
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
            $fileName = $file->material->title . '.' . $extension;

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
     * View the specified material link.
     */
    public function viewLink($code, $fileId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();
            $file = ClassroomMaterialFile::whereHas('material', function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })->findOrFail($fileId);

            if ($file->type !== 'link') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid link type',
                ], 400);
            }

            if (!$file->material->is_visible || !$file->material->is_available) {
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
        $file = ClassroomMaterialFile::whereHas('material', function ($query) use ($classroom) {
            $query->where('classroom_id', $classroom->id);
        })->findOrFail($fileId);

        // Cek ketersediaan
        if (!$file->material->is_visible || !$file->material->is_available) {
            return response()->json([
                'status' => 'error',
                'message' => 'Materi tidak tersedia saat ini',
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
        $fileName = $file->material->title . '.' . $extension;
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
            'message' => 'Gagal mengakses materi',
            'error' => $e->getMessage(),
        ], 500);
    }
}

    /**
     * Increment the view count for the specified material file.
     */
    public function incrementView($code, $fileId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();
            $file = ClassroomMaterialFile::whereHas('material', function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })->findOrFail($fileId);

            if (!$file->material->is_visible || !$file->material->is_available) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Materi tidak tersedia saat ini',
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
     * Get material types statistics
     */
    public function getStatistics($code)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            $stats = ClassroomMaterial::where('classroom_id', $classroom->id)
                ->leftJoin('classroom_material_files', 'classroom_materials.id', '=', 'classroom_material_files.material_id')
                ->select(
                    'classroom_materials.type',
                    \DB::raw('count(distinct classroom_materials.id) as count'),
                    \DB::raw('sum(classroom_material_files.download_count) as total_downloads'),
                    \DB::raw('sum(classroom_material_files.view_count) as total_views')
                )
                ->groupBy('classroom_materials.type')
                ->get();

            $totalMaterials = ClassroomMaterial::where('classroom_id', $classroom->id)->count();
            $totalDownloads = ClassroomMaterialFile::whereHas('material', function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })->sum('download_count');
            $totalViews = ClassroomMaterialFile::whereHas('material', function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })->sum('view_count');

            return response()->json([
                'status' => 'success',
                'data' => [
                    'total_materials' => $totalMaterials,
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
     * Serve material file securely by classroomId and filename (GET - View)
     */
   public function showMaterialFile($classroomId, $filename)
{
    try {
        $classroom = Classroom::findOrFail($classroomId);
        $filePath = "materials/{$classroomId}/{$filename}";

        $file = ClassroomMaterialFile::whereHas('material', function ($query) use ($classroom) {
            $query->where('classroom_id', $classroom->id);
        })->where('path', $filePath)->firstOrFail();

        // Cek tipe file
        if ($file->type !== 'file') {
            return response()->json(['status' => 'error', 'message' => 'Invalid file type'], 400);
        }

        // Cek apakah materi masih bisa diakses
        if (!$file->material->is_visible || !$file->material->is_available) {
            return response()->json(['status' => 'error', 'message' => 'Materi tidak tersedia saat ini'], 403);
        }

        // Pastikan file ada
        if (!Storage::disk('public')->exists($file->path)) {
            return response()->json(['status' => 'error', 'message' => 'File tidak ditemukan'], 404);
        }

        // Tambah view count
        $file->incrementViewCount();

        // Ambil ekstensi & mime
        $extension = strtolower(pathinfo($file->path, PATHINFO_EXTENSION));
        $fileName = $file->material->title . '.' . $extension;

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

public function downloadMaterialFile($classroomCode, $materialFileId)
{
    try {
        $classroom = Classroom::where('code', $classroomCode)->firstOrFail();
        $file = ClassroomMaterialFile::where('id', $materialFileId)
            ->whereHas('material', function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })
            ->firstOrFail();

        if ($file->type !== 'file') {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid file type',
            ], 400);
        }

        if (!$file->material->is_visible || !$file->material->is_available) {
            return response()->json([
                'status' => 'error',
                'message' => 'Materi tidak tersedia untuk diunduh saat ini',
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
        $cleanTitle = preg_replace('/[^a-zA-Z0-9\-_\.]/', '_', $file->material->title);
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
        \Log::info('Download file info:', [
            'file_id' => $materialFileId,
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
        \Log::error('Download error:', [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'classroom_code' => $classroomCode,
            'material_file_id' => $materialFileId
        ]);

        return response()->json([
            'status' => 'error',
            'message' => 'Gagal mengunduh file: ' . $e->getMessage(),
        ], 500);
    }
}

}
