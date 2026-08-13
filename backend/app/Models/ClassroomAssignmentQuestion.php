<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassroomAssignmentQuestion extends Model
{
    use HasFactory;

    protected $table = 'classroom_assignment_questions';

    protected $fillable = [
        'assignment_id',
        'points',
        'question',
        'label',
        'type',
        'options',
        'file_types',
        'page',
        'sort_order',
        'is_required',
        'author_id',
    ];

    protected $casts = [
        'points' => 'integer',   // ⬅️ ini biar aman
        'options' => 'array',
        'is_required' => 'boolean',
        'page' => 'integer',
        'sort_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    // Relasi ke assignment
    public function assignment()
    {
        return $this->belongsTo(ClassroomAssignment::class, 'assignment_id');
    }

    // Relasi ke user (author)
    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    // (Opsional) Kalau nanti ada tabel jawaban siswa
    public function answers()
    {
        return $this->hasMany(ClassroomAssignmentAnswer::class, 'question_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    // Urutkan pertanyaan per halaman dan sort_order
    public function scopeOrdered($query)
    {
        return $query->orderBy('page')->orderBy('sort_order');
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers / Accessors
    |--------------------------------------------------------------------------
    */

    // Untuk cek apakah question punya pilihan (radio/checkbox)
    public function getHasOptionsAttribute()
    {
        return in_array($this->type, ['radio', 'checkbox']) && !empty($this->options);
    }
    public function getFormattedPointsAttribute()
    {
        return $this->points . ' pts';
    }

}
