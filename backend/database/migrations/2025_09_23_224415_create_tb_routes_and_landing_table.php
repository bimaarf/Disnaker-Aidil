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
        // Tabel tb_route
        Schema::create('tb_route', function (Blueprint $table) {
            $table->id();
            $table->string('route_name')->unique();
            $table->timestamps();
        });

        // Tabel tb_landing (relasi one-to-one ke tb_route)
        Schema::create('tb_landing', function (Blueprint $table) {
            $table->id();
            $table->foreignId('route_id')
                  ->constrained('tb_route')
                  ->onDelete('cascade'); // jika route dihapus, landing juga ikut terhapus
            $table->string('title');
            $table->string('subtitle')->nullable();
            $table->string('icon')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique('route_id'); // pastikan relasi one-to-one
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tb_landing');
        Schema::dropIfExists('tb_route');
    }
};
