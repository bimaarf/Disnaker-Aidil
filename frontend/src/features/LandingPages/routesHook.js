import { createSelector, createAsyncThunk } from "@reduxjs/toolkit";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { fetchAllLandings } from "./landingsSlice";

/* -------------------------------------------------------------------------- */
/* 🔹 SELECTORS                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Ambil semua routes dari state
 */
export const selectAllRoutes = (state) => state.routes.allRoutes || [];

/**
 * Ambil semua landing dari daftar routes
 */
export const selectAllLandings = createSelector(
  [selectAllRoutes],
  (allRoutes) => allRoutes?.map((route) => route.landing).filter(Boolean) || []
);

/**
 * Ambil landing berdasarkan route_name tertentu
 */
export const selectLandingByRouteName = (routeName) =>
  createSelector(
    [selectAllRoutes],
    (allRoutes) =>
      allRoutes.find((route) => route.route_name === routeName)?.landing || null
  );

/**
 * Ambil landing dari route yang sedang aktif (state.routes.route)
 */
export const selectCurrentRouteLanding = (state) =>
  state.routes.route?.landing || null;

/* -------------------------------------------------------------------------- */
/* 🔹 THUNKS                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Fetch semua routes (dengan landings jika sudah include dari API)
 */
export const fetchAllRoutes = createAsyncThunk(
  "routes/fetchAllRoutes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/routes/all`
      );
      return { allRoutes: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch routes");
    }
  }
);

/* -------------------------------------------------------------------------- */
/* 🔹 CUSTOM HOOKS                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Hook untuk memastikan routes sudah ter-load.
 * Jika belum ada, otomatis fetch dari server.
 */
export const useEnsureRoutes = () => {
  const dispatch = useDispatch();
  const allRoutes = useSelector(selectAllRoutes);

  useEffect(() => {
    if (!allRoutes || allRoutes.length === 0) {
      dispatch(fetchAllRoutes());
    }
  }, [allRoutes, dispatch]);

  return allRoutes;
};

/**
 * Hook untuk memastikan landings sudah ter-load.
 * Jika belum ada, otomatis fetch dari server.
 */
export const useEnsureLandings = () => {
  const dispatch = useDispatch();
  const allLandings = useSelector(selectAllLandings);

  useEffect(() => {
    if (!allLandings || allLandings.length === 0) {
      dispatch(fetchAllLandings());
    }
  }, [allLandings, dispatch]);

  return allLandings;
};
