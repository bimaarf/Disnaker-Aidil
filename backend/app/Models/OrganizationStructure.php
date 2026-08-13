<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrganizationStructure extends Model
{
    protected $table = 'organization_structures';
    protected $fillable = ['name', 'user_id', 'parent_id', 'level', 'order'];

    /**
     * Relasi ke parent node
     */
    public function parent()
    {
        return $this->belongsTo(OrganizationStructure::class, 'parent_id');
    }

    /**
     * Relasi ke children (hanya 1 level)
     */
    public function children()
    {
        return $this->hasMany(OrganizationStructure::class, 'parent_id')
                    ->orderBy('order');
    }

    /**
     * Relasi ke user (owner posisi/jabatan)
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id')
                    ->select('id', 'name', 'email', 'avatar', 'phone_number');
    }

    /**
     * Ambil children secara rekursif + user
     */
    public function childrenRecursive()
    {
        return $this->children()->with(['user', 'childrenRecursive']);
    }
}
