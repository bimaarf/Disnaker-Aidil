<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use Auth;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Str;
use Validator;

class NotificationController extends Controller
{
    private function formatResponse($notifications)
    {
        // Ensure we check if $notifications is a LengthAwarePaginator
        if ($notifications instanceof \Illuminate\Pagination\LengthAwarePaginator) {
            return [
                'data' => $notifications->items(),
                'total' => $notifications->total(),
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
            ];
        }

        return [
            'data' => $notifications,
            'total' => count($notifications),
        ];
    }
    private function transformNotifData($notif)
    {
        return [
            'id' => $notif->id,
            'key' => $notif->key,
            'label' => $notif->label,
            'title' => $notif->title,
            'message' => $notif->message,
            'created_at' => $notif->created_at,
            'user' => $notif->user,
        ];
    }
    public function winStore(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|integer',
            'user_id' => 'required|integer|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $notification = new Notification();
            $notification->key = Str::random(5);
            $notification->label = 'Winner';
            $notification->title = 'Winner#';
            $notification->user_id = $request->user_id;
            $notification->message  = 'has won Rp ' . number_format($request->amount, 2, ",", ".");
            $notification->save();

            // Include the complete notification in the response
            return response()->json([
                'status' => 201,
                'notification' => $this->transformNotifData($notification)
            ], 201);
        } catch (\Throwable $th) {
            return response()->json([
                'status' => 500,
                'message' => 'Internal Server Error',
                'error' => $th->getMessage()
            ], 500);
        }
    }



    private function getNotifications(Request $request)
    {
        try {
            $sortKey = $request->input('sortKey', 'id');
            $sortDirection = $request->input('sortDirection', 'desc');
            $perPage = $request->input('perPage', 10);
            $fetchAll = $request->input('fetchAll', false) === 'true'; // Ensure it's boolean

            $notifQuery = Notification::with('user')->orderBy($sortKey, $sortDirection);

            if (auth()->user()->hasRole(['administrator', 'super admin'])) {
                $notifQuery->where('user_id', auth()->id())
                ->whereIn('label', ['New Registered', 'Account']);
            } else {
                $notifQuery->where('user_id', auth()->id())
                            ->whereIn('label', ['Account']);
            }

            // Fetching based on fetchAll
            if ($fetchAll) {
                // Return all notifications as a collection
                $notifications = $notifQuery->get();
                return response()->json([
                    'data' => $notifications,
                    'total' => $notifications->count(), // Total count of notifications
                ]);
            }

            // Return paginated notifications
            $notifications = $notifQuery->paginate($perPage);
            return response()->json($this->formatResponse($notifications), 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'An error occurred while fetching notifications.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function index(Request $request)
    {
        $notifications = $this->getNotifications($request); // Fetch notifications

        if ($notifications instanceof \Illuminate\Http\JsonResponse) {
            return $notifications;
        }

        // Format and return the notifications if it's a collection or paginated
        return response()->json($this->formatResponse($notifications), 200);
    }

    public function view($id)
    {
        $notif = Notification::findOrFail($id);
        return response()->json(['data' => $this->transformNotifData($notif)], 200);
    }

    public function update(Request $request, $id)
    {
        try {
            $validatedData = $request->validate([
                'label' => 'required',
                'title' => 'required',
                'message' => 'required',
            ]);
            $notif = Notification::find($id);
            $notif->update($validatedData);
            return response()->json([
            'status' => 200,
            'notif' => $notif,
            'message' => 'Notification updated successfully'], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $th) {
            return response()->json([
                'status' => 500,
                'message' => 'An error occurred while updating the user.',
                'error' => $th->getMessage(),
            ], 500);
        }
    }
    public function delete($key)
    {
        $user = Auth::user();

        if ($user->hasRole(['administrator', 'super admin'])) {
            $data = Notification::where('key', $key)->first();
        } else {

            $data = Notification::where('key', $key)->where('user_id', $user->id)->first();
        }

        if (!$data) {
            return response()->json(['status' => 404, 'message' => 'Notifications not found'], 404);
        }

        try {

            $data->delete();
            return response()->json(['message' => 'Notification deleted successfully']);
        } catch (\Throwable $th) {
            return response()->json(['status' => 500, 'message' => $th->getMessage()], 500);
        }
    }
}
