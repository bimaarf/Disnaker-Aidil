<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\BlogCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
class BlogCategoryController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('perPage', 20);

        $sortKey = $request->input('sortKey', 'id');
        $sortDirection = $request->input('sortDirection', 'desc');


        $data = BlogCategory::orderBy($sortKey, $sortDirection)
        ->paginate($perPage);

        return response()->json([
            'data' => $data->items(),
            'total' => $data->total(),
            'per_page' => $data->perPage(),
            'current_page' => $data->currentPage(),
            'last_page' => $data->lastPage(),
            'from' => $data->firstItem(),
            'to' => $data->lastItem(),
        ]);
    }
    public function view($key)
    {
        $data = BlogCategory::where('key', $key)->firstOrFail();
        if (!$data) {
            return response()->json(['status' => 404, 'message' => 'data not found'], 404);
        }
        return response()->json(['data' => $data], 200);
    }
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $input = new BlogCategory();
            $input->key = Str::random(16);
            $input->name = $request->name;
          
            $input->save();

            return response()->json(['status' => 201, 'category' => $input], 201);
        } catch (\Throwable $th) {
            return response()->json([
                'status' => 500,
                'message' => 'Internal Server Error',
                'error' => $th->getMessage()
            ], 500);
        }

    }
    public function update(Request $request, $key)
    {
        try {
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
            ]);
         $data = BlogCategory::where('key', $key)->firstOrFail();

         $data->name = $validatedData['name'];
       
         $data->save();
         return response()->json(['status' => 200, 'category' => $data], 200);

     } catch (ValidationException $e) {
         return response()->json([
             'status' => 422,
             'message' => 'Validation error',
             'errors' => $e->errors()
         ], 422);

     } catch (\Throwable $th) {
         return response()->json([
             'status' => 500,
             'message' => 'An error occurred while updating the category.',
             'error' => $th->getMessage()
         ], 500);
     }
    }
    public function delete($id)
    {
        $data = BlogCategory::find($id);

        if (!$data) {
            return response()->json(['status' => 404, 'message' => 'Category not found'], 404);
        }

        try {
            $data->delete();
            return response()->json(['message' => 'Category deleted successfully']);
        } catch (\Throwable $th) {
            return response()->json(['status' => 500, 'message' => $th->getMessage()], 500);
        }
    }
}
