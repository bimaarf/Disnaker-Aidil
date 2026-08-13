<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory; // Import HasFactory trait
use Laratrust\Models\Role as RoleModel;

class Role extends RoleModel
{
    use HasFactory; // Use the HasFactory trait

    public $guarded = []; // Specify which attributes are not mass assignable
    protected $table = 'roles'; // Ensure the table name is correct
    protected $fillable = [
        'name',
        'display_name',
        'description',
    ];

    // A role can have many routes through the role_route pivot table
    public function routes()
    {
        return $this->belongsToMany(Route::class, 'role_route', 'role_id', 'route_id');
    }
}
