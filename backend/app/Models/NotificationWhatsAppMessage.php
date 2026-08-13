<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationWhatsAppMessage extends Model
{
    protected $table = 'notification_whatsapp_messages';
    protected $fillable = [
        'code',
        'label',
        'message',
    ];
}
