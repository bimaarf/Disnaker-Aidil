<?php

namespace App\Models\Business;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductCategory extends Model
{
    use HasFactory;
    protected $table = 'tb_category_product';
    protected $fillable = ['name', 'key', 'image'];
    public function getCreatedAtAttribute($value)
    {
        return Carbon::parse($value)->format($this->dateFormat);
    }

    public function getUpdatedAtAttribute($value)
    {
        return Carbon::parse($value)->format($this->dateFormat);
    }
}
