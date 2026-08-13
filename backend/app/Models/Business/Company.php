<?php

namespace App\Models\Business;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;
    protected $table = 'tb_company';
    protected $fillable = [
        'key',
        'name',
        'description',
        'owner_id',
        'image',
        'status',
    ];
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function products()
    {
        return $this->hasMany(Product::class, 'company_id');
    }
}
