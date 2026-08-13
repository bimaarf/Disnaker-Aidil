<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('notification_whatsapp_messages', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // key unik untuk template
            $table->string('label');          // judul/template name
            $table->longText('message');          // isi pesan WA (bisa HTML/placeholder)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_whatsapp_messages');
    }
};
