import { fetchAllPeriods } from "../features/ppdb/periodSlice";
import store from "../store";

// utils/periodUtils.js
export const getPeriodKeyById = async (periodId) => {
  const state = store.getState();

  // Cari di existing state
  const period =
    state.periods.allPeriods.find((p) => p.id === periodId) ||
    Object.values(state.periods.periodDetails).find(
      (detail) => detail.period?.id === periodId
    )?.period;

  if (period?.key) return period.key;

  // Fallback: fetch dari API
  try {
    await store.dispatch(fetchAllPeriods()).unwrap();
    const updatedState = store.getState();
    return updatedState.periods.allPeriods.find((p) => p.id === periodId)?.key;
  } catch (error) {
    console.error(`Failed to get period key for id ${periodId}:`, error);
    return null;
  }
};
