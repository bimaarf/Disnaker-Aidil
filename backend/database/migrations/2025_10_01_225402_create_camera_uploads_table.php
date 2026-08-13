<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('camera_uploads', function (Blueprint $table) {
            $table->id();
            $table->string('filename');
            $table->string('path');
            $table->unsignedBigInteger('size')->comment('File size in bytes');
            $table->string('mime_type')->nullable();
            $table->timestamp('uploaded_at');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            // Indexes for better query performance
            $table->index('uploaded_at');
            $table->index('ip_address');
        });
    }

    public function down()
    {
        Schema::dropIfExists('camera_uploads');
    }
};
