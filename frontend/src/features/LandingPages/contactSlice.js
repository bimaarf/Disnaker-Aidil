import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { logout } from "../authentication/AuthSlice";

// Thunk untuk meng-upload contact
export const createContact = createAsyncThunk(
  "contacts/createContact",
  async (contactData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/contact`,
        contactData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to upload contact"
      );
    }
  }
);

// Thunk untuk mengambil semua contact
export const fetchContacts = createAsyncThunk(
  "contacts/fetchContacts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/contact`
      );
      return {
        contacts: response.data.data,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch contacts"
      );
    }
  }
);

// Thunk untuk mengambil contact berdasarkan ID
export const fetchContact = createAsyncThunk(
  "contacts/fetchContact",
  async (contactId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/contact/${contactId}`
      );
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch contact");
    }
  }
);

// Thunk untuk memperbarui contact
export const updateContact = createAsyncThunk(
  "contacts/updateContact",
  async ({ key, contactData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/contact/${key}`,
        contactData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update contact"
      );
    }
  }
);

// Thunk untuk menghapus contact
export const deleteContact = createAsyncThunk(
  "contacts/deleteContact",
  async (contactId, { rejectWithValue, dispatch }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/contact/${contactId}`
      );
      return contactId;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        dispatch(logout());
      }
      return rejectWithValue(err.response?.data || "Failed to delete contact");
    }
  }
);

// Slice untuk contact
const contactSlice = createSlice({
  name: "contacts",
  initialState: {
    contact: null,
    status: "idle",
    error: null,
    page: 1,
    perPage: 10,
    totalPages: 1,
    total: 0,
  },
  reducers: {
    resetContactStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setContactPage(state, action) {
      state.page = action.payload;
    },
    updateSingleContact(state, action) {
      const updatedContact = action.payload;
      const index = state.contacts.findIndex(
        (contact) => contact.id === updatedContact.id
      );

      if (index !== -1) {
        state.contacts[index] = updatedContact;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createContact.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createContact.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.contacts.unshift(action.payload);
      })
      .addCase(createContact.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchContacts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.contacts = action.payload.contacts;

        // Jika API mengembalikan object, jadikan array
        // state.contacts = Array.isArray(data) ? data : [data];
      })

      .addCase(fetchContacts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchContact.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchContact.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.contact = action.payload;
      })
      .addCase(fetchContact.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateContact.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateContact.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedContact = action.payload;

        state.contacts = state.contacts.map((contact) =>
          contact.id === updatedContact.id ? updatedContact : contact
        );
      })
      .addCase(updateContact.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteContact.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.contacts = state.contacts.filter(
          (contact) => contact.id !== action.payload
        );
      })
      .addCase(deleteContact.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

// Ekspor action dan reducer
export const { resetContactStatus, setContactPage, updateSingleContact } =
  contactSlice.actions;

export default contactSlice.reducer;
