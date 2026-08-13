<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tb_logo', function (Blueprint $table) {
            $table->string('background_header')->nullable()->after('image');
        });
    }

    public function down(): void
    {
        Schema::table('tb_logo', function (Blueprint $table) {
            $table->dropColumn('background_header');
        });
    }
};
