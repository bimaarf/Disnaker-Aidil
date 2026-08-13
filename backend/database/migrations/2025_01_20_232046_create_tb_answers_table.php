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
        Schema::create('tb_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')
                ->nullable() // Make question_id nullable
                ->constrained('tb_questions') // Assuming foreign key to questions
                ->onDelete('set null'); // Set question_id to null when the associated question is deleted
            $table->string('answer')->nullable();
            $table->longText('file_path')->nullable(); // This will hold the file path if an image is uploaded
            $table->enum('type', ['radio', 'checkbox', 'text', 'file', 'multiple_file'])->default('radio');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tb_answers');
    }
};
