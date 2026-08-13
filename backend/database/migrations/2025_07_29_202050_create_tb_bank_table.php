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
        Schema::create('tb_bank', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('bank_name');
            $table->string('receiver_name');
            $table->string('account_number');
            $table->longText('description')->nullable();
            $table->longText('image')->nullable();
            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tb_bank');
    }
};
