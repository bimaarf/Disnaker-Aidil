<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('tb_answers', function (Blueprint $table) {
            $table->uuid('submission_id')->nullable()->after('question_id');
            $table->foreignId('period_id')
                ->nullable()
                ->constrained('tb_period')
                ->onDelete('set null')
                ->after('question_id');
                

            $table->integer('page')->default(1)->after('question_id');
            $table->string('label')->nullable()->after('page');
            $table->text('question')->nullable()->after('label');
            
            $table->integer('sort_order')->default(0)->after('question');

            if (!Schema::hasColumn('tb_answers', 'type')) {
                $table->enum('type', ['radio', 'checkbox', 'text', 'file', 'multiple_file'])
                    ->default('radio')
                    ->nullable()
                    ->after('sort_order');
            }

            $table->json('options')->nullable()->after('type');
        });

        if (Schema::hasTable('tb_questions') && Schema::hasColumn('tb_questions', 'page')) {
            if (!Schema::hasColumn('tb_questions', 'sort_order')) {
                Schema::table('tb_questions', function (Blueprint $table) {
                    $table->integer('sort_order')->default(0);
                });
            }

            DB::table('tb_questions')
                ->orderByRaw('COALESCE(page, 1), id')
                ->get()
                ->each(function ($question, $index) {
                    DB::table('tb_questions')
                        ->where('id', $question->id)
                        ->update(['sort_order' => $index]);
                });
        }
    }

    public function down()
    {
        Schema::table('tb_answers', function (Blueprint $table) {
            $table->dropForeign(['period_id']);
            $table->dropColumn(['submission_id', 'period_id', 'question', 'page', 'sort_order', 'label', 'type', 'options']);
        });

        if (Schema::hasTable('tb_questions') && Schema::hasColumn('tb_questions', 'sort_order')) {
            Schema::table('tb_questions', function (Blueprint $table) {
                $table->dropColumn('sort_order');
            });
        }
    }
};
