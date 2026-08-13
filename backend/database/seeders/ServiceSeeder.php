<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Service;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            [
                "title" => "HALO PENTA",
                "description" => "Layanan konsultasi online terkait pelayanan di bidang Penempatan dan Perluasan Kerja",
                "icon" => "Phone",
                "color" => "from-blue-500 to-cyan-500",
                "link" => "https://bit.ly/Halo-Penta",
                "sub_items" => [
                    [
                        "title" => "Konsultasi Ketenagakerjaan",
                        "icon" => "Phone",
                        "description" => "Layanan konsultasi online untuk pertanyaan seputar ketenagakerjaan",
                        "link" => "https://bit.ly/Halo-Penta",
                    ],
                    [
                        "title" => "Informasi Perluasan Kerja",
                        "icon" => "Info",
                        "description" => "Informasi terkait program perluasan kesempatan kerja",
                        "link" => "https://bit.ly/Halo-Penta",
                    ],
                    [
                        "title" => "Bantuan Penempatan",
                        "icon" => "Users",
                        "description" => "Bantuan dalam proses penempatan tenaga kerja",
                        "link" => "https://bit.ly/Halo-Penta",
                    ],
                ],
            ],
            [
                "title" => "KARTU PENCAKER",
                "description" => "Kartu tanda bukti pendaftaran pencari kerja yang dikeluarkan oleh Dinas Ketenagakerjaan Kota Balikpapan",
                "icon" => "FileText",
                "color" => "from-purple-500 to-pink-500",
                "link" => "https://newnaker.balikpapan.go.id/pencaker/login",
                "sub_items" => [
                    [
                        "title" => "Pendaftaran Kartu AK/I",
                        "icon" => "FileText",
                        "description" => "Daftar untuk mendapatkan kartu pencari kerja baru",
                        "link" => "https://newnaker.balikpapan.go.id/pencaker/login",
                    ],
                    [
                        "title" => "Perpanjangan Kartu",
                        "icon" => "FileText",
                        "description" => "Perpanjang masa berlaku kartu pencari kerja Anda",
                        "link" => "https://newnaker.balikpapan.go.id/pencaker/login",
                    ],
                    [
                        "title" => "Cetak Ulang Kartu",
                        "icon" => "FileText",
                        "description" => "Cetak ulang kartu yang hilang atau rusak",
                        "link" => "https://newnaker.balikpapan.go.id/pencaker/login",
                    ],
                ],
            ],
            [
                "title" => "PELAPORAN TKA",
                "description" => "Lapor TKA adalah pelaporan yang dilakukan oleh perusahaan yang menggunakan Tenaga Kerja Asing di instansi tersebut",
                "icon" => "Users",
                "color" => "from-orange-500 to-red-500",
                "link" => "http://103.144.82.150:8000",
                "sub_items" => [
                    [
                        "title" => "Laporan Bulanan TKA",
                        "icon" => "FileText",
                        "description" => "Pelaporan rutin bulanan penggunaan tenaga kerja asing",
                        "link" => "http://103.144.82.150:8000",
                    ],
                    [
                        "title" => "Registrasi TKA Baru",
                        "icon" => "Users",
                        "description" => "Pendaftaran tenaga kerja asing yang baru masuk",
                        "link" => "http://103.144.82.150:8000",
                    ],
                    [
                        "title" => "Pembaruan Data TKA",
                        "icon" => "FileText",
                        "description" => "Update informasi dan data tenaga kerja asing",
                        "link" => "http://103.144.82.150:8000",
                    ],
                ],
            ],
            [
                "title" => "INFO LOKER",
                "description" => "Berisikan informasi lowongan pekerjaan dari perusahaan-perusahaan",
                "icon" => "Info",
                "color" => "from-green-500 to-emerald-500",
                "link" => "https://newnaker.balikpapan.go.id/info-loker",
                "sub_items" => [
                    [
                        "title" => "Lowongan Terbaru",
                        "icon" => "Info",
                        "description" => "Daftar lowongan pekerjaan yang baru dipublikasikan",
                        "link" => "https://newnaker.balikpapan.go.id/info-loker",
                    ],
                    [
                        "title" => "Lowongan Berdasarkan Bidang",
                        "icon" => "Briefcase",
                        "description" => "Cari lowongan sesuai bidang keahlian Anda",
                        "link" => "https://newnaker.balikpapan.go.id/info-loker",
                    ],
                    [
                        "title" => "Job Fair & Event",
                        "icon" => "Users",
                        "description" => "Informasi bursa kerja dan acara rekrutmen",
                        "link" => "https://newnaker.balikpapan.go.id/info-loker",
                    ],
                ],
            ],
            // 🔽 sisanya tinggal dilanjutkan (PASANG LOKER, BURSA KERJA ONLINE, BKK)
        ];

        foreach ($services as $srv) {
            $service = Service::create([
                'title' => $srv['title'],
                'description' => $srv['description'],
                'icon' => $srv['icon'],
                'color' => $srv['color'],
                'link' => $srv['link'],
            ]);

            if (!empty($srv['sub_items'])) {
                $service->subItems()->createMany($srv['sub_items']);
            }
        }
    }
}
