<?php

namespace App\Http\Controllers;

use App\Models\Checkout;
use App\Models\CheckoutProduct;
use App\Models\CheckoutPayment;
use App\Models\CheckoutPromotion;
use App\Models\Product;
use App\Models\ProductPromotion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Transaction;
use Midtrans\Notification;

class CheckoutController extends Controller
{
    public function __construct()
    {
        // Set Midtrans configuration
        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production');
        Config::$isSanitized = config('midtrans.is_sanitized');
        Config::$is3ds = config('midtrans.is_3ds');
    }

    public function index(Request $request)
    {
        $perPage = $request->input('perPage', 10);
        $sortKey = $request->input('sortKey', 'created_at');
        $sortDirection = $request->input('sortDirection', 'desc');
        $status = $request->input('status');
        $searchQuery = $request->input('q');
        $fromDate = $request->input('fromDate');
        $toDate = $request->input('toDate');
        $userId = $request->input('user_id') ?: Auth::id();


        $query = Checkout::with(['user', 'products.product', 'payment'])
            ->where('user_id', $userId);

        if ($status) {
            $query->where('status', $status);
        }
        if ($searchQuery) {
            $query->where(function ($q) use ($searchQuery) {
                $q->where('key', 'like', '%' . $searchQuery . '%');
                $q->orWhere('status', 'like', '%' . $searchQuery . '%');

                $q->orWhereHas('payment', function ($q) use ($searchQuery) {
                    $q->where('order_id', 'like', '%' . $searchQuery . '%');
                    $q->orWhere('payment_method', 'like', '%' . $searchQuery . '%');
                    $q->orWhere('payment_type', 'like', '%' . $searchQuery . '%');
                    $q->orWhere('transaction_id', 'like', '%' . $searchQuery . '%');
                    $q->orWhere('payment_status', 'like', '%' . $searchQuery . '%');
                });

                $q->orWhereHas('products', function ($q) use ($searchQuery) {
                    $q->where('product_name', 'like', '%' . $searchQuery . '%');
                    $q->orWhereHas('product', function ($q) use ($searchQuery) {
                        $q->where('name', 'like', '%' . $searchQuery . '%');
                    });
                });
                $q->orWhereHas('user', function ($q) use ($searchQuery) {
                    $q->where('name', 'like', '%' . $searchQuery . '%');
                    $q->orWhere('email', 'like', '%' . $searchQuery . '%');
                    $q->orWhere('phone_number', 'like', '%' . $searchQuery . '%');
                });
            });
        }


        if ($fromDate) {
            $query->whereDate('created_at', '>=', $fromDate);
        }
        if ($toDate) {
            $query->whereDate('created_at', '<=', $toDate);
        }

        $query->orderBy($sortKey, $sortDirection);

        $result = $query->paginate($perPage);

        $items = collect($result->items())->map(function ($checkout) {
            return $this->formatCheckoutResponse($checkout);
        });

        return response()->json([
            'data' => $items->values()->all(),
            'current_page' => $result->currentPage(),
            'last_page' => $result->lastPage(),
            'per_page' => $result->perPage(),
            'total' => $result->total(),
        ]);
    }

    public function view($key)
    {
        $checkout = Checkout::with(['user', 'products.product', 'payment'])
            ->where('key', $key)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        return response()->json([
            'data' => $this->formatCheckoutResponse($checkout)
        ]);
    }

    public function checkCode(Request $request)
    {
        $exist = ProductPromotion::where('referral_code', $request->referral_code)
            ->where('referral_code' , '!=', null)
            ->where('status', 1)
            ->where(function ($q) {
                $q->whereNull('expired')->orWhere('expired', '>', now());
            })
            ->first();
        if (!$exist) {
            return response()->json([
                'status' => 404,
                'message' => 'Kode promo tidak ditemukan!'
            ], 404);
        }
        if ($exist->status != 1 || (!is_null($exist->expired) && $exist->expired <= now())) {
            return response()->json([
                'status' => 400,
                'message' => 'Kode promo tidak aktif atau telah kedaluwarsa'
            ], 400);
        }
        return response()->json([
            'status' => 200,
            'data' => [
                'id' => $exist->id,
                'key' => $exist->key,
                'title' => $exist->title,
                'type' => 'voucher',
                'discount_percentage' => $exist->discount_percentage,
                'status' => $exist->status,
                'referral_code' => $exist->referral_code,
                'expired' => $exist->expired,
            ]
        ], 200);
    }

