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
        Schema::table('tb_product_promotion', function (Blueprint $table) {
            // $table->unsignedDecimal('discount_percentage', 8, 1)->nullable()->after('expired');
            $table->decimal('discount_percentage', 8, 1)->unsigned()->nullable()->after('expired');

        });
    }

    public function down(): void
    {
        Schema::table('tb_product_promotion', function (Blueprint $table) {
            $table->dropColumn('discount_percentage');
        });
    }

};
