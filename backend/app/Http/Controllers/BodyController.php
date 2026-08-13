<?php

namespace App\Http\Controllers;

use App\Models\Body;
use Illuminate\Http\Request;
use Validator;

class BodyController extends Controller
{
    public function show()
    {
        $body = Body::first();
        return response()->json(['status' => 200, 'data' => $body]);
    }
    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'description' => 'nullable',
            'address' => 'nullable',
            'google_map_link' => 'nullable',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 400, 'errors' => $validator->errors()]);
        }

        try {
            $body = Body::first();

            if ($body) {
                $body->update([
                    'description' => $request->description,
                    'address' => $request->address,
                    'google_map_link' => $request->google_map_link,
                ]);
            } else {
                $body = Body::create([
                    'description' => $request->description,
                    'address' => $request->address,
                    'google_map_link' => $request->google_map_link,
                ]);
            }

            return response()->json(['status' => 200, 'data' => $body]);
        } catch (\Throwable $th) {
            return response()->json([
                'status' => 500,
                'message' => 'An error occurred',
                'error' => $th->getMessage()
            ], 500);
        }
    }
}
