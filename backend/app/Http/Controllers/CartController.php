<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CartController extends Controller
{
    /**
     * Get the user's cart with items.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $cart = Cart::where('user_id', $user->id)
            ->with(['items.product.categories', 'items.product.promotions', 'items.product.images'])

            ->first();

        if (!$cart) {
            return response()->json(['data' => ['items' => []]], 200);
        }

        return response()->json(['data' => $cart], 200);
    }

    /**
     * Add a product to the cart.
     */
    public function add(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:tb_product,id',
            'quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        try {
            DB::beginTransaction();

            $cart = Cart::firstOrCreate(['user_id' => $user->id]);

            $product = Product::findOrFail($request->product_id);
            if (!$product->status) {
                return response()->json(['message' => 'Product is not available'], 400);
            }

            $cartItem = CartItem::where('cart_id', $cart->id)
                ->where('product_id', $request->product_id)
                ->first();

            if ($cartItem) {
                $cartItem->update([
                    'quantity' => $cartItem->quantity + $request->quantity
                ]);
            } else {
                $cartItem = CartItem::create([
                    'cart_id' => $cart->id,
                    'product_id' => $request->product_id,
                    'quantity' => $request->quantity,
                ]);
            }

            DB::commit();

            $cart = Cart::where('id', $cart->id)
                ->with(['items.product.categories', 'items.product.promotions', 'items.product.images'])
                ->first();

            return response()->json([
                'message' => 'Product added to cart successfully',
                'data' => $cart
            ], 200);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to add product to cart',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the quantity of a cart item.
     */
    public function update(Request $request, $cartItemId)
    {
        $validator = Validator::make($request->all(), [
            'quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        try {
            DB::beginTransaction();

            $cart = Cart::where('user_id', $user->id)->firstOrFail();
            $cartItem = CartItem::where('cart_id', $cart->id)
                ->where('id', $cartItemId)
                ->firstOrFail();

            $cartItem->update(['quantity' => $request->quantity]);

            DB::commit();

            $cart = Cart::where('id', $cart->id)
                ->with(['items.product.categories', 'items.product.promotions', 'items.product.images'])
                ->first();

            return response()->json([
                'message' => 'Cart item updated successfully',
                'data' => $cart
            ], 200);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update cart item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove a cart item.
     */
    public function remove($cartItemId)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        try {
            DB::beginTransaction();

            $cart = Cart::where('user_id', $user->id)->firstOrFail();
            $cartItem = CartItem::where('cart_id', $cart->id)
                ->where('id', $cartItemId)
                ->firstOrFail();

            $cartItem->delete();

            DB::commit();

            $cart = Cart::where('id', $cart->id)
                ->with(['items.product.categories', 'items.product.promotions', 'items.product.images'])
                ->first();

            return response()->json([
                'message' => 'Cart item removed successfully',
                'data' => $cart
            ], 200);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to remove cart item',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}