<?php
// App/Models/CheckoutProduct.php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CheckoutProduct extends Model
{
    use HasFactory;
    
    protected $table = 'tb_checkout_product';
    
    protected $fillable = [
        'checkout_id',
        'product_name',
        'product_id',
        'quantity',
        'price'
    ];

    public function checkout()
    {
        return $this->belongsTo(Checkout::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}