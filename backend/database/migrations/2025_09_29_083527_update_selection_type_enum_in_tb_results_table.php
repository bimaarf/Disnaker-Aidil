<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Ubah dulu kolom enum lama jadi string
        DB::statement("ALTER TABLE tb_results MODIFY selection_type VARCHAR(50) NULL");

        // 2. Update data sesuai mapping
        DB::table('tb_results')->where('selection_type', 'jalur tes')->update(['selection_type' => 'sesi administrasi']);
        DB::table('tb_results')->where('selection_type', 'jalur prestasi')->update(['selection_type' => 'sesi interview']);
        DB::table('tb_results')->where('selection_type', 'jalur zonasi')->update(['selection_type' => 'sesi administrasi']);

        // 3. Ubah kolom lagi jadi enum baru
        DB::statement("ALTER TABLE tb_results MODIFY selection_type ENUM('sesi administrasi', 'sesi interview') NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE tb_results MODIFY selection_type VARCHAR(50) NULL");

        // rollback data
        DB::table('tb_results')->where('selection_type', 'sesi administrasi')->update(['selection_type' => 'jalur tes']);
        DB::table('tb_results')->where('selection_type', 'sesi interview')->update(['selection_type' => 'jalur prestasi']);

        DB::statement("ALTER TABLE tb_results MODIFY selection_type ENUM('jalur tes', 'jalur prestasi', 'jalur zonasi') NULL");
    }

};
