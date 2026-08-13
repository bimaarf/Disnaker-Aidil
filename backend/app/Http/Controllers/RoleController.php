<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\RoleUser;
use DB;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class RoleController extends Controller
{
    // Get all roles
    public function all()
    {
        try {
            $roles = Role::all();
            return response()->json([
                "status" => 200,
                "data" => $roles
            ]);
        } catch (\Exception $e) {
            return response()->json([
                "status" => 500,
                "message" => "Failed to retrieve roles",
                "error" => $e->getMessage()
            ], 500);
        }
    }

    // Paginate roles
    public function index(Request $request)
    {
        $perPage = $request->input('perPage', 10);
        $sortKey = $request->input('sortKey', 'id');
        $sortDirection = $request->input('sortDirection', 'desc');

        $roles = Role::orderBy($sortKey, $sortDirection)->paginate($perPage);

        return response()->json([
            'data' => $roles->items(),
            'total' => $roles->total(),
            'per_page' => $roles->perPage(),
            'current_page' => $roles->currentPage(),
            'last_page' => $roles->lastPage(),
            'from' => $roles->firstItem(),
            'to' => $roles->lastItem(),
        ]);
    }

    // View role by name
    public function view($name)
    {
        $role = Role::where('name', $name)->first();

        if (!$role) {
            return response()->json(['status' => 404, 'message' => 'Role not found'], 404);
        }
        return response()->json(['role' => $role], 200);
    }

    // Create a new role
    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'name' => 'required|string|max:255|unique:roles,name',
                'display_name' => 'required|string|max:255',
                'description' => 'nullable|string|max:255',
            ]);

            $role = Role::create([
                'name' => $validatedData['name'],
                'display_name' => $validatedData['display_name'],
                'description' => $validatedData['description'],
            ]);

            return response()->json(['status' => 201, 'role' => $role], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'An error occurred while creating the role.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Update existing role
    public function update(Request $request, $name)
    {
        try {
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'display_name' => 'required|string|max:255',
                'description' => 'nullable|string|max:255',
            ]);

            $role = Role::where('name', $name)->firstOrFail();

            $role->name = $validatedData['name'];
            $role->display_name = $validatedData['display_name'];
            $role->description = $validatedData['description'];
            $role->save();

            return response()->json(['status' => 200, 'role' => $role], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $th) {
            return response()->json([
                'status' => 500,
                'message' => 'An error occurred while updating the role.',
                'error' => $th->getMessage()
            ], 500);
        }
    }

    // Delete a role
    public function delete($id)
    {
        // Find the role by name
        $role = Role::find($id);

        // Check if the role exists
        if (!$role) {
            return response()->json(['status' => 404, 'message' => 'Role not found'], 404);
        }

        // Check if there are any users associated with this role
        $relatedRole = RoleUser::where('role_id', $role->id)->count();
        if ($relatedRole > 0) {
            return response()->json(['status' => 422, 'message' => 'Cannot delete role; users are associated with it.'], 422);
        }

        DB::beginTransaction();

        try {
            $role->delete();
            DB::commit();
            return response()->json(['message' => 'Role deleted successfully.'], 200);
        } catch (\Throwable $th) {
            DB::rollBack();
            return response()->json(['status' => 500, 'message' => $th->getMessage()], 500);
        }
    }

}
