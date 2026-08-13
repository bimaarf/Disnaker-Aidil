<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tb_event_category', function (Blueprint $table) {
            $table->longText('image_data')->nullable()->after('key');
        });

        Schema::create('event_category_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_category_id')
                  ->constrained('tb_event_category')
                  ->onDelete('cascade');
            $table->longText('image_data');
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('tb_event_category', function (Blueprint $table) {
            $table->dropColumn('image_data');
        });

        Schema::dropIfExists('event_category_images');
    }
};
