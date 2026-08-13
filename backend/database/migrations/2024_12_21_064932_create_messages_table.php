<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMessagesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();  // Auto increment ID (primary key)
            $table->unsignedBigInteger('chat_room_id');  // Chat room ID (foreign key)
            $table->unsignedBigInteger('sender_id');  // Sender ID (foreign key)
            $table->unsignedBigInteger('recipient_id');  // Recipient ID (foreign key)
            $table->text('message');  // The actual message
            $table->string('sender_name');  // The actual message
            $table->boolean('is_read')->default(false);  // Read/unread status, default false
            $table->timestamps();  // created_at and updated_at timestamps
        });

        // Adding foreign key constraints
        Schema::table('messages', function (Blueprint $table) {
            $table->foreign('sender_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('recipient_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('chat_room_id')->references('id')->on('chat_rooms')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Drop the messages table if rolling back
        Schema::dropIfExists('messages');
    }
}
