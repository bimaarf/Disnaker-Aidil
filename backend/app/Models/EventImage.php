<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class EventImage extends Model
{
    protected $table = 'event_images';

    protected $fillable = ['event_id', 'image_data', 'is_primary'];

    // EventImage.php (Model)
    public function event()
    {
        return $this->belongsTo(Event::class, 'event_id')->withDefault(); // <- withDefault supaya tetap ada objek meski null
    }
    public function getImageDataAttribute($value)
    {
        if (!$value) {
            return null;
        }

        // Jika sudah berupa URL lengkap, langsung return
        if (filter_var($value, FILTER_VALIDATE_URL)) {
            return $value;
        }

        $baseUrl = config('app.url', 'http://localhost:8000');
        $normalizedPath = ltrim($value, '/');

        // Return full URL
        return $baseUrl . '/storage/' . $normalizedPath;
    }

}
