// src/features/enggang/selectors.js
export const selectPublicRespondents = (state) =>
  state.answers.publicRespondents;
export const selectPublicStatus = (state) => state.answers.publicStatus;
export const selectPublicError = (state) => state.answers.publicError;
export const selectRespondents = (state) => state.answers.publicRespondents;
export const selectAllPeriods = (state) => state.periods.allPeriods;
export const selectPeriodFilters = (state) => state.periods.filters;
export const selectPeriodStatus = (state) => state.periods.status;
export const selectPublicStatusTotals = (state) =>
  state.answers.publicStatusTotals || {};
