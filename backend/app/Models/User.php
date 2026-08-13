<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Laratrust\Traits\HasRolesAndPermissions;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class User extends Authenticatable
{
    use HasRolesAndPermissions, HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'phone_number',
        'otp_verified',
        'email',
        'status',
        'password',
        'avatar',
        'created_at',
        'last_online_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_online_at' => 'datetime',
        'password' => 'hashed',
        'otp_verified' => 'boolean',
    ];

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = [
        'last_online_at',
        'created_at',
        'updated_at',
        'email_verified_at',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    // protected $appends = ['avatar_url'];

    public function otps()
    {
        return $this->hasMany(Otp::class);
    }

    public function otp()
    {
        return $this->hasOne(Otp::class)->latestOfMany();
    }

    public function usedOtps()
    {
        return $this->hasMany(Otp::class)->where('is_used', true);
    }

    public function unusedOtps()
    {
        return $this->hasMany(Otp::class)->where('is_used', false);
    }

    public function chatRooms()
    {
        return $this->belongsToMany(ChatRoom::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function notiffications()
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * ✅ FIX: Hapus getLastOnlineAtAttribute karena sudah di-cast ke datetime
     * Jika perlu format khusus, gunakan accessor dengan nama berbeda
     */
    public function getFormattedLastOnlineAttribute()
    {
        if (!$this->last_online_at) {
            return null;
        }

        return Carbon::parse($this->last_online_at)
            ->timezone('Asia/Jakarta')
            ->format('d M Y, H:i');
    }

    /**
     * ✅ FIX: Hapus getCreatedAtAttribute karena bisa konflik dengan casting
     * Gunakan accessor dengan nama berbeda
     */
    public function getFormattedCreatedAtAttribute()
    {
        if (!$this->created_at) {
            return null;
        }

        return Carbon::parse($this->created_at)
            ->timezone('Asia/Jakarta')
            ->format('d F Y');
    }

    /**
     * ✅ FIX: Perbaiki accessor untuk avatar URL
     */
    public function getAvatarAttribute($value)
    {
        if (!$value) {
            return null;
        }

        // Jika avatar sudah berupa URL lengkap, langsung return
        if (filter_var($value, FILTER_VALIDATE_URL)) {
            return $value;
        }

        // Base URL kamu — bisa juga pakai config('app.url')
        $baseUrl = config('app.url', 'http://localhost:8000');

        // Pastikan path-nya tidak double "storage/"
        $normalizedPath = ltrim($value, '/');

        // Jika file ada di storage public
        if (Storage::disk('public')->exists($normalizedPath)) {
            return $baseUrl . '/storage/' . $normalizedPath;
        }

        // Fallback — tetap kembalikan URL penuh meski file tidak dicek
        return $baseUrl . '/storage/' . $normalizedPath;
    }



    // Classrooms where user is a teacher
    public function teachingClassrooms()
    {
        return $this->belongsToMany(Classroom::class, 'classroom_teachers', 'teacher_id', 'classroom_id')
            ->withPivot('is_active')
            ->withTimestamps()
            ->wherePivot('is_active', true);
    }

    // Classrooms where user is a student
    public function enrolledClassrooms()
    {
        return $this->belongsToMany(Classroom::class, 'classroom_students', 'student_id', 'classroom_id')
            ->withPivot('status', 'joined_date')
            ->withTimestamps()
            ->wherePivot('status', 'active');
    }

    /**
     * Check if user is a teacher
     */
    public function isTeacher()
    {
        return $this->hasRole('teacher') || $this->teachingClassrooms()->exists();
    }

    /**
     * Check if user is a student
     */
    public function isStudent()
    {
        return $this->hasRole('student') || $this->enrolledClassrooms()->exists();
    }

    /**
     * Check if user is admin
     */
    public function isAdmin()
    {
        return $this->hasRole('admin');
    }

    /**
     * Get user's primary role name
     */
    public function getRoleNameAttribute()
    {
        return $this->roles()->pluck('name')->first() ?? 'user';
    }

    /**
     * Scope to filter verified users
     */
    public function scopeVerified($query)
    {
        return $query->whereNotNull('email_verified_at')
            ->where('otp_verified', true);
    }

    /**
     * Scope to filter active users
     */
    public function scopeActive($query)
    {
        return $query->where('status', 1);
    }

    /**
     * Scope to filter users online in last X minutes
     */
    public function scopeOnline($query, $minutes = 5)
    {
        return $query->where('last_online_at', '>=', now()->subMinutes($minutes));
    }
}
