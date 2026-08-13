<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use Illuminate\Http\Request;
use Validator;

class ContactController extends Controller
{
    public function show()
    {
        $contact = Contact::first();
        return response()->json(['status' => 200, 'data' => $contact]);
    }
   public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'nullable|email',
            'whatsapp' => 'nullable|string',
            'telegram' => 'nullable|string',
            'instagram' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 400, 'errors' => $validator->errors()]);
        }

        try {
            $contact = Contact::first();

            $data = [
                'email' => $request->email,
                'whatsapp' => $request->whatsapp,
                'telegram' => $request->telegram,
                'instagram' => $request->instagram,
            ];

            // Konversi string kosong ke null
            $data = array_map(function ($value) {
                return ($value === '' || $value === null) ? null : $value;
            }, $data);

            if ($contact) {
                $contact->update($data);
            } else {
                $contact = Contact::create($data);
            }

            return response()->json(['status' => 200, 'data' => $contact]);
        } catch (\Throwable $th) {
            return response()->json([
                'status' => 500,
                'message' => 'An error occurred',
                'error' => $th->getMessage()
            ], 500);
        }
    }



}
