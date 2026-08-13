<?php
namespace App\Http\Controllers\Form;

use App\Models\NotificationWhatsAppMessage;
use App\Http\Controllers\Controller;
use App\Models\Form\Answers;
use App\Models\Form\Result;
use DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class ResultController extends Controller
{
    private function getEnumValues($table, $column)
    {
        if (!Schema::hasColumn($table, $column)) {
            return [];
        }

        try {
            $query = "SHOW COLUMNS FROM {$table} WHERE Field = '{$column}'";
            $result = DB::select($query);

            if (empty($result)) {
                return [];
            }

            $enumValues = $result[0]->Type;
            preg_match('/^enum\((.*)\)$/', $enumValues, $matches);

            if (empty($matches[1])) {
                return [];
            }

            $values = array_map(function($value) {
                return trim($value, "'");
            }, explode(',', $matches[1]));

            return $values;
        } catch (\Exception $e) {
            return [];
        }
    }

    public function listPeriods()
    {
        $periods = \App\Models\Form\Period::orderByDesc('created_at')
            ->select('id', 'key', 'is_published','title', 'status')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $periods,
        ]);
    }

    public function show($submissionId)
    {
        $result = Result::where('submission_answers', $submissionId)->first();
        $answers = Answers::where('submission_id', $submissionId)->get();

        $periodId = $answers->first()?->period_id;
        $period = $periodId ? \App\Models\Form\Period::find($periodId) : null;

        $approvalStatus = "Belum_Diverifikasi";
        if ($result && !is_null($result->is_approve)) {
            $approvalStatus = $result->is_approve ? 'Berkas_Diterima' : 'Berkas_Dikembalikan';
        }

        return response()->json([
            'success' => true,
            'result' => $result ?? [],
            'answers' => $answers,
            'period' => $period ? [
                'id' => $period->id,
                'key' => $period->key,
                'title' => $period->title,
                'status' => (int) $period->status,
                'is_published' => (bool) $period->is_published,
                'created_at' => $period->created_at,
            ] : null,
            'approval_status' => $approvalStatus,
        ]);
    }

    /**
     * Helper function untuk mengirim notifikasi WhatsApp
     */
    private function sendWhatsAppNotification($user, $submissionId, $templateCode, $additionalData = [])
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
            ];

            // Merge dengan additional data
            $placeholders = array_merge($placeholders, $additionalData);

            // Replace placeholders di template
            $messageTemplate = strtr($template->message, $placeholders);

            // Convert HTML to plain text untuk WhatsApp
            $message = $this->htmlToWhatsAppText($messageTemplate);

            // Kirim via socket server
            $waResponse = Http::post(env('SOCKET_SERVER_URL') . '/send-whatsapp', [
                'phone_number' => $recipientPhone,
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

  private function sendEmailNotification($user, $submissionId, $templateCode, $additionalData = [])
{
    try {
        // Validasi user email
        if (!$user->email || !filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            Log::warning('Email tidak valid', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);
            return false;
        }

        $template = NotificationWhatsAppMessage::where('code', $templateCode)->first();

        if (!$template) {
            Log::warning("Template Email '{$templateCode}' tidak ditemukan di database");
            return false;
        }

        // Placeholder
        $placeholders = [
            '{name}' => $user->name,
            '{submission_id}' => $submissionId,
        ];
        $placeholders = array_merge($placeholders, $additionalData);

        // Gunakan kolom subject dan body dari template
        // Jika tidak ada, gunakan default
        $subject = !empty($template->subject)
            ? strtr($template->subject, $placeholders)
            : "Notifikasi Hasil Submission #{$submissionId}";

        $body = !empty($template->body)
            ? strtr($template->body, $placeholders)
            : strtr($template->message, $placeholders);

        // Convert HTML untuk email jika diperlukan
        $htmlBody = $this->convertToHtmlEmail($body);
        $textBody = strip_tags($body);

        Log::info('Mengirim email', [
            'to' => $user->email,
            'subject' => $subject,
            'template' => $templateCode
        ]);

        $response = Http::timeout(10)->post(env('SOCKET_SERVER_URL') . '/send-email', [
            'to'      => $user->email,
            'subject' => $subject,
            'text'    => $textBody,
            'html'    => $htmlBody,
        ]);

        Log::info('Response dari Node send-email:', [
            'status' => $response->status(),
            'body'   => $response->body(),
        ]);

        if ($response->failed()) {
            Log::error('Gagal mengirim Email', [
                'template' => $templateCode,
                'status' => $response->status(),
                'body' => $response->body(),
                'email' => $user->email,
            ]);
            return false;
        }

        Log::info('Email berhasil dikirim via Node', [
            'template' => $templateCode,
            'email' => $user->email,
            'submission_id' => $submissionId
        ]);

        return true;

    } catch (\Exception $e) {
        Log::error('Error mengirim Email', [
            'template' => $templateCode,
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        return false;
    }
}

/**
 * Convert plain text or HTML to proper HTML email format
 */
private function convertToHtmlEmail($content)
{
    // Base URL untuk logo (sesuaikan dengan domain Anda)
    $baseUrl = env('APP_URL');
    $logoUrl = 'https://enggangfoundation.id/api-yz-v1/logo/images/logo.png';

    // Jika sudah HTML (ada tag), bungkus dengan template email modern
    if ($content !== strip_tags($content)) {
        return "
        <!DOCTYPE html>
        <html lang='id'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <meta http-equiv='X-UA-Compatible' content='IE=edge'>
            <title>Enggang Foundation</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333333;
                    background: #f5f5f5;
                    padding: 20px 0;
                }

                .email-wrapper {
                    max-width: 600px;
                    margin: 0 auto;
                    background: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                }

                .header {
                    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                    padding: 20px 20px;
                    text-align: center;
                    position: relative;
                }

                .header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url('data:image/svg+xml,%3Csvg width=\"100\" height=\"100\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M0 0h100v100H0z\" fill=\"none\"/%3E%3Cpath d=\"M0 50h100M50 0v100\" stroke=\"%23fff\" stroke-width=\"0.5\" opacity=\"0.1\"/%3E%3C/svg%3E');
                    opacity: 0.1;
                }

                .logo-container {
                    position: relative;
                    z-index: 1;
                    margin-bottom: 20px;
                }

                .logo {
                    max-width: 120px;
                    height: auto;
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .header h1 {
                    color: #ffffff;
                    font-size: 28px;
                    font-weight: 600;
                    margin: 0;
                    position: relative;
                    z-index: 1;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .content {
                    padding: 40px 30px;
                    background: #ffffff;
                }

                .content h2 {
                    color: #16a34a;
                    font-size: 24px;
                    margin-bottom: 20px;
                    font-weight: 600;
                }

                .content p {
                    margin-bottom: 16px;
                    color: #4b5563;
                    font-size: 15px;
                }

                .content strong {
                    color: #1f2937;
                    font-weight: 600;
                }

                .divider {
                    height: 1px;
                    background: linear-gradient(to right, transparent, #e5e7eb, transparent);
                    margin: 30px 0;
                }

                .footer {
                    background: #f9fafb;
                    padding: 30px;
                    text-align: center;
                    border-top: 1px solid #e5e7eb;
                }

                .footer-links {
                    margin-bottom: 20px;
                }

                .footer-links a {
                    color: #16a34a;
                    text-decoration: none;
                    margin: 0 15px;
                    font-size: 14px;
                    font-weight: 500;
                }

                .footer-links a:hover {
                    text-decoration: underline;
                }

                .copyright {
                    color: #6b7280;
                    font-size: 13px;
                    margin-top: 15px;
                }

                .social-icons {
                    margin: 20px 0;
                }

                .social-icons a {
                    display: inline-block;
                    width: 36px;
                    height: 36px;
                    margin: 0 8px;
                    background: #e5e7eb;
                    border-radius: 50%;
                    text-decoration: none;
                    line-height: 36px;
                    color: #4b5563;
                    transition: all 0.3s ease;
                }

                .social-icons a:hover {
                    background: #16a34a;
                    color: white;
                    transform: translateY(-2px);
                }

                @media only screen and (max-width: 600px) {
                    .email-wrapper {
                        border-radius: 0;
                        margin: 0;
                    }

                    .header {
                        padding: 10px 10px;
                    }

                    .header h1 {
                        font-size: 24px;
                    }

                    .logo {
                        max-width: 100px;
                    }

                    .content {
                        padding: 30px 20px;
                    }

                    .footer {
                        padding: 20px;
                    }

                    .footer-links a {
                        display: block;
                        margin: 10px 0;
                    }
                }
            </style>
        </head>
        <body>
            <div class='email-wrapper'>
                <div class='header'>
                </div>

                <div class='content'>
                    {$content}
                </div>

                <div class='footer'>
                    <div class='footer-links'>
                        <a href='{$baseUrl}'>Website</a>
                        <a href='{$baseUrl}/contact'>Kontak</a>
                        <a href='{$baseUrl}/about'>Tentang Kami</a>
                    </div>

                    <div class='divider'></div>

                    <p class='copyright'>
                        &copy; " . date('Y') . " Enggang Foundation. All rights reserved.<br>
                        <small style='color: #9ca3af;'>Email ini dikirim secara otomatis, mohon tidak membalas.</small>
                    </p>
                </div>
            </div>
        </body>
        </html>
        ";
    }

    // Jika plain text, convert ke HTML dengan template modern
    $htmlContent = nl2br(htmlspecialchars($content, ENT_QUOTES, 'UTF-8'));

    return "
    <!DOCTYPE html>
    <html lang='id'>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <meta http-equiv='X-UA-Compatible' content='IE=edge'>
        <title>Enggang Foundation</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333333;
                background: #f5f5f5;
                padding: 20px 0;
            }

            .email-wrapper {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            }

            .header {
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                padding: 40px 30px;
                text-align: center;
                position: relative;
            }

            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,%3Csvg width=\"100\" height=\"100\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M0 0h100v100H0z\" fill=\"none\"/%3E%3Cpath d=\"M0 50h100M50 0v100\" stroke=\"%23fff\" stroke-width=\"0.5\" opacity=\"0.1\"/%3E%3C/svg%3E');
                opacity: 0.1;
            }

            .logo-container {
                position: relative;
                z-index: 1;
                margin-bottom: 20px;
            }

            .logo {
                max-width: 120px;
                height: auto;
                background: white;
                padding: 15px;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .header h1 {
                color: #ffffff;
                font-size: 28px;
                font-weight: 600;
                margin: 0;
                position: relative;
                z-index: 1;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            .content {
                padding: 40px 30px;
                background: #ffffff;
            }

            .content p {
                margin-bottom: 16px;
                color: #4b5563;
                font-size: 15px;
            }

            .divider {
                height: 1px;
                background: linear-gradient(to right, transparent, #e5e7eb, transparent);
                margin: 30px 0;
            }

            .footer {
                background: #f9fafb;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }

            .footer-links {
                margin-bottom: 20px;
            }

            .footer-links a {
                color: #16a34a;
                text-decoration: none;
                margin: 0 15px;
                font-size: 14px;
                font-weight: 500;
            }

            .footer-links a:hover {
                text-decoration: underline;
            }

            .copyright {
                color: #6b7280;
                font-size: 13px;
                margin-top: 15px;
            }

            @media only screen and (max-width: 600px) {
                .email-wrapper {
                    border-radius: 0;
                    margin: 0;
                }

                .header {
                    padding: 30px 20px;
                }

                .header h1 {
                    font-size: 24px;
                }

                .logo {
                    max-width: 100px;
                }

                .content {
                    padding: 30px 20px;
                }

                .footer {
                    padding: 20px;
                }

                .footer-links a {
                    display: block;
                    margin: 10px 0;
                }
            }
        </style>
    </head>
    <body>
        <div class='email-wrapper'>
            <div class='header'>
            </div>

            <div class='content'>
                {$htmlContent}
            </div>

            <div class='footer'>
                <div class='footer-links'>
                    <a href='{$baseUrl}'>Website</a>
                    <a href='{$baseUrl}/contact'>Kontak</a>
                    <a href='{$baseUrl}/about'>Tentang Kami</a>
                </div>

                <div class='divider'></div>

                <p class='copyright'>
                    &copy; " . date('Y') . " Enggang Foundation. All rights reserved.<br>
                    <small style='color: #9ca3af;'>Email ini dikirim secara otomatis, mohon tidak membalas.</small>
                </p>
            </div>
        </div>
    </body>
    </html>
    ";
}


    public function verify(Request $request, $submissionId)
    {
        $request->validate([
            'is_approve' => 'required|boolean',
        ]);

        $answer = Answers::where('submission_id', $submissionId)->with('user')->first();
        if (!$answer) {
            return response()->json([
                'success' => false,
                'message' => 'Submission ID does not exist in answers.',
            ], 404);
        }

        $user = $answer->user;
        $period = \App\Models\Form\Period::find($answer->period_id);

        $existingResult = Result::where('submission_answers', $submissionId)->first();

        if ($existingResult) {
            $previousValidationStatus = [
                'label' => $existingResult->status === true ? 'Lulus'
                    : ($existingResult->status === false && $existingResult->selection_type !== null ? 'Tidak_Lulus'
                    : ($existingResult->is_approve === true ? 'Berkas_Diterima'
                    : ($existingResult->is_approve === false ? 'Berkas_Dikembalikan' : 'Belum_Ditentukan'))),
                'icon' => $existingResult->status === true || $existingResult->is_approve === true ? 'check_circle' : 'cancel',
                'color' => $existingResult->status === true || $existingResult->is_approve === true ? 'green' : 'red',
            ];

            $existingResult->update([
                'selection_type' => null,
                'value' => null,
                'status' => null,
                'is_approve' => $request->is_approve,
            ]);

            $result = $existingResult;
        } else {
            $result = Result::create([
                'submission_answers' => $submissionId,
                'selection_type' => null,
                'value' => null,
                'status' => $request->is_approve ? false : null,
                'is_approve' => $request->is_approve,
            ]);

            $previousValidationStatus = [
                'label' => 'Belum_Diverifikasi',
                'icon' => 'help',
                'color' => 'grey',
            ];
        }

        $resultData = [
            'submission_id' => $submissionId,
            'result' => [
                'id' => $result->id,
                'submission_answers' => $result->submission_answers,
                'selection_type' => $result->selection_type,
                'value' => $result->value,
                'status' => $result->status,
                'is_approve' => $result->is_approve,
                'created_at' => $result->created_at->toISOString(),
                'updated_at' => $result->updated_at->toISOString(),
            ],
            'is_approve' => $result->is_approve,
            'validation_status' => [
                'label' => $result->is_approve ? 'Berkas_Diterima' : 'Berkas_Dikembalikan',
                'icon' => $result->is_approve ? 'check_circle' : 'cancel',
                'color' => $result->is_approve ? 'green' : 'red',
            ],
            'previous_validation_status' => $previousValidationStatus,
            'user_id' => $user ? $user->id : 'N/A',
            'user_name' => $user ? $user->name : 'N/A',
            'user_email' => $user ? $user->email : 'N/A',
            'user_phone_number' => $user ? $user->phone_number : 'N/A',
            'period_id' => $answer->period_id,
            'period' => $period ? [
                'id' => $period->id,
                'key' => $period->key,
                'title' => $period->title,
                'status' => (int) $period->status,
                'is_published' => (bool) $period->is_published,
                'created_at' => $period->created_at->toISOString(),
            ] : null,
        ];

        // Kirim notifikasi WhatsApp
        if ($result->is_approve === true) {
            // Berkas diterima - kirim dengan link grup (jika diperlukan bisa tambahkan ke template)
            $this->sendWhatsAppNotification($user, $submissionId, 'document_received');
            $this->sendEmailNotification($user, $submissionId, 'document_received');
        } else {
            // Berkas dikembalikan
            $this->sendWhatsAppNotification($user, $submissionId, 'document_rejected');
            $this->sendEmailNotification($user, $submissionId, 'document_rejected');
        }

        // Kirim notifikasi Socket.IO
        try {
            $response = Http::post(env('SOCKET_SERVER_URL') . '/notify-result-verified', [
                'result' => $resultData,
            ]);

            if ($response->failed()) {
                Log::error('Failed to send Socket.IO result verified notification', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return response()->json([
                    'success' => true,
                    'message' => 'Data verified successfully, but notification failed.',
                    'result' => $result,
                ], 201);
            }
        } catch (\Exception $e) {
            Log::error('Error sending Socket.IO result verified notification', [
                'message' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => true,
                'message' => 'Data verified successfully, but notification failed.',
                'result' => $result,
            ], 201);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data verified successfully',
            'result' => $result,
        ], 201);
    }

    public function update(Request $request, $submissionId)
    {
        $request->validate([
            'selection_type' => 'required|in:sesi interview,sesi administrasi',
            'value' => 'nullable|string|max:255',
            'status' => 'required|boolean',
            'is_approve' => 'nullable|boolean',
        ]);

        $result = Result::where('submission_answers', $submissionId)->first();
        if (!$result) {
            return response()->json([
                'success' => false,
                'message' => 'No verified data found. Use verify endpoint first.',
            ], 404);
        }

        $previousValidationStatus = [
            'label' => $result->is_approve === null ? 'Belum_Diverifikasi' : ($result->is_approve ? 'Berkas_Diterima' : 'Berkas_Dikembalikan'),
            'icon' => $result->is_approve === null ? 'help' : ($result->is_approve ? 'check_circle' : 'cancel'),
            'color' => $result->is_approve === null ? 'grey' : ($result->is_approve ? 'green' : 'red'),
        ];

        $result->update([
            'selection_type' => $request->is_approve === false ? null : $request->selection_type,
            'value' => $request->value,
            'status' => $request->is_approve === false ? null : $request->status,
            'is_approve' => $request->is_approve ?? $result->is_approve,
        ]);

        $answer = Answers::where('submission_id', $submissionId)->with('user')->first();
        $user = $answer->user;
        $period = \App\Models\Form\Period::find($answer->period_id);

        $isPublished = $period ? (bool) $period->is_published : true;
        $selectionType = $result->selection_type;
        $status = $result->status;
        $isApprove = $result->is_approve;
        $userRole = 'user';

        // Tentukan validation status sesuai logika frontend
        if ($isApprove === true) {
            $statusLabel = 'Berkas_Diterima';
        } elseif ($isApprove === false) {
            $statusLabel = 'Berkas_Dikembalikan';
        } elseif ($userRole === 'user' && $selectionType !== null && !$isPublished) {
            $statusLabel = 'Menunggu_Hasil';
        } elseif ($status === true) {
            $statusLabel = 'Lulus';
        } elseif ($status === false && $selectionType !== null) {
            $statusLabel = 'Tidak_Lulus';
        } else {
            $statusLabel = 'Belum_Ditentukan';
        }

        $statusIcon = in_array($statusLabel, ['Lulus', 'Berkas_Diterima']) ? 'check_circle' : 'cancel';
        $statusColor = in_array($statusLabel, ['Lulus', 'Berkas_Diterima']) ? 'green' : 'red';

        $resultData = [
            'submission_id' => $submissionId,
            'result' => [
                'id' => $result->id,
                'submission_answers' => $result->submission_answers,
                'selection_type' => $result->selection_type,
                'value' => $result->value,
                'status' => $result->status,
                'is_approve' => $result->is_approve,
                'created_at' => $result->created_at->toISOString(),
                'updated_at' => $result->updated_at->toISOString(),
            ],
            'is_approve' => $result->is_approve,
            'is_published' => $isPublished,
            'validation_status' => [
                'label' => $statusLabel,
                'icon' => $statusIcon,
                'color' => $statusColor,
            ],
            'previous_validation_status' => $previousValidationStatus,
            'user_id' => $user ? $user->id : 'N/A',
            'user_name' => $user ? $user->name : 'N/A',
            'user_email' => $user ? $user->email : 'N/A',
            'user_phone_number' => $user ? $user->phone_number : 'N/A',
            'period_id' => $answer->period_id,
            'period' => $period ? [
                'id' => $period->id,
                'key' => $period->key,
                'title' => $period->title,
                'status' => (int) $period->status,
                'is_published' => $isPublished,
                'created_at' => $period->created_at->toISOString(),
            ] : null,
        ];

        // Kirim notifikasi WhatsApp hanya jika period published
        if ($period && $period->is_published) {
            if ($result->status === true) {
                // Status LULUS - kirim notifikasi lulus
                $this->sendWhatsAppNotification($user, $submissionId, 'selection_result_passed', [
                    '{selection_type}' => $result->selection_type ?? 'N/A',
                    '{value}' => $result->value ?? 'N/A',
                ]);
            } elseif ($result->status === false) {
                // Status TIDAK LULUS - kirim notifikasi tidak lulus
                $this->sendWhatsAppNotification($user, $submissionId, 'selection_result_failed', [
                    '{selection_type}' => $result->selection_type ?? 'N/A',
                    '{value}' => $result->value ?? 'N/A',
                ]);
            }
        }

        // Kirim notifikasi Socket.IO
        try {
            $response = Http::post(env('SOCKET_SERVER_URL') . '/notify-result-updated', [
                'result' => $resultData,
            ]);

            if ($response->failed()) {
                Log::error('Failed to send Socket.IO result updated notification', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error sending Socket.IO result updated notification', [
                'message' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data updated successfully (Stage 2)',
            'result' => $resultData,
        ], 200);
    }

    private function toE164PhoneNumber($phone)
    {
        $digits = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($digits, '62')) {
            return '+' . $digits;
        } elseif (str_starts_with($digits, '0')) {
            return '+62' . substr($digits, 1);
        }
        return $digits;
    }

    /**
     * Convert HTML dari ReactQuill ke WhatsApp formatted text
     */
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
