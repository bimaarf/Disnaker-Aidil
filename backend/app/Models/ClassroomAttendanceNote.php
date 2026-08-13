<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Carbon\Carbon;

class ClassroomAttendanceNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'attendance_id',
        'created_by',
        'type',
        'content',
        'is_private',
        'noted_at'
    ];

    protected $casts = [
        'is_private' => 'boolean',
        'noted_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationships
    public function attendance(): BelongsTo
    {
        return $this->belongsTo(ClassroomAttendance::class, 'attendance_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes
    public function scopeForAttendance($query, $attendanceId)
    {
        return $query->where('attendance_id', $attendanceId);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopePublic($query)
    {
        return $query->where('is_private', false);
    }

    public function scopePrivate($query)
    {
        return $query->where('is_private', true);
    }
}
