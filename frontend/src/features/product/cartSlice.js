import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ productId, quantity }, { rejectWithValue, getState }) => {
    const state = getState();
    const user = state.auth.user;

    if (!user) {
      return rejectWithValue("User not authenticated");
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/cart/add`,
        { product_id: productId, quantity },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to add to cart"
      );
    }
  }
);

export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async (_, { rejectWithValue, getState }) => {
    const state = getState();
    const user = state.auth.user;

    if (!user) {
      return rejectWithValue("User not authenticated");
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API}api/cart`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch cart"
      );
    }
  }
);

export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async ({ cartItemId, quantity }, { rejectWithValue, getState }) => {
    const state = getState();
    const user = state.auth.user;

    if (!user) {
      return rejectWithValue("User not authenticated");
    }

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API}api/cart/${cartItemId}`,
        { quantity },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update cart item"
      );
    }
  }
);

export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async (cartItemId, { rejectWithValue, getState }) => {
    const state = getState();
    const user = state.auth.user;

    if (!user) {
      return rejectWithValue("User not authenticated");
    }

    try {
      await axios.delete(`${process.env.REACT_APP_API}api/cart/${cartItemId}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      return cartItemId;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to remove cart item"
      );
    }
  }
);

export const clearCart = createAsyncThunk(
  "cart/clearCart",
  async (_, { rejectWithValue, getState }) => {
    const state = getState();
    const user = state.auth.user;

    if (!user) {
      return rejectWithValue("User not authenticated");
    }

    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API}api/cart/clear`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to clear cart"
      );
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    cart: { items: [] },
    status: "idle",
    error: null,
    isLoading: false,
    isUpdating: false,
    isRemoving: false,
    isClearing: false,
  },
  reducers: {
    resetCart: (state) => {
      state.cart = { items: [] };
      state.status = "idle";
      state.error = null;
      state.isLoading = false;
      state.isUpdating = false;
      state.isRemoving = false;
      state.isClearing = false;
    },
    setCartError: (state, action) => {
      state.error = action.payload;
      state.status = "failed";
    },
    clearCartError: (state) => {
      state.error = null;
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
        state.status = "loading";
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.status = "succeeded";
        state.cart = action.payload;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.status = "failed";
        state.error = action.payload;
      })
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.status = "succeeded";
        state.cart = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.status = "failed";
        state.error = action.payload;
      })
      // Update Cart Item
      .addCase(updateCartItem.pending, (state) => {
        state.isUpdating = true;
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.status = "succeeded";
        state.cart = action.payload;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.isUpdating = false;
        state.status = "failed";
        state.error = action.payload;
      })
      // Remove Cart Item
      .addCase(removeFromCart.pending, (state) => {
        state.isRemoving = true;
        state.status = "loading";
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.isRemoving = false;
        state.status = "succeeded";
        state.cart.items = state.cart.items.filter(
          (item) => item.id !== action.payload
        );
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.isRemoving = false;
        state.status = "failed";
        state.error = action.payload;
      })
      // Clear Cart
      .addCase(clearCart.pending, (state) => {
        state.isClearing = true;
        state.status = "loading";
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.isClearing = false;
        state.status = "succeeded";
        state.cart = { items: [] };
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.isClearing = false;
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { resetCart, setCartError, clearCartError } = cartSlice.actions;
export default cartSlice.reducer;
