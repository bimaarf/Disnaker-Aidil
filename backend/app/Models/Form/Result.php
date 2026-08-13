<?php

namespace App\Models\Form;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Result extends Model
{
    protected $table = 'tb_results';

    protected $fillable = [
        'submission_answers',
        'selection_type',
        'value',
        'status',
        'is_approve',
    ];

    protected $casts = [
        'status' => 'boolean',
        'is_approve' => 'boolean',
        'selection_type' => 'string',
    ];
    
}