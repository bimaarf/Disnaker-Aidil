<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('tb_questions', function (Blueprint $table) {
            $table->integer('sort_order')->default(0)->after('page');
        });
        
        DB::table('tb_questions')
            ->orderBy('page')
            ->orderBy('id')
            ->get()
            ->each(function ($question, $index) {
                DB::table('tb_questions')
                    ->where('id', $question->id)
                    ->update(['sort_order' => $index]);
            });
    }

    public function down()
    {
        Schema::table('tb_questions', function (Blueprint $table) {
            $table->dropColumn('sort_order');
        });
    }
};