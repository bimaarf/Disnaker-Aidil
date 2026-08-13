<?php

namespace App\Http\Controllers;

use App\Models\ChatRoom;
use App\Models\Message;
use App\Models\RoomUser;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    protected $socketClient;

    public function __construct()
    {
        $this->socketClient = new Client([
            'base_uri' => env('SOCKET_URL', 'http://localhost:3001'),
            'timeout' => 5.0,
        ]);
    }
    protected function formatChatRoomResponse(ChatRoom $chatRoom)
    {
        $user = Auth::user();
        $isCreator = $chatRoom->user_id == $user->id;
        $recipient = $chatRoom->users->where('id', '!=', $user->id)->first();
        $lastMessage = $chatRoom->messages->first();

        return [
            'id' => (string) $chatRoom->id,
            'name' => $chatRoom->name,
            'is_creator' => $isCreator,
            'creator_id' => (string) $chatRoom->user_id,
            'recipient_id' => $recipient ? (string) $recipient->id : null,
            'has_messages' => $chatRoom->messages->count() > 0,
            'last_message' => $lastMessage ? $this->formatMessageResponse($lastMessage) : null,
            'created_at' => $chatRoom->created_at->toISOString(),
            'creator' => [
                'id' => (string) $chatRoom->creator->id,
                'name' => $chatRoom->creator->name,
                'avatar' => $chatRoom->creator->avatar
            ],
            'recipient' => $recipient ? [
                'id' => (string) $recipient->id,
                'name' => $recipient->name,
                'avatar' => $recipient->avatar
            ] : null
        ];
    }
    public function createChatRoom(Request $request)
    {
        try {
            $validated = $request->validate([
                'recipient_id' => [
                    'required',
                    'exists:users,id',
                    'not_in:' . Auth::id(),
                ],
            ]);

            $senderId = Auth::id();
            $recipientId = $validated['recipient_id'];

            $existingRoom = ChatRoom::where('user_id', $senderId)
                ->whereHas('users', function($query) use ($recipientId) {
                    $query->where('users.id', $recipientId);
                })->first();

            if ($existingRoom) {
                return response()->json([
                    'success' => true,
                    'data' => $this->formatChatRoomResponse($existingRoom),
                    'message' => 'Existing chat room found',
                ]);
            }

            DB::beginTransaction();
            $chatRoom = ChatRoom::create([
                'name' => "Chat between User $senderId and User $recipientId",
                'user_id' => $senderId,
            ]);
            $chatRoom->users()->attach([$senderId, $recipientId]);
            DB::commit();

            $chatRoom->load(['users', 'messages', 'creator']);
            $this->notifySocketServerNewRoom($chatRoom->id, [$senderId, $recipientId]);

            return response()->json([
                'success' => true,
                'data' => $this->formatChatRoomResponse($chatRoom),
                'message' => 'Chat room created successfully',
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => 'validation_error',
                'errors' => $e->errors(),
                'message' => 'Validation failed. Please check your input.',
            ], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            Log::error('Database error creating chat room: ' . $e->getMessage(), [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all(),
            ]);
            return response()->json([
                'success' => false,
                'error' => 'database_error',
                'message' => 'Failed to create chat room due to a database issue. Please try again later.',
            ], 500);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create chat room: ' . $e->getMessage(), [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all(),
            ]);
            return response()->json([
                'success' => false,
                'error' => 'server_error',
                'message' => 'Failed to create chat room: ' . $e->getMessage(),
            ], 500);
        }
    }
    protected function notifySocketServerNewRoom($chatRoomId, $userIds)
    {
        try {
            $response = $this->socketClient->post('/new-chat-room', [
                'json' => [
                    'chat_room_id' => (string) $chatRoomId,
                    'user_ids' => array_map('strval', $userIds),
                ],
            ]);
            Log::info('Socket notification sent for new room', [
                'chat_room_id' => $chatRoomId,
                'response' => $response->getBody()->getContents(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to notify socket server for new room: ' . $e->getMessage());
        }
    }
    public function getUserById($id)
    {
        $user = User::findOrFail($id);
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'last_online_at' => $user->last_online_at,
        ]);
    }

    public function deleteMessage($id)
    {
        try {
            $message = Message::find($id);
            if (!$message) {
                return response()->json(['error' => 'Message not found'], 404);
            }

            if ($message->sender_id !== Auth::id()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $chatRoomId = $message->chat_room_id;
            $messageId = $message->id;

            $message->delete();
            $this->notifySocketServerDeleted($chatRoomId, $messageId);

            return response()->json([
                'success' => true,
                'message_id' => (string) $messageId,
                'chat_room_id' => (string) $chatRoomId,
            ]);
        } catch (\Exception $e) {
            Log::error('Delete message error: ' . $e->getMessage(), ['message_id' => $id]);
            return response()->json(['error' => 'Server error'], 500);
        }
    }

    private function notifySocketServerDeleted($chatRoomId, $messageId)
    {
        try {
            $this->socketClient->post('/message-deleted', [
                'json' => [
                    'chat_room_id' => (string) $chatRoomId,
                    'message_id' => (string) $messageId,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Notify message deleted error: ' . $e->getMessage());
        }
    }

    public function getUndeliveredMessages($userId)
    {
        try {
            $messages = Message::where('recipient_id', $userId)
                ->where('is_delivered', false)
                ->orderBy('created_at', 'asc')
                ->get();

            Log::info("Fetched undelivered messages for user: $userId", [
                'count' => $messages->count(),
            ]);

            return response()->json($messages->map(fn($msg) => $this->formatMessageResponse($msg)));
        } catch (\Exception $e) {
            Log::error("Error in getUndeliveredMessages: " . $e->getMessage(), ['user_id' => $userId]);
            return response()->json([], 500);
        }
    }

    public function getUserStatus(Request $request)
    {
        try {
            $userId = $request->query('user_id');
            if (!$userId) {
                return response()->json(['error' => 'Missing user_id'], 400);
            }

            $response = $this->socketClient->get('/user-status', [
                'query' => ['user_id' => $userId]
            ]);

            $status = json_decode($response->getBody(), true);
            return response()->json([
                'user_id' => $userId,
                'online' => $status['online'] ?? false,
                'timestamp' => $status['timestamp'] ?? now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            Log::error('Get user status error: ' . $e->getMessage());
            return response()->json([
                'user_id' => $userId,
                'online' => false,
                'timestamp' => now()->toISOString()
            ]);
        }
    }
    private function getOrCreateChatRoom($recipientId)
    {
        $senderId = Auth::id();
        
        // Check existing room
        $existingRoom = ChatRoom::whereHas('users', function($query) use ($senderId, $recipientId) {
            $query->whereIn('users.id', [$senderId, $recipientId]);
        })
        ->withCount('users')
        ->having('users_count', 2)
        ->first();
    
        if ($existingRoom) {
            return $existingRoom;
        }
    
        // Create new temporary room
        DB::beginTransaction();
        try {
            $room = ChatRoom::create([
                'name' => "Chat between User $senderId and User $recipientId",
                'user_id' => $senderId,
                'is_temporary' => true
            ]);
            
            $room->users()->attach([$senderId, $recipientId]);
            
            DB::commit();
            return $room;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
    
    public function sendMessage(Request $request)
    {
        try {
            Log::info('SendMessage request:', $request->all());
            Log::info('Files in request:', $request->file());

            // Validate request
            $validated = $request->validate([
                'chat_room_id' => 'nullable|string', 
                'message' => 'nullable|string|max:5000',
                'recipient_id' => 'required|exists:users,id',
                'originalTempId' => 'nullable|string',
                'sequence' => 'nullable|string',
                'original_created_at' => 'nullable|date',
            ]);

            $sender = Auth::user();
            if (!$sender) {
                Log::error('No authenticated user found');
                return response()->json(['error' => 'Unauthenticated'], 401);
            }

            $chatRoom = null;
            $isNewRoom = false;
            // Deteksi apakah chat_room_id itu temporary id atau tidak ada
            $isTempRoomId = !empty($validated['chat_room_id']) && Str::startsWith($validated['chat_room_id'], 'temp-');

            if (!$request->has('chat_room_id') || empty($validated['chat_room_id']) || $isTempRoomId) {
                // Buat room baru
                $roomResponse = $this->createOrGetChatRoom($validated['recipient_id']);
                
                if (!$roomResponse['success']) {
                    return response()->json([
                        'success' => false,
                        'error' => 'failed_to_create_room',
                        'message' => $roomResponse['message'],
                    ], 500);
                }
                
                $chatRoom = ChatRoom::find($roomResponse['data']['id']);
                $validated['chat_room_id'] = $roomResponse['data']['id'];
                $isNewRoom = true; // Tandai sebagai room baru
            } else {
                $chatRoom = ChatRoom::with(['users', 'creator'])->find($validated['chat_room_id']);
                
                if (!$chatRoom) {
                    return response()->json([
                        'success' => false,
                        'error' => 'chat_room_not_found',
                        'message' => 'Chat room does not exist.',
                    ], 404);
                }
            }

            // Handle file upload
            $fileData = $this->handleFileUpload($request);

            // Process message
            $linkPreviews = [];
            $messageStatus = 'sent';

            if ($validated['message']) {
                $urls = $this->detectUrls($validated['message']);
                if (!empty($urls)) {
                    foreach ($urls as $url) {
                        $linkPreviewResult = $this->fetchLinkPreview($url);
                        $linkPreviews[] = $linkPreviewResult['data'];
                        if ($linkPreviewResult['status'] !== 'sent') {
                            $messageStatus = $linkPreviewResult['status'];
                        }
                    }
                }
            }

            $recipientOnline = $this->checkUserOnline($validated['recipient_id']);
            $clientTimestamp = $request->input('original_created_at') ?? now();

            $message = Message::create([
                'chat_room_id' => $validated['chat_room_id'],
                'sender_id' => $sender->id,
                'recipient_id' => $validated['recipient_id'],
                'sender_name' => $sender->name,
                'message' => $validated['message'] ?? null,
                'file_name' => $fileData['fileName'],
                'file_type' => $fileData['fileType'],
                'file_url' => $fileData['fileUrl'],
                'is_delivered' => $recipientOnline,
                'is_read' => false,
                'delivered_at' => $recipientOnline ? now() : null,
                'originalTempId' => $validated['originalTempId'],
                'read_at' => null,
                'created_at' => now(),
                'original_created_at' => $clientTimestamp,
                'link_preview' => !empty($linkPreviews) ? json_encode($linkPreviews) : null,
                'status' => $messageStatus,
                'sequence' => $validated['sequence'],
            ]);


            // Notify socket server for message
            $this->sendToSocketServer($message);

            // Notify socket server for new room if applicable
            if ($isNewRoom) {
                $this->notifySocketServerNewRoom($chatRoom->id, [$sender->id, $validated['recipient_id']]);
            }

            if ($recipientOnline) {
                $this->notifySocketServerDelivered(
                    $validated['chat_room_id'],
                    $validated['recipient_id'],
                    [$message->id]
                );
            } else {
                try {
                    $this->socketClient->post('/queue-message', [
                        'json' => $this->formatMessageResponse($message),
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to queue message to socket server: ' . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'data' => array_merge(
                    $this->formatMessageResponse($message),
                    [
                        'originalTempId' => $validated['originalTempId'],
                        'chat_room_id' => (string) $validated['chat_room_id'], // Pastikan chat_room_id dikembalikan
                        'new_room' => $isNewRoom, // Tambahkan flag new_room
                        'chat_room' => $this->formatChatRoomResponse($chatRoom),
                    ]
                ),
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error: ' . json_encode($e->errors()));
            return response()->json([
                'success' => false,
                'error' => 'validation_error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Send message error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all(),
            ]);
            return response()->json([
                'success' => false,
                'error' => 'server_error',
                'message' => 'Failed to send message: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Helper method to create or get existing chat room
     * 
     * @param int $recipientId The recipient user ID
     * @return array Response with success status and data/message
     */
    protected function createOrGetChatRoom($recipientId)
    {
        try {
            $sender = Auth::user();
            if (!$sender) {
                return [
                    'success' => false,
                    'message' => 'No authenticated user found.',
                ];
            }
    
            // Cek apakah sudah ada chat room dengan 2 user ini
            $chatRoom = ChatRoom::whereHas('users', function ($q) use ($sender) {
                $q->where('user_id', $sender->id);
            })->whereHas('users', function ($q) use ($recipientId) {
                $q->where('user_id', $recipientId);
            })->first();
    
            if ($chatRoom) {
                return [
                    'success' => true,
                    'data' => [
                        'id' => $chatRoom->id,
                        'name' => $chatRoom->name,
                    ],
                ];
            }
    
            // Kalau belum ada, buat baru
            $chatRoom = ChatRoom::create([
                'name' => 'Chat ' . $sender->id . '-' . $recipientId,
                'user_id' => $sender->id,
            ]);
    
            // Tambahkan kedua user ke dalam room
            $chatRoom->users()->attach([$sender->id, $recipientId]);
    
            return [
                'success' => true,
                'data' => [
                    'id' => $chatRoom->id,
                    'name' => $chatRoom->name,
                ],
            ];
        } catch (\Exception $e) {
            \Log::error('createOrGetChatRoom error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to create or retrieve chat room.',
            ];
        }
    }
    

    private function handleFileUpload(Request $request)
    {
        if (!$request->hasFile('file')) {
            return ['fileName' => null, 'fileType' => null, 'fileUrl' => null];
        }

        $file = $request->file('file');
        if (!$file->isValid()) {
            throw new \Exception('Unggahan file tidak valid');
        }

        $directory = public_path('chattings/files');
        if (!file_exists($directory)) {
            mkdir($directory, 0755, true);
        }

        $fileName = time() . '_' . $file->getClientOriginalName();
        $file->move($directory, $fileName);

        $filePath = $directory . '/' . $fileName;
        $fileSize = filesize($filePath);
        $fileMime = mime_content_type($filePath);

        $maxSize = 250 * 1024 * 1024;
        $allowedMimes = [
            'image/jpeg', 'image/png', 'image/gif',
            'video/mp4', 'video/webm', 'video/quicktime',
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if ($fileSize > $maxSize) {
            unlink($filePath);
            throw new \Exception('Ukuran file melebihi batas 250MB');
        }
        if (!in_array($fileMime, $allowedMimes)) {
            unlink($filePath);
            throw new \Exception('Jenis file tidak didukung');
        }

        return [
            'fileName' => $file->getClientOriginalName(),
            'fileType' => $fileMime,
            'fileUrl' => asset('chattings/files/' . $fileName),
        ];
    }

    private function sendToSocketServer($message)
    {
        $payload = $this->formatMessageResponse($message);
    
        // Cari room
        $chatRoom = ChatRoom::with(['users', 'creator'])->find($message->chat_room_id);
    
        if (!$chatRoom) {
            Log::error('Failed to find chat room for socket send');
        }
    
        // Kalau message new_room (temp_id detected), ikutkan chat_room
        $payload['new_room'] = Str::startsWith($message->chat_room_id, 'temp-') ? true : false;
        $payload['chat_room'] = $chatRoom ? $this->formatChatRoomResponse($chatRoom) : null;
    
        try {
            $this->socketClient->post('/send-message', [
                'json' => $payload,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send message to socket server: ' . $e->getMessage());
        }
    }
    

    private function detectUrls($text)
    {
        $urlPattern = '/(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*))/i';
        preg_match_all($urlPattern, $text, $matches);
        return array_unique($matches[0] ?? []); // Ensure unique URLs
    }

    private function fetchLinkPreview($url, $maxRetries = 3)
    {
        $attempt = 1;
        $linkPreview = null;
        $status = 'sent';

        while ($attempt <= $maxRetries) {
            try {
                $response = $this->socketClient->get('/api/link-preview', [
                    'query' => ['url' => $url],
                    'timeout' => 0,
                ]);
                $linkPreview = json_decode($response->getBody(), true);
                // Ensure the preview includes the URL
                if ($linkPreview && !isset($linkPreview['url'])) {
                    $linkPreview['url'] = $url;
                }
                $status = 'sent';
                break;
            } catch (\Exception $e) {
                Log::warning("Link preview fetch attempt $attempt failed: " . $e->getMessage(), ['url' => $url]);
                $attempt++;
                if ($attempt > $maxRetries) {
                    // $status = $e->getCode() == 429 ? 'retry' : 'failed';
                    $status = 'sent';
                    $linkPreview = ['url' => $url, 'error' => 'Failed to fetch preview'];
                    Log::error("Failed to fetch link preview after $maxRetries attempts: " . $e->getMessage(), ['url' => $url]);
                }
                sleep(1);
            }
        }

        return [
            'data' => $linkPreview,
            'status' => $status,
        ];
    }

    protected function formatMessageResponse(Message $message)
    {
        return [
            'id' => (string) $message->id,
            'chat_room_id' => (string) $message->chat_room_id,
            'sender_id' => (string) $message->sender_id,
            'recipient_id' => (string) $message->recipient_id,
            'sender_name' => $message->sender_name,
            'message' => $message->message,
            'file_name' => $message->file_name,
            'file_type' => $message->file_type,
            'file_url' => $message->file_url,
            'is_delivered' => (bool) $message->is_delivered,
            'is_read' => (bool) $message->is_read,
            'delivered_at' => $this->safeToISOString($message->delivered_at),
            'read_at' => $this->safeToISOString($message->read_at),
            'created_at' => $this->safeToISOString($message->created_at),
            'original_created_at' => $this->safeToISOString($message->original_created_at ?? $message->created_at),
            'link_preview' => $message->link_preview,
            'status' => $message->status,
            'sequence' => $message->sequence,
        ];
    }

    private function safeToISOString($date)
    {
        try {
            return $date instanceof \Carbon\Carbon ? $date->toISOString() : null;
        } catch (\Throwable $e) {
            Log::warning("Failed to convert date to ISO string", [
                'value' => $date,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    private function checkUserOnline($userId)
    {
        try {
            $response = $this->socketClient->get('/user-status', [
                'query' => ['user_id' => $userId]
            ]);
            $status = json_decode($response->getBody(), true);
            return $status['online'] ?? false;
        } catch (\Exception $e) {
            Log::error('Check user online error: ' . $e->getMessage());
            return false;
        }
    }

    public function getPendingMessages($chatRoomId, Request $request)
    {
        try {
            $recipientId = $request->query('recipient_id');
            $isDelivered = filter_var($request->query('is_delivered', false), FILTER_VALIDATE_BOOLEAN);

            if (!$recipientId) {
                return response()->json(['error' => 'recipient_id is required'], 400);
            }

            $messages = Message::where('chat_room_id', $chatRoomId)
                ->where('recipient_id', $recipientId)
                ->where('is_delivered', $isDelivered)
                // ->orderBy('created_at', 'asc')
                ->orderByRaw('COALESCE(sequence, 0) ASC, created_at DESC')
                ->get();

            Log::info("Fetched pending messages for chat_room_id: $chatRoomId, recipient_id: $recipientId", [
                'count' => $messages->count(),
            ]);

            return response()->json($messages->map(fn($msg) => $this->formatMessageResponse($msg)));
        } catch (\Exception $e) {
            Log::error("Error in getPendingMessages: " . $e->getMessage(), [
                'chat_room_id' => $chatRoomId,
                'recipient_id' => $request->query('recipient_id'),
            ]);
            return response()->json([], 500);
        }
    }

    public function markMessagesAsDelivered(Request $request)
    {
        $validated = $request->validate([
            'chat_room_id' => 'required|exists:chat_rooms,id',
            'user_id' => 'required|exists:users,id',
            'message_ids' => 'required|array',
            'message_ids.*' => 'exists:messages,id',
        ]);

        $messageIds = $validated['message_ids'];
        $updatedCount = Message::whereIn('id', $messageIds)
            ->where('recipient_id', $validated['user_id'])
            ->where('chat_room_id', $validated['chat_room_id'])
            ->where('is_delivered', false)
            ->update([
                'is_delivered' => true,
                'delivered_at' => now(),
            ]);

        if ($updatedCount) {
            $this->notifySocketServerDelivered($validated['chat_room_id'], $validated['user_id'], $messageIds);
        }

        return response()->json([
            'success' => true,
            'updated_count' => $updatedCount,
            'message_ids' => $messageIds,
        ]);
    }

    private function notifySocketServerDelivered($chatRoomId, $userId, $messageIds)
    {
        try {
            $this->socketClient->post('/mark-messages-as-delivered', [
                'json' => [
                    'chat_room_id' => (string) $chatRoomId,
                    'user_id' => (string) $userId,
                    'message_ids' => array_map('strval', $messageIds),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Notify delivered error: ' . $e->getMessage());
        }
    }

    public function fetchAllUnreadCounts($userId)
    {
        return Message::where('recipient_id', $userId)
            ->where('is_read', false)
            ->groupBy('chat_room_id')
            ->selectRaw('chat_room_id, COUNT(*) as unread_count')
            ->pluck('unread_count', 'chat_room_id')
            ->toArray();
    }

    public function showChatRoom($id)
    {
        try {
            $chatRoom = ChatRoom::where('id', $id)
            ->whereHas('users', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->with([
                'users' => function ($query) {
                    $query->select('users.id', 'users.name', 'users.avatar');
                },
                'messages' => function($query) {
                    $query->latest()->limit(1);
                }
            ])
            ->first();

        if (!$chatRoom) {
            return response()->json(['message' => 'Chat room not found'], 404);
        }

        $sender = Auth::user();
        $recipient = $chatRoom->users->where('id', '!=', Auth::id())->first();
            $response = [
                'id' => (string) $chatRoom->id,
                'name' => $chatRoom->name,
                'sender_id' => (string) $sender->id,
                'recipient_id' => $recipient ? (string) $recipient->id : null,
                'created_at' => $chatRoom->created_at->toISOString(),
                'sender' => [
                    'id' => (string) $sender->id,
                    'name' => $sender->name,
                    'avatar' => $sender->avatar,
                ],
                'recipient' => $recipient ? [
                    'id' => (string) $recipient->id,
                    'name' => $recipient->name,
                    'avatar' => $recipient->avatar,
                ] : null,
            ];

            return response()->json($response);
        } catch (\Exception $e) {
            Log::error("Error in showChatRoom: " . $e->getMessage(), ['chat_room_id' => $id]);
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    public function getLastMessage($chatRoomId)
    {
        $lastMessage = Message::where('chat_room_id', $chatRoomId)->latest()->first();
        return response()->json($lastMessage ? $this->formatMessageResponse($lastMessage) : null);
    }

   public function getChatRooms()
    {
        $user = Auth::user();
        
        $chatRooms = ChatRoom::whereHas('users', function($query) use ($user) {
            $query->where('users.id', $user->id);
        })
        ->with([
            'users' => function($query) {
                $query->select('users.id', 'users.name', 'users.avatar');
            },
            'creator',
            'messages' => function($query) {
                $query->latest()->limit(1);
            }
        ])
        ->withCount([
            'messages',
            'messages as message_unread' => function ($query) use ($user) {
                $query->where('recipient_id', $user->id)
                    ->where('is_read', false);
            }
        ])
        ->get()
        ->filter(function($room) use ($user) {
            if ($room->user_id == $user->id) {
                return true;
            }
            return $room->messages_count > 0;
        })
        ->sortByDesc(function($room) {
            return $room->messages->first() 
                ? $room->messages->first()->created_at 
                : $room->created_at;
        })
        ->values();

        return response()->json($chatRooms->map(function($room) {
            return $this->formatChatRoomResponse($room);
        }));
    }

    public function getMessagesForRoom($chatRoomId, Request $request)
    {
        try {
            // Validate pagination parameters
            $validated = $request->validate([
                'page' => 'integer|min:1',
                'per_page' => 'integer|min:1|max:100',
            ]);

            $page = $request->query('page', 1);
            $perPage = $request->query('per_page', 20); // Default to 20 messages per page

            // Fetch messages with pagination
            $messages = Message::where('chat_room_id', $chatRoomId)
                    ->orderByRaw('COALESCE(sequence, 0) ASC, created_at DESC')
                    ->paginate($perPage, ['*'], 'page', $page);


            // Mark undelivered messages as delivered
            $undeliveredMessages = $messages->where('recipient_id', Auth::id())
                ->where('is_delivered', false);

            if ($undeliveredMessages->count() > 0) {
                $messageIds = $undeliveredMessages->pluck('id')->toArray();
                Message::whereIn('id', $messageIds)->update([
                    'is_delivered' => true,
                    'delivered_at' => now(),
                ]);
                $this->notifySocketServerDelivered($chatRoomId, Auth::id(), $messageIds);
            }

            return response()->json([
                'success' => true,
                'data' => $messages->map(fn($msg) => $this->formatMessageResponse($msg)),
                'meta' => [
                    'current_page' => $messages->currentPage(),
                    'per_page' => $messages->perPage(),
                    'total' => $messages->total(),
                    'last_page' => $messages->lastPage(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error("Error in getMessagesForRoom: " . $e->getMessage(), [
                'chat_room_id' => $chatRoomId,
            ]);
            return response()->json(['error' => 'Server error'], 500);
        }
    }

    public function markMessagesAsRead(Request $request)
    {
        try {
            $validated = $request->validate([
                'chat_room_id' => 'required|exists:chat_rooms,id',
                'message_ids' => 'required|array',
                'message_ids.*' => 'exists:messages,id',
            ]);

            $chatRoomId = $validated['chat_room_id'];
            $userId = Auth::id();

            if (!$userId) {
                return response()->json(['error' => 'Unauthenticated'], 401);
            }

            $query = Message::where('chat_room_id', $chatRoomId)
                ->where('recipient_id', $userId)
                ->where('is_read', false)
                ->whereIn('id', $validated['message_ids']);

            $updatedMessages = $query->get();
            $updatedCount = $query->update([
                'is_read' => true,
                'status' => 'read',
                'read_at' => now(),
            ]);

            $messageIds = $updatedMessages->pluck('id')->toArray();

            if ($updatedCount > 0) {
                $this->notifySocketServer($chatRoomId, $userId, $messageIds);
            }

            return response()->json([
                'success' => true,
                'updated_count' => $updatedCount,
                'message_ids' => $messageIds,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Mark as read error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to mark messages as read',
            ], 500);
        }
    }

    public function getUnreadCount($chatRoomId, $userId)
    {
        $unreadCount = Message::where('chat_room_id', $chatRoomId)
            ->where('recipient_id', $userId)
            ->where('is_read', false)
            ->count();
        return response()->json([
            'success' => true,
            'unread_count' => (int) $unreadCount,
        ]);
    }

    private function notifySocketServer($chatRoomId, $userId, $messageIds)
    {
        try {
            $this->socketClient->post('/mark-messages-as-read', [
                'json' => [
                    'chat_room_id' => (string) $chatRoomId,
                    'user_id' => (string) $userId,
                    'message_ids' => $messageIds,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Notify read error: ' . $e->getMessage());
        }
    }
}