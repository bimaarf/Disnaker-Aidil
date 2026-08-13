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
        Schema::table('tb_body', function (Blueprint $table) {
            $table->longText('address')->nullable()->after('description');
            $table->longText('google_map_link')->nullable()->after('address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tb_body', function (Blueprint $table) {
            $table->dropColumn(['address', 'google_map_link']);
        });
    }
};
