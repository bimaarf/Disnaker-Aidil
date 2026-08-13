<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoleUser extends Model
{
    use HasFactory;
    protected $fillable = ["role_id", "user_id", "user_type"];
    protected $table = "role_user";

    public function user(){
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
