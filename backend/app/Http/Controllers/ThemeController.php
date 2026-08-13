<?php

namespace App\Http\Controllers;

use App\Models\Theme;
use Illuminate\Http\Request;

class ThemeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $themes = [
            ['name' => 'violet'],
            ['name' => 'blue'],
            ['name' => 'red'],
        ];
        return response()->json($themes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show()
    {
        return response()->json(Theme::first());
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request)
    {
        $theme = Theme::first();
        $theme->name = $request->theme;
        $theme->save();
        return response()->json(['status' => 200], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
