<?php

namespace Database\Seeders;

use App\Models\Blog;
use App\Models\BlogCategory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BlogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Pastikan ada user untuk author
        $authors = User::all();
        if ($authors->isEmpty()) {
            $this->command->error('Tidak ada user! Jalankan UserSeeder terlebih dahulu.');
            return;
        }

        // Pastikan ada kategori
        $categories = BlogCategory::all();
        if ($categories->isEmpty()) {
            $this->command->info('Membuat kategori blog...');
            $categoryNames = [
                'Lowongan Kerja',
                'Pelatihan Kerja',
                'Bursa Kerja',
                'Job Fair',
                'Program Pemerintah',
                'Pengawasan Ketenagakerjaan',
                'Hubungan Industrial',
                'Transmigrasi',
                'Berita',
                'Pengumuman',
                'Artikel',
                'Sertifikasi Kompetensi'
            ];

            foreach ($categoryNames as $name) {
                BlogCategory::create([
                    'name' => $name,
                    'key' => Str::slug($name)
                ]);
            }

            $categories = BlogCategory::all();
        }

        $this->command->info('Membuat 100 blog Dinas Ketenagakerjaan Kabupaten Bengkayang...');

        $titles = [
            'Pembukaan Lowongan Kerja CPNS Kabupaten Bengkayang 2024',
            'Disnaker Bengkayang Gelar Job Fair dengan 50 Perusahaan',
            'Pelatihan Barista Gratis untuk Pencari Kerja di Bengkayang',
            'Program Kartu Prakerja Gelombang 50 Dibuka untuk Masyarakat Bengkayang',
            'Disnaker Bengkayang Launching Aplikasi Bursa Kerja Online',
            'Pelatihan Tata Boga untuk Meningkatkan Keterampilan Masyarakat',
            'Sertifikasi Kompetensi Gratis untuk Tenaga Kerja Bengkayang',
            'Disnaker Bengkayang Gelar Pelatihan Las dan Fabrikasi',
            'Job Fair Kabupaten Bengkayang Sediakan 1000 Lowongan Kerja',
            'Program Magang untuk Lulusan SMK di Kabupaten Bengkayang',
            'Disnaker Bengkayang Launching Sistem Informasi Ketenagakerjaan',
            'Pelatihan Digital Marketing untuk Pelaku UMKM Bengkayang',
            'Pengawasan Upah Minimum Regional di Kabupaten Bengkayang',
            'Sosialisasi Jaminan Sosial Ketenagakerjaan di Bengkayang',
            'Disnaker Bengkayang Adakan Pelatihan Operator Alat Berat',
            'Bursa Kerja Khusus untuk Penyandang Disabilitas di Bengkayang',
            'Program Pemagangan ke Jepang untuk Tenaga Kerja Bengkayang',
            'Disnaker Bengkayang Gelar Pelatihan Desain Grafis',
            'Penandatanganan MoU dengan Perusahaan untuk Penyerapan Tenaga Kerja',
            'Pelatihan Menjahit dan Fashion Design untuk Perempuan Bengkayang',
            'Job Fair Virtual Disnaker Bengkayang Tarik 5000 Peserta',
            'Program Transmigrasi untuk Masyarakat Bengkayang ke Kalimantan Utara',
            'Disnaker Bengkayang Launching Balai Latihan Kerja Modern',
            'Pelatihan Otomotif dan Mekanik untuk Pemuda Bengkayang',
            'Sosialisasi K3 (Keselamatan dan Kesehatan Kerja) di Perusahaan',
            'Disnaker Bengkayang Fasilitasi Penempatan TKI ke Luar Negeri',
            'Pelatihan Kelistrikan dan Instalasi untuk Tenaga Kerja Lokal',
            'Program Padat Karya Tunai untuk Masyarakat Bengkayang',
            'Disnaker Bengkayang Gelar Pelatihan Pertanian Modern',
            'Job Fair Khusus Fresh Graduate di Kabupaten Bengkayang',
            'Pelatihan Teknisi HP dan Komputer Gratis di Bengkayang',
            'Disnaker Bengkayang Launching Program Kewirausahaan Muda',
            'Sertifikasi BNSP untuk Meningkatkan Daya Saing Tenaga Kerja',
            'Program Link and Match dengan Dunia Industri di Bengkayang',
            'Disnaker Bengkayang Adakan Pelatihan Bahasa Inggris untuk Pekerja',
            'Pengurusan Kartu Kuning (AK1) Kini Lebih Mudah dan Cepat',
            'Pelatihan Customer Service dan Hospitality di Bengkayang',
            'Disnaker Bengkayang Gelar Sosialisasi Hubungan Industrial',
            'Program Pelatihan Pengolahan Kelapa Sawit untuk Petani',
            'Job Fair Ramadan: 800 Lowongan Kerja untuk Masyarakat Bengkayang',
            'Disnaker Bengkayang Launching Aplikasi E-AK1 Online',
            'Pelatihan Perpajakan dan Akuntansi untuk Pelaku Usaha',
            'Program Penempatan Tenaga Kerja Indonesia ke Malaysia',
            'Disnaker Bengkayang Gelar Pelatihan Content Creator',
            'Sosialisasi Peraturan Ketenagakerjaan untuk Perusahaan di Bengkayang',
            'Pelatihan Budidaya Ikan dan Peternakan Modern',
            'Program Pendampingan Pencari Kerja oleh Disnaker Bengkayang',
            'Disnaker Bengkayang Raih Penghargaan Pelayanan Prima dari Kemnaker',
            'Pelatihan Security dan Satpam Profesional di Bengkayang',
            'Job Fair Akhir Tahun: Peluang Karir untuk Masyarakat Bengkayang',
        ];

        $descriptions = [
            'Dinas Ketenagakerjaan Kabupaten Bengkayang terus berkomitmen meningkatkan kualitas tenaga kerja lokal melalui berbagai program pelatihan.',
            'Program ini merupakan upaya pemerintah daerah dalam mengurangi angka pengangguran dan meningkatkan kesejahteraan masyarakat Bengkayang.',
            'Disnaker Bengkayang terus berinovasi dalam memberikan pelayanan terbaik untuk pencari kerja dan dunia usaha.',
            'Kegiatan ini bertujuan untuk meningkatkan kompetensi dan daya saing tenaga kerja di Kabupaten Bengkayang.',
            'Dengan dukungan teknologi digital, layanan ketenagakerjaan di Bengkayang semakin mudah diakses oleh masyarakat.',
            'Pemerintah Kabupaten Bengkayang melalui Disnaker terus mendorong terciptanya lapangan kerja baru.',
            'Program pelatihan dan sertifikasi ini diharapkan dapat meningkatkan peluang kerja bagi masyarakat Bengkayang.',
            'Disnaker Bengkayang aktif memfasilitasi kerjasama dengan dunia industri untuk penyerapan tenaga kerja lokal.',
            'Sebagai upaya pengentasan pengangguran, Disnaker Bengkayang menghadirkan berbagai program unggulan.',
            'Layanan ketenagakerjaan yang prima menjadi prioritas utama Disnaker Kabupaten Bengkayang.',
        ];

        $counter = 0;

        for ($i = 1; $i <= 100; $i++) {
            // Ambil title dan description secara random atau berurutan
            $titleIndex = $counter % count($titles);
            $descIndex = rand(0, count($descriptions) - 1);

            $title = $titles[$titleIndex];
            if ($counter >= count($titles)) {
                $title .= ' (' . ceil($counter / count($titles)) . ')';
            }

            $blog = Blog::create([
                'key' => Str::slug($title) . '-' . $i,
                'name' => $title,
                'description' => $descriptions[$descIndex] . ' ' .
                    'Kegiatan ini merupakan bagian dari upaya Dinas Ketenagakerjaan Kabupaten Bengkayang dalam mewujudkan visi menjadi instansi pelayanan ketenagakerjaan yang profesional dan terpercaya. ' .
                    'Dengan dukungan seluruh stakeholder, Disnaker Bengkayang terus berkomitmen memberikan layanan terbaik untuk meningkatkan kesejahteraan masyarakat dan mendorong pertumbuhan ekonomi daerah.',
                'status' => rand(0, 1), // Random status visible/hidden
                'author_id' => $authors->random()->id,
            ]);

            // Attach random categories (1-3 categories per blog)
            $randomCategories = $categories->random(rand(1, 3))->pluck('id');
            $blog->categories()->attach($randomCategories);

            $counter++;
        }

        $this->command->info('Berhasil membuat 100 blog Dinas Ketenagakerjaan Kabupaten Bengkayang!');
    }
}
