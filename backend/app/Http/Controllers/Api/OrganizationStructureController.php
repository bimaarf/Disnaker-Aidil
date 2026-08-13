<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrganizationStructure;
use Illuminate\Http\Request;

class OrganizationStructureController extends Controller
{
    /**
     * Tampilkan struktur organisasi dalam bentuk tree JSON
     */
    public function index()
    {
        $roots = OrganizationStructure::whereNull('parent_id')
        ->with([
            'user',
            'children.user',
            'children.children.user',
            'children.children.children.user'
        ])
        ->orderBy('order')
        ->get();

        return response()->json($roots);
    }

    /**
     * Tambah jabatan baru
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'      => 'required|string|max:255',
            'user_id'   => 'nullable|exists:users,id',
            'parent_id' => 'nullable|exists:organization_structures,id',
            'order'     => 'nullable|integer',
        ]);

        // otomatis set level
        $data['level'] = 0;
        if (!empty($data['parent_id'])) {
            $parent = OrganizationStructure::find($data['parent_id']);
            $data['level'] = $parent ? $parent->level + 1 : 0;
        }

        $org = OrganizationStructure::create($data);

        return response()->json([
            'message' => 'Jabatan berhasil ditambahkan',
            'data' => $org
        ]);
    }

    /**
     * Update jabatan
     */
    public function update(Request $request, $id)
    {
        $org = OrganizationStructure::findOrFail($id);

        $data = $request->validate([
            'name'      => 'sometimes|required|string|max:255',
            'user_id'   => 'nullable|exists:users,id',
            'parent_id' => 'nullable|exists:organization_structures,id',
            'order'     => 'nullable|integer',
        ]);

        if (isset($data['parent_id'])) {
            $parent = OrganizationStructure::find($data['parent_id']);
            $data['level'] = $parent ? $parent->level + 1 : 0;
        }

        $org->update($data);

        return response()->json([
            'message' => 'Jabatan berhasil diperbarui',
            'data' => $org
        ]);
    }

    /**
     * Hapus jabatan
     */
    public function destroy($id)
    {
        $org = OrganizationStructure::findOrFail($id);

        // opsional: pindahkan anak-anak ke parent atas
        foreach ($org->children as $child) {
            $child->update(['parent_id' => $org->parent_id]);
        }

        $org->delete();

        return response()->json(['message' => 'Jabatan berhasil dihapus']);
    }
}
