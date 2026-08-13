<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class NotifySocketServerDelivered implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $chatRoomId;
    protected $userId;
    protected $messageIds;

    public function __construct($chatRoomId, $userId, $messageIds)
    {
        $this->chatRoomId = $chatRoomId;
        $this->userId = $userId;
        $this->messageIds = $messageIds;
    }

    public function handle()
    {
        $client = new Client([
            'base_uri' => env('SOCKET_URL', 'http://localhost:3001'),
            'timeout' => 15.0,
        ]);

        try {
            $client->post('/mark-messages-as-delivered', [
                'json' => [
                    'chat_room_id' => (string) $this->chatRoomId,
                    'user_id' => (string) $this->userId,
                    'message_ids' => $this->messageIds,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Queue notify socket delivered error: ' . $e->getMessage(), [
                'chat_room_id' => $this->chatRoomId,
            ]);
            $this->release(10); // Retry after 10 seconds
        }
    }
}