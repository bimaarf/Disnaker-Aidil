<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class WhatsappController extends Controller
{
    public function sendWhatsappNotification(Request $request)
    {
        Log::info('Incoming WhatsApp request', [
            'input' => $request->all(),
            'files' => $request->files->all(),
        ]);

        $validator = Validator::make($request->all(), [
            'phone_number' => 'required|string',
            'message' => 'required|string',
            'image' => [
                'nullable',
                'file',
                'mimes:jpeg,png,jpg,gif,bmp,webp',
                'max:10240',
            ],
            'file' => [
                'nullable',
                'file',
                'mimes:pdf,doc,docx,txt,jpeg,png,jpg,gif,bmp,webp',
                'max:10240',
            ],
        ], [
            'image.mimes' => 'Invalid image type. Allowed: JPEG, PNG, JPG, GIF, BMP, WebP',
            'image.max' => 'Image size must not exceed 10MB',
            'file.mimes' => 'Invalid file type. Allowed: PDF, DOC, DOCX, TXT, JPEG, PNG, JPG, GIF, BMP, WebP',
            'file.max' => 'File size must not exceed 10MB',
        ]);

        if ($validator->fails()) {
            Log::warning('Validation failed', ['errors' => $validator->errors()]);
            return response()->json([
                'success' => false,
                'error' => $validator->errors()->first(),
            ], 400);
        }

        try {
            $http = Http::asMultipart()
                ->attach('phone_number', $request->input('phone_number'))
                ->attach('message', $request->input('message'));

            if ($request->hasFile('image') && $request->file('image')->isValid()) {
                $image = $request->file('image');
                $http->attach(
                    'image',
                    file_get_contents($image->getPathname()),
                    $image->getClientOriginalName()
                );
            }

            if ($request->hasFile('file') && $request->file('file')->isValid()) {
                $file = $request->file('file');
                $http->attach(
                    'file',
                    file_get_contents($file->getPathname()),
                    $file->getClientOriginalName()
                );
            }
            $http = Http::timeout(10); // contoh pakai Laravel Http client
            $response = $http->post(env('SOCKET_SERVER_URL') . '/send-whatsapp', [
                'phone_number' => $request->input('phone_number'),
                'message' => $request->input('message'),
                'file' => $request->file('file'),
                'image' => $request->file('image'),
            ]);

            $body = $response->json();
            Log::info('WhatsApp response', $body);


            Log::info('Node.js server response', [
                'status' => $response->status(),
                'body' => $body,
            ]);

            if ($response->successful() && data_get($body, 'success') === true) {
                return response()->json([
                    'success' => true,
                    'message' => $body['message'] ?? 'Message sent successfully',
                    'extractedText' => $body['extractedText'] ?? null,
                ]);
            }

            return response()->json([
                'success' => false,
                'error' => $body['error'] ?? 'Failed to communicate with WhatsApp server',
                'details' => $body,
            ], 500);

        } catch (\Exception $e) {
            Log::error('WhatsApp Notification Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to send WhatsApp notification',
                'details' => $e->getMessage(),
            ], 500);
        }
    }
}
