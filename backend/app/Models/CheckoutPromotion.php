<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CheckoutPromotion extends Model
{
    use HasFactory;
    protected $table = 'tb_checkout_promotion';

    protected $fillable = ['image', 'type', 'key','checkout_id', 'title', 'status', 'referral_code', 'discount_percentage', 'expired'];

 
    public function checkout()
    {
        return $this->hasMany(Checkout::class);
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
