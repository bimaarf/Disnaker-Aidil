<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Carbon\Carbon;

// ===================== CLASSROOM MEETING MODEL =====================
class ClassroomMeeting extends Model
{
    use HasFactory;

    protected $fillable = [
        'classroom_id',
        'created_by',
        'title',
        'description',
        'meeting_date',
        'start_time',
        'end_time',
        'status',
        'type',
        'agenda',
        'materials_covered',
        'homework_assigned',
        'notes',
        'duration_minutes',
        'location',
        'is_mandatory',
        'metadata'
    ];

    protected $casts = [
        'meeting_date' => 'date:Y-m-d',
        'start_time' => 'string', // Simpan sebagai string H:i
        'end_time' => 'string',   // Simpan sebagai string H:i
        'is_mandatory' => 'boolean',
        'metadata' => 'array',
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'datetime:Y-m-d H:i:s'
    ];

    protected $appends = [
        'attendance_count',
        'present_count',
        'absent_count',
        'attendance_percentage',
        'is_past',
        'is_today',
        'formatted_duration',
        'formatted_meeting_date',
        'formatted_start_time',
        'formatted_end_time',
        'start_datetime',
        'end_datetime'
    ];

    // Relationships
    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }


    public function attendances(): HasMany
    {
        return $this->hasMany(ClassroomAttendance::class, 'meeting_id');
    }

    public function materials(): BelongsToMany
    {
        return $this->belongsToMany(ClassroomMaterial::class, 'classroom_meeting_materials', 'meeting_id', 'material_id')
                    ->withPivot('type', 'notes', 'is_required')
                    ->withTimestamps();
    }

    // Accessor untuk jumlah kehadiran
    public function getAttendanceCountAttribute()
    {
        return $this->attendances()->count();
    }

    public function getPresentCountAttribute()
    {
        return $this->attendances()->where('status', 'present')->count();
    }

    public function getAbsentCountAttribute()
    {
        return $this->attendances()->whereIn('status', ['absent', 'late'])->count();
    }

    public function getAttendancePercentageAttribute()
    {
        $total = $this->attendance_count;
        if ($total === 0) return 0;

        return round(($this->present_count / $total) * 100, 2);
    }

    public function getIsPastAttribute()
    {
        return $this->meeting_date->lt(now()->toDateString());
    }

    public function getIsTodayAttribute()
    {
        return $this->meeting_date->isToday();
    }

    public function getFormattedDurationAttribute()
    {
        if (!$this->duration_minutes) return null;

        $hours = floor($this->duration_minutes / 60);
        $minutes = $this->duration_minutes % 60;

        if ($hours > 0) {
            return $hours . 'j ' . $minutes . 'm';
        }
        return $minutes . 'm';
    }

    // Accessor untuk format tanggal konsisten
    public function getFormattedMeetingDateAttribute()
    {
        return $this->meeting_date ? $this->meeting_date->format('Y-m-d') : null;
    }

    public function getFormattedStartTimeAttribute()
    {
        return $this->start_time ? $this->start_time : null;
    }

    public function getFormattedEndTimeAttribute()
    {
        return $this->end_time ? $this->end_time : null;
    }

    // Accessor untuk datetime lengkap (untuk perhitungan)
    public function getStartDatetimeAttribute()
    {
        if (!$this->meeting_date || !$this->start_time) return null;

        return Carbon::parse($this->meeting_date->format('Y-m-d') . ' ' . $this->start_time);
    }

    public function getEndDatetimeAttribute()
    {
        if (!$this->meeting_date || !$this->end_time) return null;

        $datetime = Carbon::parse($this->meeting_date->format('Y-m-d') . ' ' . $this->end_time);

        // Jika end_time lebih kecil dari start_time, tambah 1 hari
        if ($this->start_datetime && $datetime->lt($this->start_datetime)) {
            $datetime->addDay();
        }

        return $datetime;
    }

    // Mutator untuk handling input time
    public function setStartTimeAttribute($value)
    {
        if (is_null($value)) {
            $this->attributes['start_time'] = null;
            return;
        }

        // Jika input berupa datetime, extract time-nya
        if (strpos($value, 'T') !== false || strpos($value, ' ') !== false) {
            $carbon = Carbon::parse($value);
            $this->attributes['start_time'] = $carbon->format('H:i');
        } else {
            // Jika sudah format H:i atau H:i:s
            $time = Carbon::createFromFormat('H:i', substr($value, 0, 5));
            $this->attributes['start_time'] = $time->format('H:i');
        }
    }

    public function setEndTimeAttribute($value)
    {
        if (is_null($value)) {
            $this->attributes['end_time'] = null;
            return;
        }

        // Jika input berupa datetime, extract time-nya
        if (strpos($value, 'T') !== false || strpos($value, ' ') !== false) {
            $carbon = Carbon::parse($value);
            $this->attributes['end_time'] = $carbon->format('H:i');
        } else {
            // Jika sudah format H:i atau H:i:s
            $time = Carbon::createFromFormat('H:i', substr($value, 0, 5));
            $this->attributes['end_time'] = $time->format('H:i');
        }
    }

    // Method untuk menghitung durasi otomatis
    public function calculateDuration()
    {
        if ($this->start_datetime && $this->end_datetime) {
            $this->duration_minutes = $this->end_datetime->diffInMinutes($this->start_datetime);
            return $this->duration_minutes;
        }
        return null;
    }

    // Override save untuk auto-calculate duration
    public function save(array $options = [])
    {
        // Auto calculate duration jika start_time dan end_time ada
        if ($this->start_time && $this->end_time && !$this->duration_minutes) {
            $this->calculateDuration();
        }

        return parent::save($options);
    }

    // Scopes
    public function scopeForClassroom($query, $classroomId)
    {
        return $query->where('classroom_id', $classroomId);
    }

    public function scopeForDate($query, $date)
    {
        return $query->where('meeting_date', $date);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('meeting_date', '>=', now()->toDateString())
                     ->orderBy('meeting_date', 'asc')
                     ->orderBy('start_time', 'asc');
    }

    public function scopePast($query)
    {
        return $query->where('meeting_date', '<', now()->toDateString())
                     ->orderBy('meeting_date', 'desc')
                     ->orderBy('start_time', 'desc');
    }

    public function scopeToday($query)
    {
        return $query->where('meeting_date', now()->toDateString());
    }

    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%")
              ->orWhere('location', 'like', "%{$search}%");
        });
    }

    // Helper methods
    public function canTakeAttendance()
    {
        return $this->status !== 'cancelled' && $this->meeting_date <= now()->toDateString();
    }

    public function getStudentsForAttendance()
    {
        return $this->classroom->students()
                    ->wherePivot('status', 'active')
                    ->get();
    }

    // Method untuk API response yang konsisten
    public function toApiArray()
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'meeting_date' => $this->formatted_meeting_date,
            'start_time' => $this->formatted_start_time,
            'end_time' => $this->formatted_end_time,
            'status' => $this->status,
            'type' => $this->type,
            'location' => $this->location,
            'is_mandatory' => $this->is_mandatory,
            'agenda' => $this->agenda,
            'materials_covered' => $this->materials_covered,
            'homework_assigned' => $this->homework_assigned,
            'notes' => $this->notes,
            'duration_minutes' => $this->duration_minutes,
            'formatted_duration' => $this->formatted_duration,
            'is_past' => $this->is_past,
            'is_today' => $this->is_today,
            'attendance_count' => $this->attendance_count,
            'present_count' => $this->present_count,
            'absent_count' => $this->absent_count,
            'attendance_percentage' => $this->attendance_percentage,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
