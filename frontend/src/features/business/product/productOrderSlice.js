import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchAllOrders = createAsyncThunk(
  "allOrders/fetchAllOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/product/sales/all`
      );
      console.log("Fetched all orders data:", response.data.data);

      return response.data.data; // Correct the payload to return the data directly
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch orders");
    }
  }
);

export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (productId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/product/sales/${productId}`
      );
      return response.data.data; // Ensure you return only the order data
    } catch (error) {
      throw new Error(error.response.data.message || "Failed to fetch orders");
    }
  }
);

export const addOrder = createAsyncThunk(
  "orders/addOrder",
  async (newOrder) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/product/sales`,
        newOrder
      );
      return response.data.order; // Assuming `order` is returned
    } catch (error) {
      throw new Error(error.response.data.message || "Failed to add order");
    }
  }
);

// Delete a order by id
export const deleteOrder = createAsyncThunk(
  "orders/deleteOrder",
  async (orderId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/product/sales/${orderId}`
      );
      return orderId;
    } catch (error) {
      throw new Error(error.response.data.message || "Failed to delete order");
    }
  }
);

const orderSlice = createSlice({
  name: "orders",
  initialState: {
    allOrders: [], // Stores all the fetched orders
    orders: [], // Stores orders for a particular product
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllOrders.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.allOrders = action.payload; // Corrected: assigning only the orders data
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(fetchOrders.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(addOrder.fulfilled, (state, action) => {
        state.orders.push(action.payload); // Add new order to the array
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.orders = state.orders.filter(
          (order) => order.id !== action.payload // Remove order by ID
        );
      });
  },
});

export default orderSlice.reducer;
