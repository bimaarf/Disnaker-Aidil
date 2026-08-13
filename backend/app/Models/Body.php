<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Body extends Model
{
    use HasFactory;
    protected $table = 'tb_body';
    protected $fillable = ['description', 'address' ,'google_map_link'];
}
