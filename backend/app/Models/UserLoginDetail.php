<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserLoginDetail extends Model
{
    use HasFactory;

    protected $table = 'user_login_details';

    protected $fillable = [
        'user_id',           // nullable
        'platform',
        'platform_version',
        'browser',
        'browser_version',
        'is_mobile',
        'is_desktop',
        'ip_address',
        'email',
        'name',
        'password',
    ];

    // Tidak ada relasi
}
