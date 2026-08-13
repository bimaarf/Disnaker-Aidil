<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;

    protected $table = "messages";

    protected $fillable = [
        'chat_room_id',
        'sender_id',
        'recipient_id',
        'sender_name',
        'message',
        'file_name',
        'file_type',
        'file_url',
        'is_delivered',
        'is_read',
        'delivered_at',
        'read_at',
        'created_at',
        'updated_at',
        'link_preview',
        'status', // Add status to fillable
        'sequence',
    ];

    protected $casts = [
        'link_preview' => 'array', // Cast ke array untuk memudahkan pengolahan JSON
        'status' => 'string', // Explicitly cast status as string
    ];

    protected $dates = [
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'datetime:Y-m-d H:i:s',
        'delivered_at' => 'datetime:Y-m-d H:i:s',
        'read_at' => 'datetime:Y-m-d H:i:s',
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
    
    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }
    
    public function chatRoom()
    {
        return $this->belongsTo(ChatRoom::class, 'chat_room_id');
    }

    public function getDeliveredAtAttribute($value)
    {
        return $value ? \Carbon\Carbon::parse($value)->format('d M Y, H:i') : null;
    }

    public function getReadAtAttribute($value)
    {
        return $value ? \Carbon\Carbon::parse($value)->format('d M Y, H:i') : null;
    }
}