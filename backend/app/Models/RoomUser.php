<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoomUser extends Model
{
    use HasFactory;
    protected $table ="chat_room_user";
    protected $fillable = ['user_id', 'chat_room_id'];

    public function users()
    {
        return $this->belongsToMany(User::class, 'chat_room_user', 'chat_room_id', 'user_id');
    }
    public function rooms()
    {
        return $this->belongsToMany(ChatRoom::class);
    }
}
