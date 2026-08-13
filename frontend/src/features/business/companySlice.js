import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Thunks
export const createCompany = createAsyncThunk(
  "companies/createCompany",
  async (companyData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/companies`,
        companyData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );
      return response.data.company;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create company"
      );
    }
  }
);

export const fetchAllCompanies = createAsyncThunk(
  "roles/fetchAllCompanies",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/companies/all`
      );
      return {
        allCompanies: response.data.data, // Ensure this is correct based on API response structure
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch companies" // Ensure error handling is proper
      );
    }
  }
);
export const fetchCompanies = createAsyncThunk(
  "companies/fetchCompanies",
  async ({ page = 1, perPage = 20 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/companies`,
        { params: { page, perPage } }
      );
      return {
        companies: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        totalVisible: response.data.total_visible,
        totalHidden: response.data.total_hidden,
        total: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch companies"
      );
    }
  }
);

export const fetchCompany = createAsyncThunk(
  "companies/fetchCompany",
  async (companyKey, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/companies/${companyKey}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch company");
    }
  }
);

export const updateCompany = createAsyncThunk(
  "companies/updateCompany",
  async ({ key, companyData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/companies/${key}`,
        companyData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.company;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update company"
      );
    }
  }
);

export const deleteCompany = createAsyncThunk(
  "companies/deleteCompany",
  async (companyId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/companies/${companyId}`
      );
      return companyId;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete company");
    }
  }
);

export const deleteCompanies = createAsyncThunk(
  "companies/deleteCompanies",
  async (companyIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        companyIds.map((id) =>
          axios.delete(`${process.env.REACT_APP_API}api/companies/${id}`)
        )
      );
      return companyIds;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to delete companies"
      );
    }
  }
);

const companySlice = createSlice({
  name: "companies",
  initialState: {
    allCompanies: [],
    companies: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 20,
    totalVisible: 0,
    totalHidden: 0,
    totalPages: 1,
    total: null,
    company: null,
  },
  reducers: {
    resetCompaniesState: (state) => {
      state.companies = [];
      state.company = null;
      state.error = null;
      state.status = "idle";
    },
    resetCompanyStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setCompanyPage(state, action) {
      state.page = action.payload;
    },
    updateSingleCompany(state, action) {
      const updatedCompany = action.payload;
      const index = state.companies.findIndex(
        (company) => company.id === updatedCompany.id
      );
      if (index !== -1) {
        state.companies[index] = updatedCompany;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllCompanies.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllCompanies.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.allCompanies = action.payload.allCompanies;
      })
      .addCase(fetchAllCompanies.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createCompany.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createCompany.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.companies.unshift(action.payload);
      })
      .addCase(createCompany.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchCompanies.pending, (state) => {
        state.status = "loading";
      });
    builder
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.status = "succeeded";

        const existingIds = state.companies.map((company) => company.id);

        const newCompanies = action.payload.companies.filter(
          (company) => !existingIds.includes(company.id)
        );

        state.companies = [...state.companies, ...newCompanies];

        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalVisible = action.payload.totalVisible;
        state.totalHidden = action.payload.totalHidden;
        state.total = action.payload.total;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchCompany.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCompany.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.company = action.payload;
      })
      .addCase(fetchCompany.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateCompany.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateCompany.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedCompany = action.payload;
        const index = state.companies.findIndex(
          (company) => company.key === updatedCompany.key
        );
        if (index !== -1) {
          state.companies[index] = updatedCompany;
        }
        if (state.company && state.company.key === updatedCompany.key) {
          state.company = updatedCompany;
        }
      })
      .addCase(updateCompany.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteCompany.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.companies = state.companies.filter(
          (company) => company.id !== action.payload
        );
      })
      .addCase(deleteCompany.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteCompanies.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteCompanies.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.companies = state.companies.filter(
          (company) => !action.payload.includes(company.id)
        );
      })
      .addCase(deleteCompanies.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetCompanyStatus,
  resetCompaniesState,
  setCompanyPage,
  updateSingleCompany,
} = companySlice.actions;
export default companySlice.reducer;
