<?php

namespace App\Http\Controllers;

use App\Models\Logo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class LogoController extends Controller
{
    /**
     * Menampilkan logo saat ini.
     */
    public function show()
    {
        $logo = Logo::first();

        if (!$logo) {
            return response()->json([
                'status' => 404,
                'message' => 'Logo not found'
            ], 404);
        }

        $disk = 'public';
        $path = 'uploads/logo/images/';

        return response()->json([
            'status' => 200,
            'data' => [
                'id' => $logo->id,
                'image' => $logo->image
                    ? asset('storage/' . $path . $logo->image)
                    : null,
                'background_header' => $logo->background_header
                    ? asset('storage/' . $path . $logo->background_header)
                    : null,
                'app_title' => $logo->app_title,
                'app_body' => $logo->app_body,
                'created_at' => $logo->created_at,
                'updated_at' => $logo->updated_at,
            ],
        ]);
    }

    /**
     * Update logo & background header.
     */
    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'image' => 'nullable|file|mimes:svg,png,jpg,jpeg,gif,webp|max:10240',
            'background_header' => 'nullable|file|mimes:svg,png,jpg,jpeg,gif,webp|max:10240',
            'app_title' => 'nullable|string|max:255',
            'app_body' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $logo = Logo::first() ?? new Logo();

            $disk = 'public';
            $uploadPath = 'uploads/logo/images';

            // Update text fields
            if ($request->has('app_title')) {
                $logo->app_title = $request->app_title;
            }

            if ($request->has('app_body')) {
                $logo->app_body = $request->app_body;
            }

            /**
             * HANDLE LOGO IMAGE
             */
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $extension = strtolower($file->getClientOriginalExtension());

                // Tentukan nama file berdasarkan tipe
                $fileName = $extension === 'svg' ? 'logo.svg' : 'logo.png';

                // Hapus file lama (baik SVG maupun PNG)
                if (Storage::disk($disk)->exists("$uploadPath/logo.svg")) {
                    Storage::disk($disk)->delete("$uploadPath/logo.svg");
                }
                if (Storage::disk($disk)->exists("$uploadPath/logo.png")) {
                    Storage::disk($disk)->delete("$uploadPath/logo.png");
                }

                if ($extension === 'svg') {
                    // Langsung simpan SVG tanpa processing
                    Storage::disk($disk)->put(
                        "$uploadPath/$fileName",
                        file_get_contents($file->getRealPath())
                    );
                } else {
                    // Process raster image: resize & compress
                    $processedImage = $this->processImage($file, [
                        'max_width' => 512,
                        'max_height' => 512,
                        'quality' => 85,
                    ]);

                    Storage::disk($disk)->put(
                        "$uploadPath/$fileName",
                        $processedImage
                    );
                }

                $logo->image = $fileName;
            }

            /**
             * HANDLE BACKGROUND HEADER
             */
            if ($request->hasFile('background_header')) {
                $file = $request->file('background_header');
                $extension = strtolower($file->getClientOriginalExtension());

                // Tentukan nama file berdasarkan tipe
                $fileName = $extension === 'svg' ? 'background.svg' : 'background.png';

                // Hapus file lama (baik SVG maupun PNG)
                if (Storage::disk($disk)->exists("$uploadPath/background.svg")) {
                    Storage::disk($disk)->delete("$uploadPath/background.svg");
                }
                if (Storage::disk($disk)->exists("$uploadPath/background.png")) {
                    Storage::disk($disk)->delete("$uploadPath/background.png");
                }

                if ($extension === 'svg') {
                    // Langsung simpan SVG tanpa processing
                    Storage::disk($disk)->put(
                        "$uploadPath/$fileName",
                        file_get_contents($file->getRealPath())
                    );
                } else {
                    // Process raster image: resize & compress
                    $processedImage = $this->processImage($file, [
                        'max_width' => 1920,
                        'max_height' => 1080,
                        'quality' => 85,
                    ]);

                    Storage::disk($disk)->put(
                        "$uploadPath/$fileName",
                        $processedImage
                    );
                }

                $logo->background_header = $fileName;
            }

            $logo->save();

            // Generate response data
            $data = [
                'id' => $logo->id,
                'image' => $logo->image
                    ? asset('storage/' . $uploadPath . '/' . $logo->image)
                    : null,
                'background_header' => $logo->background_header
                    ? asset('storage/' . $uploadPath . '/' . $logo->background_header)
                    : null,
                'app_title' => $logo->app_title,
                'app_body' => $logo->app_body,
                'created_at' => $logo->created_at,
                'updated_at' => $logo->updated_at,
            ];

            return response()->json([
                'status' => 200,
                'message' => 'Logo updated successfully',
                'data' => $data,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'An error occurred',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Process dan optimize raster image (resize & compress ke PNG).
     */
    private function processImage($file, $options = [])
    {
        $maxWidth = $options['max_width'] ?? 800;
        $maxHeight = $options['max_height'] ?? 800;
        $quality = $options['quality'] ?? 85;

        // Create ImageManager dengan GD Driver
        $manager = new ImageManager(new Driver());

        // Read image
        $image = $manager->read($file);

        // Scale down dengan mempertahankan aspect ratio
        $image->scaleDown($maxWidth, $maxHeight);

        // Encode ke PNG dengan quality setting
        $encoded = $image->toPng();

        return $encoded;
    }

    /**
     * Delete logo atau background.
     */
    public function destroy(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:logo,background',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $logo = Logo::first();

            if (!$logo) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Logo not found'
                ], 404);
            }

            $disk = 'public';
            $uploadPath = 'uploads/logo/images';
            $type = $request->input('type');

            if ($type === 'logo') {
                // Hapus baik SVG maupun PNG
                if (Storage::disk($disk)->exists("$uploadPath/logo.svg")) {
                    Storage::disk($disk)->delete("$uploadPath/logo.svg");
                }
                if (Storage::disk($disk)->exists("$uploadPath/logo.png")) {
                    Storage::disk($disk)->delete("$uploadPath/logo.png");
                }

                $logo->image = null;
            }

            if ($type === 'background') {
                // Hapus baik SVG maupun PNG
                if (Storage::disk($disk)->exists("$uploadPath/background.svg")) {
                    Storage::disk($disk)->delete("$uploadPath/background.svg");
                }
                if (Storage::disk($disk)->exists("$uploadPath/background.png")) {
                    Storage::disk($disk)->delete("$uploadPath/background.png");
                }

                $logo->background_header = null;
            }

            $logo->save();

            // Generate response data
            $data = [
                'id' => $logo->id,
                'image' => $logo->image
                    ? asset('storage/' . $uploadPath . '/' . $logo->image)
                    : null,
                'background_header' => $logo->background_header
                    ? asset('storage/' . $uploadPath . '/' . $logo->background_header)
                    : null,
                'app_title' => $logo->app_title,
                'app_body' => $logo->app_body,
                'created_at' => $logo->created_at,
                'updated_at' => $logo->updated_at,
            ];

            return response()->json([
                'status' => 200,
                'message' => ucfirst($type) . ' deleted successfully',
                'data' => $data,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'An error occurred',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
