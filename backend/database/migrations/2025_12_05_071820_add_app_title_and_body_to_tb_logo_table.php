<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tb_logo', function (Blueprint $table) {
            $table->string('app_title')->nullable()->after('image');
            $table->text('app_body')->nullable()->after('app_title');
        });
    }

    public function down(): void
    {
        Schema::table('tb_logo', function (Blueprint $table) {
            $table->dropColumn(['app_title', 'app_body']);
        });
    }
};
