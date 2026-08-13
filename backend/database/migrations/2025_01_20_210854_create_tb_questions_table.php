<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('tb_questions', function (Blueprint $table) {
            $table->id();
            $table->text('question');
            $table->string('label')->nullable();
            $table->enum('type', ['radio', 'checkbox', 'text', 'file', 'multiple_file'])->default('radio');
            $table->json('options')->nullable();
            $table->unsignedBigInteger('author_id');
            $table->timestamps();
            $table->string('fileTypes')->nullable(); 
            $table->foreign('author_id')->references('id')->on('users');
        });
    }

    public function down()
    {
        Schema::dropIfExists('tb_questions');
    }
};