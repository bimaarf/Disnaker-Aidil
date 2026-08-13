import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Thunks
export const createGame = createAsyncThunk(
  "games/createGame",
  async (gameData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/games`,
        gameData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );
      return response.data.game;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create game"
      );
    }
  }
);

export const fetchAllGames = createAsyncThunk(
  "roles/fetchAllGames",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/games/all`
      );
      return {
        allGames: response.data.data, // Ensure this is correct based on API response structure
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch games" // Ensure error handling is proper
      );
    }
  }
);
export const fetchGames = createAsyncThunk(
  "games/fetchGames",
  async ({ page = 1, perPage = 20 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/games`,
        { params: { page, perPage } }
      );
      return {
        games: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        totalVisible: response.data.total_visible,
        totalHidden: response.data.total_hidden,
        total: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch games");
    }
  }
);

export const fetchGame = createAsyncThunk(
  "games/fetchGame",
  async (gameKey, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/games/${gameKey}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch game");
    }
  }
);

export const updateGame = createAsyncThunk(
  "games/updateGame",
  async ({ key, gameData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/games/${key}`,
        gameData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.game;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update game");
    }
  }
);

export const deleteGame = createAsyncThunk(
  "games/deleteGame",
  async (gameId, { rejectWithValue }) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API}api/games/${gameId}`);
      return gameId;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete game");
    }
  }
);

export const deleteGames = createAsyncThunk(
  "games/deleteGames",
  async (gameIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        gameIds.map((id) =>
          axios.delete(`${process.env.REACT_APP_API}api/games/${id}`)
        )
      );
      return gameIds;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete games");
    }
  }
);

const gameSlice = createSlice({
  name: "games",
  initialState: {
    allGames: [],
    games: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 20,
    totalVisible: 0,
    totalHidden: 0,
    totalPages: 1,
    total: null,
    game: null,
  },
  reducers: {
    resetGamesState: (state) => {
      state.games = [];
      state.game = null;
      state.error = null;
      state.status = "idle";
    },
    resetGameStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setGamePage(state, action) {
      state.page = action.payload;
    },
    updateSingleGame(state, action) {
      const updatedGame = action.payload;
      const index = state.games.findIndex((game) => game.id === updatedGame.id);
      if (index !== -1) {
        state.games[index] = updatedGame;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllGames.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllGames.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.allGames = action.payload.allGames; // Update allRoles state
      })
      .addCase(fetchAllGames.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createGame.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createGame.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.games.unshift(action.payload);
      })
      .addCase(createGame.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchGames.pending, (state) => {
        state.status = "loading";
      });
    builder
      .addCase(fetchGames.fulfilled, (state, action) => {
        state.status = "succeeded";

        // Extract existing game IDs into an array
        const existingIds = state.games.map((game) => game.id);

        // Filter out duplicates using Array.prototype.filter
        const newGames = action.payload.games.filter(
          (game) => !existingIds.includes(game.id)
        );

        // Update the games state with the new unique games
        state.games = [...state.games, ...newGames];

        // Update pagination details
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalVisible = action.payload.totalVisible;
        state.totalHidden = action.payload.totalHidden;
        state.total = action.payload.total;
      })
      .addCase(fetchGames.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchGame.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchGame.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.game = action.payload;
      })
      .addCase(fetchGame.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateGame.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateGame.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedGame = action.payload;
        const index = state.games.findIndex(
          (game) => game.key === updatedGame.key
        );
        if (index !== -1) {
          state.games[index] = updatedGame;
        }
        if (state.game && state.game.key === updatedGame.key) {
          state.game = updatedGame;
        }
      })
      .addCase(updateGame.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteGame.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteGame.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.games = state.games.filter((game) => game.id !== action.payload);
      })
      .addCase(deleteGame.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteGames.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteGames.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.games = state.games.filter(
          (game) => !action.payload.includes(game.id)
        );
      })
      .addCase(deleteGames.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetGameStatus,
  resetGamesState,
  setGamePage,
  updateSingleGame,
} = gameSlice.actions;
export default gameSlice.reducer;
