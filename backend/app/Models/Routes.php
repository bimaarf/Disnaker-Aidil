<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Routes extends Model
{
    use HasFactory;

    protected $table = 'routes'; // Ensure the table name is correct
    protected $fillable = ['name', 'uri', 'method'];

    // A route can belong to many roles through the role_route pivot table
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_route', 'route_id', 'role_id');
    }
}
