<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Logo extends Model
{
    use HasFactory;

    protected $table = 'tb_logo';

    protected $fillable = [
        'image',
        'background_header',
        'app_title',
        'app_body',
    ];
}
