<?php
namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class Blog extends Model
{
    protected $table = 'tb_blog';

    protected $fillable = [
        'key',
        'name',
        'description',
        'status',
        'author_id'
    ];

    public function categories()
    {
        return $this->belongsToMany(BlogCategory::class, 'blog_categories', 'blog_id', 'category_id');
    }


    public function images()
    {
        return $this->hasMany(BlogImage::class, 'blog_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
