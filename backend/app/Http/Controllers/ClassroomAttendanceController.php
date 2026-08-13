<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\ClassroomMeeting;
use App\Models\ClassroomAttendance;
use App\Models\ClassroomAttendanceNote;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class ClassroomAttendanceController extends Controller
{
    /**
     * Get all meetings with embedded attendance data
     */
   public function getMeetings(Request $request, $code)
{
    try {
        $classroom = Classroom::where('code', $code)->firstOrFail();

        $validator = Validator::make($request->all(), [
            'per_page'   => 'nullable|integer|min:1|max:100',
            'page'       => 'nullable|integer|min:1',
            'search'     => 'nullable|string|max:255',
            'status'     => 'nullable|in:all,scheduled,ongoing,completed',
            'type'       => 'nullable|in:all,regular,exam,quiz,presentation,field_trip',
            'date_from'  => 'nullable|date',
            'date_to'    => 'nullable|date',
            'sort_by'    => 'nullable|in:meeting_date,title,status,type',
            'sort_order' => 'nullable|in:asc,desc',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Parameter tidak valid',
                'errors'  => $validator->errors()
            ], 422);
        }

        $perPage   = (int) $request->input('per_page', 15);
        $search    = $request->input('search');
        $status    = $request->input('status', 'all');
        $type      = $request->input('type', 'all');
        $dateFrom  = $request->input('date_from');
        $dateTo    = $request->input('date_to');
        $sortBy    = $request->input('sort_by', 'meeting_date');
        $sortOrder = $request->input('sort_order', 'desc');

       $query = ClassroomMeeting::where('classroom_id', $classroom->id)
            ->with([
                'creator:id,name,email',
                'attendances' => function ($q) {
                    if (auth()->user()->hasRole('user')) {
                        $q->where('student_id', auth()->user()->id);
                    }
                },
                'attendances.student:id,name,email',
                'attendances.markedBy:id,name,email',
                'attendances.additionalNotes.creator:id,name,email'
            ])
            ->withCount(['attendances' => function ($q) {
                if (auth()->user()->hasRole('user')) {
                    $q->where('student_id', auth()->user()->id);
                }
            }])
            ->orderBy($sortBy, $sortOrder);


        // Filters
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%");
            });
        }

        if (!empty($status) && $status !== 'all') {
            $query->where('status', $status);
        }

        if (!empty($type) && $type !== 'all') {
            $query->where('type', $type);
        }

        if (!empty($dateFrom)) {
            $query->where('meeting_date', '>=', $dateFrom);
        }

        if (!empty($dateTo)) {
            $query->where('meeting_date', '<=', $dateTo);
        }

        $meetings = $query->paginate($perPage);

        // Transform data with embedded attendance
        $meetings->getCollection()->transform(function ($meeting) {
            return $this->transformMeetingData($meeting);
        });

        return response()->json([
            'status'  => 'success',
            'message' => 'Data pertemuan berhasil diambil',
            'data'    => [
                'meetings' => $meetings->items(),
                'pagination' => [
                    'current_page'   => $meetings->currentPage(),
                    'last_page'      => $meetings->lastPage(),
                    'per_page'       => $meetings->perPage(),
                    'total'          => $meetings->total(),
                    'from'           => $meetings->firstItem(),
                    'to'             => $meetings->lastItem(),
                    'has_more_pages' => $meetings->hasMorePages(),
                    'prev_page_url'  => $meetings->previousPageUrl(),
                    'next_page_url'  => $meetings->nextPageUrl(),
                    'path'           => $meetings->path(),
                ]
            ]
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'status'  => 'error',
            'message' => 'Gagal mengambil data pertemuan',
            'debug'   => config('app.debug') ? $e->getMessage() : null
        ], 500);
    }
}


    /**
     * Get specific meeting detail
     */
  public function getMeetingDetail(Request $request, $code, $meetingId)
{
    try {
        $classroom = Classroom::where('code', $code)->firstOrFail();

        $meeting = ClassroomMeeting::where('classroom_id', $classroom->id)
            ->with([
                'creator:id,name,email',
                'attendances.student:id,name,email',
                'attendances.markedBy:id,name,email',
                'attendances.additionalNotes.creator:id,name,email'
            ])
            ->findOrFail($meetingId);

        // pastikan relasi kosong tetap ada default
        $meetingData = [
            'id' => $meeting->id,
            'title' => $meeting->title,
            'date' => $meeting->date,
            'description' => $meeting->description ?? '',
            'creator' => $meeting->creator ? [
                'id' => $meeting->creator->id,
                'name' => $meeting->creator->name,
                'email' => $meeting->creator->email,
            ] : null,
            'attendances' => $meeting->attendances->map(function ($attendance) {
                return [
                    'id' => $attendance->id,
                    'status' => $attendance->status ?? 'unmarked',
                    'student' => $attendance->student ? [
                        'id' => $attendance->student->id,
                        'name' => $attendance->student->name,
                        'email' => $attendance->student->email,
                    ] : null,
                    'marked_by' => $attendance->markedBy ? [
                        'id' => $attendance->markedBy->id,
                        'name' => $attendance->markedBy->name,
                        'email' => $attendance->markedBy->email,
                    ] : null,
                    'additional_notes' => $attendance->additionalNotes->map(function ($note) {
                        return [
                            'id' => $note->id,
                            'note' => $note->note,
                            'creator' => $note->creator ? [
                                'id' => $note->creator->id,
                                'name' => $note->creator->name,
                                'email' => $note->creator->email,
                            ] : null,
                        ];
                    })->toArray()
                ];
            })->toArray(),
        ];

        return response()->json([
            'status' => 'success',
            'message' => 'Detail pertemuan berhasil diambil',
            'data' => $meetingData
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Gagal mengambil detail pertemuan',
            'debug' => config('app.debug') ? $e->getMessage() : null
        ], 500);
    }
}


    /**
     * Create new meeting with auto-generated attendance records
     */
    /**
     * Create new meeting with auto-generated attendance records
     */
    public function createMeeting(Request $request, $code)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'meeting_date' => 'required|date',
                'start_time' => 'nullable',
                'end_time' => 'nullable|after:start_time',
                'type' => 'required|in:regular,exam,quiz,presentation,field_trip',
                'location' => 'nullable|string|max:255',
                'is_mandatory' => 'required|in:true,false,1,0',
                'agenda' => 'nullable|string',
                'materials_covered' => 'nullable|string',
                'homework_assigned' => 'nullable|string',
                'notes' => 'nullable|string',
            ], [
                'title.required' => 'Judul pertemuan harus diisi',
                'meeting_date.required' => 'Tanggal pertemuan harus diisi',
                'end_time.after' => 'Waktu selesai harus setelah waktu mulai',
                'type.required' => 'Tipe pertemuan harus dipilih',
                'type.in' => 'Tipe pertemuan tidak valid',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data tidak valid',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Parse meeting date
            $meetingDate = Carbon::parse($request->meeting_date)->startOfDay();

            // Proses time input - langsung simpan sebagai H:i format
            $startTime = null;
            $endTime = null;
            $durationMinutes = null;

            if ($request->start_time) {
                $startTime = $request->start_time; // Sudah dalam format H:i
            }

            if ($request->end_time) {
                $endTime = $request->end_time; // Sudah dalam format H:i
            }

            // Calculate duration jika kedua time ada
            if ($startTime && $endTime) {
                $startDateTime = Carbon::parse($meetingDate->format('Y-m-d') . ' ' . $startTime);
                $endDateTime = Carbon::parse($meetingDate->format('Y-m-d') . ' ' . $endTime);

                // Jika end_time lebih kecil dari start_time, tambah 1 hari
                if ($endDateTime->lt($startDateTime)) {
                    $endDateTime->addDay();
                }

                $durationMinutes = $endDateTime->diffInMinutes($startDateTime);
            }

            DB::beginTransaction();

            $meeting = ClassroomMeeting::create([
                'classroom_id' => $classroom->id,
                'created_by' => Auth::id(),
                'title' => $request->title,
                'description' => $request->description,
                'meeting_date' => $meetingDate,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'type' => $request->type,
                'location' => $request->location,
                'is_mandatory' => $request->boolean('is_mandatory', true),
                'agenda' => $request->agenda,
                'materials_covered' => $request->materials_covered,
                'homework_assigned' => $request->homework_assigned,
                'notes' => $request->notes,
                'duration_minutes' => $durationMinutes,
                'status' => 'scheduled', // Default status
            ]);

            // Auto-create attendance records untuk semua active students
            $students = $classroom->students()->wherePivot('status', 'active')->get();

            foreach ($students as $student) {
                ClassroomAttendance::create([
                    'meeting_id' => $meeting->id,
                    'student_id' => $student->id,
                    'status' => 'absent', // Default status
                    'marked_by' => Auth::id(),
                    'marked_at' => now(),
                ]);
            }

            DB::commit();

            // Load meeting with relations untuk consistent response
            $meeting->load([
                'creator:id,name,email',
                'attendances.student:id,name,email',
                'attendances.markedBy:id,name,email',
                'attendances.additionalNotes.creator:id,name,email'
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pertemuan berhasil dibuat',
                'data' => $this->transformMeetingData($meeting)
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat pertemuan',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
    /**
     * Update meeting with attendance data
     */
     public function updateMeeting(Request $request, $code, $meetingId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();
            $meeting = ClassroomMeeting::where('classroom_id', $classroom->id)
                ->findOrFail($meetingId);

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'meeting_date' => 'required|date',
                'start_time' => 'nullable',
                'end_time' => 'nullable|after:start_time',
                'type' => 'required|in:regular,exam,quiz,presentation,field_trip',
                'location' => 'nullable|string|max:255',
                'is_mandatory' => 'required|in:true,false,1,0',
                'agenda' => 'nullable|string',
                'materials_covered' => 'nullable|string',
                'homework_assigned' => 'nullable|string',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data tidak valid',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $oldMeetingDate = $meeting->meeting_date->startOfDay();
            $oldStartTime = $meeting->start_time;

            // Parse meeting date (start of day)
            $meetingDate = Carbon::parse($request->meeting_date)->startOfDay();

            // Proses time input - langsung simpan sebagai H:i format
            $startTime = null;
            $endTime = null;
            $durationMinutes = null;

            if ($request->start_time) {
                $startTime = $request->start_time; // Sudah dalam format H:i
            }

            if ($request->end_time) {
                $endTime = $request->end_time; // Sudah dalam format H:i
            }

            // Calculate duration jika kedua time ada
            if ($startTime && $endTime) {
                $startDateTime = Carbon::parse($meetingDate->format('Y-m-d') . ' ' . $startTime);
                $endDateTime = Carbon::parse($meetingDate->format('Y-m-d') . ' ' . $endTime);

                // Jika end_time lebih kecil dari start_time, tambah 1 hari
                if ($endDateTime->lt($startDateTime)) {
                    $endDateTime->addDay();
                }

                $durationMinutes = $endDateTime->diffInMinutes($startDateTime);
            }

            $meeting->update([
                'title' => $request->title,
                'description' => $request->description,
                'meeting_date' => $meetingDate,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'type' => $request->type,
                'location' => $request->location,
                'is_mandatory' => $request->boolean('is_mandatory', $meeting->is_mandatory),
                'agenda' => $request->agenda,
                'materials_covered' => $request->materials_covered,
                'homework_assigned' => $request->homework_assigned,
                'notes' => $request->notes,
                'duration_minutes' => $durationMinutes,
            ]);

            // Update attendance times jika tanggal berubah
            $dateChanged = !$oldMeetingDate->equalTo($meetingDate);
            $startTimeChanged = $oldStartTime != $startTime;

            if ($dateChanged) {
                $attendances = $meeting->attendances;

                foreach ($attendances as $attendance) {
                    $updates = [];

                    // Update check_in_time - tetap format H:i
                    if ($attendance->check_in_time) {
                        // check_in_time sudah dalam format H:i, tidak perlu diubah
                        // Kecuali jika Anda ingin mempertahankan waktu relatif terhadap hari baru
                    }

                    // Update check_out_time - tetap format H:i
                    if ($attendance->check_out_time) {
                        // check_out_time sudah dalam format H:i, tidak perlu diubah
                        // Kecuali jika Anda ingin mempertahankan waktu relatif terhadap hari baru
                    }

                    // Recalculate duration jika ada kedua waktu
                    if ($attendance->check_in_time && $attendance->check_out_time) {
                        $checkInDateTime = Carbon::parse($meetingDate->format('Y-m-d') . ' ' . $attendance->check_in_time);
                        $checkOutDateTime = Carbon::parse($meetingDate->format('Y-m-d') . ' ' . $attendance->check_out_time);

                        if ($checkOutDateTime->lt($checkInDateTime)) {
                            $checkOutDateTime->addDay();
                        }

                        $updates['duration_minutes'] = $checkOutDateTime->diffInMinutes($checkInDateTime);
                    }

                    if (!empty($updates)) {
                        $attendance->update($updates);
                    }
                }
            }

            // Update late status jika waktu mulai berubah
            if ($dateChanged || $startTimeChanged) {
                $lateAttendances = $meeting->attendances()->where('status', 'late')->get();

                foreach ($lateAttendances as $attendance) {
                    if ($attendance->check_in_time && $meeting->start_time) {
                        $meetingStartDateTime = Carbon::parse($meetingDate->format('Y-m-d') . ' ' . $meeting->start_time);
                        $checkInDateTime = Carbon::parse($meetingDate->format('Y-m-d') . ' ' . $attendance->check_in_time);

                        $isLate = $checkInDateTime->gt($meetingStartDateTime);
                        $lateMinutes = $isLate ? $checkInDateTime->diffInMinutes($meetingStartDateTime) : null;

                        $attendance->update([
                            'is_late' => $isLate,
                            'late_minutes' => $lateMinutes,
                        ]);
                    } else {
                        $attendance->update([
                            'is_late' => false,
                            'late_minutes' => null,
                        ]);
                    }
                }
            }

            // Load meeting dengan relations untuk response yang konsisten
            $meeting->load([
                'creator:id,name,email',
                'attendances.student:id,name,email',
                'attendances.markedBy:id,name,email',
                'attendances.additionalNotes.creator:id,name,email'
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pertemuan berhasil diperbarui',
                'data' => $this->transformMeetingData($meeting)
            ]);


        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memperbarui pertemuan',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
    /**
     * Delete meeting
     */
    public function deleteMeeting($code, $meetingId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();
            $meeting = ClassroomMeeting::where('classroom_id', $classroom->id)
                ->findOrFail($meetingId);

            DB::beginTransaction();

            // Delete related attendance records and notes
            ClassroomAttendanceNote::whereIn('attendance_id',
                $meeting->attendances->pluck('id')
            )->delete();

            ClassroomAttendance::where('meeting_id', $meetingId)->delete();

            $meeting->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Pertemuan berhasil dihapus',
                'data' => [
                    'id' => $meetingId,
                    'deleted_at' => now(),
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus pertemuan',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Update attendance for multiple students (DIPERBAIKI)
     */
    /**
     * Update attendance for multiple students (FIXED)
     */
    public function updateAttendance(Request $request, $code, $meetingId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();
            $meeting = ClassroomMeeting::where('classroom_id', $classroom->id)
                ->findOrFail($meetingId);

            $validator = Validator::make($request->all(), [
                'attendances' => 'required|array|min:1',
                'attendances.*.student_id' => 'required|exists:users,id',
                'attendances.*.status' => 'required|in:present,absent,late,excused,sick,permit',
                'attendances.*.check_in_time' => 'nullable',
                'attendances.*.check_out_time' => 'nullable',
                'attendances.*.notes' => 'nullable|string',
                'attendances.*.participation_score' => 'nullable|numeric|min:0|max:10',
                'attendances.*.participation_notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data tidak valid',
                    'errors' => $validator->errors(),
                ], 422);
            }

            DB::beginTransaction();

            $meetingDate = Carbon::parse($meeting->meeting_date)->startOfDay();
            $updatedCount = 0;

            foreach ($request->attendances as $attendanceData) {
                $attendance = ClassroomAttendance::where('meeting_id', $meeting->id)
                    ->where('student_id', $attendanceData['student_id'])
                    ->first();

                if (!$attendance) {
                    // Jika attendance tidak exist, create new
                    $attendance = ClassroomAttendance::create([
                        'meeting_id' => $meeting->id,
                        'student_id' => $attendanceData['student_id'],
                        'status' => $attendanceData['status'],
                        'marked_by' => Auth::id(),
                        'marked_at' => now(),
                    ]);
                }

                // Prepare update data
                $updateData = [
                    'status' => $attendanceData['status'],
                    'participation_score' => $attendanceData['participation_score'] ?? $attendance->participation_score,
                    'participation_notes' => $attendanceData['participation_notes'] ?? $attendance->participation_notes,
                    'notes' => $attendanceData['notes'] ?? $attendance->notes,
                    'marked_by' => Auth::id(),
                    'marked_at' => now(),
                ];

                // Handle check_in_time - simpan sebagai H:i format
                if (isset($attendanceData['check_in_time'])) {
                    $updateData['check_in_time'] = $attendanceData['check_in_time']; // Sudah format H:i
                }

                // Handle check_out_time - simpan sebagai H:i format
                if (isset($attendanceData['check_out_time'])) {
                    $updateData['check_out_time'] = $attendanceData['check_out_time']; // Sudah format H:i
                }

                // Calculate duration jika ada kedua waktu
                $checkInTime = $updateData['check_in_time'] ?? $attendance->check_in_time;
                $checkOutTime = $updateData['check_out_time'] ?? $attendance->check_out_time;

                if ($checkInTime && $checkOutTime) {
                    $checkInDateTime = Carbon::parse($meetingDate->format('Y-m-d') . ' ' . $checkInTime);
                    $checkOutDateTime = Carbon::parse($meetingDate->format('Y-m-d') . ' ' . $checkOutTime);

                    // Jika check_out_time lebih kecil dari check_in_time, tambah 1 hari
                    if ($checkOutDateTime->lt($checkInDateTime)) {
                        $checkOutDateTime->addDay();
                    }

                    $updateData['duration_minutes'] = $checkOutDateTime->diffInMinutes($checkInDateTime);
                }

                // Calculate late status jika status = late dan ada check_in_time
                if ($attendanceData['status'] === 'late' && $checkInTime && $meeting->start_time) {
                    $meetingStartDateTime = Carbon::parse($meetingDate->format('Y-m-d') . ' ' . $meeting->start_time);
                    $checkInDateTime = Carbon::parse($meetingDate->format('Y-m-d') . ' ' . $checkInTime);

                    $isLate = $checkInDateTime->gt($meetingStartDateTime);
                    $lateMinutes = $isLate ? $checkInDateTime->diffInMinutes($meetingStartDateTime) : null;

                    $updateData['is_late'] = $isLate;
                    $updateData['late_minutes'] = $lateMinutes;
                } else {
                    // Reset late status jika bukan late
                    $updateData['is_late'] = false;
                    $updateData['late_minutes'] = null;
                }

                // Update attendance
                $attendance->update($updateData);
                $updatedCount++;
            }

            // Update meeting status jika needed
            if ($meeting->status === 'scheduled') {
                $meeting->update(['status' => 'ongoing']);
            }

            DB::commit();

            // Load updated meeting dengan semua relations
            $meeting->load([
                'creator:id,name,email',
                'attendances.student:id,name,email',
                'attendances.markedBy:id,name,email',
                'attendances.additionalNotes.creator:id,name,email'
            ]);

            return response()->json([
                'status' => 'success',
                'message' => "Berhasil memperbarui kehadiran {$updatedCount} siswa",
                'data' => $this->transformMeetingData($meeting)
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memperbarui kehadiran',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }


    /**
     * Update individual attendance (NEW)
     */
    public function updateIndividualAttendance(Request $request, $code, $attendanceId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            $attendance = ClassroomAttendance::whereHas('meeting', function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })->findOrFail($attendanceId);

            $validator = Validator::make($request->all(), [
                'status' => 'required|in:present,absent,late,excused,sick,permit',
                'check_in_time' => 'nullable',
                'check_out_time' => 'nullable',
                'notes' => 'nullable|string',
                'participation_score' => 'nullable|numeric|min:0|max:10',
                'participation_notes' => 'nullable|string',
                'student_notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data tidak valid',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $meeting = $attendance->meeting;
            $meetingDate = Carbon::parse($meeting->meeting_date)->startOfDay();

            // Calculate late status and duration
            $lateMinutes = null;
            $isLate = false;
            $durationMinutes = null;
            $checkInDatetime = $attendance->check_in_time;
            $checkOutDatetime = $attendance->check_out_time;

            if ($request->has('check_in_time')) {
                $checkInDatetime = $meetingDate->copy()->setTimeFrom(Carbon::createFromFormat('H:i', $request->check_in_time));
            } elseif ($checkInDatetime) {
                $checkInDatetime = Carbon::parse($checkInDatetime);
            } else {
                $checkInDatetime = null;
            }

            if ($request->has('check_out_time')) {
                $checkOutDatetime = $meetingDate->copy()->setTimeFrom(Carbon::createFromFormat('H:i', $request->check_out_time));
            } elseif ($checkOutDatetime) {
                $checkOutDatetime = Carbon::parse($checkOutDatetime);
            } else {
                $checkOutDatetime = null;
            }

            if ($checkInDatetime && $checkOutDatetime) {
                if ($checkOutDatetime->lt($checkInDatetime)) {
                    $checkOutDatetime->addDay();
                }
                $durationMinutes = $checkOutDatetime->diffInMinutes($checkInDatetime);
            }

            if ($request->status === 'late' && $checkInDatetime && $meeting->start_time) {
                $startTime = Carbon::parse($meeting->start_time);
                $isLate = $checkInDatetime->gt($startTime);
                $lateMinutes = $isLate ? $checkInDatetime->diffInMinutes($startTime) : null;
            }

            $attendance->update([
                'status' => $request->status,
                'check_in_time' => $checkInDatetime,
                'check_out_time' => $checkOutDatetime,
                'duration_minutes' => $durationMinutes,
                'is_late' => $isLate,
                'late_minutes' => $lateMinutes,
                'participation_score' => $request->participation_score ?? $attendance->participation_score,
                'participation_notes' => $request->participation_notes ?? $attendance->participation_notes,
                'notes' => $request->notes ?? $attendance->notes,
                'student_notes' => $request->student_notes ?? $attendance->student_notes,
                'marked_by' => Auth::id(),
                'marked_at' => now(),
            ]);

            // Load updated attendance with relations
            $attendance->load([
                'student:id,name,email',
                'markedBy:id,name,email',
                'additionalNotes.creator:id,name,email'
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Kehadiran berhasil diperbarui',
                'data' => $this->transformAttendanceData($attendance)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memperbarui kehadiran individu',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get individual attendance detail (NEW)
     */
    public function getAttendanceDetail(Request $request, $code, $attendanceId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            $attendance = ClassroomAttendance::whereHas('meeting', function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })->with([
                'student:id,name,email',
                'markedBy:id,name,email',
                'additionalNotes.creator:id,name,email',
                'meeting:id,title,meeting_date,start_time,end_time'
            ])->findOrFail($attendanceId);

            return response()->json([
                'status' => 'success',
                'message' => 'Detail kehadiran berhasil diambil',
                'data' => $this->transformAttendanceData($attendance)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil detail kehadiran',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Helper method to transform meeting data
     */
  /**
     * Helper method to transform meeting data (FIXED)
     */
    private function transformMeetingData($meeting)
    {
        // Calculate attendance statistics
        $totalAttendances = $meeting->attendances->count();
        $presentCount = $meeting->attendances->whereIn('status', ['present', 'late'])->count();
        $absentCount = $meeting->attendances->where('status', 'absent')->count();
        $excusedCount = $meeting->attendances->whereIn('status', ['excused', 'sick', 'permit'])->count();

        $attendancePercentage = $totalAttendances > 0
            ? round(($presentCount / $totalAttendances) * 100, 2)
            : 0;

        return [
            'id' => $meeting->id,
            'title' => $meeting->title,
            'description' => $meeting->description,
            'meeting_date' => $meeting->meeting_date ? $meeting->meeting_date->format('Y-m-d') : null,
            'start_time' => $meeting->start_time, // Sudah dalam format H:i
            'end_time' => $meeting->end_time,     // Sudah dalam format H:i
            'status' => $meeting->status,
            'type' => $meeting->type,
            'location' => $meeting->location,
            'is_mandatory' => $meeting->is_mandatory,
            'agenda' => $meeting->agenda,
            'materials_covered' => $meeting->materials_covered,
            'homework_assigned' => $meeting->homework_assigned,
            'notes' => $meeting->notes,
            'duration_minutes' => $meeting->duration_minutes,
            'formatted_duration' => $this->formatDuration($meeting->duration_minutes),
            'is_past' => $meeting->meeting_date ? $meeting->meeting_date->lt(now()->toDateString()) : false,
            'is_today' => $meeting->meeting_date ? $meeting->meeting_date->isToday() : false,

            // Attendance statistics
            'attendance_count' => $totalAttendances,
            'present_count' => $presentCount,
            'absent_count' => $absentCount,
            'excused_count' => $excusedCount,
            'attendance_percentage' => $attendancePercentage,

            // Embedded attendance data
            'attendances' => $meeting->attendances->map(function ($attendance) {
                return $this->transformAttendanceData($attendance);
            }),

            // Creator info
            'creator' => $meeting->creator ? [
                'id' => $meeting->creator->id,
                'name' => $meeting->creator->name,
                'email' => $meeting->creator->email,
            ] : null,

            // Classroom info (jika diperlukan)
            'classroom' => $meeting->classroom ? [
                'id' => $meeting->classroom->id,
                'name' => $meeting->classroom->name,
                'code' => $meeting->classroom->code,
            ] : null,

            'created_at' => $meeting->created_at ? $meeting->created_at->format('Y-m-d H:i:s') : null,
            'updated_at' => $meeting->updated_at ? $meeting->updated_at->format('Y-m-d H:i:s') : null,
        ];
    }

    /**
     * Helper method to transform attendance data (FIXED)
     */
    private function transformAttendanceData($attendance)
    {
        return [
            'id' => $attendance->id,
            'student' => $attendance->student ? [
                'id' => $attendance->student->id,
                'name' => $attendance->student->name,
                'email' => $attendance->student->email,
                'student_id' => $attendance->student->student_id ?? null,
            ] : null,
            'status' => $attendance->status,
            'status_label' => $this->getStatusLabel($attendance->status),
            'check_in_time' => $attendance->check_in_time,   // Sudah format H:i
            'check_out_time' => $attendance->check_out_time, // Sudah format H:i
            'duration_minutes' => $attendance->duration_minutes,
            'formatted_duration' => $this->formatDuration($attendance->duration_minutes),
            'is_late' => $attendance->is_late ?? false,
            'late_minutes' => $attendance->late_minutes,
            'formatted_late_time' => $this->formatDuration($attendance->late_minutes),
            'participation_score' => $attendance->participation_score,
            'participation_notes' => $attendance->participation_notes,
            'notes' => $attendance->notes,
            'student_notes' => $attendance->student_notes,
            'marked_by' => $attendance->markedBy ? [
                'id' => $attendance->markedBy->id,
                'name' => $attendance->markedBy->name,
                'email' => $attendance->markedBy->email,
            ] : null,
            'marked_at' => $attendance->marked_at ? $attendance->marked_at->format('Y-m-d H:i:s') : null,
            'additional_notes' => $attendance->additionalNotes ? $attendance->additionalNotes->map(function ($note) {
                return [
                    'id' => $note->id,
                    'type' => $note->type,
                    'content' => $note->content,
                    'is_private' => $note->is_private,
                    'creator' => $note->creator ? [
                        'id' => $note->creator->id,
                        'name' => $note->creator->name,
                        'email' => $note->creator->email,
                    ] : null,
                    'noted_at' => $note->noted_at ? $note->noted_at->format('Y-m-d H:i:s') : null,
                    'created_at' => $note->created_at ? $note->created_at->format('Y-m-d H:i:s') : null,
                    'updated_at' => $note->updated_at ? $note->updated_at->format('Y-m-d H:i:s') : null,
                ];
            }) : [],
            'created_at' => $attendance->created_at ? $attendance->created_at->format('Y-m-d H:i:s') : null,
            'updated_at' => $attendance->updated_at ? $attendance->updated_at->format('Y-m-d H:i:s') : null,
        ];
    }

    /**
     * Helper method to get status label
     */
    private function getStatusLabel($status)
    {
        $labels = [
            'present' => 'Hadir',
            'absent' => 'Tidak Hadir',
            'late' => 'Terlambat',
            'excused' => 'Izin',
            'sick' => 'Sakit',
            'permit' => 'Izin Khusus',
        ];

        return $labels[$status] ?? $status;
    }

    /**
     * Helper method to format duration
     */
    private function formatDuration($minutes)
    {
        if (!$minutes) return null;

        $hours = floor($minutes / 60);
        $mins = $minutes % 60;

        if ($hours > 0) {
            return $hours . 'j ' . $mins . 'm';
        }
        return $mins . 'm';
    }

    /**
     * Add note to attendance
     */
    public function addAttendanceNote(Request $request, $code, $attendanceId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            $attendance = ClassroomAttendance::whereHas('meeting', function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })->findOrFail($attendanceId);

            $validator = Validator::make($request->all(), [
                'type' => 'required|in:teacher_note,student_note,parent_note,admin_note',
                'content' => 'required|string',
                'is_private' => 'nullable|in:true,false,1,0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data tidak valid',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $note = ClassroomAttendanceNote::create([
                'attendance_id' => $attendance->id,
                'created_by' => Auth::id(),
                'type' => $request->type,
                'content' => $request->content,
                'is_private' => $request->boolean('is_private'),
                'noted_at' => now(),
            ]);

            $note->load('creator:id,name,email');

            return response()->json([
                'status' => 'success',
                'message' => 'Catatan berhasil ditambahkan',
                'data' => [
                    'id' => $note->id,
                    'type' => $note->type,
                    'content' => $note->content,
                    'is_private' => $note->is_private,
                    'creator' => [
                        'id' => $note->creator->id,
                        'name' => $note->creator->name,
                        'email' => $note->creator->email,
                    ],
                    'noted_at' => $note->noted_at,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menambahkan catatan',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Update attendance note (NEW)
     */
    public function updateAttendanceNote(Request $request, $code, $attendanceId, $noteId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            $attendance = ClassroomAttendance::whereHas('meeting', function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })->findOrFail($attendanceId);

            $note = ClassroomAttendanceNote::where('attendance_id', $attendance->id)
                ->findOrFail($noteId);

            $validator = Validator::make($request->all(), [
                'type' => 'sometimes|required|in:teacher_note,student_note,parent_note,admin_note',
                'content' => 'sometimes|required|string',
                'is_private' => 'nullable|in:true,false,1,0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data tidak valid',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $note->update([
                'type' => $request->type ?? $note->type,
                'content' => $request->content ?? $note->content,
                'is_private' => $request->has('is_private') ? $request->boolean('is_private') : $note->is_private,
            ]);

            $note->load('creator:id,name,email');

            return response()->json([
                'status' => 'success',
                'message' => 'Catatan berhasil diperbarui',
                'data' => [
                    'id' => $note->id,
                    'type' => $note->type,
                    'content' => $note->content,
                    'is_private' => $note->is_private,
                    'creator' => [
                        'id' => $note->creator->id,
                        'name' => $note->creator->name,
                        'email' => $note->creator->email,
                    ],
                    'noted_at' => $note->noted_at,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memperbarui catatan',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Delete attendance note (NEW)
     */
    public function deleteAttendanceNote($code, $attendanceId, $noteId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            $attendance = ClassroomAttendance::whereHas('meeting', function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })->findOrFail($attendanceId);

            $note = ClassroomAttendanceNote::where('attendance_id', $attendance->id)
                ->findOrFail($noteId);

            $note->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Catatan berhasil dihapus',
                'data' => [
                    'id' => $noteId,
                    'deleted_at' => now(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus catatan',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get attendance notes (NEW)
     */
    public function getAttendanceNotes(Request $request, $code, $attendanceId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            $attendance = ClassroomAttendance::whereHas('meeting', function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })->findOrFail($attendanceId);

            $notes = ClassroomAttendanceNote::where('attendance_id', $attendance->id)
                ->with('creator:id,name,email')
                ->orderBy('created_at', 'asc')
                ->get();

            $transformedNotes = $notes->map(function ($note) {
                return [
                    'id' => $note->id,
                    'type' => $note->type,
                    'content' => $note->content,
                    'is_private' => $note->is_private,
                    'creator' => [
                        'id' => $note->creator->id,
                        'name' => $note->creator->name,
                        'email' => $note->creator->email,
                    ],
                    'noted_at' => $note->noted_at,
                    'created_at' => $note->created_at,
                    'updated_at' => $note->updated_at,
                ];
            });

            return response()->json([
                'status' => 'success',
                'message' => 'Catatan kehadiran berhasil diambil',
                'data' => $transformedNotes
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil catatan kehadiran',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get attendance statistics for classroom
     */
    public function getAttendanceStatistics($code)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            $studentId = auth()->user()->hasRole('user') ? auth()->user()->student_id : null;

            // Total & completed meetings (tetap dihitung semua meeting di kelas ini)
            $totalMeetings = ClassroomMeeting::where('classroom_id', $classroom->id)->count();
            $completedMeetings = ClassroomMeeting::where('classroom_id', $classroom->id)
                ->where('status', 'completed')
                ->count();

            // Attendance stats (dibatasi jika role = user)
            $attendanceStats = ClassroomAttendance::whereHas('meeting', function ($query) use ($classroom) {
                    $query->where('classroom_id', $classroom->id);
                })
                ->when($studentId, fn($q) => $q->where('student_id', $studentId))
                ->selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->get();

            // Recent meetings with stats
            $recentMeetings = ClassroomMeeting::where('classroom_id', $classroom->id)
                ->withCount([
                    'attendances as attendances_count' => function ($q) use ($studentId) {
                        if ($studentId) {
                            $q->where('student_id', $studentId);
                        }
                    },
                    'attendances as present_count' => function ($q) use ($studentId) {
                        if ($studentId) {
                            $q->where('student_id', $studentId);
                        }
                        $q->whereIn('status', ['present', 'late']);
                    },
                ])
                ->orderBy('meeting_date', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($meeting) {
                    $attendancePercentage = $meeting->attendances_count > 0
                        ? round(($meeting->present_count / $meeting->attendances_count) * 100, 2)
                        : 0;

                    return [
                        'id' => $meeting->id,
                        'title' => $meeting->title,
                        'meeting_date' => $meeting->meeting_date,
                        'attendance_percentage' => $attendancePercentage,
                        'present_count' => $meeting->present_count,
                        'total_count' => $meeting->attendances_count,
                    ];
                });

            // Top students (skip kalau role = user, karena tidak relevan)
            $topStudents = [];
            if (!$studentId) {
                $topStudents = ClassroomAttendance::whereHas('meeting', function ($query) use ($classroom) {
                        $query->where('classroom_id', $classroom->id);
                    })
                    ->with('student:id,name,email')
                    ->selectRaw('
                        student_id,
                        COUNT(*) as total_meetings,
                        SUM(CASE WHEN status IN ("present", "late") THEN 1 ELSE 0 END) as present_count
                    ')
                    ->groupBy('student_id')
                    ->havingRaw('total_meetings > 0')
                    ->orderByRaw('(present_count / total_meetings) DESC')
                    ->limit(10)
                    ->get()
                    ->map(function ($item) {
                        return [
                            'student' => [
                                'id' => $item->student->id,
                                'name' => $item->student->name,
                                'email' => $item->student->email,
                            ],
                            'total_meetings' => $item->total_meetings,
                            'present_count' => $item->present_count,
                            'attendance_percentage' => round(($item->present_count / $item->total_meetings) * 100, 2),
                        ];
                    });
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Statistik kehadiran berhasil diambil',
                'data' => [
                    'overview' => [
                        'total_meetings' => $totalMeetings,
                        'completed_meetings' => $completedMeetings,
                        'total_students' => $classroom->students()->count(),
                    ],
                    'attendance_breakdown' => $attendanceStats,
                    'recent_meetings' => $recentMeetings,
                    'top_students' => $topStudents,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil statistik kehadiran',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
    /**
     * Get student attendance summary
     */
    public function getStudentAttendanceSummary($code, $studentId, Request $request)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            // Verify student is in classroom
            if (!$classroom->students()->where('users.id', $studentId)->exists()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Siswa tidak terdaftar di kelas ini'
                ], 403);
            }

            $year = $request->input('year', date('Y'));
            $month = $request->input('month');

            $query = ClassroomAttendance::where('student_id', $studentId)
                ->whereHas('meeting', function ($q) use ($classroom, $year, $month) {
                    $q->where('classroom_id', $classroom->id)
                      ->whereYear('meeting_date', $year);

                    if ($month) {
                        $q->whereMonth('meeting_date', $month);
                    }
                });

            $attendances = $query->with(['meeting'])->get();

            // Calculate summary
            $summary = [
                'total_meetings' => $attendances->count(),
                'present_count' => $attendances->where('status', 'present')->count(),
                'absent_count' => $attendances->where('status', 'absent')->count(),
                'late_count' => $attendances->where('status', 'late')->count(),
                'excused_count' => $attendances->where('status', 'excused')->count(),
                'sick_count' => $attendances->where('status', 'sick')->count(),
                'permit_count' => $attendances->where('status', 'permit')->count(),
            ];

            $summary['attendance_percentage'] = $summary['total_meetings'] > 0
                ? round((($summary['present_count'] + $summary['late_count']) / $summary['total_meetings']) * 100, 2)
                : 0;

            $summary['punctuality_percentage'] = $summary['total_meetings'] > 0
                ? round(($summary['present_count'] / $summary['total_meetings']) * 100, 2)
                : 0;

            // Participation score average
            $participationScores = $attendances->whereNotNull('participation_score');
            $summary['average_participation_score'] = $participationScores->count() > 0
                ? round($participationScores->avg('participation_score'), 1)
                : null;

            // Detailed attendances
            $detailedAttendances = $attendances->map(function ($attendance) {
                return [
                    'id' => $attendance->id,
                    'meeting' => [
                        'id' => $attendance->meeting->id,
                        'title' => $attendance->meeting->title,
                        'meeting_date' => $attendance->meeting->meeting_date,
                        'type' => $attendance->meeting->type,
                    ],
                    'status' => $attendance->status,
                    'status_label' => $this->getStatusLabel($attendance->status),
                    'check_in_time' => $attendance->check_in_time,
                    'is_late' => $attendance->is_late,
                    'late_minutes' => $attendance->late_minutes,
                    'participation_score' => $attendance->participation_score,
                    'notes' => $attendance->notes,
                ];
            });

            return response()->json([
                'status' => 'success',
                'message' => 'Ringkasan kehadiran siswa berhasil diambil',
                'data' => [
                    'summary' => $summary,
                    'attendances' => $detailedAttendances,
                    'period' => [
                        'year' => $year,
                        'month' => $month,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil ringkasan kehadiran siswa',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
    public function deleteIndividualAttendance($code, $attendanceId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();

            $attendance = ClassroomAttendance::whereHas('meeting', function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })->findOrFail($attendanceId);

            DB::beginTransaction();

            // Delete related notes first
            ClassroomAttendanceNote::where('attendance_id', $attendance->id)->delete();

            // Delete the attendance record
            $meeting = $attendance->meeting;
            $attendance->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Data kehadiran berhasil dihapus',
                'data' => [
                    'id' => $attendanceId,
                    'meeting_id' => $meeting->id,
                    'deleted_at' => now(),
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus data kehadiran',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
    public function updateAttendanceList(Request $request, $code, $meetingId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();
            $meeting = ClassroomMeeting::where('classroom_id', $classroom->id)
                ->findOrFail($meetingId);

            $validator = Validator::make($request->all(), [
                'add_students' => 'nullable|array',
                'add_students.*.id' => 'required_with:add_students|exists:users,id',
                'add_students.*.name' => 'required_with:add_students|string',
                'add_students.*.email' => 'required_with:add_students|email',
                'remove_student_ids' => 'nullable|array',
                'remove_student_ids.*' => 'exists:users,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data tidak valid',
                    'errors' => $validator->errors(),
                ], 422);
            }

            DB::beginTransaction();

            $changes = [
                'added' => 0,
                'removed' => 0,
            ];

            // Remove students
            if (!empty($request->remove_student_ids)) {
                $removedAttendances = ClassroomAttendance::where('meeting_id', $meeting->id)
                    ->whereIn('student_id', $request->remove_student_ids)
                    ->get();

                foreach ($removedAttendances as $attendance) {
                    // Delete notes first
                    ClassroomAttendanceNote::where('attendance_id', $attendance->id)->delete();
                    // Delete attendance
                    $attendance->delete();
                    $changes['removed']++;
                }
            }

            // Add new students
            if (!empty($request->add_students)) {
                foreach ($request->add_students as $studentData) {
                    // Check if attendance already exists
                    $existingAttendance = ClassroomAttendance::where('meeting_id', $meeting->id)
                        ->where('student_id', $studentData['id'])
                        ->first();

                    if (!$existingAttendance) {
                        // Verify student is in classroom
                        $isStudentInClass = $classroom->students()
                            ->where('users.id', $studentData['id'])
                            ->exists();

                        if ($isStudentInClass) {
                            ClassroomAttendance::create([
                                'meeting_id' => $meeting->id,
                                'student_id' => $studentData['id'],
                                'status' => 'absent', // Default status
                                'marked_by' => Auth::id(),
                                'marked_at' => now(),
                            ]);
                            $changes['added']++;
                        }
                    }
                }
            }

            DB::commit();

            // Load updated meeting with all relations
            $meeting->load([
                'creator:id,name,email',
                'attendances.student:id,name,email',
                'attendances.markedBy:id,name,email',
                'attendances.additionalNotes.creator:id,name,email'
            ]);

            $message = [];
            if ($changes['added'] > 0) {
                $message[] = "Ditambahkan {$changes['added']} siswa";
            }
            if ($changes['removed'] > 0) {
                $message[] = "Dihapus {$changes['removed']} siswa";
            }

            $finalMessage = !empty($message)
                ? 'Daftar kehadiran berhasil diperbarui: ' . implode(', ', $message)
                : 'Tidak ada perubahan pada daftar kehadiran';

            return response()->json([
                'status' => 'success',
                'message' => $finalMessage,
                'data' => $this->transformMeetingData($meeting),
                'changes' => $changes
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memperbarui daftar kehadiran',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
    public function getAvailableStudents($code, $meetingId)
    {
        try {
            $classroom = Classroom::where('code', $code)->firstOrFail();
            $meeting = ClassroomMeeting::where('classroom_id', $classroom->id)
                ->findOrFail($meetingId);

            // Get students already in this meeting's attendance
            $attendedStudentIds = ClassroomAttendance::where('meeting_id', $meeting->id)
                ->pluck('student_id')
                ->toArray();

            // Get all active students in classroom who are NOT in attendance yet
            $availableStudents = $classroom->students()
                ->wherePivot('status', 'active')
                ->whereNotIn('users.id', $attendedStudentIds)
                ->select('users.id', 'users.name', 'users.email', 'users.student_id')
                ->get()
                ->map(function ($student) {
                    return [
                        'id' => $student->id,
                        'name' => $student->name,
                        'email' => $student->email,
                        'student_id' => $student->student_id,
                    ];
                });

            return response()->json([
                'status' => 'success',
                'message' => 'Daftar siswa yang tersedia berhasil diambil',
                'data' => $availableStudents
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil daftar siswa yang tersedia',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
    public function bulkUpdateAttendance(Request $request, $code, $meetingId)
    {
      \Log::info('Bulk update request received', [
        'all' => $request->all(),
        'action' => $request->input('action'),
        'student_ids' => $request->input('student_ids'),
    ]);
        try {
            // 1. Extract validation to a separate method or FormRequest
            $validated = $this->validateBulkAttendanceRequest($request);

            // 2. Use findOrFail more efficiently with relationship
            $meeting = ClassroomMeeting::whereHas('classroom', function ($query) use ($code) {
                $query->where('code', $code);
            })->findOrFail($meetingId);

            DB::beginTransaction();

            // 3. Extract status mapping to a class constant or config
            $status = $this->getAttendanceStatus($validated['action']);

            // 4. Process attendance updates
            $results = $this->processAttendanceUpdates(
                $meeting,
                $validated['student_ids'],
                $status,
                $validated
            );

            DB::commit();

            // 5. Eager load relationships more efficiently
            $meeting->load($this->getAttendanceRelations());

            return response()->json([
                'status' => 'success',
                'message' => "Berhasil memperbarui kehadiran {$results['updated']} siswa menjadi {$status}",
                'data' => $this->transformMeetingData($meeting)
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kelas atau pertemuan tidak ditemukan'
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Data tidak valid',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollback();
            \Log::error('Bulk attendance update failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal melakukan bulk update kehadiran',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
    * Validate bulk attendance request
    */
    private function validateBulkAttendanceRequest(Request $request): array
    {
        return $request->validate([
            'action' => 'required|in:mark_present,mark_absent,mark_late,mark_excused',
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'required|exists:users,id',
            'check_in_time' => 'nullable|date_format:H:i',
            'notes' => 'nullable|string|max:500',
        ]);
    }

    /**
    * Map action to attendance status
    */
    private function getAttendanceStatus(string $action): string
    {
        return match($action) {
            'mark_present' => 'present',
            'mark_absent' => 'absent',
            'mark_late' => 'late',
            'mark_excused' => 'excused',
        };
    }

    /**
    * Process attendance updates for multiple students
    */
    private function processAttendanceUpdates(
        ClassroomMeeting $meeting,
        array $studentIds,
        string $status,
        array $validated
    ): array {
        $updatedCount = 0;
        $meetingDate = Carbon::parse($meeting->meeting_date)->startOfDay();

        // Bulk fetch existing attendances
        $existingAttendances = ClassroomAttendance::where('meeting_id', $meeting->id)
            ->whereIn('student_id', $studentIds)
            ->get()
            ->keyBy('student_id');

        $toInsert = [];
        $toUpdate = [];

        foreach ($studentIds as $studentId) {
            $attendance = $existingAttendances->get($studentId);
            $attendanceData = $this->prepareAttendanceData(
                $meeting,
                $status,
                $validated,
                $meetingDate,
                $attendance
            );

            if (!$attendance) {
                $toInsert[] = array_merge($attendanceData, [
                    'meeting_id' => $meeting->id,
                    'student_id' => $studentId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                // Only update modified fields for existing records
                $toUpdate[$studentId] = array_filter($attendanceData, function($value) {
                    return $value !== null;
                });
            }

            $updatedCount++;
        }

        // Bulk insert new attendances
        if (!empty($toInsert)) {
            ClassroomAttendance::insert($toInsert);
        }

        // Update existing attendances using batch update
        if (!empty($toUpdate)) {
            foreach ($toUpdate as $studentId => $data) {
                if (!empty($data)) {
                    ClassroomAttendance::where('meeting_id', $meeting->id)
                        ->where('student_id', $studentId)
                        ->update($data);
                }
            }
        }

        return ['updated' => $updatedCount];
    }

    /**
    * Prepare attendance data for insert/update
    */
    private function prepareAttendanceData(
        ClassroomMeeting $meeting,
        string $status,
        array $validated,
        Carbon $meetingDate,
        ?ClassroomAttendance $existingAttendance
    ): array {
        $data = [
            'status' => $status,
            'marked_by' => Auth::id(),
            'marked_at' => now(),
        ];

        // Handle check-in time
        if (!empty($validated['check_in_time'])) {
            $checkInTime = $meetingDate->copy()
                ->setTimeFrom(Carbon::createFromFormat('H:i', $validated['check_in_time']));
            $data['check_in_time'] = $checkInTime;

            // Calculate late status
            if ($status === 'late' && $meeting->start_time) {
                $startTime = Carbon::parse($meeting->start_time);
                $data['is_late'] = $checkInTime->gt($startTime);
                $data['late_minutes'] = $data['is_late']
                    ? $checkInTime->diffInMinutes($startTime)
                    : null;
            }
        } elseif (!$existingAttendance) {
            // For new records without check_in_time
            $data['check_in_time'] = null;
        }

        // Add notes if provided
        if (!empty($validated['notes'])) {
            $data['notes'] = $validated['notes'];
        }

        return $data;
    }

    /**
    * Get relations to eager load for attendance
    */
    private function getAttendanceRelations(): array
    {
        return [
            'creator:id,name,email',
            'attendances.student:id,name,email',
            'attendances.markedBy:id,name,email',
            'attendances.additionalNotes.creator:id,name,email'
        ];
    }
}
