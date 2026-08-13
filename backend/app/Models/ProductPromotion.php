<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductPromotion extends Model
{
    use HasFactory;
    protected $table = 'tb_product_promotion';

    protected $fillable = ['image', 'key', 'title', 'status', 'referral_code', 'discount_percentage', 'expired'];

    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_promotions', 'promotion_id', 'product_id');
    }
    public function checkouts()
    {
        return $this->hasMany(Checkout::class, 'product_promotions');
    }
    
    public function getCreatedAtAttribute($value)
    {
        return Carbon::parse($value)->format('Y-m-d H:i:s');
    }

    public function getUpdatedAtAttribute($value)
    {
        return Carbon::parse($value)->format('Y-m-d H:i:s');
    }
}
