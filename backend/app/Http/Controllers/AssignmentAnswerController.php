<?php

namespace App\Http\Controllers;

use App\Models\ClassroomAssignment;
use App\Models\ClassroomAssignmentQuestion;
use App\Models\ClassroomAssignmentAnswer;
use App\Models\ClassroomAssignmentSubmission;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Storage;

class AssignmentAnswerController extends Controller
{
    public function index($assignmentId)
    {
        try {
            $user = Auth::user();
            $canViewAll = $user->hasRole(['administrator', 'super admin', 'teacher']);

            if ($canViewAll) {
                // Ambil semua jawaban
                $answers = ClassroomAssignmentAnswer::with(['user:id,name,email', 'question:id,question,label,type'])
                    ->where('assignment_id', $assignmentId)
                    ->orderBy('user_id')
                    ->orderBy('page')
                    ->orderBy('sort_order')
                    ->get();

                $assignment = ClassroomAssignment::findOrFail($assignmentId);

                // Ambil semua submission
                $submissions = ClassroomAssignmentSubmission::with([
                    'student:id,name,email',
                    'gradedBy:id,name,email',
                    'files'
                ])
                ->where('type', $assignment->type)
                ->where('assignment_id', $assignmentId)
                ->get()
                ->mapWithKeys(function ($submission) {
                    return [$submission->student_id => $submission];
                });

                // Group by user
                $groupedAnswers = $answers->groupBy('user_id')->map(function ($userAnswers) use ($submissions, $canViewAll) {
                    $userId = $userAnswers->first()->user_id;
                    $submission = $submissions->get($userId);

                    return [
                        'user' => $userAnswers->first()->user,
                        'submission' => $submission,
                        'answers' => $userAnswers->map(function ($answer) use ($submission, $canViewAll) {
                            return $this->normalizeAnswerForResponse($answer, $submission, $canViewAll);
                        }),
                        'submitted_at' => $userAnswers->first()->created_at
                    ];
                });

                return response()->json([
                    'success' => true,
                    'answers' => $answers->map(function ($answer) use ($submissions, $canViewAll) {
                        $submission = $submissions->get($answer->user_id);
                        return $this->normalizeAnswerForResponse($answer, $submission, $canViewAll);
                    }),
                    'grouped_answers' => $groupedAnswers,
                    'can_view_all' => true,
                    'total_respondents' => $groupedAnswers->count()
                ]);
            } else {
                // Ambil jawaban user sendiri
                $answers = ClassroomAssignmentAnswer::where('assignment_id', $assignmentId)
                    ->where('user_id', $user->id)
                    ->orderBy('page')
                    ->orderBy('sort_order')
                    ->get();

                $submission = ClassroomAssignmentSubmission::where('assignment_id', $assignmentId)
                    ->where('student_id', $user->id)
                    ->first();

                $hasSubmitted = $answers->isNotEmpty();

                return response()->json([
                    'success' => true,
                    'answers' => $answers->map(function ($answer) use ($submission, $canViewAll) {
                        return $this->normalizeAnswerForResponse($answer, $submission, $canViewAll);
                    }),
                    'can_view_all' => false,
                    'has_submitted' => $hasSubmitted,
                    'is_readonly' => $hasSubmitted
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch answers: ' . $e->getMessage()
            ], 500);
        }
    }


    public function store(Request $request, $assignmentId)
    {
        // 🔹 Normalisasi input answers
        $answers = $request->input('answers');
        if (is_string($answers)) {
            $decoded = json_decode($answers, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $answers = $decoded;
                $request->merge(['answers' => $answers]);
            }
        }

        // 🔹 Validasi awal
        $validatedData = $request->validate([
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|exists:classroom_assignment_questions,id',
            // jangan pakai "required" di sini → kita cek manual di bawah
            'answers.*.answer_data' => 'nullable',
        ]);

        $userId = auth()->id();
        $assignment = ClassroomAssignment::findOrFail($assignmentId);

        if (!$assignment->can_submit) {
            return response()->json([
                'status' => 'error',
                'message' => 'Assignment ini sudah tidak bisa disubmit.'
            ], 403);
        }

        $canResubmit = $assignment->metadata['allow_resubmit'] ?? true;

        $createdAnswers = [];

        foreach ($validatedData['answers'] as $answerData) {
            $question = ClassroomAssignmentQuestion::findOrFail($answerData['question_id']);

            // 🔹 Cek kalau pertanyaan required
            if ($question->is_required) {
                $isEmpty =
                    $answerData['answer_data'] === null ||
                    $answerData['answer_data'] === '' ||
                    (is_array($answerData['answer_data']) && count($answerData['answer_data']) === 0);

                if ($isEmpty) {
                    return response()->json([
                        'status'  => 'error',
                        'message' => "Jawaban untuk pertanyaan '{$question->label}' wajib diisi.",
                        'errors'  => [
                            "answers.{$question->id}.answer_data" => ["Pertanyaan ini wajib diisi."]
                        ]
                    ], 422);
                }
            }

            // 🔹 Tangani file upload
            if (in_array($question->type, ['file', 'multiple_file'])) {
                $files = $request->file("answers_{$question->id}_files", []);
                $storedFiles = [];
                foreach ($files as $file) {
                    $path = $file->store("assignments/{$assignmentId}/{$userId}", 'public');
                    $storedFiles[] = $path;
                }
                $answerData['answer_data'] = array_merge(
                    $answerData['answer_data'] ?? [],
                    $storedFiles
                );
            }

            // 🔹 Normalize & validate
            $normalizedAnswerData = $this->normalizeAndValidateAnswerData(
                $question,
                $answerData['answer_data'],
                $request
            );

            // Snapshot pertanyaan
            $questionSnapshot = [
                'question'    => $question->question,
                'label'       => $question->label,
                'type'        => $question->type,
                'options'     => $question->options,
                'file_types'  => $question->file_types,
                'is_required' => $question->is_required,
            ];

            // Auto grading
            [$isCorrect, $awardedPoints] = $this->computeAutoScore($question, $normalizedAnswerData);

            $existingAnswer = ClassroomAssignmentAnswer::where('assignment_id', $assignmentId)
                ->where('question_id', $question->id)
                ->where('user_id', $userId)
                ->first();

            if ($existingAnswer && $canResubmit) {
                if (in_array($question->type, ['file', 'multiple_file'])) {
                    $this->deleteRemovedFiles($existingAnswer->answer_data, $normalizedAnswerData);
                }

                $existingAnswer->update([
                    'page'                          => $question->page,
                    'sort_order'                    => $question->sort_order,
                    'question_snapshot'             => $questionSnapshot['question'],
                    'question_label_snapshot'       => $questionSnapshot['label'],
                    'question_type_snapshot'        => $questionSnapshot['type'],
                    'question_options_snapshot'     => $questionSnapshot['options'],
                    'question_file_types_snapshot'  => $questionSnapshot['file_types'],
                    'question_is_required_snapshot' => $questionSnapshot['is_required'],
                    'answer_data'                   => $normalizedAnswerData,
                    'is_correct'                    => $isCorrect,
                    'awarded_points'                 => $awardedPoints,
                ]);

                $createdAnswers[] = $this->normalizeAnswerForResponse($existingAnswer);
            } else {
                $answer = ClassroomAssignmentAnswer::create([
                    'assignment_id'                  => $assignmentId,
                    'question_id'                    => $question->id,
                    'user_id'                        => $userId,
                    'page'                           => $question->page,
                    'sort_order'                     => $question->sort_order,
                    'question_snapshot'              => $questionSnapshot['question'],
                    'question_label_snapshot'        => $questionSnapshot['label'],
                    'question_type_snapshot'         => $questionSnapshot['type'],
                    'question_options_snapshot'      => $questionSnapshot['options'],
                    'question_file_types_snapshot'   => $questionSnapshot['file_types'],
                    'question_is_required_snapshot'  => $questionSnapshot['is_required'],
                    'answer_data'                    => $normalizedAnswerData,
                    'is_correct'                     => $isCorrect,
                    'awarded_points'                 => $awardedPoints,
                ]);

                $createdAnswers[] = $this->normalizeAnswerForResponse($answer);
            }
        }
        //
            $userId = Auth::id();

            $isLate = false;
            if ($assignment->available_until) {
                $isLate = now() > $assignment->available_until;
            }
            $submission = ClassroomAssignmentSubmission::where('type', $assignment->type)
            ->firstOrCreate([
                'assignment_id' => $assignment->id,
                'student_id' => $userId,
            ], [
                'enrolled_date' => now(),
            ]);
            $maxPoints = ClassroomAssignmentQuestion::where('assignment_id', $assignmentId)
                ->sum('points'); // pastikan ada kolom points di tabel question

            $submissionData = [
                'type' => 'form',
                'status' => 'submitted',
                'max_points' => $maxPoints,
                'is_late' => $isLate,
            ];
            $submission->update($submissionData);

        return response()->json([
            'status' => 'success',
            'data'   => $createdAnswers,
        ]);
    }




    /**
     * Normalize and validate answer data based on question type.
     */
    protected function normalizeAndValidateAnswerData($question, $data, $request)
    {
        switch ($question->type) {
            case 'text':
                return is_string($data) ? trim($data) : (string)$data;

            case 'radio':
                // Radio should always be a single string value
                if (is_array($data)) {
                    return !empty($data) ? (string)$data[0] : '';
                }
                if (is_object($data)) {
                    return $data->value ?? $data->id ?? $data->label ?? '';
                }
                return (string)$data;

            case 'checkbox':
                // Checkbox should always be an array
                if (!is_array($data)) {
                    return $data ? [(string)$data] : [];
                }
                return array_map(function($item) {
                    if (is_object($item)) {
                        return $item->value ?? $item->id ?? $item->label ?? '';
                    }
                    return (string)$item;
                }, $data);

            case 'file':
            case 'multiple_file':
                $existing = is_array($data) ? $data : ($data ? [$data] : []);
                $fieldName = "answer_{$question->id}_files";
                $uploadedFiles = $request->file($fieldName) ?? [];
                if (!is_array($uploadedFiles)) $uploadedFiles = [$uploadedFiles];
                $allFiles = array_merge($existing, $uploadedFiles);
                return $this->handleFileUploads($allFiles, $question->type === 'multiple_file');

            default:
                return $data;
        }
    }

    /**
     * Handle file uploads and return file paths
     */
    protected function handleFileUploads($data, $isMultiple = false)
    {
        if (!$data) return [];

        $files = is_array($data) ? $data : [$data];
        $filePaths = [];

        foreach ($files as $file) {
            if ($file instanceof \Illuminate\Http\UploadedFile) {
                // Validate file
                if (!$file->isValid()) {
                    throw new \Exception('Invalid file upload');
                }

                // Generate unique filename
                $filename = time() . '_' . uniqid() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('uploads/assignments', $filename, 'public');

                if ($path) {
                    $filePaths[] = $path;
                } else {
                    throw new \Exception('Failed to store file: ' . $file->getClientOriginalName());
                }
            } elseif (is_string($file) && !empty($file)) {
                // Already stored file path
                $filePaths[] = $file;
            }
        }

        return $isMultiple ? $filePaths : (isset($filePaths[0]) ? [$filePaths[0]] : []);
    }

    /**
     * Delete removed files when updating
     */
    protected function deleteRemovedFiles($oldData, $newData)
    {
        $oldFiles = is_array($oldData) ? $oldData : ($oldData ? [$oldData] : []);
        $newFiles = is_array($newData) ? $newData : ($newData ? [$newData] : []);

        $removed = array_diff($oldFiles, $newFiles);

        foreach ($removed as $removedPath) {
            if (is_string($removedPath) && Storage::disk('public')->exists($removedPath)) {
                Storage::disk('public')->delete($removedPath);
            }
        }
    }

    /**
     * Normalize answer for API response
     */
    protected function normalizeAnswerForResponse($answer, $submission = null, $canViewAll = false)
    {
        $normalized = $answer->toArray();

        // Pastikan format answer_data sesuai tipe pertanyaan
        $type = $answer->question_type_snapshot ?? 'text';
        $answerData = $answer->answer_data;

        switch ($type) {
            case 'text':
            case 'radio':
                $normalized['answer_data'] = is_array($answerData)
                    ? (isset($answerData[0]) ? $answerData[0] : '')
                    : (string)$answerData;
                break;

            case 'checkbox':
            case 'file':
            case 'multiple_file':
                $normalized['answer_data'] = is_array($answerData)
                    ? $answerData
                    : ($answerData ? [$answerData] : []);
                break;

            default:
                $normalized['answer_data'] = $answerData;
        }

        // 🔹 Filter is_correct & awarded_points untuk user biasa
        // 🔹 Filter is_correct & awarded_points untuk user biasa
        if (!$canViewAll) {
            if (!$submission || ($submission->status !== 'graded' && $submission->status !== 'returned')) {
                unset($normalized['is_correct']);
                unset($normalized['awarded_points']);
            }
        }


        return $normalized;
    }




    /**
     * Get assignment summary (for admins/teachers)
     */
    public function getSummary($assignmentId)
    {
        try {
            $user = Auth::user();

            // Check if user can view summary
            if (!$user->hasRole(['administrator', 'super admin', 'teacher'])) {
                return response()->json([
                    'success' => false,
                    'error' => 'Unauthorized to view assignment summary'
                ], 403);
            }

            $assignment = ClassroomAssignment::findOrFail($assignmentId);

            // Get all respondents
            $respondents = ClassroomAssignmentAnswer::with('user:id,name,email')
                ->where('assignment_id', $assignmentId)
                ->select('user_id', 'created_at')
                ->groupBy('user_id')
                ->orderBy('created_at')
                ->get();

            // Get questions count
            $questionsCount = ClassroomAssignmentQuestion::where('assignment_id', $assignmentId)->count();

            // Get detailed statistics per question
            $questionStats = ClassroomAssignmentQuestion::where('assignment_id', $assignmentId)
                ->withCount(['answers as total_responses'])
                ->get();

            return response()->json([
                'success' => true,
                'assignment' => $assignment,
                'total_respondents' => $respondents->count(),
                'total_questions' => $questionsCount,
                'respondents' => $respondents,
                'question_statistics' => $questionStats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch assignment summary: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Hitung skor otomatis untuk pertanyaan radio/checkbox
     */
    protected function computeAutoScore(ClassroomAssignmentQuestion $question, $answerData)
    {
        // Default: tidak dinilai otomatis
        $isCorrect = null;
        $awardedPoints = null;

        // Hanya auto-grade untuk radio & checkbox
        if (in_array($question->type, ['radio', 'checkbox']) && is_array($question->options)) {
            // Ambil jawaban benar dari options
            $correctOptions = collect($question->options)
                ->filter(fn($opt) => isset($opt['is_correct']) && $opt['is_correct'])
                ->pluck('value')
                ->map(fn($v) => (string)$v)
                ->toArray();

            // Jawaban user
            $userAnswers = is_array($answerData)
                ? array_map('strval', $answerData)
                : [(string)$answerData];

            sort($correctOptions);
            sort($userAnswers);

            if ($correctOptions && $userAnswers) {
                $isCorrect = ($correctOptions == $userAnswers);
                $awardedPoints = $isCorrect ? $question->points : 0;
            }
        }

        return [$isCorrect, $awardedPoints];
    }
    /**
     * Update is_correct & awarded_points (manual grading)
    */
    public function gradeAnswer(Request $request, $assignmentId, $answerId)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'is_correct' => 'nullable|boolean',
            'awarded_points' => 'nullable|integer|min:0',
        ]);

        // Pastikan is_correct jadi 1 atau 0 hanya jika key ada
        if (array_key_exists('is_correct', $validated) && $validated['is_correct'] !== null) {
            $validated['is_correct'] = $validated['is_correct'] ? 1 : 0;
        } else {
            $validated['is_correct'] = null;
        }

        $answer = ClassroomAssignmentAnswer::where('id', $answerId)
            ->where('assignment_id', $assignmentId)
            ->with('question')
            ->firstOrFail();

        // Jika guru hanya set is_correct → otomatis points mengikuti
        if (isset($validated['is_correct']) && $validated['is_correct'] !== null && !isset($validated['awarded_points'])) {
            $validated['awarded_points'] = $validated['is_correct'] ? $answer->question->points : 0;
        }

        $answer->update($validated);

        // 🔹 Ambil submission milik user ini
        $submission = ClassroomAssignmentSubmission::where('assignment_id', $assignmentId)
            ->where('student_id', $answer->user_id)
            ->first();

        // 🔹 Cek apakah user grader punya akses penuh
        $canViewAll = $user->hasRole(['administrator', 'super admin', 'teacher']);

        return response()->json([
            'success' => true,
            'message' => 'Answer graded successfully',
            'answer'  => $this->normalizeAnswerForResponse($answer, $submission, $canViewAll)
        ]);
    }

}
