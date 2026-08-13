<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Landing extends Model
{
    use HasFactory;

    protected $table = 'tb_landing';

    protected $fillable = [
        'route_id',
        'title',
        'subtitle',
        'icon',
        'description'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'route_id' => 'integer'
    ];

    /**
     * Relationship dengan Route
     */
    public function route()
    {
        return $this->belongsTo(Route::class);
    }

    /**
     * Scope untuk pencarian
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
              ->orWhere('subtitle', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%")
              ->orWhereHas('route', function ($routeQuery) use ($search) {
                  $routeQuery->where('route_name', 'like', "%{$search}%");
              });
        });
    }

    /**
     * Scope untuk filter berdasarkan route
     */
    public function scopeByRoute($query, $routeId)
    {
        return $query->where('route_id', $routeId);
    }
}
