<?php

namespace App\Models\Form;

use App\Models\Form\Period;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Questions extends Model
{
        use HasFactory;
        protected $table = 'tb_questions';
        protected $fillable = [
        'question',
        'period_id',
        'type',
        'label',
        'options',
        'page',
        'author_id',
        'file_types',
        'sort_order',
        'is_required'

    ];
    protected $casts = [
        'options' => 'array',
        'is_required' => 'boolean',
    ];

    public function answers()
    {
        return $this->hasMany(Answers::class); // A question can have many answers
    }
    public function period()
    {
        return $this->belongsTo(Period::class);
    }
    protected $dateFormat = 'Y-m-d H:i:s';

    public function getCreatedAtAttribute($value)
    {
        return Carbon::parse($value)->format($this->dateFormat);
    }

    public function getUpdatedAtAttribute($value)
    {
        return Carbon::parse($value)->format($this->dateFormat);
    }
}
