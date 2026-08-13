import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// Event Cache dengan struktur yang lebih baik
const eventCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Helper function to check if cache is valid
const isCacheValid = (cacheEntry) => {
  if (!cacheEntry) return false;
  const { timestamp } = cacheEntry;
  return Date.now() - timestamp < CACHE_DURATION;
};

// Helper function to get cached data
export const getCachedEvents = (key) => {
  const cacheEntry = eventCache.get(key);
  if (isCacheValid(cacheEntry)) {
    return cacheEntry.data;
  }
  eventCache.delete(key); // Remove stale cache
  return null;
};

// Helper function to set cached data
const setCachedEvents = (key, data) => {
  eventCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

// Helper function untuk menghindari duplikasi event
const mergeEventsUnique = (existingEvents, newEvents) => {
  const eventMap = new Map();

  // Add existing events to map
  existingEvents.forEach((event) => {
    eventMap.set(event.key || event.id, event);
  });

  // Add or update with new events
  newEvents.forEach((event) => {
    eventMap.set(event.key || event.id, event);
  });

  return Array.from(eventMap.values());
};

// Helper function untuk update event di array tanpa duplikasi
const updateEventInArray = (events, updatedEvent) => {
  const index = events.findIndex(
    (event) =>
      (event.key && event.key === updatedEvent.key) ||
      (event.id && event.id === updatedEvent.id)
  );

  if (index !== -1) {
    events[index] = updatedEvent;
  } else {
    events.unshift(updatedEvent);
  }
  return events;
};

// Thunks
export const createEvent = createAsyncThunk(
  "events/createEvent",
  async (eventData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/event`,
        eventData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );
      const newEvent = response.data.event;
      setCachedEvents(newEvent.key, newEvent);

      // Clear cache yang berhubungan dengan list untuk refresh data
      const keysToDelete = [];
      for (let key of eventCache.keys()) {
        if (
          key.startsWith("events_page_") ||
          key.startsWith("public_events_page_") ||
          key === "all_events"
        ) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => eventCache.delete(key));

      return newEvent;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create event"
      );
    }
  }
);

export const fetchAllEvents = createAsyncThunk(
  "events/fetchAllEvents",
  async (_, { rejectWithValue }) => {
    const cacheKey = "all_events";
    const cachedData = getCachedEvents(cacheKey);
    if (cachedData) {
      return { allEvents: cachedData };
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/event/all`
      );
      const allEvents = response.data.data;
      setCachedEvents(cacheKey, allEvents);
      return { allEvents };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch events");
    }
  }
);

export const fetchEvents = createAsyncThunk(
  "events/fetchEvents",
  async (
    {
      page,
      perPage,
      searchQuery = "",
      fromDate = "",
      toDate = "",
      loadMore = false,
    },
    { rejectWithValue }
  ) => {
    const cacheKey = `events_page_${page}_per_${perPage}_q_${searchQuery}_from_${fromDate}_to_${toDate}`;
    const cachedData = getCachedEvents(cacheKey);

    if (cachedData && !loadMore) {
      return { ...cachedData, isFromCache: true };
    }

    try {
      const params = { page, perPage, q: searchQuery, fromDate, toDate };
      console.log(
        "fetchEvents: Sending request to /api/event with params:",
        params
      );

      const response = await axios.get(`${process.env.REACT_APP_API}api/event`, {
        params,
      });

      console.log("fetchEvents: Response received:", response.data);

      // Attach page number to each event for state checking
      const eventsWithPage = response.data.data.map((event) => ({
        ...event,
        page, // Add page number to each event
      }));

      const responseData = {
        ...response.data,
        data: eventsWithPage,
        loadMore,
        requestedPage: page,
      };

      setCachedEvents(cacheKey, responseData);
      return responseData;
    } catch (err) {
      console.error("fetchEvents: Error:", err.response?.data || err.message);
      return rejectWithValue(err.response?.data || "Failed to fetch events");
    }
  }
);

