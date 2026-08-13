<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;
    protected $table = 'tb_product';

    protected $fillable = [
        'key',
        'name',
        'description',
        'status',
        'price',
        'author_id'
    ];

    public function categories()
    {
        return $this->belongsToMany(ProductCategory::class, 'product_categories', 'product_id', 'category_id');
    }
    public function promotions()
    {
        return $this->belongsToMany(ProductPromotion::class, 'product_promotions', 'product_id', 'promotion_id');
    }


    public function images()
    {
        return $this->hasMany(ProductImage::class, 'product_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
