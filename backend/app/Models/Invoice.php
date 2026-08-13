<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $table = 'tb_invoice';

    protected $fillable = [
        'checkout_id',
        'total_price',
        'image',
        'note',
        'bank_name',
        'receiver_name',
        'account_number',
    ];

    protected $casts = [
        'total_price' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relationship with Checkout
     */
    public function checkout()
    {
        return $this->belongsTo(Checkout::class, 'checkout_id');
    }

    /**
     * Get image URL
     */
    public function getImageUrlAttribute()
    {
        return $this->image ? url($this->image) : null;
    }

    /**
     * Get formatted total price
     */
    public function getFormattedTotalPriceAttribute()
    {
        return 'Rp ' . number_format($this->total_price, 0, ',', '.');
    }

    /**
     * Get bank information as array
     */
    public function getBankInfoAttribute()
    {
        return [
            'bank_name' => $this->bank_name,
            'receiver_name' => $this->receiver_name,
            'account_number' => $this->account_number,
        ];
    }

    /**
     * Scope to search by bank information
     */
    public function scopeSearchByBank($query, $search)
    {
        return $query->where(function($q) use ($search) {
            $q->where('bank_name', 'like', "%{$search}%")
              ->orWhere('receiver_name', 'like', "%{$search}%")
              ->orWhere('account_number', 'like', "%{$search}%");
        });
    }

    /**
     * Scope to filter by checkout key
     */
    public function scopeByCheckoutKey($query, $checkoutKey)
    {
        return $query->whereHas('checkout', function($q) use ($checkoutKey) {
            $q->where('key', $checkoutKey);
        });
    }

    /**
     * Scope to get recent invoices
     */
    public function scopeRecent($query, $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Get full bank details formatted
     */
    public function getFullBankDetailsAttribute()
    {
        return "{$this->bank_name} - {$this->account_number} a/n {$this->receiver_name}";
    }
}
