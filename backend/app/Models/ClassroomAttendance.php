<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

// ===================== CLASSROOM ATTENDANCE MODEL =====================
class ClassroomAttendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_id',
        'student_id',
        'status',
        'check_in_time',
        'check_out_time',
        'notes',
        'student_notes',
        'marked_by',
        'marked_at',
        'is_late',
        'late_minutes',
        'participation_score',
        'participation_notes',
        'metadata',
        'duration_minutes'
    ];

    protected $casts = [
        'check_in_time' => 'string',  // Simpan sebagai string H:i
        'check_out_time' => 'string', // Simpan sebagai string H:i
        'marked_at' => 'datetime:Y-m-d H:i:s',
        'is_late' => 'boolean',
        'participation_score' => 'decimal:1',
        'metadata' => 'array',
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'datetime:Y-m-d H:i:s'
    ];

    protected $appends = [
        'duration_minutes_calculated',
        'status_label',
        'is_present',
        'formatted_check_in_time',
        'formatted_check_out_time',
        'check_in_datetime',
        'check_out_datetime'
    ];

    // Relationships
    public function meeting(): BelongsTo
    {
        return $this->belongsTo(ClassroomMeeting::class, 'meeting_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function markedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'marked_by');
    }

    public function additionalNotes(): HasMany
    {
        return $this->hasMany(ClassroomAttendanceNote::class, 'attendance_id');
    }

    // Accessor untuk format waktu konsisten
    public function getFormattedCheckInTimeAttribute()
    {
        return $this->check_in_time ? $this->check_in_time : null;
    }

    public function getFormattedCheckOutTimeAttribute()
    {
        return $this->check_out_time ? $this->check_out_time : null;
    }

    // Accessor untuk datetime lengkap (untuk perhitungan)
    public function getCheckInDatetimeAttribute()
    {
        if (!$this->check_in_time || !$this->meeting) return null;

        $meeting = $this->meeting;
        $meetingDate = $meeting->meeting_date->format('Y-m-d');

        return Carbon::parse($meetingDate . ' ' . $this->check_in_time);
    }

    public function getCheckOutDatetimeAttribute()
    {
        if (!$this->check_out_time || !$this->meeting) return null;

        $meeting = $this->meeting;
        $meetingDate = $meeting->meeting_date->format('Y-m-d');
        $datetime = Carbon::parse($meetingDate . ' ' . $this->check_out_time);

        // Jika check_out_time lebih kecil dari check_in_time, tambah 1 hari
        if ($this->check_in_datetime && $datetime->lt($this->check_in_datetime)) {
            $datetime->addDay();
        }

        return $datetime;
    }

    // Accessors
    public function getDurationMinutesCalculatedAttribute()
    {
        if (!$this->check_in_datetime || !$this->check_out_datetime) {
            return $this->duration_minutes; // Return stored value if available
        }

        return $this->check_out_datetime->diffInMinutes($this->check_in_datetime);
    }

    public function getStatusLabelAttribute()
    {
        $labels = [
            'present' => 'Hadir',
            'absent' => 'Tidak Hadir',
            'late' => 'Terlambat',
            'excused' => 'Izin',
            'sick' => 'Sakit',
            'permit' => 'Cuti'
        ];

        return $labels[$this->status] ?? $this->status;
    }

    public function getIsPresentAttribute()
    {
        return in_array($this->status, ['present', 'late']);
    }

    // Mutator untuk handling input time
    public function setCheckInTimeAttribute($value)
    {
        if (is_null($value)) {
            $this->attributes['check_in_time'] = null;
            return;
        }

        // Jika input berupa datetime, extract time-nya
        if (strpos($value, 'T') !== false || strpos($value, ' ') !== false) {
            $carbon = Carbon::parse($value);
            $this->attributes['check_in_time'] = $carbon->format('H:i');
        } else {
            // Jika sudah format H:i atau H:i:s
            $time = Carbon::createFromFormat('H:i', substr($value, 0, 5));
            $this->attributes['check_in_time'] = $time->format('H:i');
        }
    }

    public function setCheckOutTimeAttribute($value)
    {
        if (is_null($value)) {
            $this->attributes['check_out_time'] = null;
            return;
        }

        // Jika input berupa datetime, extract time-nya
        if (strpos($value, 'T') !== false || strpos($value, ' ') !== false) {
            $carbon = Carbon::parse($value);
            $this->attributes['check_out_time'] = $carbon->format('H:i');
        } else {
            // Jika sudah format H:i atau H:i:s
            $time = Carbon::createFromFormat('H:i', substr($value, 0, 5));
            $this->attributes['check_out_time'] = $time->format('H:i');
        }
    }

    // Method untuk menghitung durasi dan late status
    public function calculateDurationAndLateness()
    {
        $updates = [];

        // Calculate duration
        if ($this->check_in_datetime && $this->check_out_datetime) {
            $updates['duration_minutes'] = $this->check_out_datetime->diffInMinutes($this->check_in_datetime);
        }

        // Calculate late status
        if ($this->check_in_datetime && $this->meeting && $this->meeting->start_time) {
            $meetingStartTime = Carbon::parse($this->meeting->meeting_date->format('Y-m-d') . ' ' . $this->meeting->start_time);
            $isLate = $this->check_in_datetime->gt($meetingStartTime);
            $lateMinutes = $isLate ? $this->check_in_datetime->diffInMinutes($meetingStartTime) : null;

            $updates['is_late'] = $isLate;
            $updates['late_minutes'] = $lateMinutes;
        }

        if (!empty($updates)) {
            $this->update($updates);
        }

        return $updates;
    }

    // Override save untuk auto-calculate duration dan lateness
    public function save(array $options = [])
    {
        $result = parent::save($options);

        // Auto calculate setelah save jika ada perubahan pada waktu
        if ($this->isDirty(['check_in_time', 'check_out_time']) || $this->wasRecentlyCreated) {
            $this->calculateDurationAndLateness();
        }

        return $result;
    }

    // Scopes
    public function scopeForMeeting($query, $meetingId)
    {
        return $query->where('meeting_id', $meetingId);
    }

    public function scopeForStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }
    public function scopeForCurrentUser($query)
    {
        if (auth()->check() && auth()->user()->hasRole('user')) {
            return $query->where('student_id', auth()->user()->student_id);
        }

        return $query;
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopePresent($query)
    {
        return $query->whereIn('status', ['present', 'late']);
    }

    public function scopeAbsent($query)
    {
        return $query->where('status', 'absent');
    }

    public function scopeLate($query)
    {
        return $query->where('status', 'late');
    }

    // Method untuk API response yang konsisten
    public function toApiArray()
    {
        return [
            'id' => $this->id,
            'student' => $this->student ? [
                'id' => $this->student->id,
                'name' => $this->student->name,
                'email' => $this->student->email,
                'student_id' => $this->student->student_id ?? null,
            ] : null,
            'status' => $this->status,
            'status_label' => $this->status_label,
            'check_in_time' => $this->formatted_check_in_time,
            'check_out_time' => $this->formatted_check_out_time,
            'duration_minutes' => $this->duration_minutes_calculated,
            'is_late' => $this->is_late,
            'late_minutes' => $this->late_minutes,
            'participation_score' => $this->participation_score,
            'participation_notes' => $this->participation_notes,
            'notes' => $this->notes,
            'student_notes' => $this->student_notes,
            'marked_by' => $this->markedBy ? [
                'id' => $this->markedBy->id,
                'name' => $this->markedBy->name,
                'email' => $this->markedBy->email,
            ] : null,
            'marked_at' => $this->marked_at ? $this->marked_at->format('Y-m-d H:i:s') : null,
            'additional_notes' => $this->additionalNotes->map(function ($note) {
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
                    'noted_at' => $note->noted_at ? $note->noted_at->format('Y-m-d H:i:s') : null,
                ];
            }),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
