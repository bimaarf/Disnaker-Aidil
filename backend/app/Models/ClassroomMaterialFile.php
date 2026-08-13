<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassroomMaterialFile extends Model
{
    use HasFactory;

    protected $table = 'classroom_material_files';

    protected $fillable = [
        'material_id',
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

    // Relationship with material
    public function material()
    {
        return $this->belongsTo(ClassroomMaterial::class, 'material_id');
    }

    // Method to increment download count
    public function incrementDownloadCount()
    {
        $this->increment('download_count');
        $this->save();
    }

    // Method to increment view count
    public function incrementViewCount()
    {
        $this->increment('view_count');
        $this->save();
    }
}
