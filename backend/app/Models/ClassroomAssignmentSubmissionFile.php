<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassroomAssignmentSubmissionFile extends Model
{
    use HasFactory;

    protected $table = 'classroom_assignment_submission_files';

    protected $fillable = [
        'submission_id',
        'original_name',
        'file_name',
        'file_path',
        'file_size',
        'file_type',
        'mime_type',
        'uploaded_by',
        'uploaded_at',
        'is_active',
        'metadata'
    ];

    protected $casts = [
        'uploaded_at' => 'datetime',
        'is_active' => 'boolean',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relasi ke submission
    public function submission()
    {
        return $this->belongsTo(ClassroomAssignmentSubmission::class, 'submission_id');
    }

    // Relasi ke user yang upload
    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // ---- ACCESSORS ----

    // Ukuran file dengan format human-readable
    public function getFormattedSizeAttribute()
    {
        $bytes = (int) $this->file_size;

        if ($bytes == 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    // Ekstensi file
    public function getExtensionAttribute()
    {
        return pathinfo($this->original_name, PATHINFO_EXTENSION);
    }

    // Cek apakah file adalah gambar
    public function getIsImageAttribute()
    {
        $imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        return in_array(strtolower($this->extension), $imageTypes);
    }

    // Cek apakah file adalah dokumen
    public function getIsDocumentAttribute()
    {
        $docTypes = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
        return in_array(strtolower($this->extension), $docTypes);
    }

    // ---- CUSTOM METHODS ----

    // Soft delete file (mark as inactive)
    public function softDelete()
    {
        $this->update(['is_active' => false]);
    }

    // Restore file (mark as active)
    public function restore()
    {
        $this->update(['is_active' => true]);
    }

    // ---- SCOPES ----
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }
}
