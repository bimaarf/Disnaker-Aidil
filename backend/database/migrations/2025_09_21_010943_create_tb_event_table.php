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
        Schema::create('tb_event', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('name');
            $table->longText('description')->nullable();
            $table->boolean('status')->default(true);

            $table->unsignedBigInteger('author_id')->nullable(); // Nullable for onDelete('set null')

            $table->foreign('author_id')->references('id')->on('users')->onDelete('set null');


            $table->timestamps();
        });
        Schema::create('event_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')
            ->nullable()
            ->constrained('tb_event')
            ->onDelete('cascade');

            $table->longText('image_data');
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
        });

        Schema::create('event_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('tb_event')->onDelete('cascade');
            $table->foreignId('category_id')->constrained('tb_event_category')->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tb_event');
        Schema::dropIfExists('event_categories');
        Schema::dropIfExists('event_images');
    }
};
