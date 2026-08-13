<?php

namespace App\Http\Controllers\Form;

use App\Http\Controllers\Controller;
use App\Models\Form\Questions;
use App\Models\Form\Period;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use Log;

class QuestionController extends Controller
{
    public function show()
    {
        try {
            $questions = Questions::where('author_id', Auth::id())
                ->orderBy('page')
                ->orderBy('sort_order')
                ->get();
            return response()->json([
                'success' => true,
                'questions' => $questions
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch questions',
            ], 500);
        }
    }

    public function view(Request $request)
    {
        try {
            $questions = Questions::where('author_id', Auth::id())
                ->orderBy('page')
                ->orderBy('sort_order')
                ->get();
            return response()->json($questions);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch questions'], 500);
        }
    }

    public function find($periodKey)
    {
        try {
            $period = Period::where('key', $periodKey)->with(['questions' => function ($query) {
                $query->orderBy('page')->orderBy('sort_order');
            }])->first();
            if (!$period) {
                return response()->json(['error' => 'Period not found'], 404);
            }
            return response()->json([
                'success' => true,
                'period_title' => $period->title,
                'period_description' => $period->description,
                'period_status' => $period->status,
                'period_is_published' => $period->is_published,
                'questions' => $period->questions
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch questions'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'label' => 'nullable|string|max:255',
                'questions' => 'required|array',
                'questions.*.question' => 'required|string|max:255',
                'questions.*.period_key' => 'required|string|exists:tb_period,key',
                'questions.*.label' => 'nullable|string|max:255',
                'questions.*.type' => 'required|in:radio,checkbox,text,file,multiple_file',
                'questions.*.options' => 'nullable|array',
                'questions.*.fileTypes' => 'nullable|array',
                'questions.*.page' => 'required|integer|min:1',
                'questions.*.localIndex' => 'nullable|integer|min:0',
                'questions.*.sort_order' => 'nullable|integer|min:0',
                'questions.*.is_required' => 'nullable|boolean', // Tambahkan validasi is_required
            ]);

            $createdQuestions = [];
            $rootLabel = $validatedData['label'] ?? null;

            DB::beginTransaction();

            foreach ($validatedData['questions'] as $questionData) {
                $fileTypes = isset($questionData['fileTypes']) ? json_encode($questionData['fileTypes']) : null;

                if ($questionData['type'] === 'multiple_file' && empty($questionData['fileTypes'])) {
                    $fileTypes = json_encode(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt']);
                }

                $period = Period::where('key', $questionData['period_key'])->first();
                if (!$period) {
                    throw new \Exception('Period not found for the provided key');
                }

                $page = $questionData['page'];
                $localIndex = isset($questionData['localIndex']) ? $questionData['localIndex'] : null;
                $sortOrder = null;

                if ($localIndex !== null) {
                    Questions::where('period_id', $period->id)
                        ->where('page', $page)
                        ->where('sort_order', '>=', $localIndex)
                        ->increment('sort_order');
                    $sortOrder = $localIndex;
                } elseif (isset($questionData['sort_order'])) {
                    $sortOrder = $questionData['sort_order'];
                    Questions::where('period_id', $period->id)
                        ->where('page', $page)
                        ->where('sort_order', '>=', $sortOrder)
                        ->increment('sort_order');
                } else {
                    $lastSortOrder = Questions::where('period_id', $period->id)
                        ->where('page', $page)
                        ->max('sort_order');
                    $sortOrder = is_null($lastSortOrder) ? 0 : $lastSortOrder + 1;
                }

                $question = Questions::create([
                    'question' => $questionData['question'],
                    'period_key' => $period->key,
                    'period_id' => $period->id,
                    'type' => $questionData['type'],
                    'label' => $questionData['label'] ?? $rootLabel,
                    'page' => $page,
                    'author_id' => Auth::id(),
                    'options' => json_encode($questionData['options'] ?? []),
                    'fileTypes' => $fileTypes,
                    'sort_order' => $sortOrder,
                    'is_required' => $questionData['is_required'] ?? false, // Simpan is_required
                ]);

                $createdQuestions[] = $question;
            }

            $this->normalizeSortOrder($period->id, $page);

            DB::commit();

            return response()->json([
                'success' => true,
                'status' => 201,
                'message' => 'Questions created successfully',
                'questions' => collect($createdQuestions)->map(function ($question) {
                    $question->period_id = $question->period_id;
                    return $question;
                })
            ], 201);
        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => 'Database error: ' . $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    private function normalizeSortOrder($periodId, $page)
    {
        $questions = Questions::where('period_id', $periodId)
            ->where('page', $page)
            ->orderBy('sort_order')
            ->get();

        foreach ($questions as $index => $question) {
            if ($question->sort_order !== $index) {
                $question->update(['sort_order' => $index]);
            }
        }
    }

    public function update(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'label' => 'nullable|string|max:255',
                'questions' => 'required|array',
                'questions.*.id' => 'required|exists:tb_questions,id',
                'questions.*.label' => 'nullable|string|max:255',
                'questions.*.question' => 'required|string|max:255',
                'questions.*.type' => 'required|in:radio,checkbox,text,file,multiple_file',
                'questions.*.options' => 'nullable|array',
                'questions.*.fileTypes' => 'nullable|string|max:255',
                'questions.*.page' => 'required|integer|min:1',
                'questions.*.sort_order' => 'nullable|integer|min:0',
                'questions.*.is_required' => 'nullable|boolean', // Tambahkan validasi is_required
            ]);
    
            DB::beginTransaction();
    
            $updatedQuestions = [];
    
            foreach ($validatedData['questions'] as $questionData) {
                $question = Questions::find($questionData['id']);
                if (!$question) {
                    throw new \Exception('Question not found');
                }
    
                $fileTypes = $questionData['fileTypes'] ?? [];
                $fileTypes = is_array($fileTypes) ? json_encode($fileTypes) : $fileTypes;
    
                $question->update([
                    'question' => $questionData['question'],
                    'type' => $questionData['type'],
                    'label' => $questionData['label'],
                    'page' => $questionData['page'],
                    'sort_order' => $questionData['sort_order'] ?? $question->sort_order,
                    'options' => $questionData['options'] ? json_encode($questionData['options']) : null,
                    'fileTypes' => $fileTypes,
                    'is_required' => $questionData['is_required'] ?? $question->is_required, // Perbarui is_required
                ]);
    
                $updatedQuestions[] = $question;
            }
    
            DB::commit();
    
            return response()->json([
                'success' => true,
                'status' => 200,
                'message' => 'Questions updated successfully',
                'questions' => $updatedQuestions
            ], 200);
        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage(),
            ], 500);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update questions: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function updateOrder(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'period_key' => 'required|string|exists:tb_period,key',
                'page' => 'required|integer|min:1',
                'questions' => 'required|array',
                'questions.*.id' => 'required|exists:tb_questions,id',
                'questions.*.sort_order' => 'required|integer|min:0',
            ]);

            DB::beginTransaction();

            $period = Period::where('key', $validatedData['period_key'])->first();
            if (!$period) {
                throw new ValidationException('Period not found for the provided key');
            }

            $questionIds = collect($validatedData['questions'])->pluck('id')->toArray();
            $existingQuestions = Questions::where('period_id', $period->id)
                ->where('page', $validatedData['page'])
                ->whereIn('id', $questionIds)
                ->pluck('id')
                ->toArray();

            if (count($existingQuestions) !== count($questionIds)) {
                throw new ValidationException('Some question IDs do not belong to the specified period or page');
            }

            foreach ($validatedData['questions'] as $index => $questionData) {
                $question = Questions::find($questionData['id']);
                if (!$question) {
                    throw new ValidationException("Question with ID {$questionData['id']} not found");
                }

                $question->update([
                    'sort_order' => $index,
                    'page' => $validatedData['page'],
                    'period_key' => $period->key ?? throw new \Exception('Period key is missing'),
                ]);
            }

            $allQuestions = Questions::where('period_id', $period->id)
                ->orderBy('page')
                ->orderBy('sort_order')
                ->get();

            $responseQuestions = $allQuestions->map(function ($question) use ($period) {
                return [
                    'id' => $question->id,
                    'question' => $question->question,
                    'label' => $question->label,
                    'type' => $question->type,
                    'options' => $this->safeJsonDecode($question->options, []),
                    'author_id' => $question->author_id,
                    'created_at' => $question->created_at,
                    'updated_at' => $question->updated_at,
                    'fileTypes' => $this->safeJsonDecode($question->fileTypes, []),
                    'page' => $question->page,
                    'sort_order' => $question->sort_order,
                    'period_id' => $question->period_id,
                    'period_key' => $question->period_key ?? $period->key,
                ];
            })->toArray();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Questions order updated successfully',
                'questions' => $responseQuestions,
            ], 200);
        } catch (ValidationException $e) {
            DB::rollBack();
            Log::error('Validation error in updateOrder: ' . $e->getMessage(), [
                'request' => $request->all(),
                'errors' => $e->errors(),
            ]);
            return response()->json([
                'success' => false,
                'error' => 'Validation error: ' . $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (QueryException $e) {
            DB::rollBack();
            Log::error('Database error in updateOrder: ' . $e->getMessage(), [
                'request' => $request->all(),
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings(),
            ]);
            return response()->json([
                'success' => false,
                'error' => 'Database error: ' . $e->getMessage(),
            ], 500);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Unexpected error in updateOrder: ' . $e->getMessage(), [
                'request' => $request->all(),
                'stack' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'error' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $question = Questions::with('period')->findOrFail($id); // Eager load period relationship
            $periodId = $question->period_id;
            $periodKey = $question->period->key; // Get the period key
            $page = $question->page;
            $question->delete();

            // Normalize sort_order for the affected page and period
            $this->normalizeSortOrder($periodId, $page);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Question deleted successfully',
                'period_key' => $periodKey, // Include period_key in response
                'question_id' => $id
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => 'Failed to delete question: ' . $e->getMessage()
            ], 500);
        }
    }
    private function safeJsonDecode($json, $default = [])
    {
        if (empty($json)) {
            return $default;
        }
        try {
            return json_decode($json, true) ?? $default;
        } catch (\Exception $e) {
            Log::warning('Failed to decode JSON: ' . $e->getMessage(), ['json' => $json]);
            return $default;
        }
    }
}