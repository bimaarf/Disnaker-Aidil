<?php
// app/Http/Controllers/ServiceController.php
namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index()
    {
        return response()->json(Service::with('subItems')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
            'color' => 'nullable|string',
            'link' => 'nullable|string',
            'sub_items' => 'nullable|array',
            'sub_items.*.title' => 'required|string',
            'sub_items.*.description' => 'nullable|string',
            'sub_items.*.icon' => 'nullable|string',
            'sub_items.*.link' => 'nullable|string',
        ]);

        $service = Service::create($data);

        if (!empty($data['sub_items'])) {
            $service->subItems()->createMany($data['sub_items']);
        }

        return response()->json($service->load('subItems'), 201);
    }

    public function show(Service $service)
    {
        return response()->json($service->load('subItems'));
    }

    public function update(Request $request, Service $service)
    {
        $data = $request->validate([
            'title' => 'sometimes|required|string',
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
            'color' => 'nullable|string',
            'link' => 'nullable|string',
            'sub_items' => 'nullable|array',
        ]);

        $service->update($data);

        if (!empty($data['sub_items'])) {
            $service->subItems()->delete();
            $service->subItems()->createMany($data['sub_items']);
        }

        return response()->json($service->load('subItems'));
    }

    public function destroy(Service $service)
    {
        $service->delete();
        return response()->json(['message' => 'Service deleted successfully']);
    }
}
