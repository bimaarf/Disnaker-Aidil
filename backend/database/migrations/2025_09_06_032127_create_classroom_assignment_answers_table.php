<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classroom_assignment_answers', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('assignment_id'); // relasi ke classroom_assignments
            $table->unsignedBigInteger('question_id')->nullable(); // relasi ke classroom_assignment_questions
            $table->unsignedBigInteger('user_id'); // student who submitted
            $table->integer('page')->default(1);
            $table->integer('sort_order')->default(0);
            // Snapshot pertanyaan saat disubmit
            $table->text('question_snapshot');
            $table->string('question_label_snapshot')->nullable();
            $table->enum('question_type_snapshot', ['radio', 'checkbox', 'text', 'file', 'multiple_file']);
            $table->json('question_options_snapshot')->nullable();
            $table->longText('question_file_types_snapshot')->nullable();
            $table->boolean('question_is_required_snapshot');

            // Jawaban user (bisa teks, array, file, dll.)
            $table->json('answer_data');

            // Status benar / salah (opsional, bisa untuk form quiz)
            $table->boolean('is_correct')->nullable();
            $table->decimal('awarded_points',8,2)->nullable();


            $table->timestamps();

            // Foreign keys
            $table->foreign('assignment_id')
                ->references('id')
                ->on('classroom_assignments')
                ->onDelete('cascade');

            $table->foreign('question_id')
                ->references('id')
                ->on('classroom_assignment_questions')
                ->onDelete('set null');

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            // Indexes
            $table->index(['assignment_id', 'user_id'], 'idx_assignment_user');
            $table->index(['assignment_id', 'question_id'], 'idx_assignment_question');
            $table->index(['assignment_id', 'user_id', 'question_id'], 'idx_assignment_user_question');
            $table->index('created_at', 'idx_created_at');

            // Constraint unik: user hanya boleh 1 jawaban per pertanyaan per assignment
            $table->unique(['assignment_id', 'question_id', 'user_id'], 'unique_answer_per_question_per_user');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classroom_assignment_answers');
    }
};
