<?php
// app/Http/Controllers/ServiceSubItemController.php
namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\ServiceSubItem;
use Illuminate\Http\Request;

class ServiceSubItemController extends Controller
{
    public function index(Service $service)
    {
        return response()->json($service->subItems);
    }

    public function store(Request $request, Service $service)
    {
        $data = $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
            'link' => 'nullable|string',
        ]);

        $subItem = $service->subItems()->create($data);

        return response()->json($subItem, 201);
    }

    public function show(Service $service, ServiceSubItem $subItem)
    {
        if ($subItem->service_id !== $service->id) {
            return response()->json(['error' => 'SubItem not found in this service'], 404);
        }

        return response()->json($subItem);
    }

    public function update(Request $request, Service $service, ServiceSubItem $subItem)
    {
        if ($subItem->service_id !== $service->id) {
            return response()->json(['error' => 'SubItem not found in this service'], 404);
        }

        $data = $request->validate([
            'title' => 'sometimes|required|string',
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
            'link' => 'nullable|string',
        ]);

        $subItem->update($data);

        return response()->json($subItem);
    }

    public function destroy(Service $service, ServiceSubItem $subItem)
    {
        if ($subItem->service_id !== $service->id) {
            return response()->json(['error' => 'SubItem not found in this service'], 404);
        }

        $subItem->delete();

        return response()->json(['message' => 'SubItem deleted successfully']);
    }
}
