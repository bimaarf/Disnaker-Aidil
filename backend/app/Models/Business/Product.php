<?php

namespace App\Models\Business;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;
    protected $table = "tb_products";
    protected $fillable = [
        'key',
        'name',
        'description',
        'price',
        'image',
        'company_id',
        'status',
        'category_id',
        'suppliers_id',
    ];
    public function stocks()
    {
        return $this->hasMany(StockProduct::class);
    }
    public function category()
    {
        return $this->belongsTo(ProductCategory::class);
    }
    public function company()
    {
        return $this->belongsTo(Company::class);
    }
    public function supplier()
    {
        return $this->belongsTo(Suppliers::class, 'suppliers_id');
    }
}
