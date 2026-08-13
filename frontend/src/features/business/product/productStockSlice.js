import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchAllStocks = createAsyncThunk(
  "allStocks/fetchAllStocks",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/product/stocks/all`
      );
      console.log("Fetched all stocks data:", response.data.data);

      return response.data.data; // Correct the payload to return the data directly
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch stocks");
    }
  }
);

export const fetchStocks = createAsyncThunk(
  "stocks/fetchStocks",
  async (productId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/product/stocks/${productId}`
      );
      return response.data.data; // Ensure you return only the stock data
    } catch (error) {
      throw new Error(error.response.data.message || "Failed to fetch stocks");
    }
  }
);

export const addStock = createAsyncThunk(
  "stocks/addStock",
  async (newStock) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/product/stocks`,
        newStock
      );
      return response.data.stock; // Assuming `stock` is returned
    } catch (error) {
      throw new Error(error.response.data.message || "Failed to add stock");
    }
  }
);

// Delete a stock by id
export const deleteStock = createAsyncThunk(
  "stocks/deleteStock",
  async (stockId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/product/stocks/${stockId}`
      );
      return stockId;
    } catch (error) {
      throw new Error(error.response.data.message || "Failed to delete stock");
    }
  }
);

const stockSlice = createSlice({
  name: "stocks",
  initialState: {
    allStocks: [], // Stores all the fetched stocks
    stocks: [], // Stores stocks for a particular product
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllStocks.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllStocks.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.allStocks = action.payload; // Corrected: assigning only the stocks data
      })
      .addCase(fetchAllStocks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(fetchStocks.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchStocks.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.stocks = action.payload;
      })
      .addCase(fetchStocks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(addStock.fulfilled, (state, action) => {
        state.stocks.push(action.payload); // Add new stock to the array
      })
      .addCase(deleteStock.fulfilled, (state, action) => {
        state.stocks = state.stocks.filter(
          (stock) => stock.id !== action.payload // Remove stock by ID
        );
      });
  },
});

export default stockSlice.reducer;
