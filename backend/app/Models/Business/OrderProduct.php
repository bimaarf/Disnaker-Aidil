<?php

namespace App\Models\Business;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderProduct extends Model
{
    use HasFactory;
    protected $table = 'tb_order_product';
    protected $fillable = [
        'key',
        'product_id',
        'quantity',
        'price',
        'order_date',
    ];
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
