<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Jalankan migrasi.
     */
    public function up(): void
    {
        Schema::table('tb_event_category', function (Blueprint $table) {
            $table->string('icon')->nullable()->after('name');
            $table->longText('description')->nullable()->after('icon');
        });
    }

    /**
     * Rollback migrasi.
     */
    public function down(): void
    {
        Schema::table('tb_event_category', function (Blueprint $table) {
            $table->dropColumn(['icon', 'description']);
        });
    }
};