export const fetchPublicEvents = createAsyncThunk(
  "events/fetchPublicEvents",
  async (
    {
      page,
      perPage,
      searchQuery = "",
      fromDate = "",
      toDate = "",
      loadMore = false,
    },
    { rejectWithValue }
  ) => {
    const cacheKey = `public_events_page_${page}_per_${perPage}_q_${searchQuery}_from_${fromDate}_to_${toDate}`;
    const cachedData = getCachedEvents(cacheKey);

    if (cachedData && !loadMore) {
      return { ...cachedData, isFromCache: true };
    }

    try {
      const params = {
        page,
        perPage,
        q: searchQuery,
        fromDate,
        toDate,
        isPublic: true,
      };
      console.log("fetchPublicEvents: Sending request with params:", params);

      const response = await axios.get(`${process.env.REACT_APP_API}api/event`, {
        params,
      });

      const responseData = {
        ...response.data,
        loadMore,
        requestedPage: page,
      };

      setCachedEvents(cacheKey, responseData);
      return responseData;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch public events"
      );
    }
  }
);

// ============== PERBAIKAN BLOG SLICE ==============

// Di bagian fetchEvent thunk, perbaiki logika isPublic
export const fetchEvent = createAsyncThunk(
  "events/fetchEvent",
  async ({ key, isPublic = false }, { rejectWithValue, getState }) => {
    // Check di state terlebih dahulu
    const state = getState();
    const existingEvent =
      state.events.events.find((event) => event.key === key) ||
      state.events.publicEvents.find((event) => event.key === key) ||
      state.events.allEvents.find((event) => event.key === key);

    // PERBAIKAN: Jika isPublic = true, pastikan event yang ada memiliki status = true
    if (existingEvent) {
      if (isPublic && !existingEvent.status) {
        // Jika request untuk public event tapi event tidak public, fetch ulang
        // Tidak return existing event
      } else {
        return existingEvent;
      }
    }

    const cachedData = getCachedEvents(key);
    if (cachedData) {
      if (isPublic && !cachedData.status) {
        // Jika request untuk public event tapi cached event tidak public, fetch ulang
        // Tidak return cached data
      } else {
        return cachedData;
      }
    }

    try {
      const params = isPublic ? { isPublic: true } : {};
      console.log(
        "fetchEvent: Sending request to /api/event/" + key + " with params:",
        params
      );

      const response = await axios.get(
        `${process.env.REACT_APP_API}api/event/${key}`,
        { params }
      );

      const eventData = response.data.data;

      // PERBAIKAN: Validasi response untuk public event
      if (isPublic && !eventData.status) {
        return rejectWithValue("Event is not publicly accessible");
      }

      setCachedEvents(key, eventData);
      return eventData;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch event");
    }
  }
);

export const updateEvent = createAsyncThunk(
  "events/updateEvent",
  async ({ key, eventData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/event/${key}`,
        eventData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const updatedEvent = response.data.data;
      setCachedEvents(key, updatedEvent);

      // Clear related cache entries
      const keysToDelete = [];
      for (let cacheKey of eventCache.keys()) {
        if (
          cacheKey.startsWith("events_page_") ||
          cacheKey.startsWith("public_events_page_") ||
          cacheKey === "all_events"
        ) {
          keysToDelete.push(cacheKey);
        }
      }
      keysToDelete.forEach((cacheKey) => eventCache.delete(cacheKey));

      return updatedEvent;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update event");
    }
  }
);

export const deleteEvent = createAsyncThunk(
  "events/deleteEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API}api/event/${eventId}`);
      eventCache.delete(eventId);

      // Clear related cache entries
      const keysToDelete = [];
      for (let key of eventCache.keys()) {
        if (
          key.startsWith("events_page_") ||
          key.startsWith("public_events_page_") ||
          key === "all_events"
        ) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => eventCache.delete(key));

      return eventId;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete event");
    }
  }
);

export const deleteEvents = createAsyncThunk(
  "events/deleteEvents",
  async (eventIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        eventIds.map((id) =>
          axios.delete(`${process.env.REACT_APP_API}api/event/${id}`)
        )
      );

      eventIds.forEach((id) => eventCache.delete(id));

      // Clear related cache entries
      eventCache.clear(); // Clear all cache untuk memastikan konsistensi

      return eventIds;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete events");
    }
  }
);

