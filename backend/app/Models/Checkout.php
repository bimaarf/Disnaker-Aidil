<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Checkout extends Model
{
    use HasFactory;

    protected $table = 'tb_checkout';
    protected $fillable = [
        'key',
        'user_id',
        'total_price',
        'status',
        'checked_out_at',
        'promotion_id',
    ];

    public function payment()
    {
        return $this->hasOne(CheckoutPayment::class, 'checkout_id');
    }

    public function products()
    {
        return $this->hasMany(CheckoutProduct::class, 'checkout_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function promotions()
    {
        return $this->hasMany(CheckoutPromotion::class, 'checkout_id');
    }
}
