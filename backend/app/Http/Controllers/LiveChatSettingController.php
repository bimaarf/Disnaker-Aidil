<?php

namespace App\Http\Controllers;

use App\Models\LiveChatSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LiveChatSettingController extends Controller
{
    /**
     * Get the current LiveChat settings
     */
    public function get()
    {
        $settings = LiveChatSetting::first();

        if (!$settings) {
            // Return default settings if none exist
            return response()->json([
                'status' => 200,
                'data' => [
                    'license_id' => null,
                    'is_enabled' => true
                ]
            ]);
        }

        return response()->json([
            'status' => 200,
            'data' => $settings
        ]);
    }

    /**
     * Update the LiveChat settings
     */
    public function update(Request $request)
    {
        // Validate input
        $validator = Validator::make($request->all(), [
            'license_id' => 'required|string',
            'is_enabled' => 'required|integer|in:0,1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Get existing settings or create new
            $settings = LiveChatSetting::first();
            if (!$settings) {
                $settings = new LiveChatSetting();
            }

            // Update settings
            $settings->license_id = $request->license_id;
            $settings->is_enabled = $request->has('is_enabled') ? $request->is_enabled : true;
            $settings->save();

            return response()->json([
                'status' => 200,
                'message' => 'LiveChat settings updated successfully',
                'data' => $settings
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'An error occurred while updating LiveChat settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
