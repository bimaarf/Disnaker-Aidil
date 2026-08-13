import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const createCategory = createAsyncThunk(
  "categories/createCategory",
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/categories`,
        categoryData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.category;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create category"
      );
    }
  }
);
export const fetchAllCategories = createAsyncThunk(
  "categories/fetchAllCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/categories/all`
      );
      console.log("Fetched all categories data:", response.data);

      return {
        allCategories: response.data.data,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch categories"
      );
    }
  }
);
export const fetchCategories = createAsyncThunk(
  "categories/fetchCategories",
  async ({ page = 1, perPage = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/categories`,
        { params: { page, perPage } }
      );
      return {
        categories: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        totalVisible: response.data.total_visible,
        totalHidden: response.data.total_hidden,
        total: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch categories"
      );
    }
  }
);

export const fetchCategory = createAsyncThunk(
  "categories/fetchCategory",
  async (categoryKey, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/categories/${categoryKey}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch category");
    }
  }
);

export const updateCategory = createAsyncThunk(
  "categories/updateCategory",
  async ({ key, categoryData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/categories/${key}`,
        categoryData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.category;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update category"
      );
    }
  }
);

export const deleteCategory = createAsyncThunk(
  "categories/deleteCategory",
  async (categoryId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/categories/${categoryId}`
      );
      return categoryId;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete category");
    }
  }
);

export const deleteCategories = createAsyncThunk(
  "categories/deleteCategories",
  async (categoryIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        categoryIds.map(async (id) => {
          try {
            await axios.delete(
              `${process.env.REACT_APP_API}api/categories/${id}`
            );
          } catch (err) {
            if (err.response && err.response.status === 401) {
              throw new Error("Unauthorized - Logging out");
            }
            throw err;
          }
        })
      );
      return categoryIds;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete categories");
    }
  }
);

const categorySlice = createSlice({
  name: "categories",
  initialState: {
    allCategories: [],
    categories: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 10,
    totalVisible: 0,
    totalHidden: 0,
    totalPages: 1,
    total: null,
    category: null,
  },
  reducers: {
    resetCategoryStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setCategoryPage(state, action) {
      state.page = action.payload;
    },
    updateSingleCategory(state, action) {
      const updatedCategory = action.payload;
      const index = state.categories.findIndex(
        (category) => category.id === updatedCategory.id
      );
      if (index !== -1) {
        state.categories[index] = updatedCategory;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllCategories.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllCategories.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.allCategories = action.payload.allCategories; // Update allCategories state
      })
      .addCase(fetchAllCategories.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createCategory.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categories.unshift(action.payload);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchCategories.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categories = [...state.categories, ...action.payload.categories];
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalVisible = action.payload.totalVisible;
        state.totalHidden = action.payload.totalHidden;
        state.total = action.payload.total;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchCategory.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCategory.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.category = action.payload;
      })
      .addCase(fetchCategory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateCategory.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedCategory = action.payload;
        const index = state.categories.findIndex(
          (category) => category.key === updatedCategory.key
        );
        if (index !== -1) {
          state.categories[index] = updatedCategory;
        }
        if (state.category && state.category.key === updatedCategory.key) {
          state.category = updatedCategory;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteCategory.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categories = state.categories.filter(
          (category) => category.id !== action.payload
        );
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteCategories.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteCategories.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categories = state.categories.filter(
          (category) => !action.payload.includes(category.id)
        );
      })
      .addCase(deleteCategories.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { resetCategoryStatus, setCategoryPage, updateSingleCategory } =
  categorySlice.actions;
export default categorySlice.reducer;
