<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class Classroom extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'status',
        'created_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = ['teacher_count', 'student_count'];

    /**
     * Boot method untuk auto generate code
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($classroom) {
            if (empty($classroom->code)) {
                $classroom->code = self::generateUniqueCode();
            }
        });
    }

    /**
     * Generate unique classroom code
     */
    private static function generateUniqueCode()
    {
        do {
            $code = 'CLS-' . date('Y') . '-' . str_pad(mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
        } while (self::where('code', $code)->exists());

        return $code;
    }

    /**
     * Get the user who created the classroom
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * The teachers that belong to the classroom
     */
    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'classroom_teachers', 'classroom_id', 'teacher_id')
                    ->withPivot('is_active')
                    ->withTimestamps();
                    // ->wherePivot('is_active', true);
    }

    /**
     * All teachers including inactive
     */
    public function allTeachers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'classroom_teachers', 'classroom_id', 'teacher_id')
                    ->withPivot('is_active')
                    ->withTimestamps();
    }

    /**
     * The students that belong to the classroom
     */
    public function students(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'classroom_students', 'classroom_id', 'student_id')
                    ->withPivot('status', 'joined_date')
                    ->withTimestamps();
                    // ->wherePivot('status', 'active');
    }

    /**
     * All students including inactive
     */
    public function allStudents(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'classroom_students', 'classroom_id', 'student_id')
                    ->withPivot('status', 'joined_date')
                    ->withTimestamps();
    }

    /**
     * Get teacher count attribute
     */
    public function getTeacherCountAttribute()
    {
        return $this->teachers()->count();
    }

    /**
     * Get student count attribute
     */
    public function getStudentCountAttribute()
    {
        return $this->students()->count();
    }

    /**
     * Scope for active classrooms
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for search
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('code', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%");
        });
    }

    /**
     * Check if user is a teacher in this classroom
     */
    public function hasTeacher($userId)
    {
        return $this->teachers()->where('teacher_id', $userId)->exists();
    }

    /**
     * Check if user is a student in this classroom
     */
    public function hasStudent($userId)
    {
        return $this->students()->where('student_id', $userId)->exists();
    }
}
