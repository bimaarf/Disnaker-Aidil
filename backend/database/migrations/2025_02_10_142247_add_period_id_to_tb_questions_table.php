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
        Schema::table('tb_questions', function (Blueprint $table) {
            $table->foreignId('period_id')
                ->nullable()  // Kolom period_id bisa null
                ->constrained('tb_period') // Asumsinya period_id berelasi dengan tabel tb_period
                ->onDelete('set null') // Ketika period dihapus, period_id diset null
                ->after('question'); // Menempatkan kolom setelah question_id
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tb_questions', function (Blueprint $table) {
            $table->dropColumn('period_id');
        });
    }
};
