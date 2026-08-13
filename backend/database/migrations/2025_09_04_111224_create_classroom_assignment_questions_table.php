<?php

// database/migrations/2025_09_04_000001_create_classroom_assignment_questions.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('classroom_assignment_questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assignment_id'); // relasi ke classroom_assignments
            $table->text('question');
            $table->string('label')->nullable();
            $table->enum('type', ['radio', 'checkbox', 'text', 'file', 'multiple_file'])->default('radio');
            $table->json('options')->nullable(); // pilihan jawaban
            $table->longText('file_types')->nullable(); // kalau type = file
            $table->integer('page')->default(1);
            $table->integer('sort_order')->default(0);
            $table->boolean('is_required')->default(false);

            // 🔹 Kolom points
            $table->decimal('points', 8, 2)->default(0);

            $table->unsignedBigInteger('author_id');
            $table->timestamps();

            // Foreign keys
            $table->foreign('assignment_id')
                ->references('id')
                ->on('classroom_assignments')
                ->onDelete('cascade');

            $table->foreign('author_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            // Indexing
            $table->index(['assignment_id', 'page', 'sort_order'], 'assign_questions_idx');
        });
    }

    public function down()
    {
        Schema::dropIfExists('classroom_assignment_questions');
    }
};
