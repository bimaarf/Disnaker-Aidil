<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassroomAssignmentFile extends Model
{
    use HasFactory;

    protected $table = 'classroom_assignment_files';

    protected $fillable = [
        'assignment_id',
        'type',
        'path',
        'file_size',
        'file_type',
        'download_count',
        'view_count',
    ];

    protected $casts = [
        'download_count' => 'integer',
        'view_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationship with assignment
    public function assignment()
    {
        return $this->belongsTo(ClassroomAssignment::class, 'assignment_id');
    }

    // Method to increment download count
    public function incrementDownloadCount()
    {
        $this->increment('download_count');
        $this->save();
    }

    // Method to increment view count
    public function incrementViewCount(): void
    {
        $this->timestamps = false;
        $this->increment('view_count');
    }
}
