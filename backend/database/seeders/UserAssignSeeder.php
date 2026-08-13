<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserAssignSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /**
         * Helper untuk assign role ke user
         */
        $assignRole = function ($email, $name, $roleName, $phone = '6280000000') {
            $role = Role::where('name', $roleName)->first();
            if (!$role) {
                Log::warning("Peran '{$roleName}' tidak ditemukan saat menjalankan UserAssignSeeder.");
                return;
            }

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
                Log::info("Peran '{$roleName}' ditetapkan untuk pengguna dengan email '{$email}'.");
            } else {
                Log::info("Peran '{$roleName}' sudah ditetapkan untuk pengguna dengan email '{$email}'.");
            }
        };

        // Assign roles ke user default
        $assignRole('superadmin@gmail.com', 'Super Admin', 'super-admin', '6281111111');
        $assignRole('admin@gmail.com', 'Administrator', 'administrator', '6282222222');
        $assignRole('teacher@gmail.com', 'Teacher Example', 'teacher', '6283333333');
        $assignRole('user@gmail.com', 'Regular User', 'user', '6284444444');
    }
}
