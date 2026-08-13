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
        Schema::create('routes', function (Blueprint $table) {
            $table->id();  // ID unik untuk setiap route
            $table->string('name');  // Nama route
            $table->string('uri');  // URI dari route
            $table->string('method');  // Metode HTTP (GET, POST, PUT, DELETE)
            $table->timestamps();  // Timest
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('routes');
    }
};
