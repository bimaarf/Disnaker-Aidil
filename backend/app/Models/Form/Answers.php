<?php

namespace App\Models\Form;

use App\Models\Form\Period;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Answers extends Model
{
    use HasFactory;

    protected $table = 'tb_answers';
    protected $fillable = ['question_id', 'question', 'page', 'sort_order', 'period_id', 'label', 'submission_id', 'user_id', 'answer', 'file_path', 'type', 'options'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function period()
{
    return $this->belongsTo(Period::class, 'period_id', 'id');
}

    public function question()
    {
        return $this->belongsTo(Questions::class);
    }

}
