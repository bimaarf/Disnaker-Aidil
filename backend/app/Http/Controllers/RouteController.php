<?php

namespace App\Http\Controllers;

use App\Models\Route;
use App\Models\Landing;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class RouteController extends Controller
{
    /**
     * Fetch all routes without pagination
     */
    public function all()
    {
        $routes = Route::with('landing')->get();

        return response()->json([
            'data' => $routes
        ]);
    }

    /**
     * Fetch routes with pagination
     */
    public function index(Request $request)
    {
        $perPage = $request->input('perPage', 10);
        $page = $request->input('page', 1);
        $sortKey = $request->input('sortKey', 'id');
        $sortDirection = $request->input('sortDirection', 'desc');

        $query = Route::with('landing')->orderBy($sortKey, $sortDirection);

        // optional search
        if ($request->filled('search')) {
            $query->where('route_name', 'like', '%' . $request->search . '%');
        }

        $routes = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $routes->items(),
            'current_page' => $routes->currentPage(),
            'last_page' => $routes->lastPage(),
            'total' => $routes->total(),
        ]);
    }

    /**
     * Fetch single route
     */
    public function show($id)
    {
        $route = Route::with('landing')->find($id);

        if (!$route) {
            return response()->json(['message' => 'Route not found'], 404);
        }

        // slice expects route in "route" key
        return response()->json(['route' => $route]);
    }

    /**
     * Store new route
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'route_name' => 'required|string|unique:tb_route,route_name',
                'landing.title' => 'required|string',
                'landing.subtitle' => 'nullable|string',
                'landing.icon' => 'nullable|string',
                'landing.description' => 'nullable|string',
            ]);

            $route = Route::create([
                'route_name' => $validated['route_name'],
            ]);

            $landingData = $validated['landing'];
            $landing = new Landing($landingData);
            $route->landing()->save($landing);

            return response()->json(['route' => $route->load('landing')], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        }
    }

    /**
     * Update route
     */
    public function update(Request $request, $id)
    {
        $route = Route::find($id);
        if (!$route) return response()->json(['message' => 'Route not found'], 404);

        $validated = $request->validate([
            'route_name' => 'required|string|unique:tb_route,route_name,' . $id,
            'landing.title' => 'required|string',
            'landing.subtitle' => 'nullable|string',
            'landing.icon' => 'nullable|string',
            'landing.description' => 'nullable|string',
        ]);

        $route->update(['route_name' => $validated['route_name']]);

        if ($route->landing) {
            $route->landing()->update($validated['landing']);
        } else {
            $route->landing()->create($validated['landing']);
        }

        return response()->json(['route' => $route->load('landing')]);
    }

    /**
     * Delete route
     */
    public function destroy($id)
    {
        $route = Route::find($id);
        if (!$route) return response()->json(['message' => 'Route not found'], 404);

        $route->delete();
        return response()->json(['message' => 'Route deleted successfully']);
    }
}
