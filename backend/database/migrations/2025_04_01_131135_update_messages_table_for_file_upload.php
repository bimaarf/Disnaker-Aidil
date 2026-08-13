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
            // Pastikan kolom yang sudah ada tidak ditambahkan ulang
            if (!Schema::hasColumn('messages', 'chat_room_id')) {
                $table->foreignId('chat_room_id')->constrained('chat_rooms')->onDelete('cascade');
            }
            if (!Schema::hasColumn('messages', 'sender_id')) {
                $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            }
            if (!Schema::hasColumn('messages', 'recipient_id')) {
                $table->foreignId('recipient_id')->constrained('users')->onDelete('cascade');
            }
            if (!Schema::hasColumn('messages', 'sender_name')) {
                $table->string('sender_name');
            }
            if (!Schema::hasColumn('messages', 'message')) {
                $table->text('message')->nullable();
            }
            if (!Schema::hasColumn('messages', 'is_read')) {
                $table->boolean('is_read')->default(false);
            }

            // Tambahkan kolom yang hilang dari migration sebelumnya
            if (!Schema::hasColumn('messages', 'is_delivered')) {
                $table->boolean('is_delivered')->default(false)->after('is_read');
            }

            // Tambahkan kolom untuk fitur upload file
            if (!Schema::hasColumn('messages', 'file_name')) {
                $table->string('file_name')->nullable()->after('message');
            }
            if (!Schema::hasColumn('messages', 'file_type')) {
                $table->string('file_type')->nullable()->after('file_name');
            }
            if (!Schema::hasColumn('messages', 'file_url')) {
                $table->string('file_url')->nullable()->after('file_type');
            }

            // Pastikan kolom timestamps ada
            if (!Schema::hasColumn('messages', 'created_at') || !Schema::hasColumn('messages', 'updated_at')) {
                $table->timestamps();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            // Hapus kolom file-related jika ada
            if (Schema::hasColumn('messages', 'file_url')) {
                $table->dropColumn('file_url');
            }
            if (Schema::hasColumn('messages', 'file_type')) {
                $table->dropColumn('file_type');
            }
            if (Schema::hasColumn('messages', 'file_name')) {
                $table->dropColumn('file_name');
            }
            if (Schema::hasColumn('messages', 'is_delivered')) {
                $table->dropColumn('is_delivered');
            }

            // Catatan: Kolom lain seperti chat_room_id, sender_id, dll tidak dihapus di sini
            // karena ini mungkin migration tambahan, bukan pembuatan tabel awal.
            // Jika ini adalah tabel baru, Anda bisa hapus semua kolom dengan Schema::dropIfExists('messages').
        });
    }
};