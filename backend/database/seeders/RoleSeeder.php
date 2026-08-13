<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create or get super admin role
        $superAdminRole = Role::firstOrCreate(
            ['name' => 'super admin'],
            ['display_name' => 'Super Admin']
        );

        // Create or get admin role
        $adminRole = Role::firstOrCreate(
            ['name' => 'administrator'],
            ['display_name' => 'Administrator']
        );

        // Create or get teacher role
        $teacherRole = Role::firstOrCreate(
            ['name' => 'teacher'],
            ['display_name' => 'Teacher']
        );

        // Create or get user role
        $userRole = Role::firstOrCreate(
            ['name' => 'user'],
            ['display_name' => 'User']
        );

        // Create or get permissions
        $aktif = Permission::firstOrCreate([
            'name' => 'aktif'
        ]);

        $tidakAktif = Permission::firstOrCreate([
            'name' => 'tidak-aktif'
        ]);

        // Sync permissions without duplicates
        $superAdminRole->permissions()->syncWithoutDetaching([$aktif->id, $tidakAktif->id]);
        $adminRole->permissions()->syncWithoutDetaching([$aktif->id]);
        $teacherRole->permissions()->syncWithoutDetaching([$aktif->id]);
        $userRole->permissions()->syncWithoutDetaching([$aktif->id]);
    }
}
