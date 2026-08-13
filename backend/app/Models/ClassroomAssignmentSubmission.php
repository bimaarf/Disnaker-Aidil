<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassroomAssignmentSubmission extends Model
{
    use HasFactory;

    protected $table = 'classroom_assignment_submissions';

    protected $fillable = [
        'assignment_id',
        'type',
        'student_id',
        'submission_text',
        'status',
        'submitted_at',
        'graded_at',
        'points',
        'max_points',
        'teacher_feedback',
        'graded_by',
        'is_late',
        'metadata'
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'graded_at' => 'datetime',
        'points' => 'integer',
        'max_points' => 'integer',
        'is_late' => 'boolean',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationship with assignment
    public function assignment()
    {
        return $this->belongsTo(ClassroomAssignment::class, 'assignment_id');
    }

    // Relationship with student
    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    // Relationship with teacher who graded
    public function grader()
    {
        return $this->belongsTo(User::class, 'graded_by');
    }

    // Relationship with submission files
    public function files()
    {
        return $this->hasMany(ClassroomAssignmentSubmissionFile::class, 'submission_id');
    }

    // Get active files only
    public function activeFiles()
    {
        return $this->hasMany(ClassroomAssignmentSubmissionFile::class, 'submission_id')
                    ->where('is_active', true);
    }

    // Accessor for file URLs
    public function getFileUrlsAttribute()
    {
        return $this->activeFiles->map(function ($file) {
            return [
                'id' => $file->id,
                'original_name' => $file->original_name,
                'path' => route('submissions.files.show', [
                    'classroomId' => $this->assignment->classroom_id,
                    'submissionId' => $this->id,
                    'fileId' => $file->id
                ]),
                'size' => $this->formatFileSize($file->file_size ?? 0),
                'type' => $file->file_type,
                'mime_type' => $file->mime_type,
                'uploaded_at' => $file->uploaded_at,
            ];
        })->toArray();
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

    // Calculate percentage points
    public function getPercentageScoreAttribute()
    {
        if (!$this->points || !$this->max_points || $this->max_points == 0) {
            return null;
        }

        return round(($this->points / $this->max_points) * 100, 2);
    }

    // Get grade letter based on percentage
    public function getGradeLetterAttribute()
    {
        $percentage = $this->percentage_points;

        if ($percentage === null) {
            return null;
        }

        if ($percentage >= 90) return 'A';
        if ($percentage >= 80) return 'B';
        if ($percentage >= 70) return 'C';
        if ($percentage >= 60) return 'D';
        return 'F';
    }

    // Check if submission can be edited
    public function getCanEditAttribute()
    {
        return in_array($this->status, ['draft']) && $this->assignment->can_submit;
    }

    // Mark as submitted
    public function markAsSubmitted()
    {
        $this->update([
            'status' => 'submitted',
            'submitted_at' => now(),
            'is_late' => $this->assignment->is_late_submission
        ]);
    }

    // Grade the submission
    public function grade($points, $maxScore, $feedback = null, $graderId = null)
    {
        $this->update([
            'status' => 'graded',
            'points' => $points,
            'max_points' => $maxScore,
            'teacher_feedback' => $feedback,
            'graded_by' => $graderId,
            'graded_at' => now()
        ]);
    }

    // Scope for filtering by status
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    // Scope for submitted submissions
    public function scopeSubmitted($query)
    {
        return $query->where('status', '!=', 'draft');
    }

    // Scope for graded submissions
    public function scopeGraded($query)
    {
        return $query->where('status', 'graded');
    }

    // Scope for late submissions
    public function scopeLate($query)
    {
        return $query->where('is_late', true);
    }
    public function gradedBy()
    {
        return $this->belongsTo(User::class, 'graded_by');
    }
        // Scope for filtering by assignment type
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }


}
