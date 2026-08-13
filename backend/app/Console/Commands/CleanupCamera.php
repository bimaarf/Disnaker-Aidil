<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\CameraUploadController;

class CleanupCamera extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:cleanup-camera';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Continuously clean up old camera uploads every 4 seconds';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Starting camera cleanup loop...");

        $controller = new CameraUploadController();

        while (true) {
            try {
                $deleted = $controller->cleanupOldUploads(7);
                \Log::info("Cleaned up {$deleted} old camera uploads");
            } catch (\Exception $e) {
                \Log::error("CleanupCamera error: " . $e->getMessage());
            }

            sleep(4); // jeda 4 detik
        }
    }

    // php artisan app:cleanup-camera
    // nohup php artisan app:cleanup-camera > cleanup.log 2>&1 &

}
