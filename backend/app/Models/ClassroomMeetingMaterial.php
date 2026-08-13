<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Carbon\Carbon;

class ClassroomMeetingMaterial extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_id',
        'material_id',
        'type',
        'notes',
        'is_required'
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationships
    public function meeting(): BelongsTo
    {
        return $this->belongsTo(ClassroomMeeting::class, 'meeting_id');
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(ClassroomMaterial::class, 'material_id');
    }

    // Scopes
    public function scopeForMeeting($query, $meetingId)
    {
        return $query->where('meeting_id', $meetingId);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeRequired($query)
    {
        return $query->where('is_required', true);
    }
}
