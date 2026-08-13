<?php


namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class ClassroomStudent extends Pivot
{
    protected $table = 'classroom_students';

    protected $fillable = [
        'classroom_id',
        'student_id',
        'status',
        'joined_date',
    ];

    protected $casts = [
        'joined_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}

