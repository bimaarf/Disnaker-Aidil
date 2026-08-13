<?php

namespace App\Models\Business;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockProduct extends Model
{
    use HasFactory;
    protected $table = 'tb_stock_product';
    protected $fillable = [
        'key',
        'product_id',
        'quantity',
        'datetime',
    ];
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
