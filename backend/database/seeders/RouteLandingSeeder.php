<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Route;
use App\Models\Landing;

class RouteLandingSeeder extends Seeder
{
    /**
     * Jalankan seeder.
     */
    public function run(): void
    {
        $data = [
            [
                'route_name' => 'home-page',
                'landing' => [
                    'title' => 'Beranda',
                    'subtitle' => 'Dinas Ketenagakerjaan Kabupaten Bengkayang',
                    'icon' => 'Home',
                    'description' => 'Portal informasi ketenagakerjaan dan layanan publik Kabupaten Bengkayang.',
                ],
            ],
            [
                'route_name' => 'about-page',
                'landing' => [
                    'title' => 'Tentang Kami',
                    'subtitle' => 'Profil Dinas Ketenagakerjaan Kab. Bengkayang',
                    'icon' => 'Building2',
                    'description' => 'Visi, misi, tugas pokok dan fungsi Dinas Ketenagakerjaan Kabupaten Bengkayang.',
                ],
            ],
            [
                'route_name' => 'contact-page',
                'landing' => [
                    'title' => 'Hubungi Kami',
                    'subtitle' => 'Layanan Informasi dan Pengaduan',
                    'icon' => 'Phone',
                    'description' => 'Informasi kontak dan lokasi kantor Dinas Ketenagakerjaan Kabupaten Bengkayang.',
                ],
            ],
            [
                'route_name' => 'gallery-page',
                'landing' => [
                    'title' => 'Galeri',
                    'subtitle' => 'Dokumentasi Kegiatan Ketenagakerjaan',
                    'icon' => 'Images',
                    'description' => 'Dokumentasi kegiatan, pelatihan kerja, job fair, dan program ketenagakerjaan di Kabupaten Bengkayang.',
                ],
            ],
            [
                'route_name' => 'blog-page',
                'landing' => [
                    'title' => 'Berita & Artikel',
                    'subtitle' => 'Informasi Terkini Ketenagakerjaan',
                    'icon' => 'Newspaper',
                    'description' => 'Berita terbaru, artikel, dan informasi seputar ketenagakerjaan di Kabupaten Bengkayang.',
                ],
            ],
        ];

        foreach ($data as $item) {
            // Buat atau update route
            $route = Route::updateOrCreate(
                ['route_name' => $item['route_name']]
            );

            // Buat atau update landing yang terhubung
            Landing::updateOrCreate(
                ['route_id' => $route->id],
                $item['landing']
            );
        }
    }
}
