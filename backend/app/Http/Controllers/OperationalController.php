<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\OperationalHour;
use App\Models\OperationalNote;
use Illuminate\Support\Facades\DB;

class OperationalController extends Controller
{
    /**
     * Tampilkan semua data jam operasional + catatan.
     */
    public function index()
    {
        $hours = OperationalHour::orderByRaw("FIELD(day, 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu')")->get();
        $note = OperationalNote::where('is_active', true)->latest()->first();

        return response()->json([
            'success' => true,
            'data' => [
                'hours' => $hours,
                'note' => $note?->note,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'hours' => 'required|array|size:7',
            'hours.*.day' => 'required|string',
            'hours.*.open_time' => 'nullable|date_format:H:i',
            'hours.*.close_time' => 'nullable|date_format:H:i',
            'hours.*.is_closed' => 'required|boolean',
            'note' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated['hours'] as $hour) {
                OperationalHour::updateOrCreate(
                    ['day' => $hour['day']],
                    [
                        'open_time' => $hour['open_time'],
                        'close_time' => $hour['close_time'],
                        'is_closed' => $hour['is_closed'],
                    ]
                );
            }

            if (!empty($validated['note'])) {
                OperationalNote::create([
                    'note' => $validated['note'],
                    'is_active' => true,
                ]);

                OperationalNote::where('note', '!=', $validated['note'])->update(['is_active' => false]);
            }

            DB::commit();

            return $this->index(); 
        } catch (\Throwable $th) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to update operational data',
                'error' => $th->getMessage(),
            ], 500);
        }
    }
}
