import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Thunks
export const createData = createAsyncThunk(
  "datas/createData",
  async ({ type, dataData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/${type}`,
        dataData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return { data: response.data.data, type };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create data"
      );
    }
  }
);

export const fetchDatas = createAsyncThunk(
  "datas/fetchDatas",
  async ({ type, page = 1, perPage = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/${type}/view`,
        { params: { page, perPage } }
      );
      return {
        datas: response.data.data,
        type,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        totalVisible: response.data.total_visible,
        totalHidden: response.data.total_hidden,
        total: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch datas");
    }
  }
);

export const fetchData = createAsyncThunk(
  "datas/fetchData",
  async ({ type, dataKey }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/${type}/${dataKey}`
      );
      return { data: response.data, type };
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch data");
    }
  }
);

export const updateData = createAsyncThunk(
  "datas/updateData",
  async ({ type, key, dataData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/${type}/${key}`,
        dataData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return { data: response.data.data, type };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update data");
    }
  }
);

export const deleteData = createAsyncThunk(
  "datas/deleteData",
  async ({ type, dataId }, { rejectWithValue }) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API}api/${type}/${dataId}`);
      return { dataId, type };
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete data");
    }
  }
);

export const deleteDatas = createAsyncThunk(
  "datas/deleteDatas",
  async ({ type, dataIds }, { rejectWithValue }) => {
    try {
      await Promise.all(
        dataIds.map((id) =>
          axios.delete(`${process.env.REACT_APP_API}api/${type}/${id}`)
        )
      );
      return { dataIds, type };
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete datas");
    }
  }
);

const updateState = (state, type, updates) => {
  state[type] = { ...state[type], ...updates };
};

const dataSlice = createSlice({
  name: "datas",
  initialState: {
    payments: {
      datas: [],
      status: "idle",
      error: null,
      page: 1,
      perPage: 10,
      totalVisible: 0,
      totalHidden: 0,
      totalPages: 1,
      total: null,
      data: null,
    },
    games: {
      datas: [],
      status: "idle",
      error: null,
      page: 1,
      perPage: 10,
      totalVisible: 0,
      totalHidden: 0,
      totalPages: 1,
      total: null,
      data: null,
    },
  },
  reducers: {
    resetDataStatus: (state, action) => {
      const { type } = action.payload;
      updateState(state, type, { status: "idle", error: null });
    },
    setPage(state, action) {
      const { type, page } = action.payload;
      updateState(state, type, { page });
    },
    updateSingleData(state, action) {
      const { type, updatedData } = action.payload;
      const index = state[type].datas.findIndex(
        (data) => data.key === updatedData.key
      );
      if (index !== -1) {
        state[type].datas[index] = updatedData;
      }
      if (state[type].data && state[type].data.key === updatedData.key) {
        state[type].data = updatedData;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Data
      .addCase(createData.pending, (state, action) => {
        updateState(state, action.meta.arg.type, { status: "loading" });
      })
      .addCase(createData.fulfilled, (state, action) => {
        updateState(state, action.payload.type, {
          status: "succeeded",
          datas: [action.payload.data, ...state[action.payload.type].datas],
        });
      })
      .addCase(createData.rejected, (state, action) => {
        updateState(state, action.meta.arg.type, {
          status: "failed",
          error: action.payload,
        });
      })

      // Fetch Datas
      .addCase(fetchDatas.pending, (state, action) => {
        updateState(state, action.meta.arg.type, { status: "loading" });
      })
      .addCase(fetchDatas.fulfilled, (state, action) => {
        updateState(state, action.payload.type, {
          status: "succeeded",
          datas: [
            ...state[action.payload.type].datas,
            ...action.payload.datas,
          ],
          page: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalVisible: action.payload.totalVisible,
          totalHidden: action.payload.totalHidden,
          total: action.payload.total,
        });
      })
      .addCase(fetchDatas.rejected, (state, action) => {
        updateState(state, action.meta.arg.type, {
          status: "failed",
          error: action.payload,
        });
      })

      // Fetch Data
      .addCase(fetchData.pending, (state, action) => {
        updateState(state, action.meta.arg.type, { status: "loading" });
      })
      .addCase(fetchData.fulfilled, (state, action) => {
        updateState(state, action.payload.type, {
          status: "succeeded",
          data: action.payload.data,
        });
      })
      .addCase(fetchData.rejected, (state, action) => {
        updateState(state, action.meta.arg.type, {
          status: "failed",
          error: action.payload,
        });
      })

      // Update Data
      .addCase(updateData.pending, (state, action) => {
        updateState(state, action.meta.arg.type, { status: "loading" });
      })
      .addCase(updateData.fulfilled, (state, action) => {
        const updatedData = action.payload.data;
        updateState(state, action.payload.type, {
          status: "succeeded",
          datas: state[action.payload.type].datas.map((data) =>
            data.key === updatedData.key ? updatedData : data
          ),
          data: state[action.payload.type].data?.key === updatedData.key
            ? updatedData
            : state[action.payload.type].data,
        });
      })
      .addCase(updateData.rejected, (state, action) => {
        updateState(state, action.meta.arg.type, {
          status: "failed",
          error: action.payload,
        });
      })

      // Delete Data
      .addCase(deleteData.pending, (state, action) => {
        updateState(state, action.meta.arg.type, { status: "loading" });
      })
      .addCase(deleteData.fulfilled, (state, action) => {
        updateState(state, action.payload.type, {
          status: "succeeded",
          datas: state[action.payload.type].datas.filter(
            (data) => data.id !== action.payload.dataId
          ),
        });
      })
      .addCase(deleteData.rejected, (state, action) => {
        updateState(state, action.meta.arg.type, {
          status: "failed",
          error: action.payload,
        });
      })

      // Delete Multiple Datas
      .addCase(deleteDatas.pending, (state, action) => {
        updateState(state, action.meta.arg.type, { status: "loading" });
      })
      .addCase(deleteDatas.fulfilled, (state, action) => {
        updateState(state, action.payload.type, {
          status: "succeeded",
          datas: state[action.payload.type].datas.filter(
            (data) => !action.payload.dataIds.includes(data.id)
          ),
        });
      })
      .addCase(deleteDatas.rejected, (state, action) => {
        updateState(state, action.meta.arg.type, {
          status: "failed",
          error: action.payload,
        });
      });
  },
});

export const { resetDataStatus, setPage, updateSingleData } = dataSlice.actions;
export default dataSlice.reducer;
