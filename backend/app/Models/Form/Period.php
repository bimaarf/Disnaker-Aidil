<?php

namespace App\Models\Form;

use App\Models\Form\Answers;
use App\Models\Form\Questions;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Period extends Model
{
    use HasFactory;
    protected $table = 'tb_period';
    protected $fillable = ['key', 'title', 'status', 'description', 'is_published'];
    
    public function questions()
    {
        return $this->hasMany(Questions::class, 'period_id');
    }
    
    public function answers()
    {
        return $this->hasMany(Answers::class, 'period_id');
    }
}