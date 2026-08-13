<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_results', function (Blueprint $table) {
            $table->id();
            $table->text('submission_answers');
            $table->enum('selection_type', ['jalur tes', 'jalur prestasi', 'jalur zonasi'])->nullable();
            $table->string('value')->nullable();
            $table->boolean('status')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_results');
    }
};