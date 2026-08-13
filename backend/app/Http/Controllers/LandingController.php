<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Landing;
use App\Models\Route;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class LandingController extends Controller
{
    /**
     * Get all landings without pagination
     */
    public function all(): JsonResponse
    {
        try {
            $landings = Landing::with('route')->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $landings,
                'message' => 'Landings retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve landings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get landings with pagination
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('perPage', 10);
            $search = $request->get('search');
            $routeId = $request->get('route_id');

            $query = Landing::with('route')->orderBy('created_at', 'desc');

            if ($search) {
                $query->search($search);
            }

            if ($routeId) {
                $query->byRoute($routeId);
            }

            $landings = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $landings->items(),
                'current_page' => $landings->currentPage(),
                'last_page' => $landings->lastPage(),
                'per_page' => $landings->perPage(),
                'total' => $landings->total(),
                'message' => 'Landings retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve landings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a new landing
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'route_id' => 'required|exists:tb_route,id',
                'title' => 'required|string|max:255',
                'subtitle' => 'nullable|string|max:255',
                'icon' => 'nullable|string|max:255',
                'description' => 'nullable|string'
            ]);

            $landing = Landing::create($validated);
            $landing->load('route');

            return response()->json([
                'success' => true,
                'landing' => $landing,
                'message' => 'Landing created successfully'
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create landing',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show specific landing
     */
    public function show($id): JsonResponse
    {
        try {
            $landing = Landing::with('route')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $landing,
                'message' => 'Landing retrieved successfully'
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Landing not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve landing',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update landing
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $landing = Landing::findOrFail($id);

            $validated = $request->validate([
                'route_id' => 'required|exists:tb_route,id',
                'title' => 'required|string|max:255',
                'subtitle' => 'nullable|string|max:255',
                'icon' => 'nullable|string|max:255',
                'description' => 'nullable|string'
            ]);

            $landing->update($validated);
            $landing->load('route');

            return response()->json([
                'success' => true,
                'landing' => $landing,
                'message' => 'Landing updated successfully'
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Landing not found'
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update landing',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete landing
     */
    public function destroy($id): JsonResponse
    {
        try {
            $landing = Landing::findOrFail($id);
            $landing->delete();

            return response()->json([
                'success' => true,
                'message' => 'Landing deleted successfully'
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Landing not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete landing',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get landings by route
     */
    public function byRoute($routeId): JsonResponse
    {
        try {
            // Verify route exists
            Route::findOrFail($routeId);

            $landings = Landing::with('route')
                ->byRoute($routeId)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $landings,
                'message' => 'Landings retrieved successfully'
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Route not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve landings',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
