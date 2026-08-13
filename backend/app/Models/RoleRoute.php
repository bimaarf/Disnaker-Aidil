<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory; // Import HasFactory trait
use Illuminate\Database\Eloquent\Model;

class RoleRoute extends Model
{
    use HasFactory; // Use the HasFactory trait

    protected $table = 'role_route'; // Ensure the table name is correct
    protected $fillable = ['role_id', 'route_id'];

    // Define the relationship to Role
    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    // Define the relationship to Route
    public function route()
    {
        return $this->belongsTo(Route::class, 'route_id');
    }
}
