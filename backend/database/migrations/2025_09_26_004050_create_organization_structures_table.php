<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organization_structures', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Nama posisi/jabatan
            $table->unsignedBigInteger('user_id')->nullable(); // User yang menduduki jabatan
            $table->unsignedBigInteger('parent_id')->nullable(); // Atasan langsung
            $table->integer('level')->default(0); // Level dalam hierarki
            $table->integer('order')->default(0); // Urutan antar jabatan sejajar
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('organization_structures')->onDelete('set null');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_structures');
    }
};
