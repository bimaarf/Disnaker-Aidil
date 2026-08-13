<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\OrganizationStructure;

class OrganizationStructureSeeder extends Seeder
{
    public function run(): void
    {
        // Direktur Utama
        $direktur = OrganizationStructure::create([
            'name' => 'Direktur Utama',
            'level' => 0,
            'order' => 1
        ]);

        // Manager
        $manager = OrganizationStructure::create([
            'name' => 'Manager',
            'parent_id' => $direktur->id,
            'level' => 1,
            'order' => 1
        ]);

        // Supervisor
        $supervisor = OrganizationStructure::create([
            'name' => 'Supervisor',
            'parent_id' => $manager->id,
            'level' => 2,
            'order' => 1
        ]);

        // Staff
        OrganizationStructure::create([
            'name' => 'Staff',
            'parent_id' => $supervisor->id,
            'level' => 3,
            'order' => 1
        ]);

        // Staff tambahan di bawah Supervisor
        OrganizationStructure::create([
            'name' => 'Staff Marketing',
            'parent_id' => $supervisor->id,
            'level' => 3,
            'order' => 2
        ]);
    }
}
