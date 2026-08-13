<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class ClassroomAssignment extends Model
{
    use HasFactory;

    protected $table = 'classroom_assignments';

    protected $fillable = [
        'classroom_id',
        'uploaded_by',
        'title',
        'description',
        'type',
        'is_visible',
        'available_from',
        'available_until',
        'metadata'
    ];

    protected $casts = [
        'is_visible' => 'boolean',
        'available_from' => 'datetime:Y-m-d H:i:s',
        'available_until' => 'datetime:Y-m-d H:i:s',
        'metadata' => 'array',
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'datetime:Y-m-d H:i:s'
    ];

    // Relationship with classroom
    public function classroom()
    {
        return $this->belongsTo(Classroom::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // Relationship with user who created the assignment
    public function creator()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // Relationship with assignment files
    public function files()
    {
        return $this->hasMany(ClassroomAssignmentFile::class, 'assignment_id');
    }

    // Relationship with submissions
    public function submissions()
    {
        return $this->hasMany(ClassroomAssignmentSubmission::class, 'assignment_id')
                    ->where('type', $this->type);
    }

    // Get submitted submissions count
    public function getSubmittedCountAttribute()
    {
        return $this->submissions()->where('status', '!=', 'draft')->count();
    }

    // Get graded submissions count
    public function getGradedCountAttribute()
    {
        return $this->submissions()->where('status', 'graded')->count();
    }

    // Get total students in classroom
    public function getTotalStudentsAttribute()
    {
        return $this->classroom->students()->count();
    }

    // Helper method to format file size
    protected function formatFileSize($bytes)
    {
        if ($bytes == 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    // FIXED: Enhanced availability check with proper date formatting
    public function getIsAvailableAttribute()
    {
        // Jika tidak visible, otomatis false
        $user = auth()->user();
        if($user->hasRole('user'))
            {

                if (!$this->is_visible) {
                    return false;
                }

                // Waktu sekarang
                $now = now();

                // Cek apakah assignment belum tersedia (available_from)
                if ($this->available_from && $now->lt(Carbon::parse($this->available_from))) {
                    return false;
                }

                // Jika ingin pakai available_until juga, bisa aktifkan:
                    // if ($this->available_until && $now->gt(Carbon::parse($this->available_until))) {
            //     return false;
            // }

            // Jika lolos semua kondisi, dianggap available
        }
        return true;
    }

    // FIXED: Enhanced submission availability check
    public function getCanSubmitAttribute()
    {
        // if (!$this->is_available) {
        //     return false;
        // }

        $now = now();

        // Check available_until first (main deadline)
        if ($this->available_until && $now->gt(Carbon::parse($this->available_until))) {
            // Check if late submission is allowed from metadata
            return $this->metadata['allow_late_submission'] ?? false;
        }

        // Check metadata due_date as secondary deadline
        if (isset($this->metadata['due_date'])) {
            $dueDate = Carbon::parse($this->metadata['due_date']);
            if ($now->gt($dueDate)) {
                return $this->metadata['allow_late_submission'] ?? false;
            }
        }

        return true;
    }

    // FIXED: Enhanced late submission check
    public function getIsLateSubmissionAttribute()
    {
        $now = now();

        // Check against available_until first
        if ($this->available_until && $now->gt(Carbon::parse($this->available_until))) {
            return true;
        }

        // Check against metadata due_date as secondary check
        if (isset($this->metadata['due_date'])) {
            $dueDate = Carbon::parse($this->metadata['due_date']);
            if ($now->gt($dueDate)) {
                return true;
            }
        }

        return false;
    }

    // NEW: Get formatted availability period
    public function getAvailabilityPeriodAttribute()
    {
        $period = [];

        if ($this->available_from) {
            $period['from'] = Carbon::parse($this->available_from)->format('Y-m-d H:i:s');
            $period['from_formatted'] = Carbon::parse($this->available_from)->format('d M Y, H:i');
        }

        if ($this->available_until) {
            $period['until'] = Carbon::parse($this->available_until)->format('Y-m-d H:i:s');
            $period['until_formatted'] = Carbon::parse($this->available_until)->format('d M Y, H:i');
        }

        return $period;
    }

    // NEW: Get time remaining until deadline
    public function getTimeRemainingAttribute()
    {
        $now = now();
        $deadline = null;

        // Use available_until as primary deadline
        if ($this->available_until) {
            $deadline = Carbon::parse($this->available_until);
        } elseif (isset($this->metadata['due_date'])) {
            $deadline = Carbon::parse($this->metadata['due_date']);
        }

        if (!$deadline) {
            return null;
        }

        if ($now->gt($deadline)) {
            return [
                'status' => 'expired',
                'message' => 'Deadline terlewat',
                'diff' => $now->diffForHumans($deadline)
            ];
        }

        return [
            'status' => 'active',
            'message' => 'Tersisa',
            'diff' => $now->diffForHumans($deadline, true),
            'exact_diff' => $now->diff($deadline)
        ];
    }

    // Get submission for specific student
    public function getSubmissionForStudent($studentId)
    {
        return $this->submissions()
                    ->where('student_id', $studentId)
                    ->where('type', $this->type)
                    ->first();
    }

    // Scope for visible assignments
    public function scopeVisible($query)
    {
        return $query->where('is_visible', true);
    }

    // FIXED: Enhanced available scope with proper date handling
   public function scopeAvailable($query)
    {
        $user = auth()->user();

        // Teachers/admins see all
        if ($user && $user->hasRole(['teacher', 'administrator', 'super admin'])) {
            return $query;
        }

        // Students/guests → hanya visible dan available
        return $query->where('is_visible', true)
                    ->where(function($q) {
                        $q->whereNull('available_from')
                        ->orWhere('available_from', '<=', now());
                    })
                    ->where(function($q) {
                        $q->whereNull('available_until')
                        ->orWhere('available_until', '>=', now());
                    });
    }


    // Scope for filtering by type
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    // Scope for searching
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%");
        });
    }

    // FIXED: Enhanced scope for date range filtering
    public function scopeAvailableBetween($query, $startDate, $endDate)
    {
        return $query->where(function($q) use ($startDate, $endDate) {
            $q->where(function($subQ) use ($startDate, $endDate) {
                // Assignment starts within range
                $subQ->whereBetween('available_from', [$startDate, $endDate]);
            })->orWhere(function($subQ) use ($startDate, $endDate) {
                // Assignment ends within range
                $subQ->whereBetween('available_until', [$startDate, $endDate]);
            })->orWhere(function($subQ) use ($startDate, $endDate) {
                // Assignment spans the entire range
                $subQ->where('available_from', '<=', $startDate)
                     ->where('available_until', '>=', $endDate);
            });
        });
    }

    // Relationship to questions
    public function questions()
    {
        return $this->hasMany(ClassroomAssignmentQuestion::class, 'assignment_id')
                    ->ordered();
    }

    // FIXED: Mutator for available_from to ensure proper formatting
    public function setAvailableFromAttribute($value)
    {
        if ($value) {
            $this->attributes['available_from'] = Carbon::parse($value)->format('Y-m-d H:i:s');
        } else {
            $this->attributes['available_from'] = null;
        }
    }

    // FIXED: Mutator for available_until to ensure proper formatting
    public function setAvailableUntilAttribute($value)
    {
        if ($value) {
            $this->attributes['available_until'] = Carbon::parse($value)->format('Y-m-d H:i:s');
        } else {
            $this->attributes['available_until'] = null;
        }
    }

    // FIXED: Accessor for available_from with consistent formatting
    public function getAvailableFromAttribute($value)
    {
        if ($value) {
            return Carbon::parse($value)->format('Y-m-d H:i:s');
        }
        return null;
    }

    // FIXED: Accessor for available_until with consistent formatting
    public function getAvailableUntilAttribute($value)
    {
        if ($value) {
            return Carbon::parse($value)->format('Y-m-d H:i:s');
        }
        return null;
    }
}
