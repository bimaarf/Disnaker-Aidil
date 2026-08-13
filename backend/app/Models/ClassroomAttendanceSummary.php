<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Carbon\Carbon;
class ClassroomAttendanceSummary extends Model
{
    use HasFactory;

    protected $table = 'classroom_attendance_summary';

    protected $fillable = [
        'classroom_id',
        'student_id',
        'year',
        'month',
        'total_meetings',
        'present_count',
        'absent_count',
        'late_count',
        'excused_count',
        'sick_count',
        'permit_count',
        'attendance_percentage',
        'punctuality_percentage',
        'average_participation_score',
        'last_calculated'
    ];

    protected $casts = [
        'attendance_percentage' => 'decimal:2',
        'punctuality_percentage' => 'decimal:2',
        'average_participation_score' => 'decimal:1',
        'last_calculated' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationships
    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    // Scopes
    public function scopeForClassroom($query, $classroomId)
    {
        return $query->where('classroom_id', $classroomId);
    }

    public function scopeForStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeForMonth($query, $year, $month)
    {
        return $query->where('year', $year)->where('month', $month);
    }

    public function scopeForYear($query, $year)
    {
        return $query->where('year', $year);
    }

    // Helper method untuk kalkulasi ulang
    public function recalculate()
    {
        $attendances = ClassroomAttendance::whereHas('meeting', function ($query) {
            $query->where('classroom_id', $this->classroom_id)
                  ->whereYear('meeting_date', $this->year)
                  ->whereMonth('meeting_date', $this->month);
        })->where('student_id', $this->student_id)->get();

        $this->total_meetings = $attendances->count();
        $this->present_count = $attendances->where('status', 'present')->count();
        $this->absent_count = $attendances->where('status', 'absent')->count();
        $this->late_count = $attendances->where('status', 'late')->count();
        $this->excused_count = $attendances->where('status', 'excused')->count();
        $this->sick_count = $attendances->where('status', 'sick')->count();
        $this->permit_count = $attendances->where('status', 'permit')->count();

        $this->attendance_percentage = $this->total_meetings > 0
            ? round((($this->present_count + $this->late_count) / $this->total_meetings) * 100, 2)
            : 0;

        $this->punctuality_percentage = $this->total_meetings > 0
            ? round(($this->present_count / $this->total_meetings) * 100, 2)
            : 0;

        $participationScores = $attendances->whereNotNull('participation_score')->pluck('participation_score');
        $this->average_participation_score = $participationScores->count() > 0
            ? round($participationScores->avg(), 1)
            : null;

        $this->last_calculated = now();
        $this->save();
    }
}
