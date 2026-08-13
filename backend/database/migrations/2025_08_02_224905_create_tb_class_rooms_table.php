<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // 1. classrooms
        Schema::create('classrooms', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->longText('description')->nullable();
            $table->string('subject')->nullable();
            $table->string('grade_level')->nullable();
            $table->integer('capacity')->default(30);
            $table->enum('status', ['active', 'inactive', 'archived'])->default('active');
            $table->string('room_number')->nullable();
            $table->string('schedule')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->json('settings')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['status', 'created_at']);
            $table->index('code');
        });

        // 2. classroom_teachers
        Schema::create('classroom_teachers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('classroom_id');
            $table->unsignedBigInteger('teacher_id');
            $table->enum('role', ['main_teacher', 'assistant_teacher', 'guest_teacher'])->default('main_teacher');
            $table->boolean('is_active')->default(true);
            $table->date('assigned_date')->nullable();
            $table->date('removed_date')->nullable();
            $table->json('permissions')->nullable();
            $table->timestamps();

            $table->foreign('classroom_id')->references('id')->on('classrooms')->onDelete('cascade');
            $table->foreign('teacher_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['classroom_id', 'teacher_id', 'role']);
            $table->index(['teacher_id', 'is_active']);
        });

        // 3. classroom_students
        Schema::create('classroom_students', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('classroom_id');
            $table->unsignedBigInteger('student_id');
            $table->enum('status', ['active', 'inactive', 'dropped', 'completed'])->default('active');
            $table->date('enrolled_date');
            $table->date('dropped_date')->nullable();
            $table->decimal('attendance_percentage', 5, 2)->default(0);
            $table->integer('grade')->nullable();
            $table->text('notes')->nullable();
            $table->json('progress')->nullable();
            $table->date('joined_date')->nullable();
            $table->timestamps();

            $table->foreign('classroom_id')->references('id')->on('classrooms')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['classroom_id', 'student_id']);
            $table->index(['student_id', 'status']);
            $table->index(['classroom_id', 'status']);
        });

        // 4. classroom_announcements
        Schema::create('classroom_announcements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('classroom_id');
            $table->unsignedBigInteger('author_id');
            $table->string('title');
            $table->text('content');
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->boolean('is_pinned')->default(false);
            $table->boolean('is_published')->default(true);
            $table->datetime('published_at')->nullable();
            $table->json('attachments')->nullable();
            $table->integer('views_count')->default(0);
            $table->timestamps();

            $table->foreign('classroom_id')->references('id')->on('classrooms')->onDelete('cascade');
            $table->foreign('author_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['classroom_id', 'is_published', 'created_at'], 'cls_ann_idx');
        });

        // 5. classroom_materials
        Schema::create('classroom_materials', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('classroom_id');
            $table->unsignedBigInteger('uploaded_by');
            $table->string('title');
            $table->longText('description')->nullable();
            $table->enum('type', ['document', 'video', 'link', 'assignment', 'quiz'])->default('document');
            $table->boolean('is_visible')->default(true);
            $table->datetime('available_from')->nullable();
            $table->datetime('available_until')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('classroom_id')->references('id')->on('classrooms')->onDelete('cascade');
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('cascade');
            $table->index(['classroom_id', 'type', 'is_visible']);
        });

        // 6. classroom_material_files
        Schema::create('classroom_material_files', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('material_id');
            $table->enum('type', ['file', 'link'])->default('file');
            $table->string('path')->nullable();
            $table->string('file_size')->nullable();
            $table->string('file_type')->nullable();
            $table->integer('download_count')->default(0);
            $table->integer('view_count')->default(0);
            $table->timestamps();

            $table->foreign('material_id')->references('id')->on('classroom_materials')->onDelete('cascade');
            $table->index(['material_id', 'type']);
        });

        // 7. classroom_assignments
        Schema::create('classroom_assignments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('classroom_id');
            $table->enum('type', ['document', 'form'])->default('document');
            $table->unsignedBigInteger('uploaded_by');
            $table->string('title');
            $table->longText('description')->nullable();
            $table->boolean('is_visible')->default(true);
            $table->datetime('available_from')->nullable();
            $table->datetime('available_until')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('classroom_id')->references('id')->on('classrooms')->onDelete('cascade');
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('cascade');
            $table->index(['classroom_id', 'type', 'is_visible']);
        });

        // 8. classroom_assignment_files
        Schema::create('classroom_assignment_files', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assignment_id');
            $table->enum('type', ['file', 'link'])->default('file');
            $table->string('path')->nullable();
            $table->string('file_size')->nullable();
            $table->string('file_type')->nullable();
            $table->integer('download_count')->default(0);
            $table->integer('view_count')->default(0);
            $table->timestamps();

            $table->foreign('assignment_id')->references('id')->on('classroom_assignments')->onDelete('cascade');
            $table->index(['assignment_id', 'type']);
        });

        // 9. classroom_assignment_submissions
        Schema::create('classroom_assignment_submissions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assignment_id');
            $table->unsignedBigInteger('student_id');
            $table->enum('type', ['document', 'form'])->default('document');
            $table->text('submission_text')->nullable();
            $table->enum('status', ['draft', 'submitted', 'graded', 'returned'])->default('draft');
            $table->datetime('submitted_at')->nullable();
            $table->datetime('graded_at')->nullable();

            $table->decimal('points',8,2)->nullable();
            $table->decimal('max_points',8,2)->nullable();

            $table->bigInteger('attempt_number')->nullable();

            $table->text('teacher_feedback')->nullable();
            $table->unsignedBigInteger('graded_by')->nullable();
            $table->boolean('is_late')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('assignment_id')->references('id')->on('classroom_assignments')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('graded_by')->references('id')->on('users')->onDelete('set null');
            $table->unique(['assignment_id']);
            $table->index(['student_id', 'status']);
            $table->index(['assignment_id', 'status']);
            $table->index(['submitted_at']);
        });



        // 10. classroom_assignment_submission_files
        Schema::create('classroom_assignment_submission_files', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('submission_id');
            $table->string('original_name');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_size');
            $table->string('file_type');
            $table->string('mime_type');
            $table->unsignedBigInteger('uploaded_by');
            $table->datetime('uploaded_at');
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable(); // additional file info if needed
            $table->timestamps();

            $table->foreign('submission_id')->references('id')->on('classroom_assignment_submissions')->onDelete('cascade');
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('cascade');
            $table->index(['submission_id', 'is_active'], 'sub_files_sub_id_active_idx');
            $table->index(['uploaded_by'], 'sub_files_uploaded_by_idx');
            $table->index(['uploaded_at'], 'sub_files_uploaded_at_idx');
        });

        // 11. classroom_attendance
        Schema::create('classroom_meetings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('classroom_id');
            $table->unsignedBigInteger('created_by'); // teacher yang membuat
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('meeting_date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->enum('status', ['scheduled', 'ongoing', 'completed', 'cancelled'])->default('scheduled');
            $table->enum('type', ['regular', 'exam', 'quiz', 'presentation', 'field_trip'])->default('regular');
            $table->text('agenda')->nullable(); // agenda pertemuan
            $table->text('materials_covered')->nullable(); // materi yang dibahas
            $table->text('homework_assigned')->nullable(); // tugas yang diberikan
            $table->text('notes')->nullable(); // catatan umum pertemuan
            $table->integer('duration_minutes')->nullable(); // durasi dalam menit
            $table->string('location')->nullable(); // lokasi pertemuan
            $table->boolean('is_mandatory')->default(true);
            $table->json('metadata')->nullable(); // data tambahan
            $table->timestamps();

            $table->foreign('classroom_id')->references('id')->on('classrooms')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');

            $table->index(['classroom_id', 'meeting_date']);
            $table->index(['meeting_date', 'status']);
            $table->index('created_by');
        });

        // 2. classroom_attendances - Tabel kehadiran siswa per pertemuan
        Schema::create('classroom_attendances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('meeting_id');
            $table->unsignedBigInteger('student_id');
            $table->enum('status', ['present', 'absent', 'late', 'excused', 'sick', 'permit'])->default('absent');
            $table->time('check_in_time')->nullable();
            $table->time('check_out_time')->nullable();
            $table->text('notes')->nullable(); // catatan khusus untuk siswa ini
            $table->text('student_notes')->nullable(); // catatan dari siswa (alasan tidak hadir dll)
            $table->unsignedBigInteger('marked_by')->nullable(); // teacher yang menandai
            $table->datetime('marked_at')->nullable();
            $table->boolean('is_late')->default(false);
            $table->integer('late_minutes')->nullable(); // berapa menit terlambat
            $table->decimal('participation_score', 3, 1)->nullable(); // skor partisipasi 0-10
            $table->text('participation_notes')->nullable(); // catatan partisipasi
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('meeting_id')->references('id')->on('classroom_meetings')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('marked_by')->references('id')->on('users')->onDelete('set null');

            $table->unique(['meeting_id', 'student_id'], 'attendance_unique');
            $table->index(['student_id', 'status']);
            $table->index(['meeting_id', 'status']);
            $table->index('marked_by');
        });

        // 3. classroom_attendance_notes - Catatan tambahan untuk attendance
        Schema::create('classroom_attendance_notes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('attendance_id');
            $table->unsignedBigInteger('created_by'); // bisa teacher atau student
            $table->enum('type', ['teacher_note', 'student_note', 'parent_note', 'admin_note'])->default('teacher_note');
            $table->text('content');
            $table->boolean('is_private')->default(false); // apakah hanya visible untuk teacher
            $table->datetime('noted_at');
            $table->timestamps();

            $table->foreign('attendance_id')->references('id')->on('classroom_attendances')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');

            $table->index(['attendance_id', 'type']);
            $table->index(['created_by', 'noted_at']);
        });

        // 4. classroom_meeting_materials - Relasi pertemuan dengan materials
        Schema::create('classroom_meeting_materials', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('meeting_id');
            $table->unsignedBigInteger('material_id');
            $table->enum('type', ['main_material', 'reference', 'homework', 'quiz', 'assignment'])->default('main_material');
            $table->text('notes')->nullable(); // catatan hubungan material dengan pertemuan
            $table->boolean('is_required')->default(false);
            $table->timestamps();

            $table->foreign('meeting_id')->references('id')->on('classroom_meetings')->onDelete('cascade');
            $table->foreign('material_id')->references('id')->on('classroom_materials')->onDelete('cascade');

            $table->unique(['meeting_id', 'material_id'], 'meeting_material_unique');
            $table->index(['meeting_id', 'type']);
            $table->index('material_id');
        });

        // 5. classroom_attendance_summary - Summary kehadiran per siswa per bulan
        Schema::create('classroom_attendance_summary', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('classroom_id');
            $table->unsignedBigInteger('student_id');
            $table->year('year');
            $table->tinyInteger('month'); // 1-12
            $table->integer('total_meetings')->default(0);
            $table->integer('present_count')->default(0);
            $table->integer('absent_count')->default(0);
            $table->integer('late_count')->default(0);
            $table->integer('excused_count')->default(0);
            $table->integer('sick_count')->default(0);
            $table->integer('permit_count')->default(0);
            $table->decimal('attendance_percentage', 5, 2)->default(0); // persentase kehadiran
            $table->decimal('punctuality_percentage', 5, 2)->default(0); // persentase ketepatan waktu
            $table->decimal('average_participation_score', 3, 1)->nullable();
            $table->datetime('last_calculated')->nullable();
            $table->timestamps();

            $table->foreign('classroom_id')->references('id')->on('classrooms')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('users')->onDelete('cascade');

            $table->unique(['classroom_id', 'student_id', 'year', 'month'], 'attendance_summary_unique');
            $table->index(['student_id', 'year', 'month']);
            $table->index(['classroom_id', 'year', 'month']);
        });
    }
};
