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
        Schema::table('tb_contact', function (Blueprint $table) {
            $table->string('email')->nullable()->change();
            $table->string('whatsapp')->nullable()->change();
            $table->string('telegram')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
         Schema::table('tb_contact', function (Blueprint $table) {
            $table->string('email')->nullable(false)->change();
            $table->string('whatsapp')->nullable(false)->change();
            $table->string('telegram')->nullable(false)->change();
        });
    }
};
