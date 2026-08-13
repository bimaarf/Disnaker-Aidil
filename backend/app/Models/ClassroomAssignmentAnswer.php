<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassroomAssignmentAnswer extends Model
{
    use HasFactory;

    protected $table = 'classroom_assignment_answers';
    protected $fillable = [
        'assignment_id',
        'question_id',
        'user_id',
        'page',
        'sort_order',
        'question_snapshot',
        'question_label_snapshot',
        'question_type_snapshot',
        'question_options_snapshot',
        'question_file_types_snapshot',
        'question_is_required_snapshot',
        'answer_data',
        'is_correct',
        'awarded_points',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
        'awarded_points' => 'integer',
        'question_options_snapshot' => 'array',
        'question_file_types_snapshot' => 'array',
        'question_is_required_snapshot' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    // Relasi ke assignment
    public function assignment()
    {
        return $this->belongsTo(ClassroomAssignment::class, 'assignment_id');
    }

    // Relasi ke question
    public function question()
    {
        return $this->belongsTo(ClassroomAssignmentQuestion::class, 'question_id');
    }

    // Relasi ke user (siswa yang menjawab)
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    // Scope untuk mendapatkan jawaban berdasarkan assignment dan user
    public function scopeByAssignmentAndUser($query, $assignmentId, $userId)
    {
        return $query->where('assignment_id', $assignmentId)
                     ->where('user_id', $userId);
    }

    // Scope untuk mendapatkan semua jawaban dalam assignment
    public function scopeByAssignment($query, $assignmentId)
    {
        return $query->where('assignment_id', $assignmentId);
    }

    // Scope untuk mendapatkan jawaban dengan informasi user
    public function scopeWithUser($query)
    {
        return $query->with(['user:id,name,email']);
    }

    // Scope untuk mendapatkan jawaban yang sudah disubmit per user
    public function scopeSubmittedAnswers($query)
    {
        return $query->select('assignment_id', 'user_id', 'created_at')
                     ->groupBy('assignment_id', 'user_id', 'created_at')
                     ->orderBy('created_at', 'desc');
    }

    /*
    |--------------------------------------------------------------------------
    | Static Methods
    |--------------------------------------------------------------------------
    */

    // Cek apakah user sudah submit jawaban untuk assignment ini
    public static function hasUserSubmitted($assignmentId, $userId)
    {
        return self::where('assignment_id', $assignmentId)
                   ->where('user_id', $userId)
                   ->exists();
    }

    // Hitung total respondent untuk assignment
    public static function countRespondents($assignmentId)
    {
        return self::where('assignment_id', $assignmentId)
                   ->distinct('user_id')
                   ->count('user_id');
    }

    // Mendapatkan semua respondent dengan informasi user
    public static function getRespondents($assignmentId)
    {
        return self::where('assignment_id', $assignmentId)
                   ->with(['user:id,name,email'])
                   ->select('user_id', 'created_at')
                   ->groupBy('user_id', 'created_at')
                   ->orderBy('created_at', 'desc')
                   ->get();
    }

    // Mendapatkan jawaban yang dikelompokkan per user
    public static function getGroupedByUser($assignmentId)
    {
        return self::with(['user:id,name,email', 'question:id,question,label,type'])
                   ->where('assignment_id', $assignmentId)
                   ->orderBy('user_id')
                   ->orderBy('created_at')
                   ->get()
                   ->groupBy('user_id')
                   ->map(function ($userAnswers) {
                       return [
                           'user' => $userAnswers->first()->user,
                           'answers' => $userAnswers,
                           'submitted_at' => $userAnswers->first()->created_at,
                           'total_answers' => $userAnswers->count()
                       ];
                   });
    }

    // Simpan data sesuai tipe
    public function setAnswerDataAttribute($value)
    {
        switch ($this->question_type_snapshot) {
            case 'text':
            case 'radio':
                // selalu simpan string (atau null kalau kosong)
                $this->attributes['answer_data'] = json_encode($value ?? null);
                break;

            case 'checkbox':
            case 'file':
            case 'multiple_file':
                // selalu simpan array
                $arrayValue = is_array($value) ? $value : ($value ? [$value] : []);
                $this->attributes['answer_data'] = json_encode($arrayValue);
                break;

            default:
                $this->attributes['answer_data'] = json_encode($value);
        }
    }

    // Ambil data sesuai tipe
    public function getAnswerDataAttribute($value)
    {
        $decoded = json_decode($value, true);

        switch ($this->question_type_snapshot) {
            case 'text':
            case 'radio':
                return is_array($decoded) ? reset($decoded) : $decoded; // string tunggal

            case 'checkbox':
            case 'file':
            case 'multiple_file':
                return is_array($decoded) ? $decoded : ($decoded ? [$decoded] : []); // array

            default:
                return $decoded;
        }
    }
}
