<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class VerifyOtp
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
   public function handle($request, Closure $next)
    {
        $user = Auth::user();

        // Tangani user yang belum login
        if (!$user) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthorized. Please login first.',
            ], 401);
        }

        // Tangani user yang belum verifikasi OTP atau statusnya tidak aktif
        if (!$user->email_verified_at || $user->status !== 1) {
            return response()->json([
                'status' => 403,
                'message' => 'Account not verified or suspended.',
                'user_id' => $user->id,
            ], 403);
        }

        return $next($request);
    }

}
