<?php
namespace App\Http\Controllers\Form;
use App\Models\NotificationWhatsAppMessage;

use App\Http\Controllers\Controller;
use App\Models\Form\Answers;
use App\Models\Form\Questions;
use App\Models\Form\Period;
use App\Models\Form\Result;
use Auth;
use DateTime;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use DB;

use Exception;

class AnswerController extends Controller
{
    public function getSubmissionsPerDayByPeriod(Request $request)
    {
        // Validate date inputs
        $validator = Validator::make($request->all(), [
            'fromDate' => 'nullable|date|before_or_equal:toDate',
            'toDate' => 'nullable|date|after_or_equal:fromDate',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid date range',
                'errors' => $validator->errors(),
            ], 422);
        }

        $fromDate = $request->input('fromDate') ?? now()->subDays(30)->toDateString();
        $toDate = $request->input('toDate') ?? now()->toDateString();

        try {
            // Fetch periods and include deleted periods (null period_id)
            $periods = Period::query()
                ->where(function ($query) use ($fromDate, $toDate) {
                    $query->whereBetween('created_at', [$fromDate, $toDate])
                          ->orWhereNull('id'); // For deleted periods
                })
                ->get()
                ->keyBy('id');

            $periodIds = $periods->keys()->filter()->toArray(); // Exclude null for query

            // Fetch submissions, including those with null period_id
            $query = Answers::selectRaw('DATE(created_at) as date, period_id, COUNT(DISTINCT submission_id) as total')
                ->where(function ($query) use ($periodIds, $fromDate, $toDate) {
                    $query->whereIn('period_id', $periodIds)
                          ->orWhereNull('period_id');
                })
                ->whereBetween('created_at', [$fromDate, $toDate])
                ->groupBy('date', 'period_id');

            $results = $query->get();

            // Generate complete date range
            $startDate = new \DateTime($fromDate);
            $endDate = new \DateTime($toDate);
            $interval = new \DateInterval('P1D');
            $dateRange = new \DatePeriod($startDate, $interval, $endDate->modify('+1 day'));
            $allDates = array_map(fn($date) => $date->format('Y-m-d'), iterator_to_array($dateRange));

            // Group results by period, including null period_id
            $grouped = collect($periodIds)->merge([null])->map(function ($periodId) use ($results, $periods, $allDates) {
                $period = $periods->get($periodId);
                $submissionsForPeriod = $results->where('period_id', $periodId);

                $submissionsByDateMap = $submissionsForPeriod->pluck('total', 'date')->toArray();

                $submissionsByDate = collect($allDates)->map(function ($date) use ($submissionsByDateMap) {
                    return [
                        'date' => $date,
                        'count' => isset($submissionsByDateMap[$date]) ? (int) $submissionsByDateMap[$date] : 0,
                    ];
                })->values();

                $totalSubmissions = $submissionsForPeriod->sum('total');

                return [
                    'period_id' => $periodId ?? 'deleted-' . md5($totalSubmissions . json_encode($submissionsByDate)),
                    'title' => $period ? $period->title : 'Period (Deleted)',
                    'status' => $period ? (int) $period->status : 0,
                    'total_submissions' => (int) $totalSubmissions,
                    'submissions_by_date' => $submissionsByDate,
                ];
            })->filter(fn($item) => $item['total_submissions'] > 0)->values();

            return response()->json([
                'success' => true,
                'message' => 'Submissions per day by period fetched successfully.',
                'data' => $grouped,
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching submissions per day by period:', [
                'error' => $e->getMessage(),
                'fromDate' => $fromDate,
                'toDate' => $toDate,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch submissions per day',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getSubmissionsPerDayDetail($periodId)
    {
        try {
            $realPeriodId = str_starts_with($periodId, 'deleted-') ? null : $periodId;

            // Optimize query by combining submissions and counts
            $submissions = Answers::when(
                is_null($realPeriodId),
                fn($q) => $q->whereNull('period_id'),
                fn($q) => $q->where('period_id', $realPeriodId)
            )
            ->selectRaw('DATE(created_at) as date, COUNT(DISTINCT submission_id) as count, GROUP_CONCAT(DISTINCT submission_id) as submission_ids')
            ->groupByRaw('DATE(created_at)')
            ->orderByRaw('DATE(created_at)')
            ->get();

            $submissionIds = $submissions->flatMap(fn($row) => explode(',', $row->submission_ids))->unique();

            // Fetch results in one query
            $results = Result::whereIn('submission_answers', $submissionIds)
                ->get()
                ->groupBy('submission_answers');

            $totalSubmissions = $submissionIds->count();
            $verifiedOnly = 0;
            $passCount = 0;
            $failCount = 0;
            $undecided = 0;

            foreach ($submissionIds as $submissionId) {
                $resEntries = $results->get($submissionId);
                if ($resEntries && $resEntries->count() > 0) {
                    $verifiedOnly++;
                    $latestResult = $resEntries->sortByDesc('created_at')->first();
                    if ($latestResult->status === true) {
                        $passCount++;
                    } elseif ($latestResult->status === false && $latestResult->selection_type !== null) {
                        $failCount++;
                    } else {
                        $undecided++;
                    }
                }
            }

            $period = Period::find($realPeriodId);
            $fallbackAnswer = Answers::when(
                is_null($realPeriodId),
                fn($q) => $q->whereNull('period_id'),
                fn($q) => $q->where('period_id', $realPeriodId)
            )->latest()->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'period_id' => $periodId,
                    'title' => $period?->title ?? 'Period (Deleted)',
                    'status' => $period?->status ?? 0,
                    'total_submissions' => (int) $totalSubmissions,
                    'verified_only' => (int) $verifiedOnly,
                    'pass' => (int) $passCount,
                    'fail' => (int) $failCount,
                    'undecided' => (int) $undecided,
                    'unverified' => (int) ($totalSubmissions - $verifiedOnly),
                    'submissions_by_date' => $submissions->map(fn($row) => [
                        'date' => $row->date,
                        'count' => (int) $row->count,
                    ]),
                    'period_created_at' => $period?->getRawOriginal('created_at') ?? $fallbackAnswer?->created_at?->toISOString(),
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching submissions per day detail:', [
                'period_id' => $periodId,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch submission details',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

public function getSubmissionsByPeriod(Request $request)
{
    $fromDate = $request->input('fromDate');
    $toDate = $request->input('toDate');
    $user = Auth::user();

    $validator = Validator::make($request->all(), [
        'fromDate' => 'nullable|date|before_or_equal:toDate',
        'toDate' => 'nullable|date|after_or_equal:fromDate',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => 'Invalid date range',
            'errors' => $validator->errors(),
        ], 422);
    }

    try {
        $periodsQuery = Period::query();
        if ($fromDate) {
            $periodsQuery->whereDate('created_at', '>=', $fromDate);
        }
        if ($toDate) {
            $periodsQuery->whereDate('created_at', '<=', $toDate);
        }

        $periods = $periodsQuery->orderBy('created_at', 'desc')->get()->keyBy('id');
        $periodIds = $periods->keys()->toArray();
        $periodIds[] = null;

        $answers = Answers::where(function ($query) use ($periodIds) {
            $query->whereIn('period_id', $periodIds)
                ->orWhereNull('period_id');
        })->get();

        $groupedSubmissions = $answers->groupBy('period_id')->map(function ($group, $key) {
            $submissionIds = $group->pluck('submission_id')->unique();
            return [
                'period_id' => $key,
                'submission_ids' => $submissionIds,
                'total_submissions' => $submissionIds->count(),
                'latest_created' => $group->max('created_at'),
            ];
        })->values();

        $allSubmissionIds = $groupedSubmissions->pluck('submission_ids')->flatten()->unique();
        $results = Result::whereIn('submission_answers', $allSubmissionIds)
            ->get()
            ->groupBy('submission_answers');

        $formatted = [];

        foreach ($groupedSubmissions as $row) {
            // Reset counter per period
            $statusCounts = [
                'Belum_Diverifikasi' => 0,
                'Belum_Ditentukan'   => 0,
                'Menunggu_Hasil'     => 0,
                'Berkas_Diterima'    => 0,
                'Berkas_Dikembalikan'=> 0,
                'Lulus'              => 0,
                'Tidak_Lulus'        => 0,
            ];

            $rawPeriodId = $row['period_id'];
            $syntheticId = $rawPeriodId ?? "deleted-" . md5($row['latest_created']);
            $period = $periods->get($rawPeriodId);
            $submissionIds = $row['submission_ids'];

            $isPublished = $period ? (bool) $period->is_published : false;
            $isUserRole = $user && $user->hasRole('user');
            $userRole = $isUserRole ? 'user' : 'administrator';

            foreach ($submissionIds as $submissionId) {
                $resEntries = $results->get($submissionId);

                if ($resEntries && $resEntries->count() > 0) {
                    $latestResult = $resEntries->sortByDesc('created_at')->first();

                    if ($latestResult) {
                        if (
                            $userRole === 'user' &&
                            !$isPublished &&
                            ($latestResult->status === true || $latestResult->status === false)
                        ) {
                            $statusCounts['Menunggu_Hasil']++;
                        } elseif ($latestResult->status === true && $latestResult->selection_type !== null) {
                            $statusCounts['Lulus']++;
                        } elseif ($latestResult->status === false && $latestResult->selection_type !== null) {
                            $statusCounts['Tidak_Lulus']++;
                        } elseif ($latestResult->is_approve === true) {
                            $statusCounts['Berkas_Diterima']++;
                        } elseif ($latestResult->is_approve === false) {
                            $statusCounts['Berkas_Dikembalikan']++;
                        } else {
                            $statusCounts['Belum_Ditentukan']++;
                        }
                    }
                } else {
                    $statusCounts['Belum_Diverifikasi']++;
                }
            }

            // Dominant status
            $maxStatus = array_keys($statusCounts, max($statusCounts))[0];
            $statusLabel = $maxStatus;
            $statusIcon = match ($maxStatus) {
                'Belum_Diverifikasi' => 'hourglass_empty',
                'Berkas_Diterima' => 'check_circle',
                'Berkas_Dikembalikan' => 'cancel',
                'Menunggu_Hasil' => 'announcement',
                'Lulus' => 'check_circle',
                'Tidak_Lulus' => 'cancel',
                default => 'help',
            };
            $statusColor = match ($maxStatus) {
                'Belum_Diverifikasi' => 'orange',
                'Berkas_Diterima' => 'green',
                'Berkas_Dikembalikan' => 'red',
                'Menunggu_Hasil' => 'blue',
                'Lulus' => 'green',
                'Tidak_Lulus' => 'red',
                default => 'orange',
            };

            $formatted[] = [
                'period_id' => $syntheticId,
                'title' => $period ? $period->title : "Period (Deleted)",
                'created_at' => $row['latest_created'],
                'period_created_at' => $period ? $period->getRawOriginal('created_at') : $row['latest_created'],
                'status' => $period ? (int) $period->status : 0,
                'is_published' => $isPublished,
                'total_submissions' => $row['total_submissions'],
                'pass' => $statusCounts['Lulus'],
                'fail' => $statusCounts['Tidak_Lulus'],
                'undecided' => $statusCounts['Menunggu_Hasil'],
                'unverified' => $statusCounts['Belum_Ditentukan'],
                'validation_status' => [
                    'label' => $statusLabel,
                    'icon' => $statusIcon,
                    'color' => $statusColor,
                ],
                'status_counts' => $statusCounts,
            ];
        }

        usort($formatted, function ($a, $b) {
            $dateA = $a['period_created_at'] ? new DateTime($a['period_created_at']) : new DateTime($a['created_at']);
            $dateB = $b['period_created_at'] ? new DateTime($b['period_created_at']) : new DateTime($b['created_at']);
            return $dateB <=> $dateA;
        });

        return response()->json([
            'success' => true,
            'message' => 'Submission count by period fetched successfully.',
            'data' => $formatted,
        ]);
    } catch (Exception $e) {
        Log::error('Error fetching submissions by period:', [
            'error' => $e->getMessage(),
            'fromDate' => $fromDate,
            'toDate' => $toDate,
        ]);
        return response()->json([
            'success' => false,
            'message' => 'Failed to fetch submissions by period',
            'error' => $e->getMessage(),
        ], 500);
    }
}

public function getStatusTotals(Request $request)
{
    $searchQuery = $request->input('search');
    $fromDate = $request->input('fromDate');
    $toDate = $request->input('toDate');
    $userAll = $request->boolean('userAll', false);
    $user = Auth::user();

    $submissionQuery = Answers::select('submission_id')
        ->leftJoin('users', 'tb_answers.user_id', '=', 'users.id')
        ->groupBy('tb_answers.submission_id');

    // Filter berdasarkan user
    if (!$userAll && $user && $user->hasRole('user') && !$request->has('user_id')) {
        $submissionQuery->where('tb_answers.user_id', $user->id);
    } elseif (!$userAll && $request->has('user_id') && $user && !$user->hasRole(['administrator', 'super admin'])) {
        $submissionQuery->where('tb_answers.user_id', $request->input('user_id'));
    }

    // Filter pencarian
    if (!empty($searchQuery)) {
        $searchTerm = strtolower($searchQuery);
        $submissionQuery->where(function ($q) use ($searchTerm) {
            $q->whereRaw('LOWER(tb_answers.submission_id) LIKE ?', ["%$searchTerm%"])
                ->orWhereRaw('LOWER(tb_answers.period_id) LIKE ?', ["%$searchTerm%"])
                ->orWhereRaw('LOWER(tb_answers.question) LIKE ?', ["%$searchTerm%"])
                ->orWhereRaw('LOWER(tb_answers.answer) LIKE ?', ["%$searchTerm%"])
                ->orWhereRaw('LOWER(tb_answers.file_path) LIKE ?', ["%$searchTerm%"])
                ->orWhereRaw('LOWER(tb_answers.type) LIKE ?', ["%$searchTerm%"])
                ->orWhere('tb_answers.created_at', 'LIKE', "%$searchTerm%")
                ->orWhereRaw('LOWER(users.name) LIKE ?', ["%$searchTerm%"])
                ->orWhereRaw('LOWER(users.email) LIKE ?', ["%$searchTerm%"])
                ->orWhereRaw('LOWER(users.phone_number) LIKE ?', ["%$searchTerm%"]);
        });
    }

    if ($request->filled('period_id')) {
        $submissionQuery->where('tb_answers.period_id', $request->input('period_id'));
    }

    if (!empty($fromDate)) {
        $submissionQuery->whereDate('tb_answers.created_at', '>=', $fromDate);
    }

    if (!empty($toDate)) {
        $submissionQuery->whereDate('tb_answers.created_at', '<=', $toDate);
    }

    $submissionIds = $submissionQuery->pluck('submission_id')->unique();

    // Ambil hasil verifikasi terbaru
    $results = Result::whereIn('submission_answers', $submissionIds)
        ->orderBy('created_at', 'desc')
        ->get()
        ->groupBy('submission_answers')
        ->map(fn ($group) => $group->first());

    // Ambil informasi period
    $periodsData = [];
    $answersForPeriods = Answers::whereIn('submission_id', $submissionIds)
        ->select('submission_id', 'period_id')
        ->get()
        ->groupBy('submission_id');

    foreach ($answersForPeriods as $submissionId => $submissionAnswers) {
        $periodId = $submissionAnswers->first()->period_id;
        if (!isset($periodsData[$periodId])) {
            $periodsData[$periodId] = Period::find($periodId);
        }
    }

    // Status default
    $statusCounts = [
        'Belum_Diverifikasi' => 0,
        'Belum_Ditentukan' => 0,
        'Menunggu_Hasil' => 0,
        'Berkas_Diterima' => 0,
        'Berkas_Dikembalikan' => 0,
        'Lulus' => 0,
        'Tidak_Lulus' => 0,
    ];

    // Loop status
    foreach ($submissionIds as $submissionId) {
        $latestResult = $results->get($submissionId);
        $submissionAnswers = $answersForPeriods->get($submissionId);
        $period = $submissionAnswers ? ($periodsData[$submissionAnswers->first()->period_id] ?? null) : null;

        $isUserRole = $user && $user->hasRole('user');
        $userRole = $isUserRole ? 'user' : 'administrator';
        $isPublished = $period ? $period->is_published : false;

        $statusKey = 'Belum_Diverifikasi';

        if ($latestResult) {
            if (
                $userRole === 'user' &&
                !$isPublished &&
                ($latestResult->status === true || $latestResult->status === false)
            ) {
                $statusKey = 'Menunggu_Hasil';
            } elseif ($latestResult->status === true && $latestResult->selection_type !== null) {
                $statusKey = 'Lulus';
            } elseif ($latestResult->status === false && $latestResult->selection_type !== null) {
                $statusKey = 'Tidak_Lulus';
            } elseif ($latestResult->is_approve === true) {
                $statusKey = 'Berkas_Diterima';
            } elseif ($latestResult->is_approve === false) {
                $statusKey = 'Berkas_Dikembalikan';
            } else {
                $statusKey = 'Belum_Ditentukan';
            }
        }

        $statusKey = str_replace(' ', '_', $statusKey);
        if (!isset($statusCounts[$statusKey])) {
            $statusKey = 'Belum_Ditentukan';
        }

        $statusCounts[$statusKey]++;
    }

    $total = array_sum($statusCounts);

    return response()->json([
        'success' => true,
        'status_totals' => array_merge($statusCounts, ['Total_Submissions' => $total]),
    ], 200);
}



    public function getGroupedAnswers(Request $request)
{
    $perPage = $request->input('perPage', 10);
    $searchQuery = $request->input('search');
    $fromDate = $request->input('fromDate');
    $toDate = $request->input('toDate');
    $userAll = $request->boolean('userAll', false);
    $userId = $request->input('user_id'); // Tambahkan parameter user_id

    $user = Auth::user();

    // --- Query utama ---
    $query = Answers::selectRaw('tb_answers.submission_id, COUNT(*) as total_answers, MAX(tb_answers.id) as latest_id')
        ->leftJoin('users', 'tb_answers.user_id', '=', 'users.id')
        ->groupBy('tb_answers.submission_id')
        ->orderBy('latest_id', 'desc');

    // Filter user_id
    if (!$userAll && $user && $user->hasRole('user') && !$userId) {
        $query->where('tb_answers.user_id', $user->id);
    } elseif (!$userAll && $userId && $user && !$user->hasRole(['administrator', 'super admin'])) {
        $query->where('tb_answers.user_id', $userId);
    } elseif ($userId && $user && $user->hasRole(['administrator', 'super admin'])) {
        $query->where('tb_answers.user_id', $userId);
    }

    // Search
    if (!empty($searchQuery)) {
        $searchTerm = strtolower($searchQuery);
        $query->where(function ($q) use ($searchTerm) {
            $q->whereRaw('LOWER(tb_answers.submission_id) LIKE ?', ["%$searchTerm%"])
              ->orWhereRaw('LOWER(tb_answers.period_id) LIKE ?', ["%$searchTerm%"])
              ->orWhereRaw('LOWER(tb_answers.question) LIKE ?', ["%$searchTerm%"])
              ->orWhereRaw('LOWER(tb_answers.answer) LIKE ?', ["%$searchTerm%"])
              ->orWhereRaw('LOWER(tb_answers.file_path) LIKE ?', ["%$searchTerm%"])
              ->orWhereRaw('LOWER(tb_answers.type) LIKE ?', ["%$searchTerm%"])
              ->orWhere('tb_answers.created_at', 'LIKE', "%$searchTerm%")
              ->orWhereRaw('LOWER(users.name) LIKE ?', ["%$searchTerm%"])
              ->orWhereRaw('LOWER(users.email) LIKE ?', ["%$searchTerm%"])
              ->orWhereRaw('LOWER(users.phone_number) LIKE ?', ["%$searchTerm%"]);
        });
    }

    if ($request->filled('period_id')) {
        $query->where('tb_answers.period_id', $request->input('period_id'));
    }

    if (!empty($fromDate)) {
        $query->whereDate('tb_answers.created_at', '>=', $fromDate);
    }

    if (!empty($toDate)) {
        $query->whereDate('tb_answers.created_at', '<=', $toDate);
    }

    $answers = $query->paginate($perPage);
    $submissionIds = $answers->pluck('submission_id');

    // === Ambil semua data answers untuk submission_id tersebut ===
    $answersData = Answers::with(['user', 'period', 'question'])
        ->whereIn('submission_id', $submissionIds)
        ->orderBy('id', 'desc')
        ->get()
        ->groupBy('submission_id');

    // === Ambil results & period ===
    $results = Result::whereIn('submission_answers', $submissionIds)->get()->groupBy('submission_answers');

    $periodsData = [];
    $answersForPeriods = Answers::whereIn('submission_id', $submissionIds)
        ->select('submission_id', 'period_id')
        ->get()
        ->groupBy('submission_id');

    foreach ($answersForPeriods as $submissionId => $submissionAnswers) {
        $periodId = $submissionAnswers->first()->period_id;
        if (!isset($periodsData[$periodId])) {
            $periodsData[$periodId] = Period::find($periodId);
        }
    }

    // === Format Response ===
    $formattedData = $answers->map(function ($answer) use ($answersData, $results, $periodsData, $user) {
        $groupData = $answersData[$answer->submission_id] ?? collect();
        $firstAnswer = $groupData->first();
        $period = $firstAnswer->period ?? null;

        // --- Ambil latest_answer sesuai latest_id ---
        $latestAnswer = $groupData->firstWhere('id', $answer->latest_id);

        // --- Format semua answers ---
        $formattedGroupData = $groupData->map(function ($item) {
            $question = $item->getRelation('question');
            return [
                'id' => $item->id,
                'question_id' => $item->question_id,
                'question' => $item->question,
                'page' => $item->page,
                'sort_order' => $item->sort_order,
                'period_id' => $item->period_id,
                'label' => $item->label,
                'submission_id' => $item->submission_id,
                'user_id' => $item->user_id,
                'answer' => $item->answer,
                'file_path' => $this->getFileUrl($item->file_path),
                'type' => $item->type,
                'options' => $item->options ? json_decode($item->options, true) : [],
                'is_required' => $item->question_id && $question ? $question->is_required : 'question sudah dihapus',
                'created_at' => $item->created_at->toISOString(),
                'updated_at' => $item->updated_at->toISOString(),
            ];
        });

        // --- Ambil result terbaru ---
        $latestResult = $results->get($answer->submission_id)?->sortByDesc('created_at')->first();

        // --- Tentukan status ---
        $statusLabel = 'Belum_Diverifikasi';
        $statusIcon = 'hourglass_empty';
        $statusColor = 'orange';

        if ($latestResult) {
            $isUserRole = $user && $user->hasRole('user');
            $isPublished = $period && $period->is_published;
            if ($isUserRole && !$isPublished && $latestResult->selection_type !== null) {
                $statusLabel = 'Menunggu_Hasil';
                $statusIcon = 'announcement';
                $statusColor = 'blue';
            } elseif ($latestResult->status === true) {
                $statusLabel = 'Lulus';
                $statusIcon = 'check_circle';
                $statusColor = 'green';
            } elseif ($latestResult->status === false && $latestResult->selection_type !== null) {
                $statusLabel = 'Tidak_Lulus';
                $statusIcon = 'cancel';
                $statusColor = 'red';
            } else {
                $statusLabel = $latestResult->is_approve ? 'Berkas_Diterima' : 'Berkas_Dikembalikan';
                $statusIcon = $latestResult->is_approve ? 'check_circle' : 'cancel';
                $statusColor = $latestResult->is_approve ? 'green' : 'red';
            }
        }

        return [
            'submission_id' => $answer->submission_id,
            'key' => $answer->submission_id,
            'total_answers' => $answer->total_answers,
            'latest_id' => $answer->latest_id,
            'latest_answer' => $latestAnswer ? [
                'id' => $latestAnswer->id,
                'question_id' => $latestAnswer->question_id,
                'answer' => $latestAnswer->answer,
                'created_at' => $latestAnswer->created_at->toISOString(),
            ] : null,
            'user_id' => optional($firstAnswer->user)->id ?? 'N/A',
            'user_name' => optional($firstAnswer->user)->name ?? 'N/A',
            'user_email' => optional($firstAnswer->user)->email ?? 'N/A',
            'user_phone_number' => optional($firstAnswer->user)->phone_number ?? 'N/A',
            'created_at' => $firstAnswer->created_at->toISOString(),
            'answers' => $formattedGroupData,
            'period' => $period ? [
                'id' => $period->id,
                'title' => $period->title,
                'description' => $period->description,
                'status' => (int) $period->status,
                'is_published' => (bool) $period->is_published,
            ] : null,
            'validation_status' => [
                'label' => $statusLabel,
                'icon' => $statusIcon,
                'color' => $statusColor,
            ],
            'result' => $latestResult ? [
                'id' => $latestResult->id,
                'submission_answers' => $latestResult->submission_answers,
                'selection_type' => $latestResult->selection_type,
                'value' => $latestResult->value,
                'status' => $latestResult->status,
                'is_approve' => $latestResult->is_approve,
                'created_at' => $latestResult->created_at->toISOString(),
                'updated_at' => $latestResult->updated_at->toISOString(),
            ] : null,
        ];
    });

    return response()->json([
        'success' => true,
        'message' => 'Data fetched successfully (grouped)',
        'data' => $formattedData,
        'total' => $answers->total(),
        'per_page' => $answers->perPage(),
        'current_page' => $answers->currentPage(),
        'last_page' => $answers->lastPage(),
        'from' => $answers->firstItem(),
        'to' => $answers->lastItem(),
    ], 200);
}


//getBySubmission yg dikeluarkan adalah submission current
   public function getBySubmission($submissionId)
{
    try {
        $firstAnswer = Answers::where('submission_id', $submissionId)
            ->with(['user', 'period'])
            ->first();

        if (!$firstAnswer) {
            Log::warning('No answers found for submission:', ['submission_id' => $submissionId]);
            return response()->json([
                'success' => false,
                'message' => 'No answers found for this submission',
            ], 404);
        }

        // 🔹 Ambil langsung dari tb_answers, bukan dari questions
        $answers = Answers::where('submission_id', $submissionId)
            ->with(['user', 'period'])
            ->orderBy('page', 'asc')
            ->orderBy('sort_order', 'asc')
            ->get();

        $formattedAnswers = $answers->map(function ($answer) use ($firstAnswer) {
            return [
                'id' => $answer->id,
                'question_id' => $answer->question_id,
                'page' => $answer->page,
                'label' => $answer->label,
                'question' => $answer->question,
                'sort_order' => $answer->sort_order,
                'submission_id' => $answer->submission_id,
                'answer' => $answer->answer,
                'file_path' => $answer->file_path ? $this->getFileUrl($answer->file_path) : null,

                'type' => $answer->type,
                'options' => $answer->options,
                'is_required' => $answer->question_id ? $answer->is_required : 'question sudah dihapus',
                'created_at' => $answer->created_at?->toISOString(),
                'updated_at' => $answer->updated_at?->toISOString(),
                'user_id' => $answer->user_id ?? $firstAnswer->user_id,
                'period_id' => $answer->period_id,
                'user' => $answer->user ? [
                    'id' => $answer->user->id,
                    'name' => $answer->user->name,
                    'avatar' => $answer->user->avatar,
                    'email' => $answer->user->email,
                    'phone_number' => $answer->user->phone_number,
                    'email_verified_at' => $answer->user->email_verified_at,
                    'status' => $answer->user->status,
                    'created_at' => $answer->user->created_at,
                    'updated_at' => $answer->user->updated_at,
                    'last_online_at' => $answer->user->last_online_at,
                ] : null,
                'period' => $answer->period ? [
                    'id' => $answer->period->id,
                    'key' => $answer->period->key,
                    'title' => $answer->period->title,
                    'status' => (int) $answer->period->status,
                    'is_published' => (bool) $answer->period->is_published,
                    'description' => $answer->period->description,
                    'created_at' => $answer->period->created_at->toISOString(),
                    'updated_at' => $answer->period->updated_at->toISOString(),
                ] : null,
            ];
        });

        $latestResult = Result::where('submission_answers', $submissionId)->first();

        // 🔹 status logic tetap
        $statusLabel = 'Belum_Diverifikasi';
        $statusIcon = 'hourglass_empty';
        $statusColor = 'orange';

        if ($latestResult) {
            if ($latestResult->status === true) {
                $statusLabel = 'Lulus';
                $statusIcon = 'check_circle';
                $statusColor = 'green';
            } elseif ($latestResult->status === false && $latestResult->selection_type !== null) {
                $statusLabel = 'Tidak_Lulus';
                $statusIcon = 'cancel';
                $statusColor = 'red';
            } else {
                $statusLabel = $latestResult->is_approve ? 'Berkas_Diterima' : 'Berkas_Dikembalikan';
                $statusIcon = $latestResult->is_approve ? 'check_circle' : 'cancel';
                $statusColor = $latestResult->is_approve ? 'green' : 'red';
            }
        }

        $formattedData = [
            'submission_id' => $submissionId,
            'key' => $submissionId,
            'total_answers' => $formattedAnswers->count(),
            'latest_id' => $answers->max('id'),
            'user_id' => optional($firstAnswer->user)->id ?? 'N/A',
            'user_name' => optional($firstAnswer->user)->name ?? 'N/A',
            'user_email' => optional($firstAnswer->user)->email ?? 'N/A',
            'user_phone_number' => optional($firstAnswer->user)->phone_number ?? 'N/A',
            'created_at' => $firstAnswer->created_at->toISOString(),
            'answers' => $formattedAnswers,
            'period' => $firstAnswer->period ? [
                'id' => $firstAnswer->period->id,
                'title' => $firstAnswer->period->title,
                'status' => (int) $firstAnswer->period->status,
                'is_published' => (bool) $firstAnswer->period->is_published,
                'created_at' => $firstAnswer->period->created_at->toISOString(),
            ] : null,
            'validation_status' => [
                'label' => $statusLabel,
                'icon' => $statusIcon,
                'color' => $statusColor,
            ],
            'result' => $latestResult ? [
                'id' => $latestResult->id,
                'submission_answers' => $latestResult->submission_answers,
                'selection_type' => $latestResult->selection_type,
                'value' => $latestResult->value,
                'status' => $latestResult->status,
                'is_approve' => $latestResult->is_approve,
                'created_at' => $latestResult->created_at->toISOString(),
                'updated_at' => $latestResult->updated_at->toISOString(),
            ] : null,
        ];

        return response()->json([
            'success' => true,
            'message' => 'Data fetched successfully (by submission)',
            'data' => $formattedData,
        ], 200);
    } catch (\Exception $e) {
        Log::error('Error fetching answers by submission:', [
            'submission_id' => $submissionId,
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Error fetching answers',
            'error' => $e->getMessage(),
        ], 500);
    }
}
private function sendWhatsAppNotification($user, $submissionId, $answersCollection, $templateCode, $additionalData = [])
{
    try {
        $recipientPhone = $this->toE164PhoneNumber($user->phone_number);

        if (!$recipientPhone || strlen($recipientPhone) <= 8) {
            Log::warning('Nomor telepon tidak valid', [
                'user_id' => $user->id,
                'phone' => $user->phone_number
            ]);
            return false;
        }

        if (!\Illuminate\Support\Str::startsWith($recipientPhone, '+')) {
            $recipientPhone = '+62' . ltrim($recipientPhone, '0');
        }

        $template = NotificationWhatsAppMessage::where('code', $templateCode)->first();

        if (!$template) {
            Log::warning("Template WhatsApp '{$templateCode}' tidak ditemukan di database");
            return false;
        }

        // Default placeholders
        $placeholders = [
            '{name}' => $user->name,
            '{submission_id}' => $submissionId,
            '{answer_count}' => $answersCollection->count(),
            '{period_title}' => optional($answersCollection->first()->period)->title ?? 'N/A',
        ];

        // Merge dengan additional data
        $placeholders = array_merge($placeholders, $additionalData);

        // Replace placeholders di template
        $messageTemplate = strtr($template->message, $placeholders);

        // Convert HTML ke text untuk WhatsApp
        $message = $this->htmlToWhatsAppText($messageTemplate);

        // Kirim via socket server
        $waResponse = Http::post(env('SOCKET_SERVER_URL') . '/send-whatsapp', [
            'phone_number' => $recipientPhone,
            'message' => $message,
        ]);

        Log::info('Sending WhatsApp payload:', [
            'url' => env('SOCKET_SERVER_URL') . '/send-whatsapp',
            'phone' => $recipientPhone,
            'message' => $message,
        ]);

        if ($waResponse->failed()) {
            Log::error('Gagal mengirim WhatsApp', [
                'template' => $templateCode,
                'status' => $waResponse->status(),
                'body' => $waResponse->body(),
            ]);
            return false;
        }

        Log::info('WhatsApp berhasil dikirim', [
            'template' => $templateCode,
            'phone' => $recipientPhone,
            'submission_id' => $submissionId
        ]);

        return true;

    } catch (\Exception $e) {
        Log::error('Error mengirim WhatsApp', [
            'template' => $templateCode,
            'message' => $e->getMessage()
        ]);
        return false;
    }
}

    public function submitAnswers(Request $request)
    {
        try {
            if (!Auth::check()) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $submissionId = Str::uuid()->toString();
            $uuid = strtoupper(str_replace('-', '', $submissionId));
            $formattedId = sprintf('OP-%s-%s-%s', substr($uuid, 0, 4), substr($uuid, 4, 3), substr($uuid, 7, 3));

            if (config('app.debug')) {
                Log::info('Submit answers request:', [
                    'headers' => $request->headers->all(),
                    'inputs' => $request->all(),
                    'files' => $request->allFiles()
                ]);
            }

            $answers = json_decode($request->input('answers', '[]'), true);
            if (json_last_error() !== JSON_ERROR_NONE || !is_array($answers)) {
                return response()->json([
                    'message' => 'Invalid answers format',
                    'errors' => ['answers' => ['The answers field must be a valid JSON array']]
                ], 422);
            }

            $validator = Validator::make(['answers' => $answers], [
                'answers' => 'required|array|max:100',
                'answers.*.question_id' => 'required|integer|exists:tb_questions,id',
                'answers.*.answer' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()->all()
                ], 422);
            }

$allowedFileTypes = [
    'pdf','doc','docx','xls','xlsx','txt',
    'png','jpg','jpeg','gif','webp',
    'heic','heif','jfif'
];

$allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/png',
    'image/x-png',    // ↔ beberapa Android lama
    'image/jpeg',
    'image/pjpeg',    // ↔ progressive jpeg
    'image/jpg',      // ↔ beberapa kamera menandai seperti ini
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/jfif',
];

            $maxFileSize = 2048000;
            $allErrors = [];
            $filePathsByQuestion = [];

            // Fetch all questions for provided question_ids
            $questionIds = array_column($answers, 'question_id');
            $questions = Questions::whereIn('id', $questionIds)->get()->keyBy('id');

            foreach ($answers as $answer) {
                $questionId = $answer['question_id'];
                $question = $questions->get($questionId);
                if (!$question) {
                    $allErrors[$questionId][] = 'Question not found';
                    continue;
                }
                $filePaths = [];

                // Validate is_required
                if ($question->is_required) {
                    if (in_array($question->type, ['text', 'radio'])) {
                        if (empty(trim($answer['answer'] ?? ''))) {
                            $allErrors[$questionId][] = 'This question is required and must have an answer.';
                        }
                    } elseif ($question->type === 'checkbox') {
                        if (empty(trim($answer['answer'] ?? ''))) {
                            $allErrors[$questionId][] = 'Please select at least one option for this required question.';
                        }
                    }
                } else {
                    // Non-required validation
                    if (in_array($question->type, ['text', 'radio']) && !empty($answer['answer']) && empty(trim($answer['answer']))) {
                        $allErrors[$questionId][] = 'Answer cannot be empty if provided.';
                    }
                    if ($question->type === 'checkbox' && !empty($answer['answer']) && empty(trim($answer['answer']))) {
                        $allErrors[$questionId][] = 'Please select at least one option.';
                    }
                }

                // PERBAIKAN: Cek file untuk question ini
                $fileKeys = ["files.{$questionId}", "files[{$questionId}]"];
                $files = [];

                foreach ($fileKeys as $key) {
                    if ($request->hasFile($key)) {
                        $uploadedFiles = $request->file($key);
                        $files = is_array($uploadedFiles) ? $uploadedFiles : [$uploadedFiles];
                        Log::info("Files found for question {$questionId} with key {$key}:", ['count' => count($files)]);
                        break;
                    }
                }

                if (!empty($files)) {
                    Log::info("Processing files for question {$questionId}:", ['count' => count($files)]);

                    if ($question->type === 'file' && count($files) > 1) {
                        $allErrors[$questionId][] = 'Only one file is allowed for this question.';
                    }

                    foreach ($files as $file) {
                        if (!$file->isValid()) {
                            $allErrors[$questionId][] = "File '{$file->getClientOriginalName()}' is corrupted or invalid.";
                            continue;
                        }

                      $extension = strtolower($file->getClientOriginalExtension());
$mimeType = $file->getMimeType();

// Cek extension
if (!in_array($extension, $allowedFileTypes)) {
    $allErrors[$questionId][] = "File '{$file->getClientOriginalName()}' has unsupported extension. Allowed: " . implode(', ', $allowedFileTypes);
    continue;
}

// Cek MIME type
if (!in_array($mimeType, $allowedMimeTypes)) {
    $allErrors[$questionId][] = "File '{$file->getClientOriginalName()}' has unsupported MIME type ({$mimeType}).";
    continue;
}


                        // PERBAIKAN: Gunakan secure file upload dengan Laravel Storage
                        try {
                            $securePath = $this->handleSecureFileUpload($file, $questionId);
                            $filePaths[] = $securePath;
                            Log::info("File uploaded successfully:", [
                                'original_name' => $file->getClientOriginalName(),
                                'secure_path' => $securePath,
                                'question_id' => $questionId
                            ]);
                        } catch (\Exception $e) {
                            Log::error("File upload failed:", [
                                'file' => $file->getClientOriginalName(),
                                'error' => $e->getMessage(),
                                'question_id' => $questionId
                            ]);
                            $allErrors[$questionId][] = "Failed to upload file '{$file->getClientOriginalName()}': " . $e->getMessage();
                        }
                    }
                    $filePathsByQuestion[$questionId] = $filePaths;
                }

                // Validate is_required for file questions
                if ($question->is_required && in_array($question->type, ['file', 'multiple_file']) && empty($filePaths)) {
                    $allErrors[$questionId][] = 'This question is required and must have at least one file uploaded.';
                }
            }

            // Check for missing required questions
            foreach ($questions as $question) {
                if ($question->is_required && !in_array($question->id, $questionIds)) {
                    $allErrors[$question->id][] = 'This required question is missing an answer or file.';
                }
            }

            if (!empty($allErrors)) {
                // Cleanup uploaded files if validation fails
                foreach ($filePathsByQuestion as $paths) {
                    foreach ($paths as $path) {
                        $this->deleteFileSecurely($path);
                    }
                }

                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $allErrors
                ], 422);
            }

            $createdAnswers = [];
            foreach ($answers as $answer) {
                $questionId = $answer['question_id'];
                $question = $questions->get($questionId);
                $filePaths = $filePathsByQuestion[$questionId] ?? [];

                $newAnswer = Answers::create([
                    'question_id' => $questionId,
                    'user_id' => Auth::id(),
                    'submission_id' => $formattedId,
                    'question' => htmlspecialchars($question->question),
                    'page' => $question->page,
                    'sort_order' => $question->sort_order,
                    'label' => htmlspecialchars($question->label),
                    'period_id' => $question->period_id,
                    'options' => $question->options,
                    'answer' => htmlspecialchars($answer['answer'] ?? ''),
                    'file_path' => !empty($filePaths) ? json_encode($filePaths) : null,
                    'type' => $question->type,
                ]);
                $createdAnswers[] = $newAnswer;
            }

            $answersData = Answers::with(['user', 'period'])
                ->where('submission_id', $formattedId)
                ->orderBy('id', 'desc')
                ->get();

            // Map question_id to is_required for response
            $questionIsRequired = $questions->mapWithKeys(function ($question) {
                return [$question->id => (bool) $question->is_required];
            })->toArray();

            $answerSummary = Answers::selectRaw('submission_id, COUNT(*) as total_answers, MAX(id) as latest_id')
                ->where('submission_id', $formattedId)
                ->groupBy('submission_id')
                ->first();

            $latestResult = Result::where('submission_answers', $formattedId)->first();

            $statusLabel = 'Belum_Diverifikasi';
            $statusIcon = 'hourglass_empty';
            $statusColor = 'orange';

            if ($latestResult) {
                if ($latestResult->status === true) {
                    $statusLabel = 'Lulus';
                    $statusIcon = 'check_circle';
                    $statusColor = 'green';
                } elseif ($latestResult->status === false && $latestResult->selection_type !== null) {
                    $statusLabel = 'Tidak_Lulus';
                    $statusIcon = 'cancel';
                    $statusColor = 'red';
                } else {
                    $statusLabel = $latestResult->is_approve ? 'Berkas_Diterima' : 'Berkas_Dikembalikan';
                    $statusIcon = $latestResult->is_approve ? 'check_circle' : 'cancel';
                    $statusColor = $latestResult->is_approve ? 'green' : 'red';
                }
            }

            $firstAnswer = $answersData->first();
            $formattedData = [
                'submission_id' => $formattedId,
                'key' => $formattedId,
                'period_id' => $question->period_id,
                'total_answers' => $answerSummary->total_answers,
                'latest_id' => $answerSummary->latest_id,
                'user_id' => optional($firstAnswer->user)->id ?? 'N/A',
                'user_name' => optional($firstAnswer->user)->name ?? 'N/A',
                'user_email' => optional($firstAnswer->user)->email ?? 'N/A',
                'user_phone_number' => optional($firstAnswer->user)->phone_number ?? 'N/A',
                'created_at' => $firstAnswer->created_at->toISOString(),
                'answers' => $answersData->map(function ($answer) use ($questionIsRequired) {
                    return [
                        'id' => $answer->id,
                        'question_id' => $answer->question_id,
                        'page' => $answer->page,
                        'label' => $answer->label,
                        'question' => $answer->question,
                        'sort_order' => $answer->sort_order,
                        'submission_id' => $answer->submission_id,
                        'answer' => $answer->answer,
                        'file_path' => $this->getFileUrl($answer->file_path),
                        'type' => $answer->type,
                        'options' => $answer->options,
                        'is_required' => isset($questionIsRequired[$answer->question_id]) ? (bool) $questionIsRequired[$answer->question_id] : false,
                        'created_at' => $answer->created_at->toISOString(),
                        'updated_at' => $answer->updated_at->toISOString(),
                        'user_id' => $answer->user_id,
                        'period_id' => $answer->period_id,
                        'user' => $answer->user ? [
                            'id' => $answer->user->id,
                            'wallet_id' => $answer->user->wallet_id ?? null,
                            'name' => $answer->user->name,
                            'avatar' => $answer->user->avatar,
                            'email' => $answer->user->email,
                            'phone_number' => $answer->user->phone_number,
                            'email_verified_at' => $answer->user->email_verified_at,
                            'status' => $answer->user->status,
                            'created_at' => $answer->user->created_at,
                            'updated_at' => $answer->user->updated_at,
                            'last_online_at' => $answer->user->last_online_at,
                        ] : null,
                        'period' => $answer->period ? [
                            'id' => $answer->period->id,
                            'key' => $answer->period->key,
                            'title' => $answer->period->title,
                            'status' => (int) $answer->period->status,
                            'is_published' => (bool) $answer->period->is_published,
                            'description' => $answer->period->description,
                            'created_at' => $answer->period->created_at->toISOString(),
                            'updated_at' => $answer->period->updated_at->toISOString(),
                        ] : null,
                    ];
                })->toArray(),
                'period' => $firstAnswer->period ? [
                    'id' => $firstAnswer->period->id,
                    'title' => $firstAnswer->period->title,
                    'status' => (int) $firstAnswer->period->status,
                    'is_published' => (bool) $firstAnswer->period->is_published,
                    'created_at' => $firstAnswer->period->created_at->toISOString(),
                ] : null,
                'validation_status' => [
                    'label' => $statusLabel,
                    'icon' => $statusIcon,
                    'color' => $statusColor,
                ],
                'result' => $latestResult ? [
                    'id' => $latestResult->id,
                    'submission_answers' => $latestResult->submission_answers,
                    'selection_type' => $latestResult->selection_type,
                    'value' => $latestResult->value,
                    'status' => $latestResult->status,
                    'is_approve' => $latestResult->is_approve,
                    'created_at' => $latestResult->created_at->toISOString(),
                    'updated_at' => $latestResult->updated_at->toISOString(),
                ] : null,
            ];
            $template = NotificationWhatsAppMessage::where('code', 'new_submission')->first();

            if (!$template) {
                Log::warning("Template WhatsApp '{$template}' tidak ditemukan di database");
                return false;
            }

            // Default placeholders

            // Send WhatsApp notification to user
            // $recipientPhone = $this->toE164PhoneNumber($recipientPhone);
            $template = NotificationWhatsAppMessage::where('code', 'new_submission')->first();

            if (!$template) {
                Log::warning("Template WhatsApp 'new_submission' tidak ditemukan di database");
                return false;
            }

            $recipientPhone = $this->toE164PhoneNumber($firstAnswer->user->phone_number);

            if ($recipientPhone) {
                try {
                 if ($firstAnswer && $answerSummary) {
                        $this->sendWhatsAppNotification(
                            $firstAnswer->user,
                            $formattedId,
                            $answersData,
                            'new_submission'
                        );
                    }

                } catch (\Exception $e) {
                    Log::error('Error sending WhatsApp notification to user', [
                        'message'        => $e->getMessage(),
                        'submission_id'  => $formattedId,
                    ]);
                }
            }

            // Send WhatsApp notification to admin
            $adminPhone = env('ADMIN_PHONE_NUMBER', '');
            if ($adminPhone) {
                try {
                    $adminPhone = $this->toE164PhoneNumber($adminPhone);
                    $adminMessage = <<<MSG
    Pendaftaran Baru!

    Submission ID: {$formattedId}
    Nama: {$firstAnswer->user->name}
    Email: {$firstAnswer->user->email}
    Total Jawaban: {$answerSummary->total_answers}
    Periode: {$firstAnswer->period->title}

    Silakan verifikasi di sistem.
    MSG;

                    $response = Http::post(env('SOCKET_SERVER_URL') . '/send-whatsapp', [
                        'phone_number' => $adminPhone,
                        'message' => $adminMessage,
                    ]);

                    if ($response->failed()) {
                        Log::error('WhatsApp notification to admin failed', [
                            'status' => $response->status(),
                            'body' => $response->body(),
                        ]);
                    } else {
                        Log::info('WhatsApp notification sent to admin', [
                            'phone_number' => $adminPhone,
                            'submission_id' => $formattedId,
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Error sending WhatsApp notification to admin', [
                        'message' => $e->getMessage(),
                        'submission_id' => $formattedId,
                    ]);
                }
            }

            // Send Socket.IO notification
            try {
                $socketResponse = Http::timeout(5)->retry(3, 1000)->post(env('SOCKET_SERVER_URL') .'/notify-new-submission', [
                    'submission' => array_merge($formattedData, [
                        'updated_at' => $firstAnswer->updated_at->toISOString(), // Add updated_at
                    ]),
                ]);

                if ($socketResponse->failed()) {
                    Log::error('Failed to send Socket.IO notification', [
                        'status' => $socketResponse->status(),
                        'body' => $socketResponse->body(),
                        'submission_id' => $formattedId,
                    ]);
                } else {
                    Log::info('Socket.IO notification sent', [
                        'submission_id' => $formattedId,
                        'response' => $socketResponse->json(),
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Error sending Socket.IO notification', [
                    'message' => $e->getMessage(),
                    'submission_id' => $formattedId,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Answers submitted successfully',
                'data' => $formattedData,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error submitting answers:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'submission_id' => isset($formattedId) ? $formattedId : null,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while submitting answers',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    private function toE164PhoneNumber($number)
    {
        $normalized = preg_replace('/[^0-9]/', '', $number);

        if (Str::startsWith($normalized, '628')) {
            return '+' . $normalized;
        }

        if (Str::startsWith($number, '+628')) {
            return $number;
        }

        if (Str::startsWith($normalized, '0')) {
            return '+62' . substr($normalized, 1);
        }

        if (Str::startsWith($normalized, '8')) {
            return '+62' . $normalized;
        }

        if (Str::startsWith($normalized, '62')) {
            return '+' . $normalized;
        }

        return '+62' . $normalized;
    }

    public function deleteRespondentBySubmission($submissionId)
{
    try {
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        Log::info('Attempting to delete submission:', ['submission_id' => $submissionId]);

        $answers = Answers::where('submission_id', $submissionId)
            ->orWhere('submission_id', 'LIKE', '%' . str_replace('-', '', $submissionId) . '%')
            ->get();

        if ($answers->isEmpty()) {
            Log::warning('Submission not found after fuzzy match:', ['submission_id' => $submissionId]);
            return response()->json([
                'success' => false,
                'message' => 'Submission tidak ditemukan'
            ], 404);
        }

        // PERBAIKAN: Gunakan deleteFileSecurely untuk menghapus file
        foreach ($answers as $answer) {
            if ($answer->file_path) {
                // Handle JSON-encoded file paths (multiple files)
                $filePaths = json_decode($answer->file_path, true);

                if (json_last_error() === JSON_ERROR_NONE && is_array($filePaths)) {
                    // Multiple files
                    foreach ($filePaths as $filePath) {
                        if ($filePath) {
                            $this->deleteFileSecurely($filePath);
                        }
                    }
                } else {
                    // Single file
                    $this->deleteFileSecurely($answer->file_path);
                }
            }
        }

        // Delete answers from database
        $deletedAnswersCount = 0;
        foreach ($answers as $answer) {
            $deletedAnswersCount += Answers::where('id', $answer->id)->delete();
        }

        // Delete results from database
        $deletedResultsCount = 0;
        $uniqueSubmissionIds = $answers->pluck('submission_id')->unique();
        foreach ($uniqueSubmissionIds as $submissionIdToDelete) {
            $deletedResultsCount += Result::where('submission_answers', $submissionIdToDelete)->delete();
        }

        Log::info('Respondent deleted by submission_id:', [
            'submission_id' => $submissionId,
            'user_id' => Auth::id(),
            'deleted_answers' => $deletedAnswersCount,
            'deleted_results' => $deletedResultsCount,
            'unique_submissions' => $uniqueSubmissionIds->toArray()
        ]);

        // Emit Socket.IO event for respondent deletion
        try {
            $socketResponse = Http::timeout(5)->post(env('SOCKET_SERVER_URL') . '/notify-respondent-deleted', [
                'submission_id' => $submissionId,
            ]);

            if ($socketResponse->failed()) {
                Log::error('Failed to send Socket.IO respondent-deleted notification', [
                    'status' => $socketResponse->status(),
                    'body' => $socketResponse->body(),
                ]);
            } else {
                Log::info('Socket.IO respondent-deleted event emitted', [
                    'submission_id' => $submissionId,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error sending Socket.IO respondent-deleted notification', [
                'message' => $e->getMessage(),
                'submission_id' => $submissionId,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Respondent berhasil dihapus',
            'submission_id' => $submissionId,
            'deleted_answers' => $deletedAnswersCount,
            'deleted_results' => $deletedResultsCount,
        ], 200);

    } catch (Exception $e) {
        Log::error('Error deleting respondent by submission_id:', [
            'submission_id' => $submissionId,
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Terjadi kesalahan saat menghapus respondent',
            'debug' => config('app.debug') ? $e->getMessage() : null
        ], 500);
    }
}


  public function deleteRespondent($submissionId)
{
    try {
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        Log::info('Attempting to delete submission via POST:', ['submission_id' => $submissionId]);

        $answers = Answers::where('submission_id', $submissionId)
            ->orWhere('submission_id', 'LIKE', '%' . str_replace('-', '', $submissionId) . '%')
            ->get();

        if ($answers->isEmpty()) {
            Log::warning('Submission not found after fuzzy match:', ['submission_id' => $submissionId]);
            return response()->json([
                'success' => false,
                'message' => 'Submission tidak ditemukan'
            ], 404);
        }

        // PERBAIKAN: Gunakan deleteFileSecurely untuk menghapus file
        foreach ($answers as $answer) {
            if ($answer->file_path) {
                // Handle JSON-encoded file paths (multiple files)
                $filePaths = json_decode($answer->file_path, true);

                if (json_last_error() === JSON_ERROR_NONE && is_array($filePaths)) {
                    // Multiple files
                    foreach ($filePaths as $filePath) {
                        if ($filePath) {
                            $this->deleteFileSecurely($filePath);
                        }
                    }
                } else {
                    // Single file
                    $this->deleteFileSecurely($answer->file_path);
                }
            }
        }

        // Delete answers from database
        $deletedAnswersCount = 0;
        foreach ($answers as $answer) {
            $deletedAnswersCount += Answers::where('id', $answer->id)->delete();
        }

        // Delete results from database
        $deletedResultsCount = 0;
        $uniqueSubmissionIds = $answers->pluck('submission_id')->unique();
        foreach ($uniqueSubmissionIds as $submissionIdToDelete) {
            $deletedResultsCount += Result::where('submission_answers', $submissionIdToDelete)->delete();
        }

        Log::info('Respondent deleted by submission_id via POST:', [
            'submission_id' => $submissionId,
            'user_id' => Auth::id(),
            'deleted_answers' => $deletedAnswersCount,
            'deleted_results' => $deletedResultsCount,
            'unique_submissions' => $uniqueSubmissionIds->toArray()
        ]);

        // Emit Socket.IO event for respondent deletion
        try {
            $socketResponse = Http::timeout(5)->post(env('SOCKET_SERVER_URL') . '/notify-respondent-deleted', [
                'submission_id' => $submissionId,
            ]);

            if ($socketResponse->failed()) {
                Log::error('Failed to send Socket.IO respondent-deleted notification', [
                    'status' => $socketResponse->status(),
                    'body' => $socketResponse->body(),
                ]);
            } else {
                Log::info('Socket.IO respondent-deleted event emitted', [
                    'submission_id' => $submissionId,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error sending Socket.IO respondent-deleted notification', [
                'message' => $e->getMessage(),
                'submission_id' => $submissionId,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Respondent berhasil dihapus',
            'submission_id' => $submissionId,
            'deleted_answers' => $deletedAnswersCount,
            'deleted_results' => $deletedResultsCount,
        ], 200);

    } catch (Exception $e) {
        Log::error('Error deleting respondent by submission_id via POST:', [
            'submission_id' => $submissionId,
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Terjadi kesalahan saat menghapus respondent',
            'debug' => config('app.debug') ? $e->getMessage() : null
        ], 500);
    }
}

    /**
     * Secure file upload handler
     */
     private function handleSecureFileUpload($file, $questionId)
    {
        // Enhanced validation
        if (!$this->validateFileSecurely($file)) {
            throw new \Exception("Validasi file gagal untuk: " . $file->getClientOriginalName());
        }

        // Generate secure filename
        $extension = strtolower($file->getClientOriginalExtension());
        $filename = hash('sha256', time() . $file->getClientOriginalName() . Str::random(10)) . '.' . $extension;

        // PERBAIKAN: Buat direktori jika belum ada
        $storagePath = 'form-answers';
        if (!Storage::disk('local')->exists($storagePath)) {
            Storage::disk('local')->makeDirectory($storagePath);
        }

        // PERBAIKAN: Store menggunakan Laravel Storage dengan disk 'local'
        try {
            $path = $file->storeAs($storagePath, $filename, 'local');

            Log::info('File uploaded securely:', [
                'original_name' => $file->getClientOriginalName(),
                'secure_filename' => $filename,
                'storage_path' => $path,
                'question_id' => $questionId,
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType()
            ]);

            // Verifikasi file berhasil disimpan
            if (!Storage::disk('local')->exists($path)) {
                throw new \Exception("File gagal disimpan ke storage: " . $path);
            }

            return $path;
        } catch (\Exception $e) {
            Log::error('Error storing file:', [
                'original_name' => $file->getClientOriginalName(),
                'filename' => $filename,
                'error' => $e->getMessage(),
                'question_id' => $questionId
            ]);
            throw $e;
        }
    }

    /**
     * Enhanced file validation
     */
   private function validateFileSecurely($file)
{
    // === 1. Pastikan file valid ===
    if (!$file->isValid()) {
        Log::error('File validation failed: Invalid file', [
            'name'  => $file->getClientOriginalName(),
            'error' => $file->getErrorMessage(),
        ]);
        return false;
    }

    // === 2. Daftar ekstensi & MIME yang diizinkan ===
    //     Sudah mencakup screenshot HP (HEIC/HEIF/JFIF)
     $allowedTypes = [
        // Dokumen
        'pdf'  => ['application/pdf'],
        'doc'  => ['application/msword'],
        'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        'xls'  => ['application/vnd.ms-excel'],
        'xlsx' => ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        'txt'  => ['text/plain'],

        // Gambar
        'png'  => ['image/png', 'image/x-png'],
        'jpg'  => ['image/jpeg', 'image/pjpeg', 'image/jpg'],
        'jpeg' => ['image/jpeg', 'image/pjpeg'],
        'gif'  => ['image/gif'],
        'webp' => ['image/webp'],
        'heic' => ['image/heic', 'image/heif'],
        'heif' => ['image/heic', 'image/heif'],
        'jfif' => ['image/jpeg', 'image/pjpeg'],
        'tif'  => ['image/tiff'],
        'tiff' => ['image/tiff'],
    ];


    $extension = strtolower($file->getClientOriginalExtension());

    // === 3. Validasi ekstensi ===
    if (!array_key_exists($extension, $allowedTypes)) {
        Log::error('File validation failed: Unsupported extension', [
            'name'      => $file->getClientOriginalName(),
            'extension' => $extension,
        ]);
        return false;
    }

    // === 4. Validasi MIME ===
    $realMimeType  = $file->getMimeType();
    $guessedExt    = $file->guessExtension();
    $expectedMimes = $allowedTypes[$extension];

    if (!in_array($realMimeType, $expectedMimes, true)) {
        Log::error('File validation failed: MIME type mismatch', [
            'name'        => $file->getClientOriginalName(),
            'extension'   => $extension,
            'expected'    => $expectedMimes,
            'actual'      => $realMimeType,
            'guessed_ext' => $guessedExt,
        ]);
        return false;
    }

    // === 5. Batas ukuran file: 2 GB ===
    // 2 GB = 2 * 1024 * 1024 * 1024 byte
    $maxSize = 2 * 1024 * 1024 * 1024;
    if ($file->getSize() > $maxSize) {
        Log::error('File validation failed: File too large', [
            'name'     => $file->getClientOriginalName(),
            'size'     => $file->getSize(),
            'max_size' => $maxSize,
        ]);
        return false;
    }

    // === 6. Pemeriksaan konten tambahan ===
    if ($this->containsSuspiciousContent($file)) {
        Log::error('File validation failed: Contains suspicious content', [
            'name' => $file->getClientOriginalName(),
        ]);
        return false;
    }

    // === 7. Logging sukses (opsional) ===
    Log::info('File validation success', [
        'name'      => $file->getClientOriginalName(),
        'extension' => $extension,
        'mime'      => $realMimeType,
        'size'      => $file->getSize(),
    ]);

    return true;
}


    /**
     * Generate secure filename
     */
    private function generateSecureFilename($extension)
    {
        // Generate truly random filename
        return hash('sha256', uniqid('', true) . random_bytes(32)) . '.' . $extension;
    }

    /**
     * Check for suspicious content in files
     */
    private function containsSuspiciousContent($file)
    {
        try {
            // Read first 1KB of file
            $handle = fopen($file->getRealPath(), 'rb');
            if (!$handle) {
                return true; // Gagal baca = suspicious
            }

            $content = fread($handle, 1024);
            fclose($handle);

            // Check for PHP tags and other suspicious patterns
            $suspiciousPatterns = [
                '/<\?php/i',
                '/<\?=/i',
                '/<script/i',
                '/eval\s*\(/i',
                '/exec\s*\(/i',
                '/system\s*\(/i',
                '/shell_exec/i',
                '/passthru/i',
            ];

            foreach ($suspiciousPatterns as $pattern) {
                if (preg_match($pattern, $content)) {
                    return true;
                }
            }

            return false;
        } catch (\Exception $e) {
            Log::error('Error checking file content:', [
                'file' => $file->getClientOriginalName(),
                'error' => $e->getMessage()
            ]);
            return true; // Error = suspicious
        }
    }

    /**
     * Serve file securely
     */
    /**
     * Serve file securely
     */
  public function serveFile(string $filename)
{
    try {
        // === 1. Validasi format nama file: 64 hex + ekstensi yang diizinkan
        if (!preg_match(
            '/^[a-f0-9]{64}\.(pdf|doc|docx|xls|xlsx|txt|png|jpg|jpeg|webp|gif|heic|heif|jfif)$/i',
            $filename
        )) {
            Log::warning('Invalid filename format attempted', ['filename' => $filename]);
            return response()->json([
                'success' => false,
                'message' => 'Format nama file tidak valid',
            ], 400);
        }

        $path = 'form-answers/' . $filename;

        // === 2. Pastikan file benar-benar ada
        if (!Storage::disk('local')->exists($path)) {
            Log::warning('File not found', ['path' => $path]);
            return response()->json([
                'success' => false,
                'message' => 'File tidak ditemukan',
            ], 404);
        }

        // === 3. Validasi ulang ekstensi & MIME
        $extension   = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $contentType = $this->getContentType($extension);

        // Double-check MIME sebenarnya (finfo) untuk mencegah spoofing
        $realMime = Storage::disk('local')->mimeType($path);
        if ($realMime && $contentType !== 'application/octet-stream' && stripos($realMime, strtok($contentType, '/')) === false) {
            Log::error('MIME mismatch when serving file', [
                'filename'   => $filename,
                'expected'   => $contentType,
                'detected'   => $realMime,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Tipe file tidak sesuai',
            ], 415); // 415 Unsupported Media Type
        }

        // === 4. Log akses sukses
        Log::info('File accessed successfully', [
            'filename' => $filename,
            'mime'     => $contentType,
            'size'     => Storage::disk('local')->size($path),
        ]);

        // === 5. Kirim response dengan header keamanan tambahan
        return Storage::disk('local')->response($path, basename($filename), [
            'Content-Type'              => $contentType,
            'Cache-Control'             => 'private, max-age=3600',
            'Content-Disposition'       => 'inline; filename="' . basename($filename) . '"',
            'X-Content-Type-Options'    => 'nosniff',   // Hindari MIME sniffing
            'X-Frame-Options'           => 'DENY',     // Cegah clickjacking
            'X-XSS-Protection'          => '1; mode=block',
        ]);

    } catch (\Throwable $e) {
        Log::error('Error serving file', [
            'filename' => $filename,
            'error'    => $e->getMessage(),
            'file'     => $e->getFile(),
            'line'     => $e->getLine(),
        ]);
        return response()->json([
            'success' => false,
            'message' => 'Terjadi kesalahan saat mengakses file',
            'debug'   => config('app.debug') ? $e->getMessage() : null,
        ], 500);
    }
}




    /**
     * Get content type for file extension
     */
  /**
 * Tentukan Content-Type HTTP berdasarkan ekstensi file.
 *
 * @param  string  $extension  Ekstensi file tanpa titik, misal: 'jpg'
 * @return string  MIME type yang sesuai atau 'application/octet-stream' sebagai fallback
 */
private function getContentType($extension)
{
    // Normalisasi ke huruf kecil agar tidak case-sensitive
    $ext = strtolower($extension);

    $allowedTypes = [
        // ===== Dokumen =====
        'pdf'  => ['application/pdf'],

        'doc'  => ['application/msword'],
        'docx' => [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],

        'xls'  => ['application/vnd.ms-excel'],
        'xlsx' => [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/zip' // beberapa perangkat lama kirim zip untuk xlsx
        ],

        'txt'  => ['text/plain'],

        'csv'  => ['text/csv', 'application/csv', 'text/comma-separated-values'],

        // ===== Gambar =====
        'png'  => ['image/png', 'image/x-png'],
        'jpg'  => ['image/jpeg', 'image/pjpeg', 'image/jpg'],
        'jpeg' => ['image/jpeg', 'image/pjpeg'],
        'gif'  => ['image/gif'],
        'webp' => ['image/webp'],

        // HEIC / HEIF (iPhone)
        'heic' => ['image/heic', 'image/heif'],
        'heif' => ['image/heic', 'image/heif'],

        // Format turunan JPEG
        'jfif' => ['image/jpeg', 'image/pjpeg'],
        'tif'  => ['image/tiff'],
        'tiff' => ['image/tiff'],
        'bmp'  => ['image/bmp'],

        // ===== Vector / SVG =====
        'svg'  => ['image/svg+xml'],

        // ===== Video =====
        'mp4'  => ['video/mp4', 'application/mp4'],
        'mov'  => ['video/quicktime'],
        'avi'  => ['video/x-msvideo'],
        'mkv'  => ['video/x-matroska'],

        // ===== Arsip / Kompresi =====
        'zip'  => ['application/zip', 'application/x-zip-compressed'],
        'rar'  => ['application/x-rar', 'application/x-rar-compressed'],
        '7z'   => ['application/x-7z-compressed'],
    ];


    // Jika ekstensi tidak dikenal, kembalikan generic binary stream
    return $contentTypes[$ext] ?? 'application/octet-stream';
}

    /**
     * Generate file URL for API response
     */
    private function getFileUrl($filePath)
    {
        if (!$filePath) {
            return null;
        }

        // Handle JSON-encoded file paths (for multiple_file)
        $filePaths = json_decode($filePath, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($filePaths)) {
            return array_map(function ($path) {
                $filename = basename($path);
                return url('/api/form-answers/' . $filename);
            }, array_filter($filePaths));
        }

        // Handle single file path
        $filename = basename($filePath);
        return url('/api/form-answers/' . $filename);
    }

   private function deleteFileSecurely($filePath)
{
    try {
        if (!$filePath) {
            return false;
        }

        // Normalisasi path - hapus leading slash jika ada
        $normalizedPath = ltrim($filePath, '/');

        // Pastikan path dimulai dengan form-answers/ untuk keamanan
        if (!str_starts_with($normalizedPath, 'form-answers/')) {
            // Jika path tidak dimulai dengan form-answers/, coba tambahkan
            if (!str_starts_with($normalizedPath, 'ppdb/answers/files/')) {
                Log::warning('Attempting to delete file with unexpected path:', ['path' => $filePath]);
                return false;
            }
            // Handle legacy path format (ppdb/answers/files/)
            $fileName = basename($normalizedPath);
            $normalizedPath = 'form-answers/' . $fileName;
        }

        if (Storage::disk('local')->exists($normalizedPath)) {
            $deleted = Storage::disk('local')->delete($normalizedPath);
            if ($deleted) {
                Log::info('Secure file deleted:', ['file_path' => $normalizedPath]);
                return true;
            } else {
                Log::warning('Failed to delete file:', ['file_path' => $normalizedPath]);
                return false;
            }
        } else {
            // File tidak ada, mungkin sudah dihapus atau path berbeda
            Log::warning('File not found for deletion:', ['file_path' => $normalizedPath]);

            // Coba hapus dengan path legacy jika masih ada
            $legacyPath = str_replace('form-answers/', 'ppdb/answers/files/', $normalizedPath);
            if (file_exists(public_path($legacyPath))) {
                $deleted = unlink(public_path($legacyPath));
                if ($deleted) {
                    Log::info('Legacy file deleted:', ['file_path' => $legacyPath]);
                    return true;
                }
            }

            return false;
        }
    } catch (\Exception $e) {
        Log::error('Error deleting file:', [
            'file_path' => $filePath,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        return false;
    }
}


public function updateAnswers(Request $request, $submissionId)
{
    try {
        if (!Auth::check()) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Validate submission exists and belongs to the authenticated user
        $existingAnswers = Answers::where('submission_id', $submissionId)
            ->get();

        if ($existingAnswers->isEmpty()) {
            return response()->json([
                'message' => 'Submission not found or unauthorized',
                'errors' => ['submission_id' => ['Invalid submission ID']]
            ], 404);
        }

        $periodId = $existingAnswers->first()->period_id;
        $userId = Auth::id();

        // Check if user has permission to update this submission
        $userHasPermission = $existingAnswers->where('user_id', $userId)->isNotEmpty();
        if (!$userHasPermission && !Auth::user()->hasRole(['administrator', 'super admin'])) {
            return response()->json([
                'message' => 'Unauthorized to update this submission',
                'errors' => ['permission' => ['You do not have permission to update this submission']]
            ], 403);
        }

        if (config('app.debug')) {
            Log::info('Update answers request:', [
                'submission_id' => $submissionId,
                'user_id' => $userId,
                'period_id' => $periodId,
                'request_method' => $request->method(),
                'content_type' => $request->header('Content-Type')
            ]);
        }

        // Handle both JSON and FormData properly
        $answersInput = $request->input('answers');

        // Parse answers input
        $answers = null;

        if (is_array($answersInput)) {
            $answers = $answersInput;
        } elseif (is_string($answersInput)) {
            $answers = json_decode($answersInput, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json([
                    'message' => 'Invalid answers format',
                    'errors' => ['answers' => ['The answers field must be a valid JSON array']],
                    'debug' => [
                        'json_error' => json_last_error_msg(),
                        'json_error_code' => json_last_error()
                    ]
                ], 422);
            }
        } else {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => ['answers' => ['The answers field is required and cannot be empty']],
                'debug' => [
                    'received_input' => $answersInput,
                    'input_type' => gettype($answersInput),
                    'is_json_request' => $request->isJson(),
                    'content_type' => $request->header('Content-Type')
                ]
            ], 422);
        }

        // Validate answers is an array and not empty
        if (!is_array($answers) || empty($answers)) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => ['answers' => ['The answers field is required and must contain at least one answer']],
                'debug' => [
                    'decoded_answers' => $answers,
                    'answers_type' => gettype($answers),
                    'answers_count' => is_array($answers) ? count($answers) : 'not_array'
                ]
            ], 422);
        }

        // FIXED: Get question IDs from answers (these should be the actual question IDs from tb_questions)
        $submittedQuestionIds = array_column($answers, 'question_id');
        $submittedQuestionIds = array_unique(array_filter($submittedQuestionIds, 'is_numeric'));

        if (empty($submittedQuestionIds)) {
            return response()->json([
                'message' => 'No valid question IDs found in submission',
                'errors' => ['questions' => ['At least one valid question ID is required']],
                'debug' => ['submitted_data' => $answers]
            ], 422);
        }

        // FIXED: Get questions that belong to the same period as the submission
        $existingQuestions = Questions::where('period_id', $periodId)
            ->whereIn('id', $submittedQuestionIds)
            ->get(['id', 'question', 'period_id', 'is_required', 'type', 'page', 'sort_order', 'label', 'options']);

        $existingQuestionIds = $existingQuestions->pluck('id')->toArray();
        $missingQuestionIds = array_diff($submittedQuestionIds, $existingQuestionIds);

        // Check if questions exist but in different periods
        $questionsInOtherPeriods = [];
        if (!empty($missingQuestionIds)) {
            $questionsInOtherPeriods = Questions::whereIn('id', $missingQuestionIds)
                ->where('period_id', '!=', $periodId)
                ->get(['id', 'question', 'period_id'])
                ->toArray();
        }

        // If there are missing question IDs, return detailed error
        if (!empty($missingQuestionIds)) {
            $errorDetails = [];
            foreach ($missingQuestionIds as $missingId) {
                $inOtherPeriod = collect($questionsInOtherPeriods)->where('id', $missingId)->first();
                if ($inOtherPeriod) {
                    $errorDetails[] = "Question ID {$missingId} belongs to period {$inOtherPeriod['period_id']}, not period {$periodId}";
                } else {
                    $errorDetails[] = "Question ID {$missingId} does not exist in database";
                }
            }

            return response()->json([
                'message' => 'Question validation failed',
                'errors' => [
                    'questions' => $errorDetails
                ],
                'debug' => [
                    'submission_id' => $submissionId,
                    'period_id' => $periodId,
                    'submitted_question_ids' => $submittedQuestionIds,
                    'existing_question_ids' => $existingQuestionIds,
                    'missing_question_ids' => $missingQuestionIds,
                    'questions_in_other_periods' => collect($questionsInOtherPeriods)->pluck('id')->toArray()
                ]
            ], 422);
        }

        // Basic validation
        $validator = Validator::make(['answers' => $answers], [
            'answers' => 'required|array|max:100',
            'answers.*.question_id' => 'required|integer',
            'answers.*.answer' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Basic validation failed',
                'errors' => $validator->errors()->all(),
                'debug' => [
                    'validation_errors' => $validator->errors()->toArray()
                ]
            ], 422);
        }

        $allowedFileTypes = [
            'pdf','doc','docx','xls','xlsx','txt',
            'png','jpg','jpeg','gif','webp',
            'heic','heif','jfif'
        ];

        $allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'image/png',
            'image/x-png',
            'image/jpeg',
            'image/pjpeg',
            'image/jpg',
            'image/gif',
            'image/webp',
            'image/heic',
            'image/heif',
            'image/jfif',
        ];

        $allErrors = [];
        $filePathsByQuestion = [];

        // Use the existing questions we already fetched
        $questions = $existingQuestions->keyBy('id');

        // FIXED: Get all required questions for this period that user is trying to answer
        $allRequiredQuestionIds = $questions->where('is_required', true)->pluck('id')->toArray();

        // Check for missing required questions
        $providedQuestionIds = array_column($answers, 'question_id');
        foreach ($allRequiredQuestionIds as $reqId) {
            if (!in_array($reqId, $providedQuestionIds)) {
                $question = $questions->get($reqId);
                $allErrors[$reqId][] = "Required question '{$question->question}' is missing an answer or file.";
            }
        }

        // Process each answer
        foreach ($answers as $answerData) {
            $questionId = $answerData['question_id'];
            $question = $questions->get($questionId);

            if (!$question) {
                $allErrors[$questionId][] = "Question not found in period {$periodId}";
                continue;
            }

            // Validate text-based answers
            $answerText = $answerData['answer'] ?? '';

            if ($question->is_required) {
                if (in_array($question->type, ['text', 'textarea', 'radio']) && empty(trim($answerText))) {
                    $allErrors[$questionId][] = 'This question is required and must have an answer.';
                } elseif ($question->type === 'checkbox' && empty(trim($answerText))) {
                    $allErrors[$questionId][] = 'Please select at least one option for this required question.';
                }
            }

            // FIXED: Handle files with better error handling
            $fileKeys = ["files.{$questionId}", "files[{$questionId}]"];
            $newFiles = [];

            foreach ($fileKeys as $key) {
                if ($request->hasFile($key)) {
                    $uploadedFiles = $request->file($key);
                    $newFiles = is_array($uploadedFiles) ? $uploadedFiles : [$uploadedFiles];
                    break;
                }
            }

            $newFilePaths = [];
            if (!empty($newFiles)) {
                if ($question->type === 'file' && count($newFiles) > 1) {
                    $allErrors[$questionId][] = 'Only one file is allowed for this question.';
                    continue; // Skip processing multiple files for single file question
                }

                foreach ($newFiles as $file) {
                    if (!$file->isValid()) {
                        $allErrors[$questionId][] = "File '{$file->getClientOriginalName()}' is corrupted or invalid.";
                        continue;
                    }

                    $extension = strtolower($file->getClientOriginalExtension());
                    $mimeType = $file->getMimeType();

                    if (!in_array($extension, $allowedFileTypes) || !in_array($mimeType, $allowedMimeTypes)) {
                        $allErrors[$questionId][] = "File '{$file->getClientOriginalName()}' has unsupported format.";
                        continue;
                    }

                    try {
                        $securePath = $this->handleSecureFileUpload($file, $questionId);
                        $newFilePaths[] = $securePath;
                        $filePathsByQuestion[$questionId][] = $securePath;
                    } catch (\Exception $e) {
                        Log::error("File upload failed:", [
                            'file' => $file->getClientOriginalName(),
                            'error' => $e->getMessage(),
                            'question_id' => $questionId
                        ]);
                        $allErrors[$questionId][] = "Failed to upload file '{$file->getClientOriginalName()}'.";
                    }
                }
            }

            // FIXED: Handle file path merging and answer preparation
            $finalFilePath = null;
            $finalAnswer = null;

            if (in_array($question->type, ['file', 'multiple_file'])) {
                // Get existing file paths
                $existingPaths = [];
                if (!empty($answerText)) {
                    try {
                        $decoded = json_decode($answerText, true);
                        $existingPaths = is_array($decoded) ? $decoded : [$answerText];
                    } catch (\Exception $e) {
                        $existingPaths = [$answerText];
                    }
                }

                // Merge existing and new file paths
                $mergedPaths = array_merge($existingPaths, $newFilePaths);
                $mergedPaths = array_values(array_unique(array_filter($mergedPaths)));

                $finalFilePath = !empty($mergedPaths) ? json_encode($mergedPaths) : null;

                // Validate required file questions
                if ($question->is_required && empty($mergedPaths)) {
                    $allErrors[$questionId][] = 'This question is required and must have at least one file.';
                }
            } else {
                // For non-file questions, use the answer text
                $finalAnswer = !empty($answerText) ? htmlspecialchars(trim($answerText)) : null;

                // Additional validation for required text questions
                if ($question->is_required && empty($finalAnswer)) {
                    $allErrors[$questionId][] = 'This question is required and must have an answer.';
                }
            }
        }

        // If there are validation errors, cleanup uploaded files and return errors
        if (!empty($allErrors)) {
            // Cleanup any new uploaded files if validation fails
            foreach ($filePathsByQuestion as $paths) {
                foreach ($paths as $path) {
                    $this->deleteFileSecurely($path);
                }
            }

            return response()->json([
                'message' => 'Validation failed',
                'errors' => $allErrors
            ], 422);
        }

        // FIXED: Process successful updates
        DB::beginTransaction();

        try {
            foreach ($answers as $answerData) {
                $questionId = $answerData['question_id'];
                $question = $questions->get($questionId);

                if (!$question) continue;

                $answerText = $answerData['answer'] ?? '';

                // Prepare final values
                if (in_array($question->type, ['file', 'multiple_file'])) {
                    $existingPaths = [];
                    if (!empty($answerText)) {
                        try {
                            $decoded = json_decode($answerText, true);
                            $existingPaths = is_array($decoded) ? $decoded : [$answerText];
                        } catch (\Exception $e) {
                            $existingPaths = [$answerText];
                        }
                    }

                    $newPaths = $filePathsByQuestion[$questionId] ?? [];
                    $mergedPaths = array_values(array_unique(array_filter(array_merge($existingPaths, $newPaths))));

                    $finalFilePath = !empty($mergedPaths) ? json_encode($mergedPaths) : null;
                    $finalAnswer = null;
                } else {
                    $finalAnswer = !empty($answerText) ? htmlspecialchars(trim($answerText)) : null;
                    $finalFilePath = null;
                }

                // Update or create the answer
                Answers::updateOrCreate(
                    [
                        'submission_id' => $submissionId,
                        'question_id' => $questionId,
                    ],
                    [
                        'user_id' => $userId,
                        'question' => htmlspecialchars($question->question),
                        'page' => $question->page,
                        'sort_order' => $question->sort_order,
                        'label' => htmlspecialchars($question->label),
                        'period_id' => $question->period_id,
                        'options' => $question->options,
                        'answer' => $finalAnswer,
                        'file_path' => $finalFilePath,
                        'type' => $question->type,
                    ]
                );
            }

            DB::commit();

            // Fetch updated data for response
            $updatedAnswers = Answers::with(['user', 'period'])
                ->where('submission_id', $submissionId)
                ->orderBy('sort_order', 'asc')
                ->orderBy('id', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Answers updated successfully',
                'data' => $updatedAnswers,
            ], 200);

        } catch (\Exception $e) {
            DB::rollback();
            throw $e; // Re-throw to be caught by outer catch block
        }

    } catch (\Exception $e) {
        // Cleanup files on any error
        foreach ($filePathsByQuestion ?? [] as $paths) {
            foreach ($paths as $path) {
                $this->deleteFileSecurely($path);
            }
        }

        Log::error('Error updating answers:', [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'submission_id' => $submissionId ?? null,
            'trace' => $e->getTraceAsString()
        ]);

        return response()->json([
            'success' => false,
            'message' => 'An error occurred while updating answers',
            'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
        ], 500);
    }
}
private function htmlToWhatsAppText($html)
    {
        // Jika bukan HTML, return as-is
        if (strip_tags($html) === $html) {
            return $html;
        }

        // Replace <strong> atau <b> dengan *bold*
        $text = preg_replace('/<(strong|b)>(.*?)<\/(strong|b)>/is', '*$2*', $html);

        // Replace <em> atau <i> dengan _italic_
        $text = preg_replace('/<(em|i)>(.*?)<\/(em|i)>/is', '_$2_', $text);

        // Replace <u> dengan WhatsApp tidak support, hapus tag saja
        $text = preg_replace('/<u>(.*?)<\/u>/is', '$1', $text);

        // Replace <s> atau <strike> atau <del> dengan ~strikethrough~
        $text = preg_replace('/<(s|strike|del)>(.*?)<\/(s|strike|del)>/is', '~$2~', $text);

        // Replace heading dengan bold
        $text = preg_replace('/<h[1-6]>(.*?)<\/h[1-6]>/is', "*$1*\n", $text);

        // Replace <br> dan <br/> dengan line break
        $text = preg_replace('/<br\s*\/?>/i', "\n", $text);

        // Replace <p> dengan double line break
        $text = preg_replace('/<p>(.*?)<\/p>/is', "$1\n\n", $text);

        // Replace ordered list
        $text = preg_replace_callback('/<ol>(.*?)<\/ol>/is', function($matches) {
            $items = preg_replace('/<li>(.*?)<\/li>/is', "$1\n", $matches[1]);
            $lines = explode("\n", trim($items));
            $numbered = [];
            $counter = 1;
            foreach ($lines as $line) {
                if (trim($line)) {
                    $numbered[] = $counter++ . ". " . trim($line);
                }
            }
            return implode("\n", $numbered) . "\n\n";
        }, $text);

        // Replace unordered list
        $text = preg_replace_callback('/<ul>(.*?)<\/ul>/is', function($matches) {
            $items = preg_replace('/<li>(.*?)<\/li>/is', "$1\n", $matches[1]);
            $lines = explode("\n", trim($items));
            $bulleted = [];
            foreach ($lines as $line) {
                if (trim($line)) {
                    $bulleted[] = "• " . trim($line);
                }
            }
            return implode("\n", $bulleted) . "\n\n";
        }, $text);

        // Replace <a> links dengan format: text (url)
        $text = preg_replace('/<a\s+href=["\']([^"\']+)["\'][^>]*>(.*?)<\/a>/is', '$2 ($1)', $text);

        // Hapus semua tag HTML yang tersisa
        $text = strip_tags($text);

        // Decode HTML entities
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // Clean up multiple line breaks
        $text = preg_replace('/\n{3,}/', "\n\n", $text);

        // Trim whitespace
        $text = trim($text);

        return $text;
    }
}
