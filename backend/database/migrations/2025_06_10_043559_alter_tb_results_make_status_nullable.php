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
        DB::table('tb_results')
            ->whereNull('status')
            ->update(['status' => false]);

        Schema::table('tb_results', function (Blueprint $table) {
            $table->boolean('status')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
        DB::table('tb_results')
            ->whereNull('status')
            ->update(['status' => false]);

        Schema::table('tb_results', function (Blueprint $table) {
            $table->boolean('status')->nullable(false)->default(false)->change();
        });
    }
};
