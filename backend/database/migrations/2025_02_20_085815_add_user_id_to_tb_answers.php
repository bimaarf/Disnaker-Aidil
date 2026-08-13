<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tb_answers', function (Blueprint $table) {
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users') // Asumsi relasi ke tabel users
                ->onDelete('set null')
                ->after('id'); // Meletakkan kolom setelah id
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tb_answers', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};
