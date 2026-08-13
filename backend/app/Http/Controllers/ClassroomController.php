<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Exception;

class ClassroomController extends Controller
{
    /**
     * Display a listing of classrooms with enhanced pagination
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();

            $validator = Validator::make($request->all(), [
                'per_page' => 'nullable|integer|min:1|max:100',
                'page' => 'nullable|integer|min:1',
                'search' => 'nullable|string|max:255',
                'status' => 'nullable|in:all,active,inactive',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Parameter tidak valid',
                    'errors' => $validator->errors()
                ], 422);
            }

            $perPage = (int) $request->input('per_page', 10);
            $page = (int) $request->input('page', 1);
            $search = $request->input('search');
            $status = $request->input('status', 'all');

            $query = Classroom::with([
                    'creator:id,name,email',
                    'teachers:id,name,email',
                    'students:users.id,name,email',
                ])
                ->withCount(['teachers', 'students'])
                ->orderBy('created_at', 'desc');

            // filter kelas sesuai role
            if ($user->hasRole('user')) {
                $query->whereHas('students', function ($q) use ($user) {
                    $q->where('users.id', $user->id)
                    ->where('classroom_students.status', 'active');
                });
            }
            if ($user->hasRole('teacher')) {
                $query->whereHas('teachers', function ($q) use ($user) {
                    $q->where('users.id', $user->id);
                });
            }

            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
                });
            }

            if (!empty($status) && $status !== 'all') {
                $query->where('status', $status);
            }

            $classrooms = $query->paginate($perPage, ['*'], 'page', $page);

            $transformedClassrooms = $classrooms->getCollection()->map(function ($classroom) use ($user) {
                $data = [
                    'id' => $classroom->code,
                    'code' => $classroom->code,
                    'name' => $classroom->name,
                    'description' => $classroom->description,
                    'status' => $classroom->status,
                    'teacher_count' => $classroom->teachers_count ?? 0,
                    'student_count' => $classroom->students_count ?? 0,
                    'created_at' => $classroom->created_at->toISOString(),
                    'updated_at' => $classroom->updated_at->toISOString(),
                ];

                if ($user->hasRole('user')) {
                    // user lihat semua guru + semua siswa di kelas yg sama
                    $data['teachers'] = $classroom->teachers->map(fn($t) => [
                        'id' => $t->id,
                        'name' => $t->name,
                        'email' => $t->email,
                    ])->sortBy('name')->values();

                    $data['students'] = $classroom->students->map(fn($s) => [
                        'id' => $s->id,
                        'name' => $s->name,
                        'email' => $s->email,
                        'status' => optional($s->pivot)->status ?? 'active',
                        'joined_date' => optional($s->pivot)->joined_date ?? optional($s->pivot)->created_at?->toISOString(),
                    ])->sortBy('joined_date')->values();

                    $data['created_by'] = $classroom->creator ? [
                        'name' => $classroom->creator->name,
                    ] : null;
                } else {
                    // teacher/admin
                    $data['teachers'] = $classroom->teachers->map(fn($t) => [
                        'id' => $t->id,
                        'name' => $t->name,
                        'email' => $t->email,
                        'assigned_at' => optional($t->pivot)->created_at?->toISOString(),
                    ]);

                    $data['students'] = $classroom->students->map(fn($s) => [
                        'id' => $s->id,
                        'name' => $s->name,
                        'email' => $s->email,
                        'status' => optional($s->pivot)->status,
                        'joined_date' => optional($s->pivot)->joined_date,
                    ]);

                    $data['created_by'] = $classroom->creator ? [
                        'id' => $classroom->creator->id,
                        'name' => $classroom->creator->name,
                        'email' => $classroom->creator->email,
                    ] : null;
                }

                return $data;
            });

            return response()->json([
                'status' => 'success',
                'message' => 'Data kelas berhasil diambil',
                'data' => [
                    'data' => $transformedClassrooms,
                    'current_page' => $classrooms->currentPage(),
                    'last_page' => $classrooms->lastPage(),
                    'per_page' => $classrooms->perPage(),
                    'total' => $classrooms->total(),
                    'from' => $classrooms->firstItem(),
                    'to' => $classrooms->lastItem(),
                    'has_more_pages' => $classrooms->hasMorePages(),
                    'prev_page_url' => $classrooms->previousPageUrl(),
                    'next_page_url' => $classrooms->nextPageUrl(),
                    'path' => $classrooms->path(),
                    'links' => [
                        'first' => $classrooms->url(1),
                        'last' => $classrooms->url($classrooms->lastPage()),
                        'prev' => $classrooms->previousPageUrl(),
                        'next' => $classrooms->nextPageUrl(),
                    ]
                ],
            ]);

        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat mengambil data kelas',
                'debug' => config('app.debug') ? [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ] : null
            ], 500);
        }
    }


    public function show($code)
    {
        try {
            $user = Auth::user();

            $query = Classroom::where('code', $code)
                ->with(['creator:id,name,email', 'teachers:id,name,email', 'students:users.id,name,email'])
                ->withCount(['teachers', 'students']);

            // Role filtering: jika user role, pastikan mereka terdaftar di kelas ini
            if ($user->hasRole('user')) {
                $query->whereHas('students', function ($q) use ($user) {
                    $q->where('users.id', $user->id)
                    ->where('classroom_students.status', 'active');
                });
            }
            if ($user->hasRole('teacher')) {
                $query->whereHas('teachers', function ($q) use ($user) {
                    $q->where('users.id', $user->id);
                });
            }
            $classroom = $query->firstOrFail();

            $data = [
                'id' => $classroom->code,
                'code' => $classroom->code,
                'name' => $classroom->name,
                'description' => $classroom->description,
                'status' => $classroom->status,
                'teacher_count' => $classroom->teachers_count,
                'student_count' => $classroom->students_count,
                'created_at' => $classroom->created_at->toISOString(),
                'updated_at' => $classroom->updated_at->toISOString(),
            ];

            // Jika user role, hanya tampilkan data terbatas
            if ($user->hasRole('user')) {
                $data['teachers'] = $classroom->teachers->map(function ($teacher) {
                    return [
                        'id' => $teacher->id,
                        'name' => $teacher->name,
                        'email' => $teacher->email,
                    ];
                })->sortBy('name')->values();

                // 👉 tampilkan semua siswa lain di kelas
                $data['students'] = $classroom->students->map(function ($student) {
                    return [
                        'id' => $student->id,
                        'name' => $student->name,
                        'email' => $student->email,
                        'status' => optional($student->pivot)->status ?? 'active',
                        'joined_date' => optional($student->pivot)->joined_date ?? optional($student->pivot)->created_at?->toISOString(),
                    ];
                })->sortBy('joined_date')->values();

                $data['created_by'] = $classroom->creator ? [
                    'name' => $classroom->creator->name,
                ] : null;
            } else {
                // Untuk teacher/admin, tampilkan data lengkap seperti biasa
                $teachers = $classroom->teachers->map(function ($teacher) {
                    return [
                        'id' => $teacher->id,
                        'name' => $teacher->name,
                        'email' => $teacher->email,
                        'phone' => $teacher->phone ?? null,
                        'assigned_at' => optional($teacher->pivot)->created_at?->toISOString(),
                    ];
                })->sortBy('assigned_at')->values();

                $students = $classroom->students->map(function ($student) {
                    return [
                        'id' => $student->id,
                        'name' => $student->name,
                        'email' => $student->email,
                        'student_id' => $student->student_id ?? null,
                        'status' => optional($student->pivot)->status ?? 'active',
                        'joined_date' => optional($student->pivot)->joined_date ?? optional($student->pivot)->created_at?->toISOString(),
                    ];
                })->sortBy('joined_date')->values();

                $data['teachers'] = $teachers;
                $data['students'] = $students;
                $data['created_by'] = $classroom->creator ? [
                    'id' => $classroom->creator->id,
                    'name' => $classroom->creator->name,
                    'email' => $classroom->creator->email,
                ] : null;
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Detail kelas berhasil diambil',
                'data' => $data
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => $user->hasRole('user')
                    ? 'Kelas tidak ditemukan atau Anda tidak terdaftar di kelas ini'
                    : 'Kelas tidak ditemukan'
            ], 404);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil detail kelas',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Store a newly created classroom with enhanced validation
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'code' => [
                    'nullable',
                    'string',
                    'max:50',
                    'unique:classrooms,code',
                    'regex:/^[A-Za-z0-9\-_]+$/',
                ],
                'description' => 'nullable|string',
                'status' => 'nullable|in:active,inactive',
            ], [
                'name.required' => 'Nama kelas harus diisi',
                'name.string' => 'Nama kelas harus berupa text',
                'name.max' => 'Nama kelas maksimal 255 karakter',
                'status.in' => 'Status harus berupa active atau inactive',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $code = $request->code;

            if (empty($code)) {
                $firstLetter = strtoupper(substr($request->name, 0, 1));

                do {
                    $number = str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
                    $code = "CLS-{$firstLetter}-{$number}";

                    $exists = Classroom::where('code', $code)->exists();
                } while ($exists);
            }

            $classroom = Classroom::create([
                'name' => $request->name,
                'code' => $code,
                'description' => $request->description,
                'status' => $request->status ?? 'active',
                'created_by' => Auth::id(),
            ]);

            $classroom = Classroom::where('code', $classroom->code)
                ->with(['creator:id,name,email'])
                ->withCount(['teachers', 'students'])
                ->first();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Kelas berhasil dibuat',
                'data' => [
                    'id' => $classroom->code,
                    'code' => $classroom->code,
                    'name' => $classroom->name,
                    'description' => $classroom->description,
                    'status' => $classroom->status,
                    'teacher_count' => $classroom->teachers_count ?? 0,
                    'student_count' => $classroom->students_count ?? 0,
                    'created_by' => $classroom->creator ? [
                        'id' => $classroom->creator->id,
                        'name' => $classroom->creator->name,
                        'email' => $classroom->creator->email,
                    ] : null,
                    'created_at' => $classroom->created_at->toISOString(),
                    'updated_at' => $classroom->updated_at->toISOString(),
                ]
            ], 201);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat kelas',
                'debug' => config('app.debug') ? [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ] : null
            ], 500);
        }
    }



    /**
     * Remove student from classroom
     */
    public function removeStudent($code, $studentId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            if (!$classroom->students()->where('users.id', $studentId)->exists()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Siswa tidak ditemukan di kelas ini'
                ], 404);
            }

            DB::beginTransaction();

            $classroom->students()->detach($studentId);

            // Reload classroom with counts
            $classroom = Classroom::where('code', $code)
                ->withCount(['teachers', 'students'])
                ->firstOrFail();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Siswa berhasil dihapus dari kelas',
                'data' => [
                    'student_id' => (int) $studentId,
                    'removed_at' => now()->toISOString(),
                ],
                'meta' => [
                    'teacher_count' => $classroom->teachers_count,
                    'student_count' => $classroom->students_count,
                ]
            ]);

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
                'message' => 'Gagal menghapus siswa',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Add multiple students to classroom with enhanced validation
     */
    public function addMultipleStudents(Request $request, $code)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            $validator = Validator::make($request->all(), [
                'student_ids' => 'required|array|min:1|max:100',
                'student_ids.*' => [
                    'integer',
                    'exists:users,id',
                ],
            ], [
                'student_ids.required' => 'Pilih minimal satu siswa',
                'student_ids.array' => 'Format data tidak valid',
                'student_ids.min' => 'Pilih minimal satu siswa',
                'student_ids.max' => 'Maksimal 100 siswa dapat ditambahkan sekaligus',
                'student_ids.*.integer' => 'ID siswa harus berupa angka',
                'student_ids.*.exists' => 'Salah satu siswa tidak ditemukan',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $studentIds = array_unique($request->student_ids);
            $existingStudentIds = $classroom->students()->pluck('users.id')->toArray();
            $newStudentIds = array_diff($studentIds, $existingStudentIds);

            if (empty($newStudentIds)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Semua siswa sudah terdaftar di kelas ini'
                ], 400);
            }

            DB::beginTransaction();

            $attachData = [];
            $now = now();
            foreach ($newStudentIds as $studentId) {
                $attachData[$studentId] = [
                    'status' => 'active',
                    'joined_date' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            $classroom->students()->attach($attachData);

            // Reload classroom with counts
            $classroom = Classroom::where('code', $code)
                ->withCount(['teachers', 'students'])
                ->firstOrFail();

            $addedStudents = User::whereIn('id', $newStudentIds)
                ->select('id', 'name', 'email')
                ->get()
                ->map(function ($student) use ($now) {
                    return [
                        'id' => $student->id,
                        'name' => $student->name,
                        'email' => $student->email,
                        'status' => 'active',
                        'joined_date' => $now->toISOString(),
                    ];
                });

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => count($newStudentIds) . ' siswa berhasil ditambahkan',
                'data' => $addedStudents,
                'meta' => [
                    'total_requested' => count($studentIds),
                    'total_added' => count($newStudentIds),
                    'already_exists' => count($studentIds) - count($newStudentIds),
                    'teacher_count' => $classroom->teachers_count,
                    'student_count' => $classroom->students_count,
                ]
            ]);

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
                'message' => 'Gagal menambahkan siswa',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Update student status in classroom with enhanced validation
     */
    public function updateStudentStatus(Request $request, $code, $studentId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            $validator = Validator::make($request->all(), [
                'status' => 'required|in:active,inactive,suspended',
            ], [
                'status.required' => 'Status harus diisi',
                'status.in' => 'Status harus active, inactive, atau suspended',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            if (!$classroom->students()->where('users.id', $studentId)->exists()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Siswa tidak ditemukan di kelas ini'
                ], 404);
            }

            $classroom->students()->updateExistingPivot($studentId, [
                'status' => $request->status,
                'updated_at' => now(),
            ]);

            $student = User::findOrFail($studentId);

            return response()->json([
                'status' => 'success',
                'message' => 'Status siswa berhasil diupdate',
                'data' => [
                    'id' => $student->id,
                    'name' => $student->name,
                    'email' => $student->email,
                    'status' => $request->status,
                    'updated_at' => now()->toISOString(),
                ]
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kelas atau siswa tidak ditemukan'
            ], 404);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengupdate status siswa',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get classroom statistics
     */
    public function statistics()
    {
        try {
            $stats = [
                'total_classrooms' => Classroom::count(),
                'active_classrooms' => Classroom::where('status', 'active')->count(),
                'inactive_classrooms' => Classroom::where('status', 'inactive')->count(),
                'total_teachers' => DB::table('classroom_teachers')->distinct('teacher_id')->count('teacher_id'),
                'total_students' => DB::table('classroom_students')->distinct('student_id')->count('student_id'),
                'classrooms_with_teachers' => Classroom::has('teachers')->count(),
                'classrooms_with_students' => Classroom::has('students')->count(),
                'avg_teachers_per_classroom' => round(
                    DB::table('classroom_teachers')->count() / max(Classroom::count(), 1),
                    2
                ),
                'avg_students_per_classroom' => round(
                    DB::table('classroom_students')->count() / max(Classroom::count(), 1),
                    2
                ),
            ];

            return response()->json([
                'status' => 'success',
                'message' => 'Statistik berhasil diambil',
                'data' => $stats
            ]);

        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil statistik',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Bulk operations for classrooms
     */
    public function bulkAction(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'action' => 'required|in:delete,activate,deactivate',
                'classroom_codes' => 'required|array|min:1|max:100',
                'classroom_codes.*' => 'string|exists:classrooms,code',
            ], [
                'action.required' => 'Aksi harus dipilih',
                'action.in' => 'Aksi tidak valid',
                'classroom_codes.required' => 'Pilih minimal satu kelas',
                'classroom_codes.array' => 'Format data tidak valid',
                'classroom_codes.min' => 'Pilih minimal satu kelas',
                'classroom_codes.max' => 'Maksimal 100 kelas dapat diproses sekaligus',
                'classroom_codes.*.string' => 'Kode kelas harus berupa string',
                'classroom_codes.*.exists' => 'Salah satu kelas tidak ditemukan',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $action = $request->action;
            $classroomCodes = array_unique($request->classroom_codes);
            $results = [
                'success' => [],
                'failed' => [],
                'skipped' => [],
            ];

            DB::beginTransaction();

            foreach ($classroomCodes as $classroomCode) {
                try {
                    $classroom = Classroom::where('code', $classroomCode)
                        ->withCount(['teachers', 'students'])
                        ->first();

                    if (!$classroom) {
                        $results['failed'][] = [
                            'code' => $classroomCode,
                            'reason' => 'Kelas tidak ditemukan'
                        ];
                        continue;
                    }

                    switch ($action) {
                        case 'delete':
                            if ($classroom->teachers_count > 0 || $classroom->students_count > 0) {
                                $results['skipped'][] = [
                                    'code' => $classroomCode,
                                    'name' => $classroom->name,
                                    'reason' => 'Kelas masih memiliki guru atau siswa'
                                ];
                            } else {
                                $classroom->delete();
                                $results['success'][] = [
                                    'code' => $classroomCode,
                                    'name' => $classroom->name,
                                    'action' => 'deleted'
                                ];
                            }
                            break;

                        case 'activate':
                            if ($classroom->status === 'active') {
                                $results['skipped'][] = [
                                    'code' => $classroomCode,
                                    'name' => $classroom->name,
                                    'reason' => 'Kelas sudah aktif'
                                ];
                            } else {
                                $classroom->update(['status' => 'active']);
                                $results['success'][] = [
                                    'code' => $classroomCode,
                                    'name' => $classroom->name,
                                    'action' => 'activated'
                                ];
                            }
                            break;

                        case 'deactivate':
                            if ($classroom->status === 'inactive') {
                                $results['skipped'][] = [
                                    'code' => $classroomCode,
                                    'name' => $classroom->name,
                                    'reason' => 'Kelas sudah tidak aktif'
                                ];
                            } else {
                                $classroom->update(['status' => 'inactive']);
                                $results['success'][] = [
                                    'code' => $classroomCode,
                                    'name' => $classroom->name,
                                    'action' => 'deactivated'
                                ];
                            }
                            break;
                    }

                } catch (Exception $e) {
                    $results['failed'][] = [
                        'code' => $classroomCode,
                        'reason' => $e->getMessage()
                    ];
                }
            }

            DB::commit();

            $message = sprintf(
                'Bulk operation completed. Success: %d, Failed: %d, Skipped: %d',
                count($results['success']),
                count($results['failed']),
                count($results['skipped'])
            );

            return response()->json([
                'status' => 'success',
                'message' => $message,
                'data' => $results,
                'summary' => [
                    'total_processed' => count($classroomCodes),
                    'success_count' => count($results['success']),
                    'failed_count' => count($results['failed']),
                    'skipped_count' => count($results['skipped']),
                ]
            ]);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal melakukan bulk operation',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Export classrooms data
     */
    public function export(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'format' => 'required|in:csv,excel,json',
                'search' => 'nullable|string|max:255',
                'status' => 'nullable|in:all,active,inactive',
                'include_teachers' => 'nullable|boolean',
                'include_students' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Parameter tidak valid',
                    'errors' => $validator->errors()
                ], 422);
            }

            $format = $request->input('format', 'csv');
            $search = $request->input('search');
            $status = $request->input('status', 'all');
            $includeTeachers = $request->boolean('include_teachers', false);
            $includeStudents = $request->boolean('include_students', false);

            $query = Classroom::with(['creator:id,name,email'])
                ->withCount(['teachers', 'students'])
                ->orderBy('created_at', 'desc');

            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            if (!empty($status) && $status !== 'all') {
                $query->where('status', $status);
            }

            $classrooms = $query->get();

            $exportData = $classrooms->map(function ($classroom) use ($includeTeachers, $includeStudents) {
                $data = [
                    'id' => $classroom->code, // Use code as ID
                    'code' => $classroom->code,
                    'name' => $classroom->name,
                    'description' => $classroom->description,
                    'status' => $classroom->status,
                    'teacher_count' => $classroom->teachers_count,
                    'student_count' => $classroom->students_count,
                    'created_by' => $classroom->creator ? $classroom->creator->name : null,
                    'created_at' => $classroom->created_at->toISOString(),
                    'updated_at' => $classroom->updated_at->toISOString(),
                ];

                if ($includeTeachers) {
                    $data['teachers'] = $classroom->teachers()
                        ->select('users.name', 'users.email')
                        ->get()
                        ->pluck('name')
                        ->join(', ');
                }

                if ($includeStudents) {
                    $data['students'] = $classroom->students()
                        ->select('users.name', 'users.email')
                        ->get()
                        ->pluck('name')
                        ->join(', ');
                }

                return $data;
            });

            return response()->json([
                'status' => 'success',
                'message' => 'Data export berhasil digenerate',
                'data' => $exportData,
                'meta' => [
                    'format' => $format,
                    'total_rows' => $exportData->count(),
                    'filters' => [
                        'search' => $search,
                        'status' => $status,
                        'include_teachers' => $includeTeachers,
                        'include_students' => $includeStudents,
                    ],
                    'generated_at' => now()->toISOString(),
                ]
            ]);

        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengexport data',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Generate unique classroom code
     */



    /**
     * Update the specified classroom with enhanced validation
     */
    public function update(Request $request, $code)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'code' => [
                    'nullable',
                    'string',
                    'max:50',
                    'unique:classrooms,code,' . $classroom->id, // Use actual ID for unique validation
                    'regex:/^[A-Za-z0-9\-_]+$/',
                ],
                'description' => 'nullable|string',
                'status' => 'nullable|in:active,inactive',
            ], [
                'name.required' => 'Nama kelas harus diisi',
                'name.string' => 'Nama kelas harus berupa text',
                'name.max' => 'Nama kelas maksimal 255 karakter',
                'code.unique' => 'Kode kelas sudah digunakan',
                'code.max' => 'Kode kelas maksimal 50 karakter',
                'code.regex' => 'Kode kelas hanya boleh mengandung huruf, angka, tanda minus, dan underscore',
                'status.in' => 'Status harus berupa active atau inactive',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = $request->only(['name', 'description', 'status']);

            if ($request->has('code') && $request->code) {
                $updateData['code'] = $request->code;
            }

            $classroom->update($updateData);

            $classroom = Classroom::where('code', $classroom->code)
                ->with(['creator:id,name,email'])
                ->withCount(['teachers', 'students'])
                ->first();

            return response()->json([
                'status' => 'success',
                'message' => 'Kelas berhasil diupdate',
                'data' => [
                    'id' => $classroom->code, // Use code as ID for frontend
                    'code' => $classroom->code,
                    'name' => $classroom->name,
                    'description' => $classroom->description,
                    'status' => $classroom->status,
                    'teacher_count' => $classroom->teachers_count ?? 0,
                    'student_count' => $classroom->students_count ?? 0,
                    'created_by' => $classroom->creator ? [
                        'id' => $classroom->creator->id,
                        'name' => $classroom->creator->name,
                        'email' => $classroom->creator->email,
                    ] : null,
                    'created_at' => $classroom->created_at->toISOString(),
                    'updated_at' => $classroom->updated_at->toISOString(),
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
                'message' => 'Gagal mengupdate kelas',
                'debug' => config('app.debug') ? [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ] : null
            ], 500);
        }
    }

    /**
     * Remove the specified classroom with better validation
     */
    public function destroy($code)
    {
        try {
            $classroom = Classroom::where('code', $code)
                ->withCount(['teachers', 'students'])
                ->firstOrFail();

            if ($classroom->teachers_count > 0 || $classroom->students_count > 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Tidak dapat menghapus kelas yang masih memiliki guru atau siswa',
                    'details' => [
                        'teachers_count' => $classroom->teachers_count,
                        'students_count' => $classroom->students_count,
                    ]
                ], 400);
            }

            $classroom->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Kelas berhasil dihapus',
                'data' => [
                    'id' => $code, // Use code instead of undefined $id
                    'code' => $code,
                    'deleted_at' => now()->toISOString(),
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
                'message' => 'Gagal menghapus kelas',
                'debug' => config('app.debug') ? [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ] : null
            ], 500);
        }
    }

    /**
     * Get available teachers with pagination
     */
    public function availableTeachers(Request $request, $code)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            $validator = Validator::make($request->all(), [
                'search' => 'nullable|string|max:255',
                'per_page' => 'nullable|integer|min:1|max:50',
                'page' => 'nullable|integer|min:1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Parameter tidak valid',
                    'errors' => $validator->errors()
                ], 422);
            }

            $search = $request->input('search');
            $perPage = (int) $request->input('per_page', 10);

            $existingTeacherIds = $classroom->teachers()->pluck('users.id')->toArray();

            $query = User::whereNotIn('id', $existingTeacherIds)
                ->select('id', 'name', 'email')
                ->orderBy('name');

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $teachers = $query->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'message' => 'Data guru tersedia berhasil diambil',
                'data' => $teachers->items(),
                'meta' => [
                    'current_page' => $teachers->currentPage(),
                    'last_page' => $teachers->lastPage(),
                    'per_page' => $teachers->perPage(),
                    'total' => $teachers->total(),
                    'has_more' => $teachers->hasMorePages(),
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
                'message' => 'Gagal mengambil data guru',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get available students with pagination
     */
    public function availableStudents(Request $request, $code)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            $validator = Validator::make($request->all(), [
                'search' => 'nullable|string|max:255',
                'per_page' => 'nullable|integer|min:1|max:50',
                'page' => 'nullable|integer|min:1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Parameter tidak valid',
                    'errors' => $validator->errors()
                ], 422);
            }

            $search = $request->input('search');
            $perPage = (int) $request->input('per_page', 10);

            $existingStudentIds = $classroom->students()->pluck('users.id')->toArray();

            $query = User::whereNotIn('id', $existingStudentIds)
                ->select('id', 'name', 'email')
                ->orderBy('name');

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $students = $query->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'message' => 'Data siswa tersedia berhasil diambil',
                'data' => $students->items(),
                'meta' => [
                    'current_page' => $students->currentPage(),
                    'last_page' => $students->lastPage(),
                    'per_page' => $students->perPage(),
                    'total' => $students->total(),
                    'has_more' => $students->hasMorePages(),
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
                'message' => 'Gagal mengambil data siswa',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Add teacher to classroom with enhanced validation
     */
    public function addTeacher(Request $request, $code)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            $validator = Validator::make($request->all(), [
                'teacher_id' => [
                    'required',
                    'integer',
                    'exists:users,id',
                ],
            ], [
                'teacher_id.required' => 'ID guru harus diisi',
                'teacher_id.integer' => 'ID guru harus berupa angka',
                'teacher_id.exists' => 'Guru tidak ditemukan',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $teacher = User::findOrFail($request->teacher_id);

            if ($classroom->teachers()->where('users.id', $teacher->id)->exists()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Guru sudah terdaftar di kelas ini'
                ], 400);
            }

            DB::beginTransaction();

            $classroom->teachers()->attach($teacher->id, [
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Reload classroom with counts
            $classroom = Classroom::where('code', $code)
                ->withCount(['teachers', 'students'])
                ->firstOrFail();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Guru berhasil ditambahkan',
                'data' => [
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                    'email' => $teacher->email,
                    'phone' => $teacher->phone ?? null,
                    'assigned_at' => now()->toISOString(),
                ],
                'meta' => [
                    'teacher_count' => $classroom->teachers_count,
                    'student_count' => $classroom->students_count,
                ]
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Kelas atau guru tidak ditemukan'
            ], 404);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menambahkan guru',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Add student to classroom with enhanced validation
     */
    public function addStudent(Request $request, $code)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            $validator = Validator::make($request->all(), [
                'student_id' => [
                    'required',
                    'integer',
                    'exists:users,id',
                ],
            ], [
                'student_id.required' => 'ID siswa harus diisi',
                'student_id.integer' => 'ID siswa harus berupa angka',
                'student_id.exists' => 'Siswa tidak ditemukan',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $student = User::findOrFail($request->student_id);

            if ($classroom->students()->where('users.id', $student->id)->exists()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Siswa sudah terdaftar di kelas ini'
                ], 400);
            }

            DB::beginTransaction();

            $classroom->students()->attach($student->id, [
                'status' => 'active',
                'joined_date' => now(),
                'enrolled_date' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Reload classroom with counts
            $classroom = Classroom::where('code', $code)
                ->withCount(['teachers', 'students'])
                ->firstOrFail();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Siswa berhasil ditambahkan',
                'data' => [
                    'id' => $student->id,
                    'name' => $student->name,
                    'email' => $student->email,
                    'student_id' => $student->student_id ?? null,
                    'status' => 'active',
                    'joined_date' => now()->toISOString(),
                ],
                'meta' => [
                    'teacher_count' => $classroom->teachers_count,
                    'student_count' => $classroom->students_count,
                ]
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Kelas atau siswa tidak ditemukan'
            ], 404);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menambahkan siswa',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Remove teacher from classroom
     */


    /**
     * Remove teacher from classroom
     */
    public function removeTeacher($code, $teacherId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            if (!$classroom->teachers()->where('users.id', $teacherId)->exists()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Guru tidak ditemukan di kelas ini'
                ], 404);
            }

            DB::beginTransaction();

            $classroom->teachers()->detach($teacherId);

            // Reload classroom with counts
            $classroom = Classroom::where('code', $code)->withCount(['teachers', 'students'])->firstOrFail();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Guru berhasil dihapus dari kelas',
                'data' => [
                    'teacher_id' => (int) $teacherId,
                    'removed_at' => now()->toISOString(),
                    'teacher_count' => $classroom->teachers_count,
                    'student_count' => $classroom->students_count,
                ]
            ]);

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
                'message' => 'Gagal menghapus guru',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
    /**
     * Generate unique classroom code
     */
     private function generateUniqueCode($name)
    {
        $baseCode = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $name), 0, 6));
        $code = $baseCode;
        $counter = 1;

        while (Classroom::where('code', $code)->exists()) {
            $code = $baseCode . str_pad($counter, 2, '0', STR_PAD_LEFT);
            $counter++;
        }

        return $code;
    }
}
