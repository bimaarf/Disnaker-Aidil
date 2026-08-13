<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Notification extends Model
{
    use HasFactory;

    protected $table = 'tb_notification';
    protected $fillable = ['key', 'label', 'title', 'message', 'user_id'];

    protected $dateFormat = 'Y-m-d H:i';

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getCreatedAtAttribute($value)
    {
        return Carbon::parse($value)->format($this->dateFormat);
    }

    public function getUpdatedAtAttribute($value)
    {
        return Carbon::parse($value)->format($this->dateFormat);
    }

    /**
     * Public helper untuk membuat notifikasi
     */
    public static function createNotification($userId, $label, $title, $message)
    {
        return self::create([
            'key' => Str::random(8),
            'user_id' => $userId,
            'label' => $label,
            'title' => $title,
            'message' => $message,
        ]);
    }
}