const eventSlice = createSlice({
  name: "events",
  initialState: {
    allEvents: [],
    events: [],
    publicEvents: [],
    status: "idle",
    error: null,

    // State untuk events (dashboard)
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 1,
    totalVisible: 0,
    totalHidden: 0,
    searchQuery: "",
    fromDate: "",
    toDate: "",

    // State terpisah untuk publicEvents
    publicPage: 1,
    publicPerPage: 10,
    publicTotal: 0,
    publicTotalPages: 1,
    publicTotalVisible: 0,
    publicTotalHidden: 0,
    publicSearchQuery: "",
    publicFromDate: "",
    publicToDate: "",
    publicStatus: "idle",
    publicError: null,
    publicIsLoadingMore: false,

    // Tambahan untuk tracking
    lastFetchParams: null,
    isLoadingMore: false,
  },
  reducers: {
    resetEvents: (state) => {
      state.events = [];
      state.page = 1;
      state.totalPages = 1;
      state.total = 0;
      state.status = "idle";
      state.lastFetchParams = null;
      state.isLoadingMore = false;
      // Hapus cache khusus events saja
      for (let key of eventCache.keys()) {
        if (key.startsWith("events_page_")) {
          eventCache.delete(key);
        }
      }
    },

    resetPublicEvents: (state) => {
      state.publicEvents = [];
      state.publicPage = 1;
      state.publicTotalPages = 1;
      state.publicTotal = 0;
      state.publicStatus = "idle";
      state.publicIsLoadingMore = false;
      // Hapus cache khusus public events saja
      for (let key of eventCache.keys()) {
        if (key.startsWith("public_events_page_")) {
          eventCache.delete(key);
        }
      }
    },

    resetAllEvents: (state) => {
      state.allEvents = [];
      eventCache.delete("all_events");
    },

    setEventFromDate(state, action) {
      state.fromDate = action.payload;
    },
    setEventToDate(state, action) {
      state.toDate = action.payload;
    },

    setPublicEventFromDate(state, action) {
      state.publicFromDate = action.payload;
    },
    setPublicEventToDate(state, action) {
      state.publicToDate = action.payload;
    },

    resetEventsState: (state) => {
      state.events = [];
      state.error = null;
      state.status = "idle";
      state.isLoadingMore = false;
    },

    resetPublicEventsState: (state) => {
      state.publicEvents = [];
      state.publicError = null;
      state.publicStatus = "idle";
      state.publicIsLoadingMore = false;
    },

    resetEventStatus: (state) => {
      state.status = "idle";
      state.error = null;
      state.isLoadingMore = false;
    },

    resetPublicEventStatus: (state) => {
      state.publicStatus = "idle";
      state.publicError = null;
      state.publicIsLoadingMore = false;
    },

    setEventPage(state, action) {
      state.page = action.payload;
    },
    setPublicEventPage(state, action) {
      state.publicPage = action.payload;
    },

    setEventSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    setPublicEventSearchQuery(state, action) {
      state.publicSearchQuery = action.payload;
    },

    updateSingleEvent(state, action) {
      const updatedEvent = action.payload;

      // Update di events array
      state.events = updateEventInArray([...state.events], updatedEvent);

      // Update di publicEvents array
      if (updatedEvent.status) {
        state.publicEvents = updateEventInArray(
          [...state.publicEvents],
          updatedEvent
        );
      } else {
        state.publicEvents = state.publicEvents.filter(
          (event) => event.key !== updatedEvent.key && event.id !== updatedEvent.id
        );
      }

      // Update di allEvents array
      state.allEvents = updateEventInArray([...state.allEvents], updatedEvent);

      setCachedEvents(updatedEvent.key, updatedEvent);
    },
    clearEventCache: () => {
      eventCache.clear();
    },
    setLoadingMore: (state, action) => {
      state.isLoadingMore = action.payload;
    },
    setPublicLoadingMore: (state, action) => {
      state.publicIsLoadingMore = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllEvents.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllEvents.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.allEvents = action.payload.allEvents || [];
      })
      .addCase(fetchAllEvents.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createEvent.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.status = "succeeded";

        // Hindari duplikasi dengan menggunakan helper function
        state.events = updateEventInArray([...state.events], action.payload);
        state.allEvents = updateEventInArray([...state.allEvents], action.payload);

        if (action.payload.status) {
          state.publicEvents = updateEventInArray(
            [...state.publicEvents],
            action.payload
          );
        }
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchEvents.pending, (state, action) => {
        if (action.meta.arg.loadMore) {
          state.isLoadingMore = true;
        } else {
          state.status = "loading";
        }
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        const {
          data,
          total,
          total_visible,
          total_hidden,
          current_page,
          last_page,
          per_page,
        } = action.payload;

        state.status = "succeeded";
        state.isLoadingMore = false;

        // LOGIKA INI SUDAH BENAR - MENAMBAH DATA, BUKAN MENGGANTI
        // Load more: gabungkan tanpa duplikasi menggunakan mergeEventsUnique
        state.events = mergeEventsUnique(state.events, data);

        // Update pagination info
        state.total = total;
        state.totalVisible = total_visible;
        state.totalHidden = total_hidden;
        state.page = current_page;
        state.totalPages = last_page;
        state.perPage = per_page;
      })

      .addCase(fetchEvents.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.isLoadingMore = false;
      })
      .addCase(fetchPublicEvents.pending, (state, action) => {
        if (action.meta.arg.loadMore) {
          state.publicIsLoadingMore = true;
        } else {
          state.publicStatus = "loading";
        }
      })
      .addCase(fetchPublicEvents.fulfilled, (state, action) => {
        const {
          data,
          total,
          total_visible,
          total_hidden,
          current_page,
          last_page,
          per_page,
        } = action.payload;

        state.publicStatus = "succeeded";
        state.publicIsLoadingMore = false;

        state.publicEvents = mergeEventsUnique(state.publicEvents, data);

        state.publicTotal = total;
        state.publicTotalVisible = total_visible;
        state.publicTotalHidden = total_hidden;
        state.publicPage = current_page;
        state.publicTotalPages = last_page;
        state.publicPerPage = per_page;
      })
      .addCase(fetchPublicEvents.rejected, (state, action) => {
        state.publicStatus = "failed";
        state.publicError = action.payload;
        state.publicIsLoadingMore = false;
      })
      .addCase(fetchEvent.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchEvent.fulfilled, (state, action) => {
        state.status = "succeeded";
        const eventData = action.payload;

        // Update di semua array tanpa duplikasi
        state.events = updateEventInArray([...state.events], eventData);
        state.allEvents = updateEventInArray([...state.allEvents], eventData);

        if (eventData.status) {
          state.publicEvents = updateEventInArray(
            [...state.publicEvents],
            eventData
          );
        }
      })
      .addCase(fetchEvent.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateEvent.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedEvent = action.payload;

        // Update semua array
        state.events = updateEventInArray([...state.events], updatedEvent);
        state.allEvents = updateEventInArray([...state.allEvents], updatedEvent);

        if (updatedEvent.status) {
          state.publicEvents = updateEventInArray(
            [...state.publicEvents],
            updatedEvent
          );
        } else {
          state.publicEvents = state.publicEvents.filter(
            (event) => event.key !== updatedEvent.key && event.id !== updatedEvent.id
          );
        }
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteEvent.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.status = "succeeded";
        const eventId = action.payload;

        state.events = state.events.filter(
          (event) => event.key !== eventId && event.id !== eventId
        );
        state.publicEvents = state.publicEvents.filter(
          (event) => event.key !== eventId && event.id !== eventId
        );
        state.allEvents = state.allEvents.filter(
          (event) => event.key !== eventId && event.id !== eventId
        );
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteEvents.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteEvents.fulfilled, (state, action) => {
        state.status = "succeeded";
        const eventIds = action.payload;

        state.events = state.events.filter(
          (event) => !eventIds.includes(event.key) && !eventIds.includes(event.id)
        );
        state.publicEvents = state.publicEvents.filter(
          (event) => !eventIds.includes(event.key) && !eventIds.includes(event.id)
        );
        state.allEvents = state.allEvents.filter(
          (event) => !eventIds.includes(event.key) && !eventIds.includes(event.id)
        );
      })
      .addCase(deleteEvents.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetEvents,
  resetPublicEvents,
  resetAllEvents,
  resetEventStatus,
  resetPublicEventStatus,
  resetEventsState,
  resetPublicEventsState,
  setEventPage,
  setPublicEventPage,
  setEventFromDate,
  setEventToDate,
  setPublicEventFromDate,
  setPublicEventToDate,
  setEventSearchQuery,
  setPublicEventSearchQuery,
  updateSingleEvent,
  clearEventCache,
  setLoadingMore,
  setPublicLoadingMore,
} = eventSlice.actions;

export default eventSlice.reducer;
