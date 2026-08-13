<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\NotificationWhatsAppMessage;

class NotificationWhatsAppMessageSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'code' => 'selection_result_passed',
                'label' => 'Hasil Seleksi - LULUS',
                'message' => "<p>Halo <strong>{name}</strong>,</p><p><strong>🎉 SELAMAT! 🎉</strong></p><p>Kami dengan senang hati mengumumkan bahwa Anda <strong>DINYATAKAN LULUS</strong> pada tahap seleksi kami.</p><ul><li>Submission ID: <strong>{submission_id}</strong></li><li>Jalur Seleksi: <strong>{selection_type}</strong></li><li>Keterangan: <strong>{value}</strong></li></ul><p><strong>Langkah Selanjutnya:</strong></p><ol><li>Pantau email dan WhatsApp Anda untuk informasi lebih lanjut</li><li>Siapkan dokumen yang mungkin diperlukan untuk tahap berikutnya</li><li>Jika ada grup WhatsApp khusus, Anda akan segera ditambahkan</li></ol><p><em>Selamat atas pencapaian Anda!</em> Kami bangga dengan prestasi Anda dan menantikan kolaborasi selanjutnya.</p><p>Salam hangat,<br><strong>Tim Enggang Foundation</strong></p>",
            ],
            [
                'code' => 'selection_result_failed',
                'label' => 'Hasil Seleksi - TIDAK LULUS',
                'message' => "<p>Halo <strong>{name}</strong>,</p><p>Terima kasih atas partisipasi Anda dalam proses seleksi Enggang Foundation.</p><ul><li>Submission ID: <strong>{submission_id}</strong></li><li>Jalur Seleksi: <strong>{selection_type}</strong></li><li>Keterangan: <strong>{value}</strong></li></ul><p>Setelah melalui proses evaluasi yang ketat, dengan berat hati kami sampaikan bahwa Anda <strong>belum dapat melanjutkan</strong> ke tahap berikutnya pada periode ini.</p><p><strong>Catatan Penting:</strong></p><ul><li>Keputusan ini tidak mengurangi apresiasi kami atas usaha dan dedikasi Anda</li><li>Kami mendorong Anda untuk terus berkembang dan mencoba kembali di periode mendatang</li><li>Setiap pengalaman adalah pembelajaran berharga untuk kesuksesan masa depan</li></ul><p><em>Jangan menyerah!</em> Kesuksesan seringkali datang setelah beberapa kali percobaan. Kami tetap mendukung perjalanan Anda.</p><p>Salam hangat,<br><strong>Tim Enggang Foundation</strong></p>",
            ],
            [
                'code' => 'document_received',
                'label' => 'Berkas Diterima',
                'message' => "<p>Halo <strong>{name}</strong>,</p><p><strong>✅ Selamat!</strong> Berkas Anda telah diterima dan <strong>LOLOS VERIFIKASI ADMINISTRASI</strong>.</p><ul><li>Submission ID: <strong>{submission_id}</strong></li></ul><p><strong>Langkah Selanjutnya:</strong></p><ol><li>Bergabung ke grup WhatsApp interview (link akan dikirimkan terpisah)</li><li>Pantau grup secara aktif untuk informasi jadwal interview</li><li>Siapkan diri Anda untuk tahap seleksi berikutnya</li><li>Pastikan nomor WhatsApp Anda tetap aktif</li></ol><p><em>Persiapkan diri Anda dengan baik!</em> Kami menantikan kehadiran Anda di tahap selanjutnya.</p><p>Salam hangat,<br><strong>Tim Enggang Foundation</strong></p>",
            ],
            [
                'code' => 'document_rejected',
                'label' => 'Berkas Dikembalikan',
                'message' => "<p>Halo <strong>{name}</strong>,</p><p>Terima kasih telah mendaftar di Enggang Foundation.</p><ul><li>Submission ID: <strong>{submission_id}</strong></li></ul><p>Setelah melakukan verifikasi administrasi, dengan berat hati kami sampaikan bahwa berkas Anda <strong>belum memenuhi persyaratan</strong> pada tahap ini.</p><p><strong>Apa yang bisa dilakukan:</strong></p><ul><li>Periksa kembali kelengkapan dokumen yang diminta</li><li>Pastikan semua berkas dalam format dan kualitas yang baik</li><li>Lengkapi dokumen yang kurang</li><li>Daftar kembali pada periode pendaftaran berikutnya</li></ul><p><em>Jangan berkecil hati!</em> Ini adalah kesempatan untuk memperbaiki dan kembali lebih siap. Kami tetap membuka pintu untuk pendaftaran di masa mendatang.</p><p>Tetap semangat!</p><p>Salam hangat,<br><strong>Tim Enggang Foundation</strong></p>",
            ],
            [
                'code' => 'new_submission',
                'label' => 'Submission Baru Diterima',
                'message' => "<p>Halo <strong>{name}</strong>,</p><p><strong>Terima kasih telah mendaftar!</strong></p><ul><li>Submission ID: <strong>{submission_id}</strong></li></ul><p>Pendaftaran Anda telah kami terima dengan baik. Saat ini berkas Anda sedang dalam <strong>antrian verifikasi</strong>.</p><p><strong>Yang perlu Anda lakukan:</strong></p><ol><li>Tunggu proses verifikasi oleh tim kami (maksimal 3-5 hari kerja)</li><li>Pantau WhatsApp dan email Anda secara berkala</li><li>Pastikan nomor WhatsApp Anda tetap aktif</li><li>Siapkan dokumen tambahan jika diperlukan</li></ol><p>Kami akan segera menginformasikan hasil verifikasi berkas Anda melalui WhatsApp dan email.</p><p><em>Terima kasih atas kesabaran Anda!</em></p><p>Salam hangat,<br><strong>Tim Enggang Foundation</strong></p>",
            ],
            [
                'code' => 'selection_result',
                'label' => 'Hasil Seleksi (Deprecated)',
                'message' => "<p>Halo <strong>{name}</strong>,</p><p>Kami informasikan hasil seleksi Anda:</p><ul><li>Submission ID: <strong>{submission_id}</strong></li><li>Jalur Seleksi: <strong>{selection_type}</strong></li><li>Status: <strong>{status}</strong></li></ul><p>Terima kasih atas partisipasi Anda.</p><p>Salam hangat,<br>Tim Enggang Foundation</p>",
            ],
        ];

        foreach ($templates as $template) {
            NotificationWhatsAppMessage::updateOrCreate(
                ['code' => $template['code']],
                ['label' => $template['label'], 'message' => $template['message']]
            );
        }

        $this->command->info('✅ Notification WhatsApp templates seeded successfully!');
        $this->command->info('📝 Total templates: ' . count($templates));
    }
}
