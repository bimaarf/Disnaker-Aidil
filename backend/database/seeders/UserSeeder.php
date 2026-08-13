<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create roles
        $superAdminRole = Role::firstOrCreate(
            ['name' => 'super admin'],
            ['display_name' => 'Super Admin', 'description' => 'User with all access']
        );

        $adminRole = Role::firstOrCreate(
            ['name' => 'administrator'],
            ['display_name' => 'Administrator', 'description' => 'System Administrator with full privileges']
        );

        $teacherRole = Role::firstOrCreate(
            ['name' => 'teacher'],
            ['display_name' => 'Teacher', 'description' => 'Application Teacher']
        );

        $userRole = Role::firstOrCreate(
            ['name' => 'user'],
            ['display_name' => 'Regular User', 'description' => 'Standard application user']
        );

        /**
         * Helper untuk buat user default
         */
        $createUser = function ($email, $name, $role, $phone = '6280000000') {
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => Hash::make('password'),
                    'phone_number' => $phone,
                    'status' => 1,
                    'created_at' => now(),
                    'last_online_at' => now(),
                ]
            );

            if (!$user->roles()->where('role_id', $role->id)->exists()) {
                $user->roles()->attach($role->id);
            }

            return $user;
        };

        // Buat default users untuk setiap role
        $superAdmin = $createUser('superadmin@gmail.com', 'Super Admin', $superAdminRole, '6281111111');
        $admin      = $createUser('admin@gmail.com', 'Administrator', $adminRole, '6282222222');
        $teacher    = $createUser('teacher@gmail.com', 'Teacher Example', $teacherRole, '6283333333');
        $user       = $createUser('user@gmail.com', 'Regular User', $userRole, '6284444444');

        // Khusus super admin → assign semua role
        $allRoleIds = Role::pluck('id');
        $superAdmin->roles()->syncWithoutDetaching($allRoleIds);

        // Tambahan: bikin 100 user biasa dari factory
        User::factory()
            ->count(100)
            ->create([
                'status' => 1,
                'password' => Hash::make('password'),
                'phone_number' => '6285555555',
            ])
            ->each(function ($user) use ($userRole) {
                if (!$user->hasRole($userRole->name)) {
                    $user->roles()->attach($userRole->id);
                }
            });
    }
}
