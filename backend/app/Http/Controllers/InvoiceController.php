<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Checkout;
use App\Models\CheckoutPayment;
use App\Models\Bank;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Exception;

class InvoiceController extends Controller
{
    /**
     * Display invoice by checkout key
     */
    public function show($checkoutKey)
    {
        try {
            $checkout = $this->findCheckoutByKey($checkoutKey);

            if (!$checkout) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Pesanan tidak ditemukan'
                ], 404);
            }

            // Load invoice with relationships
            $invoice = Invoice::where('checkout_id', $checkout->id)->first();

            if (!$invoice) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invoice tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Invoice berhasil ditemukan',
                'data' => [
                    'invoice' => [
                        'id' => $invoice->id,
                        'total_price' => $invoice->total_price,
                        'formatted_total_price' => 'Rp ' . number_format($invoice->total_price, 0, ',', '.'),
                        'image' => $this->getImageUrl($invoice->image),
                        'note' => $invoice->note,
                        'bank_name' => $invoice->bank_name,
                        'receiver_name' => $invoice->receiver_name,
                        'account_number' => $invoice->account_number,
                        'created_at' => $invoice->created_at,
                        'updated_at' => $invoice->updated_at,
                    ],
                    'checkout' => [
                        'id' => $checkout->id,
                        'key' => $checkout->key,
                        'total_price' => $checkout->total_price,
                        'formatted_total_price' => 'Rp ' . number_format($checkout->total_price, 0, ',', '.'),
                        'payment_method' => $checkout->payment->payment_method ?? null,
                        'created_at' => $checkout->created_at,
                    ]
                ]
            ]);

        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat mengambil data invoice'
            ], 500);
        }
    }

    /**
     * Serve image file securely
     */
    public function showImage($filename)
    {
        try {
            // Validasi filename untuk keamanan
            if (!preg_match('/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/', $filename)) {
                abort(404);
            }

            $path = 'invoices/' . $filename;

            // Cek apakah file ada di storage
            if (!Storage::disk('local')->exists($path)) {
                abort(404);
            }

            // Return file dengan proper headers
            return Storage::disk('local')->response($path, null, [
                'Cache-Control' => 'max-age=3600',
                'Content-Disposition' => 'inline'
            ]);

        } catch (Exception $e) {
            abort(404);
        }
    }

    /**
     * Generate image URL
     */
    private function getImageUrl($imagePath)
    {
        if (!$imagePath) {
            return null;
        }

        $filename = basename($imagePath);
        return url('/api/invoice/image/' . $filename);
    }

    /**
     * Create or update invoice by checkout key
     */
    public function createOrUpdate(Request $request, $checkoutKey)
    {
        try {
            // Validate input
            $validator = $this->validateInvoiceData($request);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data tidak valid',
                    'errors' => $validator->errors()
                ], 400);
            }

            // Find checkout and bank
            $checkout = $this->findCheckoutByKey($checkoutKey);
            $bank = $this->findBankById($request->bank_id);

            if (!$checkout) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Pesanan tidak ditemukan'
                ], 404);
            }

            if (!$bank) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Bank tidak ditemukan'
                ], 404);
            }

            // Validate payment method
            if (!$this->isValidPaymentMethod($checkout)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Metode pembayaran tidak sesuai untuk upload bukti transfer'
                ], 400);
            }

            // Validate bank status
            if (!$this->isBankActive($bank)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Bank sedang tidak tersedia (maintenance)'
                ], 400);
            }

            // Check existing invoice
            $existingInvoice = Invoice::where('checkout_id', $checkout->id)->first();
            $existingCheckoutPayment = CheckoutPayment::where('checkout_id', $checkout->id)->first();

            // Handle file upload
            $imagePath = $this->handleFileUpload($request->file('image'), $existingInvoice);

            // Create or update invoice
            $invoice = Invoice::updateOrCreate(
                ['checkout_id' => $checkout->id],
                [
                    'total_price' => $checkout->total_price,
                    'image' => $imagePath,
                    'note' => $request->input('note', ''),
                    'bank_name' => $bank->bank_name,
                    'receiver_name' => $bank->receiver_name,
                    'account_number' => $bank->account_number,
                ]
            );
            $existingCheckoutPayment->payment_type = $bank->bank_name;
            $existingCheckoutPayment->update();

            return response()->json([
                'status' => 'success',
                'message' => $existingInvoice ? 'Invoice berhasil diperbarui' : 'Invoice berhasil dibuat',
                'data' => [
                    'invoice' => [
                        'id' => $invoice->id,
                        'total_price' => $invoice->total_price,
                        'formatted_total_price' => 'Rp ' . number_format($invoice->total_price, 0, ',', '.'),
                        'image' => $this->getImageUrl($invoice->image),
                        'note' => $invoice->note,
                        'bank_name' => $invoice->bank_name,
                        'receiver_name' => $invoice->receiver_name,
                        'account_number' => $invoice->account_number,
                        'created_at' => $invoice->created_at,
                        'updated_at' => $invoice->updated_at,
                    ]
                ]
            ], $existingInvoice ? 200 : 201);

        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat memproses invoice',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Delete invoice by checkout key
     */
    public function destroy($checkoutKey)
    {
        try {
            $checkout = $this->findCheckoutByKey($checkoutKey);

            if (!$checkout) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Pesanan tidak ditemukan'
                ], 404);
            }

            $invoice = Invoice::where('checkout_id', $checkout->id)->first();

            if (!$invoice) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invoice tidak ditemukan'
                ], 404);
            }

            // Delete image file if exists
            if ($invoice->image && Storage::disk('local')->exists($invoice->image)) {
                Storage::disk('local')->delete($invoice->image);
            }

            // Delete invoice
            $invoice->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Invoice berhasil dihapus'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat menghapus invoice'
            ], 500);
        }
    }

    /**
     * Get all invoices (for admin)
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $dateFrom = $request->input('date_from');
            $dateTo = $request->input('date_to');
            $bankName = $request->input('bank_name');

            // Validasi input
            $validator = Validator::make($request->all(), [
                'per_page' => 'integer|min:1|max:100',
                'search' => 'nullable|string|max:255',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date|after_or_equal:date_from',
                'bank_name' => 'nullable|string|max:100',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $query = Invoice::with('checkout')
                ->orderBy('created_at', 'desc');

            // Pencarian berdasarkan kata kunci
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('bank_name', 'like', "%{$search}%")
                      ->orWhere('receiver_name', 'like', "%{$search}%")
                      ->orWhere('account_number', 'like', "%{$search}%")
                      ->orWhere('note', 'like', "%{$search}%");
                });
            }

            // Filter berdasarkan rentang tanggal
            if ($dateFrom) {
                $query->whereDate('created_at', '>=', $dateFrom);
            }
            if ($dateTo) {
                $query->whereDate('created_at', '<=', $dateTo);
            }

            // Filter berdasarkan nama bank
            if ($bankName) {
                $query->where('bank_name', $bankName);
            }

            $invoices = $query->paginate($perPage);

            $invoices->getCollection()->transform(function ($invoice) {
                return [
                    'id' => $invoice->id,
                    'checkout_key' => $invoice->checkout->key ?? null,
                    'total_price' => $invoice->total_price,
                    'formatted_total_price' => 'Rp ' . number_format($invoice->total_price, 0, ',', '.'),
                    'image' => $this->getImageUrl($invoice->image),
                    'note' => $invoice->note,
                    'bank_name' => $invoice->bank_name,
                    'receiver_name' => $invoice->receiver_name,
                    'account_number' => $invoice->account_number,
                    'created_at' => $invoice->created_at->toIso8601String(),
                    'updated_at' => $invoice->updated_at->toIso8601String(),
                ];
            });

            return response()->json([
                'status' => 'success',
                'message' => 'Data invoice berhasil diambil',
                'data' => $invoices
            ]);

        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat mengambil data invoice: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Find checkout by key with payment relationship
     */
    private function findCheckoutByKey($checkoutKey)
    {
        return Checkout::with('payment')
            ->where('key', $checkoutKey)
            ->first();
    }

    /**
     * Find bank by ID
     */
    private function findBankById($bankId)
    {
        return Bank::find($bankId);
    }

    /**
     * Validate invoice data
     */
    private function validateInvoiceData(Request $request)
    {
        return Validator::make($request->all(), [
            'image' => [
                'required',
                'image',
                'mimes:jpeg,png,jpg,webp',
                'max:10240', // 10MB
                function ($attribute, $value, $fail) {
                    // Validasi MIME type yang sebenarnya
                    $finfo = finfo_open(FILEINFO_MIME_TYPE);
                    $mimeType = finfo_file($finfo, $value->getRealPath());
                    finfo_close($finfo);

                    $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
                    if (!in_array($mimeType, $allowedMimes)) {
                        $fail('File bukan gambar valid');
                    }

                    // Validasi ukuran gambar (opsional)
                    $imageInfo = getimagesize($value->getRealPath());
                    if (!$imageInfo) {
                        $fail('File gambar tidak valid atau rusak');
                    }

                    // Batasi dimensi gambar jika perlu (opsional)
                    if ($imageInfo[0] > 5000 || $imageInfo[1] > 5000) {
                        $fail('Dimensi gambar terlalu besar (maksimal 5000x5000 pixel)');
                    }
                }
            ],
            'note' => 'nullable|string|max:255',
            'bank_id' => 'required|exists:tb_bank,id',
        ], [
            'image.required' => 'Bukti transfer harus diupload',
            'image.image' => 'File harus berupa gambar',
            'image.mimes' => 'Format file harus jpeg, png, jpg, atau webp',
            'image.max' => 'Ukuran file maksimal 10MB',
            'note.max' => 'Catatan maksimal 255 karakter',
            'bank_id.required' => 'Bank harus dipilih',
            'bank_id.exists' => 'Bank yang dipilih tidak valid',
        ]);
    }

    /**
     * Check if payment method is valid for invoice upload
     */
    private function isValidPaymentMethod($checkout)
    {
        return $checkout->payment &&
               in_array($checkout->payment->payment_method, ['bank_transfer', 'manual_transfer']);
    }

    /**
     * Check if bank is active
     */
    private function isBankActive($bank)
    {
        return $bank->status == 1 || $bank->status == '1' || $bank->status === true;
    }

    /**
     * Handle file upload securely
     */
    private function handleFileUpload($file, $existingInvoice = null)
    {
        // Delete old image if exists
        if ($existingInvoice && $existingInvoice->image && Storage::disk('local')->exists($existingInvoice->image)) {
            Storage::disk('local')->delete($existingInvoice->image);
        }

        // Generate unique filename dengan prefix timestamp
        $extension = $file->getClientOriginalExtension();
        $filename = time() . '_' . Str::random(20) . '.' . $extension;

        // Store file ke storage/app/invoices (private directory)
        $path = $file->storeAs('invoices', $filename, 'local');

        return $path;
    }
}
