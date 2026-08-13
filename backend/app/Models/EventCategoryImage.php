<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventCategoryImage extends Model
{
    use HasFactory;
     // Pastikan nama tabel sesuai dengan migrasi
    protected $table = 'event_category_images';

    // Hanya kolom yang memang ada di tabel
    protected $fillable = [
        'category_event_id',
        'image_data',
        'is_primary',
    ];

    public function eventCategory()
    {
        // Ganti 'EventCategory' dengan nama model tabel tb_event_category yang Anda pakai
        return $this->belongsTo(EventCategory::class, 'event_category_id');
    }
}
