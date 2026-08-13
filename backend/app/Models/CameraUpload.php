<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CameraUpload extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'filename',
        'path',
        'size',
        'mime_type',
        'uploaded_at',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'uploaded_at' => 'datetime',
        'size' => 'integer',
        'user_id' => 'integer',
    ];

    public $timestamps = true;

    /**
     * Relationship with User
     */
    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    /**
     * Get full URL of uploaded image
     */
    public function getUrlAttribute()
    {
        return url("storage/{$this->path}");
    }

    /**
     * Get human readable file size
     */
    public function getFormattedSizeAttribute()
    {
        $bytes = $this->size;
        $units = ['B', 'KB', 'MB', 'GB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }
}
