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
        Schema::table('messages', function (Blueprint $table) {
            // Index for markMessagesAsDelivered
            $table->index(['chat_room_id', 'recipient_id', 'is_delivered'], 'messages_delivery_idx');
            // Index for unread count and markMessagesAsRead
            $table->index(['chat_room_id', 'recipient_id', 'is_read'], 'messages_read_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex('messages_delivery_idx');
            $table->dropIndex('messages_read_idx');
        });
    }
};