    public function create(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'total_price' => 'required|numeric|min:0',
            'product_ids' => 'required|array|min:1',
            'product_ids.*' => 'exists:tb_product,id',
            'quantity' => 'required|array|min:1',
            'quantity.*' => 'integer|min:1',
            'payment_method' => 'required|in:credit_card,bank_transfer,cash_on_delivery,e_wallet,midtrans',
            'referral_code' => 'nullable|string|exists:tb_product_promotion,referral_code',
            'referral_discount' => 'nullable|numeric|min:0|max:100',
            'referral_promotion_id' => 'nullable|exists:tb_product_promotion,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $subtotalBeforeReferral = 0;
            $productDetails = [];

            $products = Product::with(['promotions' => function ($query) {
                $query->where('status', 1)
                    ->where(function ($q) {
                        $q->whereNull('expired')->orWhere('expired', '>', now());
                    });
            }])->whereIn('id', $request->product_ids)->get()->keyBy('id');

            foreach ($request->product_ids as $index => $productId) {
                $product = $products->get($productId);

                if (!$product) {
                    throw new \Exception("Product with ID {$productId} not found");
                }

                if (!$product->status) {
                    throw new \Exception("Product '{$product->name}' is not available for purchase");
                }

                $quantity = $request->quantity[$index];
                $price = $product->price;

                if ($this->isBonusProduct($product)) {
                    $price = 0;
                }

                $totalProductPrice = $price * $quantity;
                $totalDiscount = 0;
                $activePromotions = $product->promotions;
                $promotionDetails = [];

                if ($activePromotions->count() > 0) {
                    $totalDiscount = $activePromotions->sum('discount_percentage');
                    $promotionDetails = $activePromotions->map(function ($promo) use ($product) {
                        return [
                            'id' => $promo->id,
                            'key' => $promo->key,
                            'title' => "{$promo->title} (Product ID: {$product->id})",
                            'type' => 'product',
                            'discount_percentage' => $promo->discount_percentage,
                            'status' => $promo->status,
                            'referral_code' => $promo->referral_code,
                            'expired' => $promo->expired,
                        ];
                    })->toArray();
                }

                $discountAmount = $totalDiscount ? ($totalProductPrice * $totalDiscount / 100) : 0;
                $subtotal = $totalProductPrice - $discountAmount;

                $productDetails[] = [
                    'product' => $product,
                    'quantity' => $quantity,
                    'price' => $price,
                    'total_product_price' => $totalProductPrice,
                    'discount_amount' => $discountAmount,
                    'subtotal' => $subtotal,
                    'product_discount' => $totalDiscount,
                    'promotions' => $promotionDetails,
                ];

                $subtotalBeforeReferral += $subtotal;
            }

            $finalTotal = $subtotalBeforeReferral;
            $referralPromotion = null;
            $voucherPromotionDetails = [];

            if ($request->referral_code && $request->referral_discount > 0 && $request->referral_promotion_id) {
                $referralPromotion = ProductPromotion::where('id', $request->referral_promotion_id)
                    ->where('referral_code', $request->referral_code)
                    ->where('referral_code', '!=', null)
                    ->where('status', 1)
                    ->where(function ($q) {
                        $q->whereNull('expired')->orWhere('expired', '>', now());
                    })
                    ->first();

                if ($referralPromotion && $referralPromotion->discount_percentage == $request->referral_discount) {
                    $finalTotal = $subtotalBeforeReferral * (1 - $request->referral_discount / 100);
                    $voucherPromotionDetails = [
                        'id' => $referralPromotion->id,
                        'key' => $referralPromotion->key,
                        'title' => $referralPromotion->title,
                        'type' => 'voucher',
                        'discount_percentage' => $referralPromotion->discount_percentage,
                        'status' => $referralPromotion->status,
                        'referral_code' => $referralPromotion->referral_code,
                        'expired' => $referralPromotion->expired,
                    ];
                } else {
                    throw new \Exception("Invalid voucher promotion");
                }
            }

            if (abs($finalTotal - $request->total_price) >= 0.01) {
                return response()->json([
                    'message' => 'Total price mismatch',
                    'errors' => [
                        'total_price' => [
                            'Calculated total (' . number_format($finalTotal, 2) . ') does not match provided total (' . number_format($request->total_price, 2) . ')'
                        ]
                    ],
                    'debug' => [
                        'subtotal_before_referral' => $subtotalBeforeReferral,
                        'referral_discount_percentage' => $request->referral_discount,
                        'calculated_total' => $finalTotal,
                        'provided_total' => $request->total_price,
                        'difference' => abs($finalTotal - $request->total_price)
                    ]
                ], 422);
            }

            $checkout = Checkout::create([
                'key' => Str::uuid(),
                'user_id' => Auth::id(),
                'total_price' => $finalTotal,
                'status' => 'pending',
                'promotion_id' => $request->referral_promotion_id,
            ]);

            foreach ($productDetails as $detail) {
                $checkoutProduct = CheckoutProduct::create([
                    'checkout_id' => $checkout->id,
                    'product_id' => $detail['product']->id,
                    'product_name' => $detail['product']->name,
                    'quantity' => $detail['quantity'],
                    'price' => $detail['price'],
                ]);

                foreach ($detail['promotions'] as $promotion) {
                    CheckoutPromotion::create([
                        'key' => Str::uuid(),
                        'checkout_id' => $checkout->id,
                        'type' => 'product',
                        'title' => $promotion['title'],
                        'status' => $promotion['status'],
                        'discount_percentage' => $promotion['discount_percentage'],
                        'referral_code' => $promotion['referral_code'],
                        'expired' => $promotion['expired'],
                    ]);
                }
            }

            if ($referralPromotion) {
                CheckoutPromotion::create([
                    'key' => Str::uuid(),
                    'checkout_id' => $checkout->id,
                    'type' => 'voucher',
                    'title' => $referralPromotion->title,
                    'status' => $referralPromotion->status,
                    'discount_percentage' => $referralPromotion->discount_percentage,
                    'referral_code' => $referralPromotion->referral_code,
                    'expired' => $referralPromotion->expired,
                ]);
            }

            $paymentStatus = $request->payment_method === 'midtrans' ? 'pending' : 'unpaid';
            $payment = CheckoutPayment::create([
                'checkout_id' => $checkout->id,
                'payment_method' => $request->payment_method,
                'payment_status' => $paymentStatus,
                'order_id' => 'yz-' . time() . '-' . Str::random(6), // New unique order ID format
            ]);

            $snapToken = null;
            $redirectUrl = null;

            if ($request->payment_method === 'midtrans') {
                try {
                    $midtransPayload = $this->createMidtransPayload($checkout, $productDetails, Auth::user());
                    $midtransPayload['transaction_details']['order_id'] = $payment->order_id;
                    $snapToken = Snap::getSnapToken($midtransPayload);

                    $redirectUrl = config('midtrans.is_production')
                    ? "https://app.midtrans.com/snap/v4/redirection/{$snapToken}"
                    : "https://app.sandbox.midtrans.com/snap/v4/redirection/{$snapToken}";
                    $payment->update([
                        'snap_token' => $snapToken,
                        'redirect_url' => $redirectUrl,
                        'gross_amount' => $finalTotal,
                    ]);

                    Log::info('Midtrans Snap Token Generated', [
                        'checkout_id' => $checkout->id,
                        'order_id' => $payment->order_id,
                        'snap_token' => $snapToken,
                        'gross_amount' => $finalTotal,
                    ]);

                } catch (\Exception $e) {
                    Log::error('Midtrans Snap Token Error', [
                        'checkout_id' => $checkout->id,
                        'error' => $e->getMessage(),
                    ]);
                    throw new \Exception('Failed to create payment gateway token: ' . $e->getMessage());
                }
            }

            DB::commit();

            $checkout->load(['products.product', 'payment']);

            $responseData = $this->formatCheckoutResponse($checkout);
            $responseData['subtotal_before_referral'] = $subtotalBeforeReferral;
            $responseData['referral_discount'] = $request->referral_discount ?? 0;

            if ($request->payment_method === 'midtrans') {
                $responseData['payment_gateway'] = [
                    'snap_token' => $snapToken,
                    'redirect_url' => $redirectUrl,
                    'is_production' => config('midtrans.is_production'),
                    'order_id' => $payment->order_id,
                ];
            }

            return response()->json([
                'message' => 'Checkout created successfully',
                'data' => $responseData,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create checkout',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function createMidtransPayload($checkout, $productDetails, $user)
    {
        $orderId = $checkout->key;
        $grossAmount = $this->formatCurrencyForMidtrans($checkout->total_price);

        $itemDetails = [];
        $totalItemsAmount = 0;

        // Process product items
        foreach ($productDetails as $detail) {
            $unitPrice = $this->formatCurrencyForMidtrans($detail['price']);
            $quantity = $detail['quantity'];
            $totalProductPrice = $this->formatCurrencyForMidtrans($detail['total_product_price']);
            $discountAmount = $this->formatCurrencyForMidtrans($detail['discount_amount']);

            // Add product item
            $itemDetails[] = [
                'id' => $detail['product']->id,
                'price' => $unitPrice,
                'quantity' => $quantity,
                'name' => $detail['product']->name,
                'brand' => 'Yz-Course',
                'category' => $detail['product']->categories[0]->name ?? 'Course',
                'merchant_name' => 'Yz-Course'
            ];

            $totalItemsAmount += $unitPrice * $quantity;

            // Add product discount if exists
            if ($discountAmount > 0) {
                $itemDetails[] = [
                    'id' => 'DISCOUNT-PROD-' . $detail['product']->id,
                    'price' => -$discountAmount,
                    'quantity' => 1,
                    'name' => 'Diskon Produk: ' . $detail['product']->name,
                    'category' => 'Discount',
                    'merchant_name' => 'Yz-Course'
                ];
                $totalItemsAmount -= $discountAmount;
            }
        }

        // Add referral discount if exists
        $subtotalBeforeReferral = array_sum(array_column($productDetails, 'subtotal'));
        $referralDiscount = $subtotalBeforeReferral - $checkout->total_price;
        if ($referralDiscount > 0) {
            $referralDiscountAmount = $this->formatCurrencyForMidtrans($referralDiscount);
            $itemDetails[] = [
                'id' => 'DISCOUNT-REFERRAL',
                'price' => -$referralDiscountAmount,
                'quantity' => 1,
                'name' => 'Diskon Referral',
                'category' => 'Discount',
                'merchant_name' => 'Yz-Course'
            ];
            $totalItemsAmount -= $referralDiscountAmount;
        }

        // Validate total amount
        if ($totalItemsAmount !== $grossAmount) {
            Log::error('Midtrans payload total mismatch', [
                'order_id' => $orderId,
                'gross_amount' => $grossAmount,
                'total_items_amount' => $totalItemsAmount,
                'item_details' => $itemDetails,
            ]);
            throw new \Exception('Midtrans payload total mismatch');
        }

        // Customer details
        $customerDetails = [
            'first_name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone_number ?? '',
        ];

        // Transaction details
        $transactionDetails = [
            'order_id' => $orderId,
            'gross_amount' => $grossAmount,
        ];

        // Frontend URL untuk callback langsung
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');

        // Build complete payload
        $payload = [
            'transaction_details' => $transactionDetails,
            'item_details' => $itemDetails,
            'customer_details' => $customerDetails,

            // Payment methods configuration
            // 'enabled_payments' => [
            //     'qris',
            //     'dana',
            //     'credit_card',
            //     'bri_epay',
            //     'echannel',
            //     'permata_va',
            //     'bca_va',
            //     'bni_va',
            //     'bri_va',
            //     'other_va',
            //     'gopay',
            //     'shopeepay',
            //     'indomaret',
            //     'alfamart',
            //     'akulaku'
            // ],

            // // VT-Web specific configuration
            // 'vtweb' => [
            //     'enabled_payments' => [
            //         'qris',
            //         'dana',
            //         'credit_card',
            //         'bri_epay',
            //         'echannel',
            //         'permata_va',
            //         'bca_va',
            //         'bni_va',
            //         'bri_va',
            //         'other_va',
            //         'gopay',
            //         'shopeepay',
            //         'indomaret',
            //         'alfamart',
            //         'akulaku'
            //     ],
            //     'credit_card' => [
            //         'secure' => true,
            //         'channel' => 'migs',
            //         'bank' => 'bca',
            //         'installment' => [
            //             'required' => false,
            //             'terms' => [
            //                 'bni' => [3, 6, 12],
            //                 'mandiri' => [3, 6, 12],
            //                 'cimb' => [3],
            //                 'bca' => [3, 6, 12],
            //                 'offline' => [6, 12]
            //             ]
            //         ]
            //     ]
            // ],

            // ✅ LANGSUNG KE FRONTEND - TANPA BACKEND CALLBACK
            'callbacks' => [
                'finish' => "{$frontendUrl}/checkout/preview/{$checkout->key}",
                'unfinish' => "{$frontendUrl}/checkout/preview/{$checkout->key}",
                'error' => "{$frontendUrl}/checkout/preview/{$checkout->key}"
            ],

            // Additional configuration
            'expiry' => [
                'start_time' => date('Y-m-d H:i:s O'),
                'unit' => 'minutes',
                'duration' => 1440 // 24 hours
            ],

            // Custom fields (optional)
            'custom_field1' => $checkout->id,
            'custom_field2' => $user->id,
            'custom_field3' => 'checkout',

            // Page settings
            'page_expiry' => [
                'duration' => 1440, // 24 hours in minutes
                'unit' => 'minutes'
            ]
        ];

        // Add billing address if available
        if ($user->address ?? null) {
            $payload['customer_details']['billing_address'] = [
                'first_name' => $user->name,
                'address' => $user->address,
                'city' => $user->city ?? 'Jakarta',
                'postal_code' => $user->postal_code ?? '12345',
                'phone' => $user->phone_number ?? '',
                'country_code' => 'IDN'
            ];
        }

        // Add shipping address (same as billing for digital products)
        $payload['customer_details']['shipping_address'] = [
            'first_name' => $user->name,
            'address' => $user->address ?? 'Digital Product',
            'city' => $user->city ?? 'Jakarta',
            'postal_code' => $user->postal_code ?? '12345',
            'phone' => $user->phone_number ?? '',
            'country_code' => 'IDN'
        ];

        Log::info('Midtrans Payload Created - Direct to Frontend', [
            'order_id' => $orderId,
            'gross_amount' => $grossAmount,
            'item_details_count' => count($itemDetails),
            'total_items_amount' => $totalItemsAmount,
            'customer_email' => $user->email,
            'redirect_urls' => [
                'finish' => $payload['callbacks']['finish'],
                'unfinish' => $payload['callbacks']['unfinish'],
                'error' => $payload['callbacks']['error']
            ],
            // 'enabled_payments_count' => count($payload['enabled_payments']),
            'expiry_duration' => $payload['expiry']['duration'] . ' ' . $payload['expiry']['unit']
        ]);

        return $payload;
    }

    private function formatCheckoutResponse($checkout)
    {
        $checkout->products = $checkout->products->map(function ($checkoutProduct) {
            $promotions = CheckoutPromotion::where('checkout_id', $checkoutProduct->checkout_id)
                ->where('type', 'product')
                ->where('title', 'like', "%(Product ID: {$checkoutProduct->product_id})%")
                ->get()
                ->map(function ($promo) {
                    return [
                        'id' => $promo->id,
                        'key' => $promo->key,
                        'title' => $promo->title,
                        'type' => $promo->type,
                        'discount_percentage' => $promo->discount_percentage,
                        'status' => $promo->status,
                        'referral_code' => $promo->referral_code,
                        'expired' => $promo->expired,
                    ];
                });

            return [
                'id' => $checkoutProduct->id,
                'product_id' => $checkoutProduct->product_id,
                'product_name' => $checkoutProduct->product_name,
                'quantity' => $checkoutProduct->quantity,
                'price' => $checkoutProduct->price,
                'promotions' => $promotions,
                'product' => $checkoutProduct->product ? [
                    'id' => $checkoutProduct->product->id,
                    'name' => $checkoutProduct->product->name,
                    'images' => $checkoutProduct->product->images,
                    'categories' => $checkoutProduct->product->categories,
                ] : null,
            ];
        });

        $referralPromotion = CheckoutPromotion::where('checkout_id', $checkout->id)
            ->where('type', 'voucher')
            ->first();


        $referralPromotion = $referralPromotion ? [
            'id' => $checkout->promotion_id,
            'key' => $referralPromotion->key,
            'title' => $referralPromotion->title,
            'type' => 'voucher',
            'discount_percentage' => $referralPromotion->discount_percentage,
            'status' => $referralPromotion->status,
            'referral_code' => $referralPromotion->referral_code,
            'expired' => $referralPromotion->expired,
        ] : null;

        return [
            'id' => $checkout->id,
            'key' => $checkout->key,
            'user_id' => $checkout->user_id,
            'total_price' => $checkout->total_price,
            'status' => $checkout->status,
            'checked_out_at' => $checkout->checked_out_at,
            'promotion_id' => $checkout->promotion_id,
            'created_at' => $checkout->created_at,
            'updated_at' => $checkout->updated_at,
            'products' => $checkout->products,
            'user' => $checkout->user,
            'payment' => $checkout->payment,
            'referral_promotion' => $referralPromotion,
        ];
    }

    public function getSnapToken($checkoutKey)
    {
        try {
            $checkout = Checkout::with(['payment', 'products.product', 'user'])
                ->where('key', $checkoutKey)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            $payment = $checkout->payment;

            if ($checkout->status !== 'pending') {
                return response()->json([
                    'message' => 'Checkout is not in pending status'
                ], 400);
            }

            if ($payment->payment_status === 'paid') {
                return response()->json([
                    'message' => 'Payment already completed'
                ], 400);
            }

            if ($payment->snap_token) {
                try {
                    $transactionStatus = Transaction::status($payment->order_id ?? $checkoutKey);
                    if (in_array($transactionStatus->transaction_status, ['pending', 'challenge'])) {
                        return response()->json([
                            'snap_token' => $payment->snap_token,
                            'is_production' => config('midtrans.is_production'),
                            'message' => 'Existing snap token is still valid'
                        ]);
                    }
                } catch (\Exception $e) {
                    if (strpos($e->getMessage(), 'Transaction doesn\'t exist') !== false ||
                        strpos($e->getMessage(), '404') !== false) {
                        // Transaction expired or not found, proceed to generate new token
                    } else {
                        throw $e;
                    }
                }
            }

            // Generate new snap token
            $productDetails = $checkout->products->map(function ($checkoutProduct) {
                $promotions = CheckoutPromotion::where('checkout_id', $checkoutProduct->checkout_id)
                    ->where('type', 'product')
                    ->where('title', 'like', "%(Product ID: {$checkoutProduct->product_id})%")
                    ->get();

                $totalDiscount = $promotions->sum('discount_percentage');
                $totalProductPrice = $checkoutProduct->price * $checkoutProduct->quantity;
                $discountAmount = $totalDiscount ? ($totalProductPrice * $totalDiscount / 100) : 0;
                $subtotal = $totalProductPrice - $discountAmount;

                return [
                    'product' => $checkoutProduct->product,
                    'quantity' => $checkoutProduct->quantity,
                    'price' => $checkoutProduct->price,
                    'total_product_price' => $totalProductPrice,
                    'discount_amount' => $discountAmount,
                    'subtotal' => $totalProductPrice - $discountAmount,
                    'promotions' => $promotions->toArray(),
                ];
            })->toArray();

            // Create new order_id with timestamp
            $newOrderId = 'yz-' . time() . '-' . Str::random(6);
            $midtransPayload = $this->createMidtransPayload($checkout, $productDetails, $checkout->user);
            $midtransPayload['transaction_details']['order_id'] = $newOrderId;

            $snapToken = Snap::getSnapToken($midtransPayload);

            $redirectUrl = config('midtrans.is_production')
                ? "https://app.midtrans.com/snap/v4/redirection/{$snapToken}"
                : "https://app.sandbox.midtrans.com/snap/v4/redirection/{$snapToken}";

            $payment->update([
                'snap_token' => $snapToken,
                'redirect_url' => $redirectUrl,
                'payment_method' => 'midtrans',
                'payment_status' => 'pending',
                'gross_amount' => $checkout->total_price,
                'order_id' => $newOrderId,
            ]);

            Log::info('Snap token generated', [
                'checkout_key' => $checkoutKey,
                'new_order_id' => $newOrderId,
                'snap_token' => $snapToken,
            ]);

            return response()->json([
                'snap_token' => $snapToken,
                'is_production' => config('midtrans.is_production'),
                'order_id' => $newOrderId,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to generate Snap Token', [
                'checkout_key' => $checkoutKey,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to generate payment token',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function checkPaymentStatus($checkoutKey)
    {
        try {
            $checkout = Checkout::with('payment')
                ->where('key', $checkoutKey)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            $payment = $checkout->payment;

            if (!$payment) {
                return response()->json([
                    'message' => 'Payment record not found'
                ], 404);
            }

            if (!$payment->isMidtransPayment()) {
                return response()->json([
                    'order_id' => $checkout->key,
                    'payment_status' => $payment->payment_status,
                    'payment_method' => $payment->payment_method,
                    'paid_at' => $payment->paid_at,
                    'transaction_id' => $payment->transaction_id,
                    'payment_type' => $payment->payment_type,
                    'source' => 'database',
                    'checkout_status' => $checkout->status,
                    'can_regenerate' => in_array($payment->payment_status, ['expire', 'failed', 'cancel', 'cancelled']),
                ]);
            }

            try {
                // Use the order_id from payment record if exists, otherwise use checkout key
                $orderId = $payment->order_id ?? $checkoutKey;

                $transactionStatus = Transaction::status($orderId);

                Log::info('Midtrans transaction status checked', [
                    'checkout_key' => $checkoutKey,
                    'order_id' => $orderId,
                    'transaction_status' => $transactionStatus->transaction_status,
                    'payment_type' => $transactionStatus->payment_type ?? null,
                    'fraud_status' => $transactionStatus->fraud_status ?? null,
                    'transaction_id' => $transactionStatus->transaction_id ?? null,
                ]);

                // Hanya perbarui payment_type jika status valid
                if (in_array($transactionStatus->transaction_status, ['pending', 'settlement', 'capture', 'challenge'])) {
                    $this->syncPaymentStatusWithMidtrans($checkout, $payment, $transactionStatus);
                } else {
                    // Jika status tidak valid (misalnya, expire, cancel), jangan perbarui payment_type
                    Log::info('Skipping payment_type update due to invalid transaction status', [
                        'checkout_key' => $checkoutKey,
                        'transaction_status' => $transactionStatus->transaction_status,
                    ]);
                }

                // Get fresh payment data after sync
                $payment->refresh();

                return response()->json([
                    'order_id' => $orderId,
                    'transaction_status' => $transactionStatus->transaction_status,
                    'payment_type' => $transactionStatus->payment_type ?? null,
                    'transaction_time' => $transactionStatus->transaction_time ?? null,
                    'transaction_id' => $transactionStatus->transaction_id ?? null,
                    'gross_amount' => $transactionStatus->gross_amount ?? null,
                    'fraud_status' => $transactionStatus->fraud_status ?? null,
                    'source' => 'midtrans_api',
                    'checkout_status' => $checkout->fresh()->status,
                    'can_regenerate' => in_array($transactionStatus->transaction_status, ['expire', 'cancel', 'deny']),
                    'can_retry' => $transactionStatus->transaction_status === 'pending',
                    'payment_status' => $payment->payment_status,
                ]);

            } catch (\Exception $e) {
                if (strpos($e->getMessage(), 'Transaction doesn\'t exist') !== false ||
                    strpos($e->getMessage(), '404') !== false) {

                    // Transaction not found in Midtrans
                    if ($payment->payment_status === 'pending' && is_null($payment->payment_type)) {
                        // New transaction that hasn't been started yet
                        return response()->json([
                            'order_id' => $checkout->key,
                            'payment_status' => $payment->payment_status,
                            'payment_method' => $payment->payment_method,
                            'payment_type' => null,
                            'source' => 'database_fallback',
                            'message' => 'Transaksi belum dimulai. Silakan lanjutkan pembayaran.',
                            'can_retry' => true,
                            'can_regenerate' => false,
                            'checkout_status' => $checkout->status,
                            'midtrans_error' => $e->getMessage(),
                        ]);
                    } else {
                        // Transaction was started but not found - likely expired
                        $this->updatePaymentStatusFromMidtrans($checkout, $payment, 'cancelled', null);
                        return response()->json([
                            'order_id' => $checkout->key,
                            'payment_status' => 'cancelled',
                            'payment_method' => $payment->payment_method,
                            'payment_type' => $payment->payment_type,
                            'source' => 'database_fallback',
                            'message' => 'Transaksi sudah kedaluwarsa atau tidak ditemukan.',
                            'can_retry' => false,
                            'can_regenerate' => true,
                            'checkout_status' => $checkout->fresh()->status,
                            'midtrans_error' => $e->getMessage(),
                        ]);
                    }
                }

                // Other errors - use database status
                Log::warning('Failed to check Midtrans status, using database status', [
                    'checkout_key' => $checkoutKey,
                    'error' => $e->getMessage(),
                ]);

                return response()->json([
                    'order_id' => $checkout->key,
                    'payment_status' => $payment->payment_status,
                    'payment_method' => $payment->payment_method,
                    'payment_type' => $payment->payment_type,
                    'paid_at' => $payment->paid_at,
                    'transaction_id' => $payment->transaction_id,
                    'source' => 'database_fallback',
                    'checkout_status' => $checkout->status,
                    'can_regenerate' => in_array($payment->payment_status, ['expire', 'failed', 'cancel', 'cancelled']),
                    'midtrans_error' => $e->getMessage(),
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Error checking payment status', [
                'checkout_key' => $checkoutKey,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to check payment status',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function redirectToPayment($checkoutKey)
    {
        try {
            $checkout = Checkout::with('payment')
                ->where('key', $checkoutKey)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            $payment = $checkout->payment;

            if (!$payment || !$payment->redirect_url) {
                return redirect()->route('checkout.preview', $checkoutKey)
                    ->with('error', 'Payment URL not available');
            }

            if ($payment->payment_status === 'paid') {
                return redirect()->route('checkout.preview', $checkoutKey)
                    ->with('success', 'Payment already completed');
            }

            Log::info('Redirecting to Midtrans payment', [
                'checkout_key' => $checkoutKey,
                'user_id' => Auth::id(),
                'redirect_url' => $payment->redirect_url,
            ]);

            return redirect($payment->redirect_url);

        } catch (\Exception $e) {
            Log::error('Failed to redirect to payment', [
                'checkout_key' => $checkoutKey,
                'error' => $e->getMessage(),
            ]);

            return redirect()->route('checkout.preview', $checkoutKey)
                ->with('error', 'Failed to redirect to payment gateway');
        }
    }

    private function isBonusProduct($product)
    {
        return $product->promotions->contains(function ($promo) {
            return $promo->discount_percentage == 100;
        });
    }

    public function midtransNotification(Request $request)
    {
        try {
            $notification = new Notification();

            $orderId = $notification->order_id;
            $transactionStatus = $notification->transaction_status;
            $fraudStatus = $notification->fraud_status ?? null;
            $paymentType = $notification->payment_type;

            Log::info('Midtrans Notification Received', [
                'order_id' => $orderId,
                'transaction_status' => $transactionStatus,
                'fraud_status' => $fraudStatus,
                'payment_type' => $paymentType,
                'full_notification' => $notification->getResponse(),
            ]);

            // PERBAIKAN: Cari checkout berdasarkan order_id di tabel payment
            $payment = CheckoutPayment::where('order_id', $orderId)->first();

            if (!$payment) {
                // Fallback: coba cari berdasarkan checkout key (untuk order lama)
                $checkout = Checkout::where('key', $orderId)->first();
                if ($checkout) {
                    $payment = $checkout->payment;
                }
            } else {
                $checkout = $payment->checkout;
            }

            if (!$payment || !$checkout) {
                Log::error('Checkout/Payment not found for order_id: ' . $orderId, [
                    'searched_order_id' => $orderId,
                    'notification_data' => $notification->getResponse()
                ]);

                // Return 200 OK agar Midtrans tidak retry
                return response()->json(['message' => 'Order not found'], 200);
            }

            // Log untuk debugging
            Log::info('Found checkout for notification', [
                'checkout_id' => $checkout->id,
                'checkout_key' => $checkout->key,
                'payment_id' => $payment->id,
                'stored_order_id' => $payment->order_id,
                'received_order_id' => $orderId,
            ]);

            // Process transaction status
            switch ($transactionStatus) {
                case 'capture':
                    if ($fraudStatus == 'challenge') {
                        $this->updatePaymentStatusFromMidtrans($checkout, $payment, 'challenge', $notification);
                    } elseif ($fraudStatus == 'accept') {
                        $this->updatePaymentStatusFromMidtrans($checkout, $payment, 'paid', $notification);
                    }
                    break;

                case 'settlement':
                    $this->updatePaymentStatusFromMidtrans($checkout, $payment, 'paid', $notification);
                    break;

                case 'pending':
                    $this->updatePaymentStatusFromMidtrans($checkout, $payment, 'pending', $notification);
                    break;

                case 'deny':
                case 'cancel':
                    $this->updatePaymentStatusFromMidtrans($checkout, $payment, 'cancelled', $notification);
                    break;

                case 'expire':
                    $this->updatePaymentStatusFromMidtrans($checkout, $payment, 'expire', $notification);
                    break;

                case 'refund':
                case 'partial_refund':
                    $this->updatePaymentStatusFromMidtrans($checkout, $payment, 'refunded', $notification);
                    break;

                default:
                    Log::warning('Unknown transaction status: ' . $transactionStatus, [
                        'order_id' => $orderId,
                        'checkout_id' => $checkout->id,
                    ]);
                    break;
            }

            // Return 200 OK to acknowledge receipt
            return response()->json(['message' => 'Notification processed successfully'], 200);

        } catch (\Exception $e) {
            Log::error('Midtrans notification error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
                'notification_data' => isset($notification) ? $notification->getResponse() : null,
            ]);

            // Still return 200 to prevent Midtrans from retrying
            return response()->json(['message' => 'Notification processing failed'], 200);
        }
    }

    private function updatePaymentStatusFromMidtrans($checkout, $payment, $status, $notification)
    {
        try {
            DB::beginTransaction();

            // ✅ PERBAIKAN: Map status yang diterima ke status database yang benar
            $mappedStatus = $this->mapStatusToDatabase($status);

            $paymentData = [
                'payment_status' => $mappedStatus, // ✅ Gunakan mapped status
            ];

            if (is_object($notification)) {
                $paymentData['transaction_id'] = $notification->transaction_id ?? $payment->transaction_id;
                $paymentData['payment_type'] = $notification->payment_type ?? $payment->payment_type;
                $paymentData['gross_amount'] = $notification->gross_amount ?? $payment->gross_amount;

                if (isset($notification->transaction_time)) {
                    $paymentData['transaction_time'] = \Carbon\Carbon::parse($notification->transaction_time);
                }

                $paymentData['fraud_status'] = $notification->fraud_status ?? null;
                $paymentData['midtrans_response'] = method_exists($notification, 'getResponse')
                    ? json_encode($notification->getResponse())
                    : json_encode((array) $notification);
            }

            // Status-specific handling berdasarkan mapped status
            if (in_array($mappedStatus, ['paid', 'settlement', 'capture'])) {
                $paymentData['paid_at'] = now();
                $checkout->update(['status' => 'completed']);
            } elseif ($mappedStatus === 'expire') {
                $paymentData['expired_at'] = now();
                if (!is_null($paymentData['payment_type'] ?? $payment->payment_type)) {
                    $checkout->update(['status' => 'cancelled']);
                } else {
                    if ($checkout->status !== 'completed') {
                        $checkout->update(['status' => 'pending']);
                    }
                }
            } elseif (in_array($mappedStatus, ['cancelled', 'failed', 'deny', 'cancel'])) {
                $paymentData['expired_at'] = now();
                if ($checkout->status !== 'completed') {
                    $checkout->update(['status' => 'pending']);
                }
            } elseif ($mappedStatus === 'refunded' || $mappedStatus === 'partial_refund') {
                $checkout->update(['status' => 'cancelled']);
            }

            $payment->update($paymentData);

            Log::info('Payment status updated from Midtrans', [
                'checkout_id' => $checkout->id,
                'order_id' => $checkout->key,
                'original_status' => $status,
                'mapped_status' => $mappedStatus,
                'checkout_status' => $checkout->fresh()->status,
                'transaction_id' => $paymentData['transaction_id'] ?? null,
                'payment_type' => $paymentData['payment_type'] ?? null,
            ]);

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update payment status from Midtrans: ' . $e->getMessage());
            throw $e;
        }
    }

    public function recreateFromExpired(Request $request, $checkoutKey)
    {
        try {
            $expiredCheckout = Checkout::with(['products', 'payment'])
                ->where('key', $checkoutKey)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            if (!in_array($expiredCheckout->payment->payment_status, ['cancelled', 'failed', 'cancel', 'expire'])) {
                return response()->json([
                    'message' => 'Checkout is not expired or cancelled',
                    'current_status' => $expiredCheckout->payment->payment_status
                ], 400);
            }

            // Validate input data
            $validator = Validator::make($request->all(), [
                'total_price' => 'required|numeric|min:0',
                'payment_method' => 'required|in:credit_card,bank_transfer,cash_on_delivery,e_wallet,midtrans',
                'referral_code' => 'nullable|string|exists:tb_product_promotion,referral_code',
                'referral_discount' => 'nullable|numeric|min:0|max:100',
                'referral_promotion_id' => 'nullable|exists:tb_product_promotion,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Kode Promo sudah expired!',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Create a new checkout record
            $newCheckout = Checkout::create([
                'key' => Str::uuid(), // Generate a new UUID
                'user_id' => Auth::id(),
                'total_price' => $request->total_price,
                'status' => 'pending',
                'promotion_id' => $request->referral_promotion_id,
            ]);

            // Copy products from the expired checkout
            $products = $expiredCheckout->products;
            foreach ($products as $product) {
                $checkoutProduct = CheckoutProduct::create([
                    'checkout_id' => $newCheckout->id,
                    'product_id' => $product->product_id,
                    'product_name' => $product->product_name,
                    'quantity' => $product->quantity,
                    'price' => $product->price,
                ]);

                // Copy product promotions
                $promotions = CheckoutPromotion::where('checkout_id', $expiredCheckout->id)
                    ->where('type', 'product')
                    ->where('title', 'like', "%(Product ID: {$product->product_id})%")
                    ->get();

                foreach ($promotions as $promotion) {
                    CheckoutPromotion::create([
                        'key' => Str::uuid(),
                        'checkout_id' => $newCheckout->id,
                        'type' => 'product',
                        'title' => $promotion->title,
                        'status' => $promotion->status,
                        'discount_percentage' => $promotion->discount_percentage,
                        'referral_code' => $promotion->referral_code,
                        'expired' => $promotion->expired,
                    ]);
                }
            }

            // Copy referral promotion if exists
            $referralPromotion = CheckoutPromotion::where('checkout_id', $expiredCheckout->id)
                ->where('type', 'voucher')
                ->first();

            if ($referralPromotion) {
                CheckoutPromotion::create([
                    'key' => Str::uuid(),
                    'checkout_id' => $newCheckout->id,
                    'type' => 'voucher',
                    'title' => $referralPromotion->title,
                    'status' => $referralPromotion->status,
                    'discount_percentage' => $referralPromotion->discount_percentage,
                    'referral_code' => $referralPromotion->referral_code,
                    'expired' => $referralPromotion->expired,
                ]);
            }

            // Create a new payment record
            $paymentStatus = $request->payment_method === 'midtrans' ? 'pending' : 'unpaid';
            $payment = CheckoutPayment::create([
                'checkout_id' => $newCheckout->id,
                'payment_method' => $request->payment_method,
                'payment_status' => $paymentStatus,
            ]);

            $snapToken = null;
            $redirectUrl = null;

            if ($request->payment_method === 'midtrans') {
                try {
                    $productDetails = $products->map(function ($checkoutProduct) {
                        $promotions = CheckoutPromotion::where('checkout_id', $checkoutProduct->checkout_id)
                            ->where('type', 'product')
                            ->where('title', 'like', "%(Product ID: {$checkoutProduct->product_id})%")
                            ->get();

                        $totalDiscount = $promotions->sum('discount_percentage');
                        $totalProductPrice = $checkoutProduct->price * $checkoutProduct->quantity;
                        $discountAmount = $totalDiscount ? ($totalProductPrice * $totalDiscount / 100) : 0;
                        $subtotal = $totalProductPrice - $discountAmount;

                        return [
                            'product' => $checkoutProduct->product,
                            'quantity' => $checkoutProduct->quantity,
                            'price' => $checkoutProduct->price,
                            'total_product_price' => $totalProductPrice,
                            'discount_amount' => $discountAmount,
                            'subtotal' => $subtotal,
                            'promotions' => $promotions->toArray(),
                        ];
                    })->toArray();

                    $midtransPayload = $this->createMidtransPayload($newCheckout, $productDetails, Auth::user());
                    $snapToken = Snap::getSnapToken($midtransPayload);

                    $redirectUrl = config('midtrans.is_production')
                        ? "https://app.midtrans.com/snap/v4/redirection/{$snapToken}"
                        : "https://app.sandbox.midtrans.com/snap/v4/redirection/{$snapToken}";

                    $payment->update([
                        'snap_token' => $snapToken,
                        'redirect_url' => $redirectUrl,
                        'gross_amount' => $newCheckout->total_price,
                    ]);

                    Log::info('Midtrans Snap Token Generated for new checkout', [
                        'new_checkout_id' => $newCheckout->id,
                        'order_id' => $newCheckout->key,
                        'snap_token' => $snapToken,
                        'gross_amount' => $newCheckout->total_price,
                    ]);

                } catch (\Exception $e) {
                    DB::rollBack();
                    Log::error('Midtrans Snap Token Error for new checkout', [
                        'new_checkout_id' => $newCheckout->id,
                        'error' => $e->getMessage(),
                    ]);
                    throw new \Exception('Failed to create payment gateway token: ' . $e->getMessage());
                }
            }

            DB::commit();

            $newCheckout->load(['products.product', 'payment']);

            $responseData = $this->formatCheckoutResponse($newCheckout);
            $responseData['subtotal_before_referral'] = array_sum(array_column($productDetails, 'subtotal'));
            $responseData['referral_discount'] = $request->referral_discount ?? 0;

            if ($request->payment_method === 'midtrans') {
                $responseData['payment_gateway'] = [
                    'snap_token' => $snapToken,
                    'redirect_url' => $redirectUrl,
                    'is_production' => config('midtrans.is_production'),
                ];
            }

            return response()->json([
                'message' => 'New checkout created successfully from expired checkout',
                'data' => $responseData,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to recreate checkout from expired', [
                'checkout_key' => $checkoutKey,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to recreate checkout',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function paymentFinish(Request $request, $key)
{
    try {
        // Log untuk debugging
        Log::info('Payment finish callback', [
            'checkout_key' => $key,
            'request_params' => $request->all()
        ]);

        // Get order_id dari request (Midtrans mengirimkan ini)
        $orderId = $request->input('order_id');

        // Cari checkout berdasarkan key yang ada di URL
        $checkout = Checkout::with('payment')->where('key', $key)->first();

        if (!$checkout) {
            Log::error('Checkout not found in paymentFinish', [
                'checkout_key' => $key,
                'order_id' => $orderId
            ]);
            $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
            return redirect($frontendUrl);
        }

        // Check transaction status dengan Midtrans jika ada order_id
        if ($orderId && $checkout->payment) {
            try {
                $transactionStatus = Transaction::status($orderId);
                $this->syncPaymentStatusWithMidtrans($checkout, $checkout->payment, $transactionStatus);

                Log::info('Payment status synced from finish callback', [
                    'checkout_key' => $key,
                    'order_id' => $orderId,
                    'transaction_status' => $transactionStatus->transaction_status
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to check transaction status in finish callback', [
                    'error' => $e->getMessage()
                ]);
            }
        }

        // Redirect langsung ke frontend preview page
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
        return redirect("{$frontendUrl}/checkout/preview/{$key}");

    } catch (\Exception $e) {
        Log::error('Error in paymentFinish callback', [
            'checkout_key' => $key,
            'error' => $e->getMessage(),
            'request_params' => $request->all()
        ]);

        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
        return redirect($frontendUrl);
    }
}

public function paymentUnfinish(Request $request, $key)
{
    try {
        Log::info('Payment unfinish callback', [
            'checkout_key' => $key,
            'request_params' => $request->all()
        ]);

        $checkout = Checkout::with('payment')->where('key', $key)->first();

        if (!$checkout) {
            Log::error('Checkout not found in paymentUnfinish', [
                'checkout_key' => $key
            ]);
            $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
            return redirect($frontendUrl);
        }

        // Update status jika masih pending
        if ($checkout->payment && $checkout->payment->payment_status === 'pending') {
            $checkout->payment->update([
                'payment_status' => 'pending'
            ]);
        }

        // Redirect langsung ke frontend preview page
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
        return redirect("{$frontendUrl}/checkout/preview/{$key}");

    } catch (\Exception $e) {
        Log::error('Error in paymentUnfinish callback', [
            'checkout_key' => $key,
            'error' => $e->getMessage()
        ]);

        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
        return redirect($frontendUrl);
    }
}

public function paymentError(Request $request, $key)
{
    try {
        Log::warning('Payment error callback', [
            'checkout_key' => $key,
            'request_params' => $request->all()
        ]);

        $checkout = Checkout::with('payment')->where('key', $key)->first();

        if (!$checkout) {
            Log::error('Checkout not found in paymentError', [
                'checkout_key' => $key
            ]);
            $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
            return redirect($frontendUrl);
        }

        // Update status ke cancelled/failed
        if ($checkout->payment && $checkout->payment->payment_status === 'pending') {
            $checkout->payment->update([
                'payment_status' => 'cancelled',
                'expired_at' => now()
            ]);
        }

        // Redirect langsung ke frontend preview page
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
        return redirect("{$frontendUrl}/checkout/preview/{$key}");

    } catch (\Exception $e) {
        Log::error('Error in paymentError callback', [
            'checkout_key' => $key,
            'error' => $e->getMessage()
        ]);

        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
        return redirect($frontendUrl);
    }
}

// Jika Anda ingin mempertahankan API endpoint untuk fallback
public function paymentFinishApi(Request $request)
{
    try {
        $orderId = $request->input('order_id');
        $checkoutKey = $request->input('checkout_key');

        if (!$orderId && !$checkoutKey) {
            return response()->json([
                'success' => false,
                'message' => 'Missing order_id or checkout_key'
            ], 400);
        }

        // Find checkout
        $checkout = null;
        if ($checkoutKey) {
            $checkout = Checkout::with('payment')->where('key', $checkoutKey)->first();
        } else if ($orderId) {
            // Try to find by order_id in payment table
            $payment = CheckoutPayment::where('order_id', $orderId)->first();
            if ($payment) {
                $checkout = $payment->checkout;
            } else {
                // Fallback: try checkout key as order_id
                $checkout = Checkout::with('payment')->where('key', $orderId)->first();
            }
        }

        if (!$checkout) {
            return response()->json([
                'success' => false,
                'message' => 'Checkout not found'
            ], 404);
        }

        // Check and update payment status
        if ($orderId) {
            try {
                $transactionStatus = Transaction::status($orderId);
                $this->syncPaymentStatusWithMidtrans($checkout, $checkout->payment, $transactionStatus);
            } catch (\Exception $e) {
                Log::error('Failed to check transaction status', [
                    'error' => $e->getMessage()
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'redirect_url' => config('app.frontend_url', 'http://localhost:3000') . "/checkout/preview/{$checkout->key}",
            'checkout_key' => $checkout->key
        ]);

    } catch (\Exception $e) {
        Log::error('Error in paymentFinishApi', [
            'error' => $e->getMessage(),
            'request' => $request->all()
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Internal server error'
        ], 500);
    }
}
    private function processTransactionStatus($transactionStatus, $checkout, $payment)
    {
        $status = $transactionStatus->transaction_status;
        $fraudStatus = $transactionStatus->fraud_status ?? null;

        switch ($status) {
            case 'capture':
                if ($fraudStatus === 'challenge') {
                    $this->updatePaymentStatusFromMidtrans($checkout, $payment, 'challenge', $transactionStatus);
                    return ['type' => 'warning', 'message' => 'Pembayaran dalam peninjauan (challenge)'];
                } elseif ($fraudStatus === 'accept') {
                    $this->updatePaymentStatusFromMidtrans($checkout, $payment, 'paid', $transactionStatus);
                    return ['type' => 'success', 'message' => 'Pembayaran berhasil!'];
                } else {
                    // ✅ PERBAIKAN: Handle capture tanpa fraud status
                    $this->updatePaymentStatusFromMidtrans($checkout, $payment, 'paid', $transactionStatus);
                    return ['type' => 'success', 'message' => 'Pembayaran berhasil!'];
                }
                break;

            case 'settlement':
                $this->updatePaymentStatusFromMidtrans($checkout, $payment, 'paid', $transactionStatus);
                return ['type' => 'success', 'message' => 'Pembayaran berhasil!'];

            case 'pending':
                $this->updatePaymentStatusFromMidtrans($checkout, $payment, 'pending', $transactionStatus);
                return ['type' => 'info', 'message' => 'Pembayaran sedang diproses'];

            case 'deny':
            case 'cancel':
                $this->updatePaymentStatusFromMidtrans($checkout, $payment, 'cancelled', $transactionStatus);
                return ['type' => 'error', 'message' => 'Pembayaran gagal atau dibatalkan. Silakan coba lagi.'];

            case 'expire':
                $this->updatePaymentStatusFromMidtrans($checkout, $payment, 'expire', $transactionStatus);
                return ['type' => 'error', 'message' => 'Pembayaran telah kedaluwarsa. Silakan buat token pembayaran baru.'];

            case 'refund':
            case 'partial_refund':
                $this->updatePaymentStatusFromMidtrans($checkout, $payment, 'refunded', $transactionStatus);
                return ['type' => 'warning', 'message' => 'Pembayaran telah direfund'];

            default:
                Log::warning('Unknown transaction status in processTransactionStatus', [
                    'status' => $status,
                    'fraud_status' => $fraudStatus,
                    'checkout_key' => $checkout->key,
                ]);
                return ['type' => 'info', 'message' => 'Status pembayaran: ' . $status];
        }
    }

    public function delete($checkoutId)
    {
        try {
            DB::beginTransaction();

            $checkout = Checkout::where('id', $checkoutId)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            if ($checkout->status === 'completed') {
                return response()->json([
                    'message' => 'Cannot delete completed checkout'
                ], 400);
            }

            $payment = $checkout->payment;
            if ($payment && $payment->isMidtransPayment() && $payment->isPending()) {
                Log::info('Deleting checkout with pending Midtrans payment', [
                    'checkout_id' => $checkout->id,
                    'order_id' => $checkout->key,
                    'payment_status' => $payment->payment_status
                ]);
            }

            CheckoutProduct::where('checkout_id', $checkout->id)->delete();
            CheckoutPayment::where('checkout_id', $checkout->id)->delete();
            CheckoutPromotion::where('checkout_id', $checkout->id)->delete();

            $checkout->delete();

            DB::commit();

            return response()->json(['message' => 'Checkout deleted successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete checkout',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|uuid|exists:checkouts,id',
        ]);

        $ids = $request->input('ids');

        try {
            DB::beginTransaction();

            foreach ($ids as $checkoutId) {
                $checkout = Checkout::where('id', $checkoutId)
                    ->where('user_id', Auth::id())
                    ->firstOrFail();

                if ($checkout->status === 'completed') {
                    throw new \Exception("Cannot delete completed checkout with ID: {$checkout->id}");
                }

                $payment = $checkout->payment;
                if ($payment && $payment->isMidtransPayment() && $payment->isPending()) {
                    Log::info('Deleting checkout with pending Midtrans payment', [
                        'checkout_id' => $checkout->id,
                        'order_id' => $checkout->key,
                        'payment_status' => $payment->payment_status
                    ]);
                }

                CheckoutProduct::where('checkout_id', $checkout->id)->delete();
                CheckoutPayment::where('checkout_id', $checkout->id)->delete();
                CheckoutPromotion::where('checkout_id', $checkout->id)->delete();

                $checkout->delete();
            }

            DB::commit();

            return response()->json(['message' => 'Checkouts deleted successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete checkouts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function formatCurrencyForMidtrans($amount)
    {
        return (int) round($amount);
    }

    private function validateMidtransConfig()
    {
        $required = ['server_key', 'client_key', 'merchant_id'];

        foreach ($required as $key) {
            if (!config("midtrans.{$key}")) {
                throw new \Exception("Midtrans {$key} is not configured");
            }
        }
    }

    public function getPaymentMethods()
    {
        return response()->json([
            'payment_methods' => [
                [
                    'key' => 'credit_card',
                    'name' => 'Kartu Kredit',
                    'description' => 'Visa, MasterCard, JCB',
                    'icon' => 'credit_card',
                    'enabled' => true
                ],
                [
                    'key' => 'bank_transfer',
                    'name' => 'Transfer Bank',
                    'description' => 'Transfer ke rekening bank',
                    'icon' => 'account_balance',
                    'enabled' => true
                ],
                [
                    'key' => 'cash_on_delivery',
                    'name' => 'Bayar di Tempat',
                    'description' => 'Bayar saat barang tiba',
                    'icon' => 'payments',
                    'enabled' => true
                ],
                [
                    'key' => 'e_wallet',
                    'name' => 'E-Wallet',
                    'description' => 'OVO, GoPay, Dana',
                    'icon' => 'account_balance_wallet',
                    'enabled' => true
                ],
                [
                    'key' => 'midtrans',
                    'name' => 'Payment Gateway',
                    'description' => 'Semua metode pembayaran via Midtrans',
                    'icon' => 'payment',
                    'enabled' => config('midtrans.server_key') ? true : false
                ]
            ]
        ]);
    }

    public function regeneratePayment(Request $request, $checkoutKey)
    {
        try {
            // Validate the checkout key format (UUID)
            if (!Str::isUuid($checkoutKey)) {
                Log::warning('Invalid checkout key format', [
                    'checkout_key' => $checkoutKey,
                    'user_id' => Auth::id() ?: 'guest',
                    'ip_address' => $request->ip(),
                ]);
                return response()->json([
                    'message' => 'Invalid checkout key format',
                    'error' => 'Checkout key must be a valid UUID'
                ], 400);
            }

            // Ensure user is authenticated
            if (!Auth::check()) {
                Log::warning('Unauthenticated attempt to regenerate payment', [
                    'checkout_key' => $checkoutKey,
                    'ip_address' => $request->ip(),
                ]);
                return response()->json([
                    'message' => 'Unauthenticated',
                    'error' => 'You must be logged in to regenerate payment'
                ], 401);
            }

            // Fetch the checkout record
            $checkout = Checkout::with(['products.product', 'payment', 'user'])
                ->where('key', $checkoutKey)
                ->where('user_id', Auth::id())
                ->first();


            if (!$checkout) {
                Log::warning('Checkout record not found or unauthorized', [
                    'checkout_key' => $checkoutKey,
                    'user_id' => Auth::id(),
                    'request_data' => $request->all(),
                ]);
                return response()->json([
                    'message' => 'Checkout not found',
                    'error' => 'The specified checkout does not exist or you are not authorized to access it'
                ], 404);
            }


            $payment = $checkout->payment;

            if (!$payment) {
                Log::warning('Payment record not found for checkout', [
                    'checkout_key' => $checkoutKey,
                    'user_id' => Auth::id(),
                ]);
                return response()->json([
                    'message' => 'Payment record not found',
                    'error' => 'No payment record associated with this checkout'
                ], 404);
            }

            // Validate request payload
            $validator = Validator::make($request->all(), [
                'total_price' => 'required|numeric|min:0',
                'payment_method' => 'required|in:midtrans',
                'referral_code' => 'nullable|string|exists:tb_product_promotion,referral_code',
                'referral_discount' => 'nullable|numeric|min:0|max:100',
                'referral_promotion_id' => 'nullable|exists:tb_product_promotion,id',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for regenerate payment', [
                    'checkout_key' => $checkoutKey,
                    'user_id' => Auth::id(),
                    'errors' => $validator->errors()->toArray(),
                ]);
                return response()->json([
                    'message' => 'Kode Promo sudah expired!',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if checkout is already completed
            if ($checkout->status === 'completed') {
                Log::info('Attempt to regenerate payment for completed checkout', [
                    'checkout_key' => $checkoutKey,
                    'checkout_status' => $checkout->status,
                ]);
                return response()->json([
                    'message' => 'Checkout is already completed',
                    'current_status' => $checkout->status
                ], 400);
            }

            // Store old order_id for cancellation
            $oldOrderId = $payment->order_id;

            // Check current payment status with Midtrans if it's a Midtrans payment
            $actualPaymentStatus = $payment->payment_status;
            $isExpired = false;

            if ($payment->payment_method === 'midtrans' && $payment->order_id) {
                try {
                    $transactionStatus = Transaction::status($payment->order_id);
                    $actualPaymentStatus = $transactionStatus->transaction_status;

                    // Update payment status if different
                    if ($actualPaymentStatus !== $payment->payment_status) {
                        $this->syncPaymentStatusWithMidtrans($checkout, $payment, $transactionStatus);
                    }

                    // Check if transaction is expired or can be regenerated
                    $isExpired = in_array($actualPaymentStatus, ['expire', 'cancel', 'deny', 'failure']);

                    // If transaction is still active, return existing token
                    if (in_array($actualPaymentStatus, ['pending', 'challenge']) && $payment->snap_token) {
                        Log::info('Existing Midtrans transaction is still active', [
                            'checkout_key' => $checkoutKey,
                            'order_id' => $payment->order_id,
                            'transaction_status' => $actualPaymentStatus,
                        ]);

                        return response()->json([
                            'message' => 'Payment is still active',
                            'data' => [
                                'snap_token' => $payment->snap_token,
                                'redirect_url' => $payment->redirect_url,
                                'is_production' => config('midtrans.is_production'),
                                'order_id' => $payment->order_id,
                                'payment_status' => $actualPaymentStatus,
                            ]
                        ], 200);
                    }

                    // If payment is settled, prevent regeneration
                    if ($actualPaymentStatus === 'settlement') {
                        return response()->json([
                            'message' => 'Payment has been completed',
                            'current_status' => $actualPaymentStatus
                        ], 400);
                    }

                } catch (\Exception $e) {
                    // If transaction not found, it's likely expired
                    if (strpos($e->getMessage(), 'Transaction doesn\'t exist') !== false ||
                        strpos($e->getMessage(), '404') !== false) {
                        $isExpired = true;
                        Log::info('Midtrans transaction not found, treating as expired', [
                            'checkout_key' => $checkoutKey,
                            'order_id' => $payment->order_id,
                            'error' => $e->getMessage(),
                        ]);
                    } else {
                        // Other errors, log and continue
                        Log::error('Failed to check Midtrans transaction status', [
                            'checkout_key' => $checkoutKey,
                            'order_id' => $payment->order_id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }

            // Check if payment can be regenerated based on status
            $canRegenerate = in_array($payment->payment_status, ['cancelled', 'failed', 'cancel', 'expire', 'deny']) ||
                            $isExpired ||
                            ($payment->payment_status === 'pending' && $payment->payment_method === 'midtrans');

            if (!$canRegenerate) {
                Log::info('Payment cannot be regenerated due to current status', [
                    'checkout_key' => $checkoutKey,
                    'payment_status' => $payment->payment_status,
                    'actual_status' => $actualPaymentStatus,
                ]);
                return response()->json([
                    'message' => 'Payment cannot be regenerated',
                    'current_status' => $payment->payment_status
                ], 400);
            }

            // ✅ CANCEL PREVIOUS MIDTRANS TRANSACTION IF EXISTS AND ACTIVE
            if ($oldOrderId && !$isExpired) {
                try {
                    $transactionStatus = Transaction::status($oldOrderId);

                    if (in_array($transactionStatus->transaction_status, ['pending', 'challenge'])) {
                        // Cancel the previous transaction
                        Transaction::cancel($oldOrderId);

                        Log::info('Previous Midtrans transaction cancelled during regeneration', [
                            'checkout_id' => $checkout->id,
                            'cancelled_order_id' => $oldOrderId,
                            'previous_status' => $transactionStatus->transaction_status,
                        ]);
                    }
                } catch (\Exception $e) {
                    // If transaction not found or already expired, continue
                    Log::info('Previous transaction not found or already expired during regeneration', [
                        'checkout_id' => $checkout->id,
                        'old_order_id' => $oldOrderId,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Verify total price
            $productDetails = $checkout->products->map(function ($checkoutProduct) {
                if (!$checkoutProduct->product) {
                    throw new \Exception("Product with ID {$checkoutProduct->product_id} no longer exists");
                }
                if (!$checkoutProduct->product->status) {
                    throw new \Exception("Product '{$checkoutProduct->product->name}' is not available for purchase");
                }

                $promotions = CheckoutPromotion::where('checkout_id', $checkoutProduct->checkout_id)
                    ->where('type', 'product')
                    ->where('title', 'like', "%(Product ID: {$checkoutProduct->product_id})%")
                    ->get();

                $totalDiscount = $promotions->sum('discount_percentage');
                $totalProductPrice = $checkoutProduct->price * $checkoutProduct->quantity;
                $discountAmount = $totalDiscount ? ($totalProductPrice * $totalDiscount / 100) : 0;
                $subtotal = $totalProductPrice - $discountAmount;

                return [
                    'product' => $checkoutProduct->product,
                    'quantity' => $checkoutProduct->quantity,
                    'price' => $checkoutProduct->price,
                    'total_product_price' => $totalProductPrice,
                    'discount_amount' => $discountAmount,
                    'subtotal' => $subtotal,
                    'product_discount' => $totalDiscount,
                    'promotions' => $promotions->toArray(),
                ];
            })->toArray();

            $calculatedTotal = array_sum(array_column($productDetails, 'subtotal'));
            $referralPromotion = CheckoutPromotion::where('checkout_id', $checkout->id)
                ->where('type', 'voucher')
                ->first();
            $finalTotal = $referralPromotion ? $calculatedTotal * (1 - ($referralPromotion->discount_percentage / 100)) : $calculatedTotal;

            if (abs($finalTotal - $request->total_price) >= 0.01) {
                Log::error('Total price mismatch during payment regeneration', [
                    'checkout_key' => $checkoutKey,
                    'user_id' => Auth::id(),
                    'calculated_total' => $finalTotal,
                    'provided_total' => $request->total_price,
                    'difference' => abs($finalTotal - $request->total_price),
                ]);
                return response()->json([
                    'message' => 'Total price mismatch',
                    'errors' => [
                        'total_price' => [
                            'Calculated total (' . number_format($finalTotal, 2) . ') does not match provided total (' . number_format($request->total_price, 2) . ')'
                        ]
                    ]
                ], 422);
            }

            // Proceed with payment regeneration
            DB::beginTransaction();

            try {
                // Generate new order_id with timestamp
                $newOrderId = 'yz-' . time() . '-' . Str::random(6);

                // Create Midtrans payload
                $midtransPayload = $this->createMidtransPayload($checkout, $productDetails, $checkout->user);
                $midtransPayload['transaction_details']['order_id'] = $newOrderId;

                // Generate new snap token
                $snapToken = Snap::getSnapToken($midtransPayload);

                $redirectUrl = config('midtrans.is_production')
                    ? "https://app.midtrans.com/snap/v4/redirection/{$snapToken}"
                    : "https://app.sandbox.midtrans.com/snap/v4/redirection/{$snapToken}";

                // Update payment record
                $payment->update([
                    'payment_status' => 'pending',
                    'snap_token' => $snapToken,
                    'redirect_url' => $redirectUrl,
                    'paid_at' => null,
                    'expired_at' => null,
                    'transaction_id' => null,
                    'transaction_time' => null,
                    'payment_type' => null,
                    'order_id' => $newOrderId,
                    'gross_amount' => $this->formatCurrencyForMidtrans($checkout->total_price),
                    'midtrans_response' => null,
                ]);

                // Update checkout status if needed
                if ($checkout->status === 'cancelled') {
                    $checkout->update(['status' => 'pending']);
                }

                Log::info('Payment regenerated successfully', [
                    'checkout_id' => $checkout->id,
                    'checkout_key' => $checkoutKey,
                    'old_order_id' => $oldOrderId,
                    'new_order_id' => $newOrderId,
                    'snap_token' => $snapToken,
                    'gross_amount' => $checkout->total_price,
                    'previous_transaction_cancelled' => $oldOrderId,
                ]);

                DB::commit();

                // Load fresh data
                $checkout->load(['products.product', 'payment']);
                $responseData = $this->formatCheckoutResponse($checkout);

                return response()->json([
                    'status' => 'regenerated',
                    'message' => 'Payment token regenerated successfully',
                    'data' => [
                        'snap_token' => $snapToken,
                        'redirect_url' => $redirectUrl,
                        'is_production' => config('midtrans.is_production'),
                        'checkout_key' => $checkout->key,
                        'order_id' => $newOrderId,
                        'payment_status' => 'pending',
                        'gross_amount' => $checkout->total_price,
                        'payment_gateway' => [
                            'snap_token' => $snapToken,
                            'redirect_url' => $redirectUrl,
                            'is_production' => config('midtrans.is_production'),
                            'order_id' => $newOrderId,
                        ],
                    ]
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Failed to regenerate payment', [
                    'checkout_id' => $checkout->id,
                    'checkout_key' => $checkoutKey,
                    'user_id' => $checkout->user_id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);

                return response()->json([
                    'message' => 'Failed to regenerate payment',
                    'error' => $e->getMessage()
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Failed to regenerate payment - outer exception', [
                'checkout_key' => $checkoutKey,
                'user_id' => Auth::id() ?: 'guest',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to regenerate payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function checkAndRegenerateIfExpired($checkoutKey)
    {
        try {
            $checkout = Checkout::with(['payment', 'products.product', 'user'])
                ->where('key', $checkoutKey)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            $payment = $checkout->payment;

            if ($payment->payment_method === 'midtrans') {
                try {
                    $transactionStatus = Transaction::status($checkoutKey);

                    if ($transactionStatus->transaction_status === 'expire') {
                        // Option 1: Create a new checkout
                        $newCheckoutData = [
                            'product_ids' => $checkout->products->pluck('product_id')->toArray(),
                            'quantity' => $checkout->products->pluck('quantity')->toArray(),
                            'payment_method' => 'midtrans',
                            'total_price' => $checkout->total_price,
                            'referral_code' => CheckoutPromotion::where('checkout_id', $checkout->id)
                                ->where('type', 'voucher')
                                ->value('referral_code'),
                            'referral_discount' => CheckoutPromotion::where('checkout_id', $checkout->id)
                                ->where('type', 'voucher')
                                ->value('discount_percentage'),
                            'referral_promotion_id' => $checkout->promotion_id,
                        ];
                        $createRequest = new Request($newCheckoutData);
                        if ($checkout->promotion_id) {
                             $exist = ProductPromotion::where('id', $checkout->promotion_id)
                            ->where('referral_code' , '!=', null)
                            ->where('status', 1)
                            ->where(function ($q) {
                                $q->whereNull('expired')->orWhere('expired', '>', now());
                            })
                            ->first();
                            if(!$exist)
                            {
                            return response()->json([
                                    'status' => 404,
                                    'message' => 'Kode promo tidak ditemukan!'
                                ], 404);
                            }
                        }
                            return $this->recreateFromExpired($createRequest, $checkoutKey);

                        // Option 2: Use autoRegeneratePayment with new order_id
                        // return $this->autoRegeneratePayment($checkout);
                    }

                    return response()->json([
                        'status' => 'active',
                        'payment_status' => $transactionStatus->transaction_status,
                        'message' => 'Payment is still active'
                    ]);

                } catch (\Exception $e) {
                    if (strpos($e->getMessage(), 'Transaction doesn\'t exist') !== false ||
                        strpos($e->getMessage(), '404') !== false) {
                        $this->updatePaymentStatusFromMidtrans($checkout, $payment, 'cancelled', null);
                        // Option 1: Create a new checkout
                        $newCheckoutData = [
                            'product_ids' => $checkout->products->pluck('product_id')->toArray(),
                            'quantity' => $checkout->products->pluck('quantity')->toArray(),
                            'payment_method' => 'midtrans',
                            'total_price' => $checkout->total_price,
                            'referral_code' => CheckoutPromotion::where('checkout_id', $checkout->id)
                                ->where('type', 'voucher')
                                ->value('referral_code'),
                            'referral_discount' => CheckoutPromotion::where('checkout_id', $checkout->id)
                                ->where('type', 'voucher')
                                ->value('discount_percentage'),
                            'referral_promotion_id' => $checkout->promotion_id,
                        ];
                        $createRequest = new Request($newCheckoutData);
                        return $this->recreateFromExpired($createRequest, $checkoutKey);

                        // Option 2: Use autoRegeneratePayment with new order_id
                        // return $this->autoRegeneratePayment($checkout);
                    }
                    throw $e;
                }
            }

            return response()->json([
                'status' => 'not_midtrans',
                'payment_method' => $payment->payment_method,
                'message' => 'Not a Midtrans payment'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to check and regenerate payment', [
                'checkout_key' => $checkoutKey,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to check payment status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function autoRegeneratePayment($checkout)
{
    try {
        DB::beginTransaction();

        // Verify product availability
        $productDetails = $checkout->products->map(function ($checkoutProduct) {
            if (!$checkoutProduct->product) {
                throw new \Exception("Product with ID {$checkoutProduct->product_id} no longer exists");
            }
            if (!$checkoutProduct->product->status) {
                throw new \Exception("Product '{$checkoutProduct->product->name}' is not available for purchase");
            }

            $promotions = CheckoutPromotion::where('checkout_id', $checkoutProduct->checkout_id)
                ->where('type', 'product')
                ->where('title', 'like', "%(Product ID: {$checkoutProduct->product_id})%")
                ->get();

            $totalDiscount = $promotions->sum('discount_percentage');
            $totalProductPrice = $checkoutProduct->price * $checkoutProduct->quantity;
            $discountAmount = $totalDiscount ? ($totalProductPrice * $totalDiscount / 100) : 0;
            $subtotal = $totalProductPrice - $discountAmount;

            return [
                'product' => $checkoutProduct->product,
                'quantity' => $checkoutProduct->quantity,
                'price' => $checkoutProduct->price,
                'total_product_price' => $totalProductPrice,
                'discount_amount' => $discountAmount,
                'subtotal' => $subtotal,
                'product_discount' => $totalDiscount,
                'promotions' => $promotions->toArray(),
            ];
        })->toArray();

        // Validate total price
        $calculatedTotal = array_sum(array_column($productDetails, 'subtotal'));
        $referralPromotion = CheckoutPromotion::where('checkout_id', $checkout->id)
            ->where('type', 'voucher')
            ->first();
        $finalTotal = $referralPromotion ? $calculatedTotal * (1 - $referralPromotion->discount_percentage / 100) : $calculatedTotal;

        if (abs($finalTotal - $checkout->total_price) >= 0.01) {
            Log::error('Total price mismatch during payment regeneration', [
                'checkout_id' => $checkout->id,
                'calculated_total' => $finalTotal,
                'stored_total' => $checkout->total_price,
                'difference' => abs($finalTotal - $checkout->total_price),
            ]);
            throw new \Exception('Total price mismatch during regeneration');
        }

        // Generate new order_id
        $newOrderId = $checkout->key . '-' . time();
        $midtransPayload = $this->createMidtransPayload($checkout, $productDetails, $checkout->user);
        $midtransPayload['transaction_details']['order_id'] = $newOrderId;

        // Generate new snap token
        $snapToken = Snap::getSnapToken($midtransPayload);

           $redirectUrl = config('midtrans.is_production')
            ? "https://app.midtrans.com/snap/v4/redirection/{$snapToken}"
            : "https://app.sandbox.midtrans.com/snap/v4/redirection/{$snapToken}";

        // Update payment record
        $checkout->payment->update([
            'payment_status' => 'pending',
            'snap_token' => $snapToken,
            'redirect_url' => $redirectUrl,
            'paid_at' => null,
            'expired_at' => null,
            'transaction_id' => null,
            'transaction_time' => null,
            'order_id' => $newOrderId,
            'gross_amount' => $this->formatCurrencyForMidtrans($checkout->total_price),
            'midtrans_response' => null,
        ]);

        // Update checkout status
        $checkout->update(['status' => 'pending']);

        Log::info('Payment auto-regenerated successfully', [
            'checkout_id' => $checkout->id,
            'order_id' => $newOrderId,
            'snap_token' => $snapToken,
            'gross_amount' => $checkout->total_price,
        ]);

        DB::commit();

        return response()->json([
            'status' => 'regenerated',
            'message' => 'Payment token regenerated successfully',
            'data' => [
                'snap_token' => $snapToken,
                'redirect_url' => $redirectUrl,
                'is_production' => config('midtrans.is_production'),
                'checkout_key' => $checkout->key,
                'order_id' => $newOrderId,
                'payment_status' => 'pending',
                'gross_amount' => $checkout->total_price,
            ]
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Failed to auto-regenerate payment', [
            'checkout_id' => $checkout->id,
            'checkout_key' => $checkout->key,
            'user_id' => $checkout->user_id,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
        throw $e;
    }
}



    // Add this helper method to map payment statuses
    private function mapPaymentStatus($status)
    {
        $statusMap = [
            'paid' => 'settlement',
            'settlement' => 'settlement',
            'cancelled' => 'cancelled',
            'cancel' => 'cancelled',
            'expire' => 'cancelled',
            'deny' => 'cancelled',
            'failed' => 'failed',
            'pending' => 'pending',
            'challenge' => 'challenge',
            'refunded' => 'refunded',
            'unpaid' => 'unpaid',
        ];

        return $statusMap[$status] ?? $status;
    }

    // Add this helper method to determine checkout status
    private function determineCheckoutStatus($paymentStatus, $currentCheckoutStatus)
    {
        // If already completed, keep it completed unless refunded
        if ($currentCheckoutStatus === 'completed' && $paymentStatus !== 'refunded') {
            return 'completed';
        }

        switch ($paymentStatus) {
            case 'settlement':
            case 'paid':
                return 'completed';

            case 'cancelled':
            case 'failed':
            case 'deny':
            case 'expire':
            case 'refunded':
                return 'cancelled';

            case 'pending':
            case 'challenge':
            case 'unpaid':
            default:
                return 'pending';
        }
    }

   private function syncPaymentStatusWithMidtrans($checkout, $payment, $transactionStatus)
    {
        $status = $transactionStatus->transaction_status;
        $fraudStatus = $transactionStatus->fraud_status ?? null;

        // ✅ PERBAIKAN: Map status Midtrans ke status database yang benar
        $mappedStatus = $this->mapMidtransStatusToDatabase($status, $fraudStatus);

        // Hanya perbarui payment_type untuk status transaksi yang valid
        $validStatuses = ['pending', 'settlement', 'capture', 'challenge'];
        $paymentData = [
            'payment_status' => $mappedStatus, // ✅ Gunakan mapped status
        ];

        if (in_array($status, $validStatuses)) {
            $paymentData['payment_type'] = $transactionStatus->payment_type ?? $payment->payment_type;
            $paymentData['transaction_id'] = $transactionStatus->transaction_id ?? $payment->transaction_id;
            $paymentData['gross_amount'] = $transactionStatus->gross_amount ?? $payment->gross_amount;
            if (isset($transactionStatus->transaction_time)) {
                $paymentData['transaction_time'] = \Carbon\Carbon::parse($transactionStatus->transaction_time);
            }
            $paymentData['fraud_status'] = $transactionStatus->fraud_status ?? null;
            $paymentData['midtrans_response'] = json_encode((array) $transactionStatus);
        } else {
            Log::info('Skipping payment_type update in syncPaymentStatusWithMidtrans', [
                'checkout_key' => $checkout->key,
                'transaction_status' => $status,
                'mapped_status' => $mappedStatus,
                'existing_payment_type' => $payment->payment_type,
            ]);
            $paymentData['payment_type'] = $payment->payment_type;
        }

        // Status-specific handling berdasarkan mapped status
        if (in_array($mappedStatus, ['settlement', 'paid', 'capture'])) {
            $paymentData['paid_at'] = now();
            $checkout->update(['status' => 'completed']);
        } elseif ($mappedStatus === 'expire') {
            $paymentData['expired_at'] = now();
            if ($paymentData['payment_type'] !== null) {
                $checkout->update(['status' => 'cancelled']);
            } else {
                if ($checkout->status !== 'completed') {
                    $checkout->update(['status' => 'pending']);
                }
            }
        } elseif (in_array($mappedStatus, ['cancelled', 'failed', 'deny', 'cancel'])) {
            $paymentData['expired_at'] = now();
            if ($checkout->status !== 'completed') {
                $checkout->update(['status' => 'pending']);
            }
        } elseif ($mappedStatus === 'refunded' || $mappedStatus === 'partial_refund') {
            $checkout->update(['status' => 'cancelled']);
        }

        $payment->update($paymentData);

        Log::info('Payment status synced with Midtrans', [
            'checkout_id' => $checkout->id,
            'order_id' => $checkout->key,
            'midtrans_status' => $status,
            'mapped_status' => $mappedStatus,
            'checkout_status' => $checkout->fresh()->status,
            'transaction_id' => $paymentData['transaction_id'] ?? null,
            'payment_type' => $paymentData['payment_type'] ?? null,
        ]);
    }
    public function updatePaymentStatus(Request $request, $checkoutId)
    {
        $validator = Validator::make($request->all(), [
            'payment_status' => 'required|in:paid,cancelled,unpaid,pending,failed,challenge,refunded,settlement,expire,deny',
            'payment_method' => 'nullable|in:credit_card,bank_transfer,cash_on_delivery,e_wallet,midtrans', // Changed to nullable
            'transaction_id' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $checkout = Checkout::with(['payment', 'products.product', 'user'])
                ->where('id', $checkoutId)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            $payment = $checkout->payment;

            if (!$payment) {
                return response()->json([
                    'message' => 'Payment record not found'
                ], 404);
            }

            // Map the provided payment status
            $mappedStatus = $this->mapPaymentStatus($request->payment_status);

            // Determine the checkout status
            $checkoutStatus = $this->determineCheckoutStatus($mappedStatus, $checkout->status);

            // Prepare payment data for update - ONLY include payment_status initially
            $paymentData = [
                'payment_status' => $mappedStatus,
                'transaction_id' => $request->transaction_id,
            ];

            // Determine if payment method is changing
            $isPaymentMethodChanging = $request->has('payment_method') &&
                                    $request->payment_method &&
                                    $request->payment_method !== $payment->payment_method;

            // Only process payment method change if explicitly provided and different
            if ($isPaymentMethodChanging) {
                $paymentData['payment_method'] = $request->payment_method;

                // Handle changing TO Midtrans
                if ($request->payment_method === 'midtrans') {
                    $newOrderId = 'yz-' . time() . '-' . Str::random(6);

                    $productDetails = $checkout->products->map(function ($checkoutProduct) {
                        $promotions = CheckoutPromotion::where('checkout_id', $checkoutProduct->checkout_id)
                            ->where('type', 'product')
                            ->where('title', 'like', "%(Product ID: {$checkoutProduct->product_id})%")
                            ->get();

                        $totalDiscount = $promotions->sum('discount_percentage');
                        $totalProductPrice = $checkoutProduct->price * $checkoutProduct->quantity;
                        $discountAmount = $totalDiscount ? ($totalProductPrice * $totalDiscount / 100) : 0;
                        $subtotal = $totalProductPrice - $discountAmount;

                        return [
                            'product' => $checkoutProduct->product,
                            'quantity' => $checkoutProduct->quantity,
                            'price' => $checkoutProduct->price,
                            'total_product_price' => $totalProductPrice,
                            'discount_amount' => $discountAmount,
                            'subtotal' => $subtotal,
                            'promotions' => $promotions->toArray(),
                        ];
                    })->toArray();

                    $midtransPayload = $this->createMidtransPayload($checkout, $productDetails, $checkout->user);
                    $midtransPayload['transaction_details']['order_id'] = $newOrderId;

                    try {
                        $snapToken = Snap::getSnapToken($midtransPayload);
                        $redirectUrl = config('midtrans.is_production')
                            ? "https://app.midtrans.com/snap/v4/redirection/{$snapToken}"
                            : "https://app.sandbox.midtrans.com/snap/v4/redirection/{$snapToken}";

                        $paymentData['snap_token'] = $snapToken;
                        $paymentData['redirect_url'] = $redirectUrl;
                        $paymentData['order_id'] = $newOrderId;
                        $paymentData['gross_amount'] = $this->formatCurrencyForMidtrans($checkout->total_price);
                        $paymentData['payment_type'] = null; // Reset payment type for new transaction

                        Log::info('Generated new Midtrans snap token for payment method change', [
                            'checkout_id' => $checkout->id,
                            'order_id' => $newOrderId,
                            'snap_token' => $snapToken,
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Midtrans snap token generation failed', [
                            'checkout_id' => $checkout->id,
                            'order_id' => $newOrderId,
                            'error' => $e->getMessage(),
                        ]);
                        throw new \Exception('Failed to create payment gateway token: ' . $e->getMessage());
                    }
                } elseif ($payment->payment_method === 'midtrans') {
                    // Changing FROM Midtrans to other method - clear Midtrans fields
                    $paymentData['snap_token'] = null;
                    $paymentData['redirect_url'] = null;
                    $paymentData['order_id'] = null;
                    $paymentData['gross_amount'] = null;
                    $paymentData['transaction_time'] = null;
                    $paymentData['midtrans_response'] = null;
                    $paymentData['payment_type'] = null;
                }
            } else {
                // NOT changing payment method - handle status update for existing Midtrans payments
                if ($payment->payment_method === 'midtrans' &&
                    $payment->snap_token &&
                    $mappedStatus === 'expire') {
                    // For expired Midtrans payments, might need to regenerate token
                    // But this should be handled by regeneratePayment endpoint instead
                    Log::info('Midtrans payment expired, use regeneratePayment endpoint for new token', [
                        'checkout_id' => $checkout->id,
                        'order_id' => $payment->order_id,
                    ]);
                }
            }

            // Update payment status and related timestamp fields
            if ($mappedStatus === 'settlement' || $mappedStatus === 'paid') {
                $paymentData['paid_at'] = now();
            } elseif (in_array($mappedStatus, ['cancelled', 'failed', 'expire', 'deny'])) {
                $paymentData['expired_at'] = now();
                $paymentData['paid_at'] = null;
            } elseif ($mappedStatus === 'pending' || $mappedStatus === 'challenge') {
                $paymentData['expired_at'] = null;
                $paymentData['paid_at'] = null;
            }

            // Update payment record
            $payment->update($paymentData);

            // Update checkout status
            $checkout->update(['status' => $checkoutStatus]);

            Log::info('Payment status updated', [
                'checkout_id' => $checkout->id,
                'order_id' => $payment->order_id ?? $checkout->key,
                'payment_status' => $mappedStatus,
                'checkout_status' => $checkoutStatus,
                'payment_method_changed' => $isPaymentMethodChanging,
                'current_payment_method' => $payment->fresh()->payment_method,
            ]);

            DB::commit();

            // Get fresh data for response
            $checkout->refresh();
            $responseData = $this->formatCheckoutResponse($checkout);

            // Include payment gateway info if new Midtrans token was generated
            if ($isPaymentMethodChanging &&
                $request->payment_method === 'midtrans' &&
                isset($snapToken)) {
                $responseData['payment_gateway'] = [
                    'snap_token' => $snapToken,
                    'redirect_url' => $redirectUrl,
                    'is_production' => config('midtrans.is_production'),
                    'order_id' => $newOrderId,
                ];
            }

            return response()->json([
                'message' => 'Payment status updated successfully',
                'data' => $responseData,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update payment status', [
                'checkout_id' => $checkoutId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Failed to update payment status',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function changePaymentMethod(Request $request, $key)
    {
        $validator = Validator::make($request->all(), [
            'payment_method' => 'required|in:credit_card,bank_transfer,cash_on_delivery,e_wallet,midtrans',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Fetch the checkout record
            $checkout = Checkout::with(['payment', 'products.product', 'user'])
                ->where('key', $key)
                ->where('user_id', Auth::id())
                ->first();

            if (!$checkout) {
                Log::warning('Checkout not found or unauthorized', [
                    'checkout_key' => $key,
                    'user_id' => Auth::id(),
                    'request_data' => $request->all(),
                ]);
                return response()->json([
                    'message' => 'Checkout not found',
                    'error' => 'The specified checkout does not exist or you are not authorized to access it'
                ], 404);
            }
            if($checkout->promotion_id){

                $exist = ProductPromotion::where('id', $checkout->promotion_id)
                ->where('referral_code' , '!=', null)
                ->where('status', 1)
                ->where(function ($q) {
                    $q->whereNull('expired')->orWhere('expired', '>', now());
                })
                ->first();
                if (!$exist) {
                    return response()->json([
                        'status' => 404,
                        'message' => 'Kode promo sudah expired!'
                    ], 404);
                }
            }
            $payment = $checkout->payment;

            if (!$payment) {
                Log::warning('Payment record not found for checkout', [
                    'checkout_key' => $key,
                    'user_id' => Auth::id(),
                ]);
                return response()->json([
                    'message' => 'Payment record not found',
                    'error' => 'No payment record associated with this checkout'
                ], 404);
            }

            // Prevent changes if payment is already completed
            if ($payment->payment_status === 'paid' || $payment->payment_status === 'settlement') {
                Log::info('Attempt to change payment method for completed payment', [
                    'checkout_key' => $key,
                    'payment_status' => $payment->payment_status,
                ]);
                return response()->json([
                    'message' => 'Cannot change payment method for a completed payment',
                    'current_status' => $payment->payment_status
                ], 400);
            }

            // Prevent changes if checkout is completed
            if ($checkout->status === 'completed') {
                Log::info('Attempt to change payment method for completed checkout', [
                    'checkout_key' => $key,
                    'checkout_status' => $checkout->status,
                ]);
                return response()->json([
                    'message' => 'Cannot change payment method for a completed checkout',
                    'current_status' => $checkout->status
                ], 400);
            }

            $newPaymentMethod = $request->payment_method;
            $oldPaymentMethod = $payment->payment_method;
            $oldOrderId = $payment->order_id;

            // ✅ CANCEL PREVIOUS MIDTRANS TRANSACTION IF EXISTS
            if ($oldPaymentMethod === 'midtrans' && $oldOrderId && $payment->snap_token) {
                try {
                    // Check if transaction exists and is active
                    $transactionStatus = Transaction::status($oldOrderId);

                    if (in_array($transactionStatus->transaction_status, ['pending', 'challenge'])) {
                        // Cancel the previous transaction
                        Transaction::cancel($oldOrderId);

                        Log::info('Previous Midtrans transaction cancelled', [
                            'checkout_id' => $checkout->id,
                            'cancelled_order_id' => $oldOrderId,
                            'previous_status' => $transactionStatus->transaction_status,
                        ]);
                    }
                } catch (\Exception $e) {
                    // If transaction not found or already expired, continue
                    Log::info('Previous transaction not found or already expired', [
                        'checkout_id' => $checkout->id,
                        'old_order_id' => $oldOrderId,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            $paymentData = [
                'payment_method' => $newPaymentMethod,
                'payment_status' => $newPaymentMethod === 'midtrans' ? 'pending' : 'unpaid',
            ];

            // Handle Midtrans payment method
            if ($newPaymentMethod === 'midtrans') {
                // Always generate new order_id with timestamp
                $newOrderId = 'yz-' . time() . '-' . Str::random(6);

                Log::info('Generating new Midtrans token for payment method change', [
                    'checkout_id' => $checkout->id,
                    'old_payment_method' => $oldPaymentMethod,
                    'new_payment_method' => $newPaymentMethod,
                    'old_order_id' => $oldOrderId,
                    'new_order_id' => $newOrderId,
                    'reason' => 'Reset payment type and generate fresh transaction',
                ]);

                // Prepare product details for Midtrans
                $productDetails = $checkout->products->map(function ($checkoutProduct) {
                    $promotions = CheckoutPromotion::where('checkout_id', $checkoutProduct->checkout_id)
                        ->where('type', 'product')
                        ->where('title', 'like', "%(Product ID: {$checkoutProduct->product_id})%")
                        ->get();

                    $totalDiscount = $promotions->sum('discount_percentage');
                    $totalProductPrice = $checkoutProduct->price * $checkoutProduct->quantity;
                    $discountAmount = $totalDiscount ? ($totalProductPrice * $totalDiscount / 100) : 0;
                    $subtotal = $totalProductPrice - $discountAmount;

                    return [
                        'product' => $checkoutProduct->product,
                        'quantity' => $checkoutProduct->quantity,
                        'price' => $checkoutProduct->price,
                        'total_product_price' => $totalProductPrice,
                        'discount_amount' => $discountAmount,
                        'subtotal' => $subtotal,
                        'promotions' => $promotions->toArray(),
                    ];
                })->toArray();

                $midtransPayload = $this->createMidtransPayload($checkout, $productDetails, $checkout->user);
                $midtransPayload['transaction_details']['order_id'] = $newOrderId;

                try {
                    $snapToken = Snap::getSnapToken($midtransPayload);

                    $redirectUrl = config('midtrans.is_production')
                        ? "https://app.midtrans.com/snap/v4/redirection/{$snapToken}"
                        : "https://app.sandbox.midtrans.com/snap/v4/redirection/{$snapToken}";


                    // Reset all payment fields for new transaction
                    $paymentData['snap_token'] = $snapToken;
                    $paymentData['redirect_url'] = $redirectUrl;
                    $paymentData['order_id'] = $newOrderId;
                    $paymentData['gross_amount'] = $this->formatCurrencyForMidtrans($checkout->total_price);
                    $paymentData['transaction_id'] = null;
                    $paymentData['transaction_time'] = null;
                    $paymentData['midtrans_response'] = null;
                    $paymentData['paid_at'] = null;
                    $paymentData['expired_at'] = null;
                    $paymentData['payment_type'] = null; // Reset payment type

                    Log::info('Generated new Midtrans snap token for payment method change', [
                        'checkout_id' => $checkout->id,
                        'order_id' => $newOrderId,
                        'snap_token' => $snapToken,
                        'from_method' => $oldPaymentMethod,
                        'to_method' => $newPaymentMethod,
                        'previous_order_cancelled' => $oldOrderId,
                    ]);
                } catch (\Exception $e) {
                    Log::error('Midtrans snap token generation failed', [
                        'checkout_id' => $checkout->id,
                        'order_id' => $newOrderId,
                        'error' => $e->getMessage(),
                    ]);
                    throw new \Exception('Failed to create payment gateway token: ' . $e->getMessage());
                }
            } else {
                // Non-Midtrans payment method, clear Midtrans-specific fields
                $paymentData['snap_token'] = null;
                $paymentData['redirect_url'] = null;
                $paymentData['order_id'] = null;
                $paymentData['gross_amount'] = null;
                $paymentData['transaction_id'] = null;
                $paymentData['transaction_time'] = null;
                $paymentData['midtrans_response'] = null;
                $paymentData['paid_at'] = null;
                $paymentData['expired_at'] = null;
                $paymentData['payment_type'] = null;
            }

            // Update checkout status to pending if it was cancelled
            if ($checkout->status === 'cancelled') {
                $checkout->update(['status' => 'pending']);
            }

            // Update payment record
            $payment->update($paymentData);

            Log::info('Payment method changed successfully', [
                'checkout_id' => $checkout->id,
                'order_id' => $paymentData['order_id'] ?? $checkout->key,
                'old_payment_method' => $oldPaymentMethod,
                'new_payment_method' => $newPaymentMethod,
                'payment_status' => $paymentData['payment_status'],
                'checkout_status' => $checkout->status,
                'payment_type_reset' => $newPaymentMethod === 'midtrans',
                'previous_transaction_cancelled' => $oldOrderId ?? null,
            ]);

            DB::commit();

            $responseData = $this->formatCheckoutResponse($checkout->fresh(['products.product', 'payment']));

            if ($newPaymentMethod === 'midtrans' && isset($snapToken)) {
                $responseData['payment_gateway'] = [
                    'snap_token' => $snapToken,
                    'redirect_url' => $redirectUrl,
                    'is_production' => config('midtrans.is_production'),
                    'order_id' => $newOrderId,
                ];
            }

            return response()->json([
                'message' => 'Payment method changed successfully',
                'data' => $responseData,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to change payment method', [
                'checkout_key' => $key,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Failed to change payment method',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    private function mapMidtransStatusToDatabase($status, $fraudStatus = null)
    {
        switch ($status) {
            case 'capture':
                // Handle capture dengan fraud status
                if ($fraudStatus === 'challenge') {
                    return 'challenge';
                } elseif ($fraudStatus === 'accept') {
                    return 'paid'; // atau 'capture' jika ingin konsisten
                }
                return 'capture'; // Default untuk capture

            case 'settlement':
                return 'paid'; // Map settlement ke paid

            case 'pending':
                return 'pending';

            case 'deny':
                return 'cancelled';

            case 'cancel':
                return 'cancelled';

            case 'expire':
                return 'expire';

            case 'refund':
            case 'partial_refund':
                return 'refunded';

            case 'challenge':
                return 'challenge';

            case 'failure':
            case 'failed':
                return 'failed';

            default:
                Log::warning('Unknown Midtrans status, using original', [
                    'status' => $status,
                    'fraud_status' => $fraudStatus
                ]);
                return $status;
        }
    }

    private function mapStatusToDatabase($status)
    {
        $statusMap = [
            'paid' => 'paid',
            'settlement' => 'paid',
            'capture' => 'capture', // atau 'paid' jika prefer konsisten
            'cancelled' => 'cancelled',
            'cancel' => 'cancelled',
            'expire' => 'expire',
            'deny' => 'cancelled',
            'failed' => 'failed',
            'pending' => 'pending',
            'challenge' => 'challenge',
            'refunded' => 'refunded',
            'unpaid' => 'unpaid',
        ];

        return $statusMap[$status] ?? $status;
    }
}
