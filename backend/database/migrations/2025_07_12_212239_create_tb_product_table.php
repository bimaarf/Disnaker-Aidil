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
        Schema::create('tb_product', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('name');
            $table->longText('description')->nullable();
            $table->boolean('status')->default(true);
            $table->unsignedBigInteger('price')->default(0);
            $table->unsignedBigInteger('author_id')->nullable();

            $table->foreign('author_id')->references('id')->on('users')->onDelete('set null');

            $table->timestamps();
        });
        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('tb_product')->onDelete('cascade');
            $table->longText('image_data');
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
        });

        Schema::create('product_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('tb_product')->onDelete('cascade');
            $table->foreignId('category_id')->constrained('tb_product_category')->onDelete('cascade');

            $table->timestamps();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tb_product');
        Schema::dropIfExists('product_categories');
        Schema::dropIfExists('product_images');
    }
};
