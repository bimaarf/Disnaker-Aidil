<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CheckoutPayment extends Model
{
    use HasFactory;

    protected $table = 'tb_checkout_payment';

    protected $fillable = [
        'checkout_id',
        'payment_method',
        'payment_status',
        'paid_at',
        'expired_at',
        'transaction_id',
        'transaction_time',
        'payment_type',
        'gross_amount',
        'snap_token',
        'redirect_url',
        'midtrans_response',
        'order_id'
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'expired_at' => 'datetime',
        'transaction_time' => 'datetime',
        'gross_amount' => 'decimal:2',
        'midtrans_response' => 'array',
    ];

     public function checkout()
    {
        return $this->belongsTo(Checkout::class, 'checkout_id');
    }


    public function isMidtransPayment()
    {
        return $this->payment_method === 'midtrans';
    }
    public function getReadableStatusAttribute()
    {
        $statusMap = [
            'unpaid' => 'Belum Dibayar',
            'pending' => 'Menunggu',
            'paid' => 'Dibayar',
            'settlement' => 'Dibayar',
            'capture' => 'Dibayar',
            'cancelled' => 'Dibatalkan',
            'failed' => 'Gagal',
            'challenge' => 'Dalam Peninjauan',
            'refunded' => 'Direfund',
            'expire' => 'Kadaluwarsa',
            'deny' => 'Ditolak',
            'cancel' => 'Dibatalkan',
        ];

        return $statusMap[$this->payment_status] ?? $this->payment_status;
    }

    public function isPending()
    {
        return in_array($this->payment_status, ['pending', 'unpaid']);
    }

    public function isPaid()
    {
        return in_array($this->payment_status, ['paid', 'settlement']);
    }

    public function isCancelled()
    {
        return in_array($this->payment_status, ['cancelled', 'failed', 'cancel', 'expire', 'deny']);
    }

    /**
     * Check if payment is completed
     */
    public function isCompleted()
    {
        return in_array($this->payment_status, ['paid', 'settlement']);
    }

    /**
     * Check if payment is failed/expired
     */
    public function isFailedOrExpired()
    {
        return in_array($this->payment_status, ['expire', 'failed', 'cancel', 'deny']);
    }

    /**
     * Check if payment can be regenerated
     */
    public function canRegenerate()
    {
        return $this->isMidtransPayment() && $this->isFailedOrExpired();
    }

    /**
     * Check if payment needs auto-regeneration
     */
    public function needsAutoRegeneration()
    {
        return $this->canRegenerate() &&
               in_array($this->payment_status, ['expire', 'failed']) &&
               $this->created_at->diffInHours(now()) <= 24; // Only auto-regenerate within 24 hours
    }

    /**
     * Get payment status display name
     */
    public function getStatusDisplayName()
    {
        return match($this->payment_status) {
            'pending' => 'Menunggu Pembayaran',
            'paid', 'settlement' => 'Sudah Dibayar',
            'expire' => 'Kedaluwarsa',
            'failed' => 'Gagal',
            'cancel' => 'Dibatalkan',
            'deny' => 'Ditolak',
            'challenge' => 'Dalam Peninjauan',
            'refund', 'partial_refund' => 'Dikembalikan',
            default => 'Belum Dibayar'
        };
    }

    /**
     * Get payment status color for UI
     */
    public function getStatusColor()
    {
        return match($this->payment_status) {
            'paid', 'settlement' => 'green',
            'pending', 'challenge' => 'yellow',
            'expire', 'failed', 'cancel', 'deny' => 'red',
            'refund', 'partial_refund' => 'orange',
            default => 'gray'
        };
    }
}
