<?php
namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $table = 'tb_event';

    protected $fillable = [
        'key',
        'name',
        'description',
        'status',
        'author_id'
    ];

    public function categories()
    {
        return $this->belongsToMany(EventCategory::class, 'event_categories', 'event_id', 'category_id');
    }
    public function images()
    {
        return $this->hasMany(EventImage::class, 'event_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
