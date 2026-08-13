<?php

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Support\Facades\Route;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Response;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    // $user = User::find(1);
    // $wallets = $user->wallets;
    // return $wallets;
    $timestamp = "23:33:07 6 May 2025";
$unix_time = strtotime($timestamp);  // Converts to Unix timestamp (e.g., 1746540975)
return  $unix_time;
});


// Serve shooting files
Route::get('/storage/shooting-files/{year}/{month}/{day}/{filename}', function ($year, $month, $day, $filename) {
    $path = "shooting-files/{$year}/{$month}/{$day}/{$filename}";

    if (!Storage::disk('local')->exists($path)) {
        abort(404);
    }

    $file = Storage::disk('local')->get($path);
    $mimeType = Storage::disk('local')->mimeType($path);

    return Response::make($file, 200, [
        'Content-Type' => $mimeType,
        'Cache-Control' => 'public, max-age=31536000',
    ]);
})->where([
    'year' => '[0-9]{4}',
    'month' => '[0-9]{2}',
    'day' => '[0-9]{2}',
    'filename' => '.*'
]);
