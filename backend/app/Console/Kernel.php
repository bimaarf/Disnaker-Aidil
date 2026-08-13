<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    // protected function schedule(Schedule $schedule): void
    // {
    //     // $schedule->command('inspire')->hourly();
    //     $schedule->command('logs:clear')->daily();

    // }

    /**
     * Register the commands for the application.
     */
    protected function schedule(Schedule $schedule)
    {
        // Clean up old camera uploads daily at 2 AM
        $schedule->call(function () {
            $controller = new \App\Http\Controllers\CameraUploadController();
            $deleted = $controller->cleanupOldUploads(7);
            \Log::info("Cleaned up {$deleted} old camera uploads");
        })->dailyAt('02:00');
    }

    protected function commands()
    {
        $this->load(__DIR__.'/Commands');
        require base_path('routes/console.php');
    }
}
