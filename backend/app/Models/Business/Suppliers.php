<?php

namespace App\Models\Business;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Suppliers extends Model
{
    use HasFactory;
    protected $table = 'tb_suppliers';
    protected $fillable = ['name', 'key', 'address', 'contact'];
    public function product()
    {
        return $this->hasMany(Product::class);
    }
}
