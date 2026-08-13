<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class BlogImage extends Model
{
    protected $table = 'blog_images';

    protected $fillable = ['blog_id', 'image_data', 'is_primary'];

    // BlogImage.php (Model)
    public function blog()
    {
        return $this->belongsTo(Blog::class, 'blog_id')->withDefault(); // <- withDefault supaya tetap ada objek meski null
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
