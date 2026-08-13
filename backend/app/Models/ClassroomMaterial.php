<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class ClassroomMaterial extends Model
{
    use HasFactory;

    protected $table = 'classroom_materials';

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

    // Relationship with user who uploaded
    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // Relationship with files and links
    public function files()
    {
        return $this->hasMany(ClassroomMaterialFile::class, 'material_id');
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

    // Accessor to check if material is available
  // FIXED: Enhanced availability check with proper date formatting
    public function getIsAvailableAttribute()
    {
        $user = auth()->user();

        if($user->hasRole('user'))
        {

            if (!$this->is_visible) {
                return false;
            }

            $now = now();

            // Check if assignment has started (available_from)
            if ($this->available_from && $now->lt(Carbon::parse($this->available_from))) {
                return false;
            }

            // Check if assignment has expired (available_until)
            if ($this->available_until && $now->gt(Carbon::parse($this->available_until))) {
                return false;
            }
        }

            return true;
    }


    // Scope for visible materials
    public function scopeVisible($query)
    {
        return $query->where('is_visible', true);
    }

    // Scope for available materials
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
