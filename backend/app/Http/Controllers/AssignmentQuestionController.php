<?php

namespace App\Http\Controllers;

use App\Models\ClassroomAssignment;
use App\Models\ClassroomAssignmentQuestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AssignmentQuestionController extends Controller
{
    public function index($assignmentId)
    {
        try {
            $questions = ClassroomAssignmentQuestion::where('assignment_id', $assignmentId)
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
                'error' => 'Failed to fetch questions: ' . $e->getMessage()
            ], 500);
        }
    }

    public function find($assignmentId)
    {
        try {
            $assignment = ClassroomAssignment::with(['questions' => function ($query) {
                $query->orderBy('page')->orderBy('sort_order');
            }])->find($assignmentId);

            if (!$assignment) {
                return response()->json(['error' => 'Assignment not found'], 404);
            }

            return response()->json([
                'success' => true,
                'assignment_title' => $assignment->title,
                'assignment_description' => $assignment->description,
                'assignment_type' => $assignment->type,
                'assignment_is_visible' => $assignment->is_visible,
                'questions' => $assignment->questions
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch assignment: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request, $assignmentId)
    {
        try {
            $rules = [
                'label' => 'nullable|string|max:255',
                'questions' => 'required|array',
                'questions.*.question' => 'required|string|max:255',
                'questions.*.label' => 'nullable|string|max:255',
                'questions.*.type' => 'required|in:radio,checkbox,text,file,multiple_file',
                'questions.*.options' => 'nullable|array',
                'questions.*.file_types' => 'nullable|array',
                'questions.*.file_types.*' => 'string',
                'questions.*.page' => 'required|integer|min:1',
                'questions.*.localIndex' => 'nullable|integer|min:0',
                'questions.*.sort_order' => 'nullable|integer|min:0',
                'questions.*.is_required' => 'nullable|boolean',
                'questions.*.maxFiles' => 'nullable|integer|min:1',
                'questions.*.maxFileSize' => 'nullable|integer|min:1|max:40',
                'questions.*.points' => 'nullable|integer|min:0', // 🆕 tambahkan validasi points
            ];

            foreach ($request->questions as $key => $q) {
                if (in_array($q['type'] ?? '', ['file', 'multiple_file'])) {
                    $rules["questions.$key.file_types"] = 'required|array|min:1';
                }
            }

            $validatedData = $request->validate($rules);

            $createdQuestions = [];
            $rootLabel = $validatedData['label'] ?? null;

            DB::beginTransaction();

            foreach ($validatedData['questions'] as $questionData) {
                $file_types = !empty($questionData['file_types']) ? json_encode($questionData['file_types']) : null;

                $page = $questionData['page'];
                $sortOrder = $this->determineSortOrder($assignmentId, $page, $questionData);

                $question = ClassroomAssignmentQuestion::create([
                    'assignment_id' => $assignmentId,
                    'question' => $questionData['question'],
                    'type' => $questionData['type'],
                    'label' => $questionData['label'] ?? $rootLabel,
                    'page' => $page,
                    'author_id' => Auth::id(),
                    'options' => json_encode($questionData['options'] ?? []),
                    'file_types' => $file_types,
                    'sort_order' => $sortOrder,
                    'is_required' => $questionData['is_required'] ?? false,
                    'max_files' => $questionData['maxFiles'] ?? ($questionData['type'] === 'multiple_file' ? 5 : 1),
                    'max_file_size' => $questionData['maxFileSize'] ?? 40,
                    'points' => $questionData['points'] ?? 1, // 🆕 default points 1
                ]);

                $createdQuestions[] = $question;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'status' => 201,
                'message' => 'Questions created successfully',
                'questions' => $createdQuestions
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => 'Failed to create questions: ' . $e->getMessage()
            ], 500);
        }
    }

    private function determineSortOrder($assignmentId, $page, $questionData)
    {
        $localIndex = $questionData['localIndex'] ?? null;
        $sortOrder = $questionData['sort_order'] ?? null;

        if ($localIndex !== null) {
            ClassroomAssignmentQuestion::where('assignment_id', $assignmentId)
                ->where('page', $page)
                ->where('sort_order', '>=', $localIndex)
                ->increment('sort_order');
            return $localIndex;
        } elseif ($sortOrder !== null) {
            ClassroomAssignmentQuestion::where('assignment_id', $assignmentId)
                ->where('page', $page)
                ->where('sort_order', '>=', $sortOrder)
                ->increment('sort_order');
            return $sortOrder;
        } else {
            $lastSortOrder = ClassroomAssignmentQuestion::where('assignment_id', $assignmentId)
                ->where('page', $page)
                ->max('sort_order');
            return is_null($lastSortOrder) ? 0 : $lastSortOrder + 1;
        }
    }

    public function update(Request $request)
    {
        try {
            $rules = [
                'label' => 'nullable|string|max:255',
                'questions' => 'required|array',
                'questions.*.id' => 'required|exists:classroom_assignment_questions,id',
                'questions.*.label' => 'nullable|string|max:255',
                'questions.*.question' => 'required|string|max:255',
                'questions.*.type' => 'required|in:radio,checkbox,text,file,multiple_file',
                'questions.*.options' => 'nullable|array',
                'questions.*.file_types' => 'nullable|array',
                'questions.*.file_types.*' => 'string',
                'questions.*.page' => 'required|integer|min:1',
                'questions.*.sort_order' => 'nullable|integer|min:0',
                'questions.*.is_required' => 'nullable|boolean',
                'questions.*.maxFiles' => 'nullable|integer|min:1',
                'questions.*.maxFileSize' => 'nullable|integer|min:1|max:40',
                'questions.*.points' => 'nullable|integer|min:0', // 🆕 tambahkan validasi points
            ];

            foreach ($request->questions as $key => $q) {
                if (in_array($q['type'] ?? '', ['file', 'multiple_file'])) {
                    $rules["questions.$key.file_types"] = 'required|array|min:1';
                }
            }

            $validatedData = $request->validate($rules);

            DB::beginTransaction();

            $updatedQuestions = [];

            foreach ($validatedData['questions'] as $questionData) {
                $question = ClassroomAssignmentQuestion::findOrFail($questionData['id']);
                $file_types = !empty($questionData['file_types']) ? json_encode($questionData['file_types']) : null;

                $question->update([
                    'question' => $questionData['question'],
                    'type' => $questionData['type'],
                    'label' => $questionData['label'],
                    'page' => $questionData['page'],
                    'sort_order' => $questionData['sort_order'] ?? $question->sort_order,
                    'options' => !empty($questionData['options']) ? json_encode($questionData['options']) : null,
                    'file_types' => $file_types,
                    'is_required' => $questionData['is_required'] ?? $question->is_required,
                    'max_files' => $questionData['maxFiles'] ?? $question->max_files,
                    'max_file_size' => $questionData['maxFileSize'] ?? $question->max_file_size,
                    'points' => $questionData['points'] ?? $question->points, // 🆕 update points
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
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => 'Failed to update questions: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateOrder(Request $request, $assignmentId)
    {
        try {
            $validatedData = $request->validate([
                'page' => 'required|integer|min:1',
                'questions' => 'required|array',
                'questions.*.id' => 'required|exists:classroom_assignment_questions,id',
                'questions.*.sort_order' => 'required|integer|min:0',
            ]);

            DB::beginTransaction();

            $questionIds = collect($validatedData['questions'])->pluck('id')->toArray();
            $existingQuestions = ClassroomAssignmentQuestion::where('assignment_id', $assignmentId)
                ->where('page', $validatedData['page'])
                ->whereIn('id', $questionIds)
                ->pluck('id')
                ->toArray();

            if (count($existingQuestions) !== count($questionIds)) {
                throw new ValidationException('Some question IDs do not belong to the specified assignment or page');
            }

            foreach ($validatedData['questions'] as $index => $questionData) {
                $question = ClassroomAssignmentQuestion::findOrFail($questionData['id']);
                $question->update([
                    'sort_order' => $index,
                    'page' => $validatedData['page'],
                ]);
            }

            $allQuestions = ClassroomAssignmentQuestion::where('assignment_id', $assignmentId)
                ->orderBy('page')
                ->orderBy('sort_order')
                ->get();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Questions order updated successfully',
                'questions' => $allQuestions,
            ], 200);
        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => 'Validation error: ' . $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => 'Failed to update question order: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $question = ClassroomAssignmentQuestion::findOrFail($id);
            $assignmentId = $question->assignment_id;
            $page = $question->page;
            $question->delete();

            $this->normalizeSortOrder($assignmentId, $page);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Question deleted successfully',
                'assignment_id' => $assignmentId,
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

    private function normalizeSortOrder($assignmentId, $page)
    {
        $questions = ClassroomAssignmentQuestion::where('assignment_id', $assignmentId)
            ->where('page', $page)
            ->orderBy('sort_order')
            ->get();

        foreach ($questions as $index => $question) {
            if ($question->sort_order !== $index) {
                $question->update(['sort_order' => $index]);
            }
        }
    }
}
