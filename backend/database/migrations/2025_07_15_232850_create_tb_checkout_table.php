<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Table for main checkout information
        Schema::create('tb_checkout', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->unsignedBigInteger('total_price')->default(0);
            $table->enum('status', ['pending', 'completed', 'cancelled'])->default('pending')->index();
            $table->timestamp('checked_out_at')->nullable();
            $table->foreignId('promotion_id')->nullable()->constrained('tb_product_promotion')->onDelete('set null');
            $table->timestamps();
        });

        // Table for products purchased in a checkout
        Schema::create('tb_checkout_product', function (Blueprint $table) {
            $table->id();
            $table->foreignId('checkout_id')->constrained('tb_checkout')->onDelete('cascade');
            $table->foreignId('product_id')->nullable()->constrained('tb_product')->onDelete('set null');
            $table->string('product_name');
            $table->unsignedBigInteger('quantity')->default(1);
            $table->unsignedBigInteger('price')->default(0);
            $table->timestamps();
        });

        // Table for payment information
        Schema::create('tb_checkout_payment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('checkout_id')->constrained('tb_checkout')->onDelete('cascade');

            // ✅ Tambahan: midtrans_order_id unik
            $table->string('order_id')->nullable()->unique();

            $table->enum('payment_method', [
                'credit_card',
                'bank_transfer',
                'cash_on_delivery',
                'e_wallet',
                'midtrans'
            ]);

            $table->enum('payment_status', [
                'unpaid', 'pending', 'paid', 'cancelled', 'failed',
                'challenge', 'refunded', 'partial_refund', 'expire',
                'cancel', 'deny', 'settlement', 'capture'
            ])->default('unpaid')->index();

            $table->string('snap_token')->nullable();
            $table->text('redirect_url')->nullable();
            $table->string('transaction_id')->nullable();
            $table->string('payment_type')->nullable();
            $table->unsignedBigInteger('gross_amount')->nullable();
            $table->timestamp('transaction_time')->nullable();
            $table->text('midtrans_response')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expired_at')->nullable();

            $table->timestamps();
        });

        // Table for promotions or vouchers
        Schema::create('tb_checkout_promotion', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->enum('type', ['product', 'voucher']);
            $table->foreignId('checkout_id')->constrained('tb_checkout')->onDelete('cascade');
            $table->longText('image')->nullable();
            $table->string('title');
            $table->boolean('status')->default(true);
            $table->string('referral_code')->nullable();
            $table->timestamp('expired')->nullable();
            $table->decimal('discount_percentage', 8, 1)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tb_checkout_promotion');
        Schema::dropIfExists('tb_checkout_payment');
        Schema::dropIfExists('tb_checkout_product');
        Schema::dropIfExists('tb_checkout');
    }
};
