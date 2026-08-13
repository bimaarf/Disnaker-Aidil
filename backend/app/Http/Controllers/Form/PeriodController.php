<?php

namespace App\Http\Controllers\Form;

use App\Http\Controllers\Controller;
use App\Models\Form\Period;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class PeriodController extends Controller
{
    public function all()
    {
        try {
            $data = Period::with(['questions', 'answers'])
                ->orderBy('id', 'DESC')
                ->get()
                ->map(function ($period) {
                    return [
                        'id' => $period->id,
                        'key' => $period->key,
                        'title' => $period->title,
                        'description' => $period->description,
                        'status' => (int) $period->status,
                        'is_published' => (bool) $period->is_published,
                        'created_at' => $period->created_at->toISOString(),
                        'updated_at' => $period->updated_at->toISOString(),
                        'questions' => $period->questions,
                        'total_question' => $period->questions->count(),
                        'total_respondent' => $period->answers()->distinct('submission_id')->count(),
                    ];
                });
            return response()->json([
                'status' => 200,
                "data" => $data
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                "status" => 500,
                "message" => "Failed to retrieve data",
                "error" => $e->getMessage()
            ], 500);
        }
    }

    public function index(Request $request)
    {
        $perPage = $request->input('perPage', 20);
        $sortKey = $request->input('sortKey', 'id');
        $sortDirection = $request->input('sortDirection', 'desc');
        $searchQuery = $request->input('q');
    
        $query = Period::with(['questions', 'answers']);
    
        if ($searchQuery) {
            $query->where(function ($q) use ($searchQuery) {
                $searchTerm = strtolower($searchQuery);
                $q->whereRaw('LOWER(title) LIKE ?', ["%$searchTerm%"])
                  ->orWhere('key', 'LIKE', "%$searchTerm%")
                  ->orWhereRaw('LOWER(description) LIKE ?', ["%$searchTerm%"])
                  ->orWhere('created_at', 'LIKE', "%$searchTerm%");
            });
        }
    
        $periods = $query->orderBy($sortKey, $sortDirection)
                        ->paginate($perPage);
    
        $formattedPeriods = $periods->getCollection()->map(function ($period) {
            return [
                'id' => $period->id,
                'key' => $period->key,
                'title' => $period->title,
                'description' => $period->description,
                'status' => (int) $period->status,
                'is_published' => (bool) $period->is_published,
                'created_at' => $period->created_at->toISOString(),
                'updated_at' => $period->updated_at->toISOString(),
                'questions' => $period->questions,
                'total_question' => $period->questions->count(),
                'total_respondent' => $period->answers()->distinct('submission_id')->count(),
            ];
        });
    
        // Calculate totalVisible, totalHidden, and totalPublished
        $totalVisible = Cache::remember('periods_total_visible', 60, function () {
            return Period::where('status', 1)->count();
        });
        $totalHidden = Cache::remember('periods_total_hidden', 60, function () {
            return Period::where('status', 0)->count();
        });
        $totalPublished = Cache::remember('periods_total_published', 60, function () {
            return Period::where('is_published', true)->count();
        });
    
        // Invalidate cache after update
        if ($request->has('updated')) {
            Cache::forget('periods_total_visible');
            Cache::forget('periods_total_hidden');
            Cache::forget('periods_total_published');
            $totalVisible = Period::where('status', 1)->count();
            $totalHidden = Period::where('status', 0)->count();
            $totalPublished = Period::where('is_published', true)->count();
        }
    
        return response()->json([
            'status' => 200,
            'data' => $formattedPeriods,
            'total' => $periods->total(),
            'per_page' => $periods->perPage(),
            'current_page' => $periods->currentPage(),
            'last_page' => $periods->lastPage(),
            'from' => $periods->firstItem(),
            'to' => $periods->lastItem(),
            'totalVisible' => $totalVisible,
            'totalHidden' => $totalHidden,
            'totalPublished' => $totalPublished,
        ]);
    }

    public function view($key)
    {
        try {
            $period = Period::with(['questions', 'answers'])
                ->where('key', $key)
                ->firstOrFail();
            return response()->json([
                'status' => 200,
                'period' => [
                    'id' => $period->id,
                    'key' => $period->key,
                    'title' => $period->title,
                    'description' => $period->description,
                    'status' => (int) $period->status,
                    'is_published' => (bool) $period->is_published,
                    'created_at' => $period->created_at->toISOString(),
                    'updated_at' => $period->updated_at->toISOString(),
                    'questions' => $period->questions,
                    'total_questions' => $period->questions->count(),
                    'total_respondent' => $period->answers()->distinct('submission_id')->count(),
                ],
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 404,
                'message' => 'Period not found',
                'errors' => 'No period found with the provided key',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to retrieve period',
                'errors' => $e->getMessage(),
            ], 500);
        }
    }

   public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'status' => 'required|integer|in:0,1',
            'is_published' => 'required|integer|in:0,1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $period = new Period();
            $period->key = Str::random(16);
            $period->title = $request->title;
            $period->description = $request->description;
            $period->status = $request->status;
            $period->is_published = $request->is_published; // Fix: Use validated request data

            $period->save();

            // Invalidate cache for counts
            Cache::forget('periods_total_visible');
            Cache::forget('periods_total_hidden');
            Cache::forget('periods_total_published');

            // Emit Socket.IO event for new period
            try {
                $socketResponse =  Http::post(env('SOCKET_SERVER_URL') . '/notify-new-period', [

                    'period' => [
                        'id' => $period->id,
                        'key' => $period->key,
                        'title' => $period->title,
                        'description' => $period->description,
                        'status' => (int) $period->status,
                        'is_published' => (bool) $period->is_published, // Use bool for consistency
                        'created_at' => $period->created_at->toISOString(),
                        'updated_at' => $period->updated_at->toISOString(),
                        'total_question' => 0,
                        'total_respondent' => 0,
                    ],
                ]);

                if ($socketResponse->failed()) {
                    Log::error('Failed to send Socket.IO new period notification', [
                        'status' => $socketResponse->status(),
                        'body' => $socketResponse->body(),
                    ]);
                } else {
                    Log::info('Socket.IO new period event emitted', [
                        'period_id' => $period->id,
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Error sending Socket.IO new period notification', [
                    'message' => $e->getMessage(),
                ]);
            }

            return response()->json([
                'status' => 201,
                'period' => [
                    'id' => $period->id,
                    'key' => $period->key,
                    'title' => $period->title,
                    'description' => $period->description,
                    'status' => (int) $period->status,
                    'is_published' => (bool) $period->is_published, // Use bool for consistency
                    'created_at' => $period->created_at->toISOString(),
                    'updated_at' => $period->updated_at->toISOString(),
                    'total_question' => 0,
                    'total_respondent' => 0,
                ],
            ], 201);
        } catch (\Throwable $th) {
            Log::error('Error creating period', [
                'message' => $th->getMessage(),
                'trace' => $th->getTraceAsString(),
            ]);
            return response()->json([
                'status' => 500,
                'message' => 'Internal Server Error',
                'error' => $th->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $key)
    {
        try {
            $validatedData = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'status' => 'required|integer|in:0,1',
                'is_published' => 'required|integer|in:0,1',
            ]);

            $period = Period::with(['questions', 'answers'])
                ->where('key', $key)
                ->firstOrFail();
            $period->title = $validatedData['title'];
            $period->description = $validatedData['description'];
            $period->status = (int) $validatedData['status'];
            $period->is_published = $validatedData['is_published'];
            $period->save();

            // Invalidate cache for counts
            Cache::forget('periods_total_visible');
            Cache::forget('periods_total_hidden');
            Cache::forget('periods_total_published');

            // Emit Socket.IO event for updated period
            try {
                $socketResponse =  Http::post(env('SOCKET_SERVER_URL') . '/notify-period-updated', [
                    'period' => [
                        'id' => $period->id,
                        'key' => $period->key,
                        'title' => $period->title,
                        'description' => $period->description,
                        'status' => (int) $period->status,
                        'is_published' => (bool) $period->is_published,
                        'created_at' => $period->created_at->toISOString(),
                        'updated_at' => $period->updated_at->toISOString(),
                        'total_question' => $period->questions->count(),
                        'total_respondent' => $period->answers()->distinct('submission_id')->count(),
                    ],
                ]);

                if ($socketResponse->failed()) {
                    Log::error('Failed to send Socket.IO period updated notification', [
                        'status' => $socketResponse->status(),
                        'body' => $socketResponse->body(),
                    ]);
                } else {
                    Log::info('Socket.IO period updated event emitted', [
                        'period_id' => $period->id,
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Error sending Socket.IO period updated notification', [
                    'message' => $e->getMessage(),
                ]);
            }

            return response()->json([
                'status' => 200,
                'period' => [
                    'id' => $period->id,
                    'key' => $period->key,
                    'title' => $period->title,
                    'description' => $period->description,
                    'status' => (int) $period->status,
                    'is_published' => (bool) $period->is_published,
                    'created_at' => $period->created_at->toISOString(),
                    'updated_at' => $period->updated_at->toISOString(),
                    'questions' => $period->questions,
                    'total_question' => $period->questions->count(),
                    'total_respondent' => $period->answers()->distinct('submission_id')->count(),
                    'updated' => true,
                ],
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 404,
                'message' => 'Period not found',
                'errors' => 'No period found with the provided key',
            ], 404);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update period',
                'errors' => $e->getMessage(),
            ], 500);
        }
    }

    public function delete($id)
    {
        try {
            $period = Period::with(['questions', 'answers'])->findOrFail($id);
            $periodData = [
                'id' => $period->id,
                'key' => $period->key,
                'title' => $period->title,
                'description' => $period->description,
                'status' => (int) $period->status,
                'is_published' => (bool) $period->is_published,
                'created_at' => $period->created_at->toISOString(),
                'updated_at' => $period->updated_at->toISOString(),
                'total_question' => $period->questions->count(),
                'total_respondent' => $period->answers()->distinct('submission_id')->count(),
            ];
            $period->delete();

            // Invalidate cache for counts
            Cache::forget('periods_total_visible');
            Cache::forget('periods_total_hidden');
            Cache::forget('periods_total_published');

            // Emit Socket.IO event for deleted period
            try {
                $socketResponse =   Http::post(env('SOCKET_SERVER_URL') . '/notify-period-deleted', [
                    'period' => $periodData,
                ]);

                if ($socketResponse->failed()) {
                    Log::error('Failed to send Socket.IO period deleted notification', [
                        'status' => $socketResponse->status(),
                        'body' => $socketResponse->body(),
                    ]);
                } else {
                    Log::info('Socket.IO period deleted event emitted', [
                        'period_id' => $id,
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Error sending Socket.IO period deleted notification', [
                    'message' => $e->getMessage(),
                ]);
            }

            return response()->json([
                'status' => 200,
                'message' => 'Period deleted successfully',
                'periodId' => $id,
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 404,
                'message' => 'Period not found',
                'errors' => 'No period found with the provided ID',
            ], 404);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to delete period',
                'errors' => $e->getMessage(),
            ], 500);
        }
    }
}