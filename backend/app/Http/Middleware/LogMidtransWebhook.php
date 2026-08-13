<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogMidtransWebhook
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        // Log incoming Midtrans webhook
        if ($request->is('*/midtrans/notification')) {
            Log::info('Midtrans Webhook Received', [
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'headers' => $request->headers->all(),
                'body' => $request->all(),
                'raw_body' => $request->getContent(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        $response = $next($request);

        // Log response
        if ($request->is('*/midtrans/notification')) {
            Log::info('Midtrans Webhook Response', [
                'status' => $response->getStatusCode(),
                'content' => $response->getContent(),
            ]);
        }

        return $response;
    }
}
