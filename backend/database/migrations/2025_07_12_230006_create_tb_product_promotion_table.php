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
        Schema::create('tb_product_promotion', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->longText('image')->nullable();
            $table->string('title');
            $table->boolean('status')->default(true);
            $table->string('referral_code')->nullable();
            $table->timestamp('expired')->nullable(); // ← Tambahan kolom expired
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tb_product_promotion');
    }
};
