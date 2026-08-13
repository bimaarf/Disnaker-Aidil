<?php

namespace Database\Seeders;

use App\Models\Blog;
use App\Models\BlogImage;
use Illuminate\Database\Seeder;

class BlogImageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Menambahkan gambar random ke semua blog...');

        // Ambil semua gambar yang sudah ada
        $existingImages = BlogImage::all();

        if ($existingImages->isEmpty()) {
            $this->command->error('Tidak ada gambar di database! Tambahkan gambar terlebih dahulu.');
            return;
        }

        $this->command->info("Ditemukan {$existingImages->count()} gambar yang tersedia.");

        // Ambil semua blog
        $blogs = Blog::all();

        if ($blogs->isEmpty()) {
            $this->command->error('Tidak ada blog! Jalankan BlogSeeder terlebih dahulu.');
            return;
        }

        $this->command->info("Memproses {$blogs->count()} blog...");

        $totalImagesAdded = 0;

        foreach ($blogs as $blog) {
            // Random jumlah gambar per blog (1-5 gambar)
            $imageCount = rand(1, 5);

            // Ambil gambar random dari yang sudah ada (bisa duplikat antar blog)
            $randomImages = $existingImages->random(min($imageCount, $existingImages->count()));

            // Hitung gambar yang sudah ada untuk blog ini
            $existingCount = $blog->images()->count();

            $this->command->info("Blog: {$blog->name} - Sudah punya: {$existingCount} gambar, Menambah: {$randomImages->count()} gambar");

            // Jika blog belum punya gambar sama sekali
            $shouldSetPrimary = ($existingCount === 0);

            foreach ($randomImages as $index => $sourceImage) {
                // Cek apakah image_data ini sudah ada untuk blog ini (hindari duplikat exact)
                $alreadyExists = $blog->images()
                    ->where('image_data', $sourceImage->getRawOriginal('image_data'))
                    ->exists();

                if ($alreadyExists) {
                    $this->command->warn("  - Skip gambar duplikat untuk blog ini");
                    continue;
                }

                // Duplikasi data gambar untuk blog
                BlogImage::create([
                    'blog_id' => $blog->id,
                    'image_data' => $sourceImage->getRawOriginal('image_data'), // Ambil path asli
                    'is_primary' => ($shouldSetPrimary && $index === 0), // Gambar pertama jadi primary jika belum ada
                ]);

                $totalImagesAdded++;
            }
        }

        $this->command->info("✅ Berhasil menambahkan {$totalImagesAdded} gambar untuk {$blogs->count()} blog!");

        // Tampilkan statistik
        $blogsWithImages = Blog::has('images')->count();
        $blogsWithoutImages = Blog::doesntHave('images')->count();

        $this->command->info("📊 Statistik:");
        $this->command->info("  - Blog dengan gambar: {$blogsWithImages}");
        $this->command->info("  - Blog tanpa gambar: {$blogsWithoutImages}");
    }
}
