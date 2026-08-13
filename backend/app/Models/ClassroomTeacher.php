<?php

// app/Models/ClassroomTeacher.php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class ClassroomTeacher extends Pivot
{
    protected $table = 'classroom_teachers';

    protected $fillable = [
        'classroom_id',
        'teacher_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
