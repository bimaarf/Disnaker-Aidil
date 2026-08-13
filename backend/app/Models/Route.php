<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Route extends Model
{
    use HasFactory;

    protected $table = 'tb_route';

    protected $fillable = [
        'route_name'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Relationship dengan Landing
     */
    public function landing()
    {
        return $this->hasOne(Landing::class);
    }

    /**
     * Scope untuk pencarian berdasarkan nama route
     */
    public function scopeSearch($query, $search)
    {
        return $query->where('route_name', 'like', "%{$search}%");
    }

    /**
     * Mutator untuk route_name (otomatis lowercase)
     */
    public function setRouteNameAttribute($value)
    {
        $this->attributes['route_name'] = strtolower($value);
    }
}
