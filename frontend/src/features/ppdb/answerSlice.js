import isEqual from "lodash/isEqual";
import { isDraft, current } from "immer";

import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import axios from "axios";
import {
  createPeriod,
  updateSinglePeriod,
  deletePeriod,
} from "../ppdb/periodSlice";
import { getValidationStatusObject } from "../../utils/validationUtils";
import { toPlainObject } from "../../utils/toPlainObject";

export const respondentCache = new Map(); // For fetchAnswerGroup
export const publicRespondentCache = new Map(); // For fetchAnswerGroupPublic
export const periodRespondentCache = new Map();
export const respondentDetailCache = new Map();
export const resultCache = new Map();
export function clearCacheByPeriodId(excludedPeriodId) {
  for (const key of respondentCache.keys()) {
    try {
      const parsed = JSON.parse(key);
      if (
        parsed &&
        parsed.page === 1 &&
        parsed.perPage === 10 &&
        parsed.periodId === excludedPeriodId
      ) {
        continue;
      }
      respondentCache.delete(key);
    } catch (e) {
      continue;
    }
  }
}

// const resolveProxies = (obj) => {
//   if (!obj) return obj;
//   if (Array.isArray(obj)) {
//     return obj.map(resolveProxies);
//   }
//   if (typeof obj === "object") {
//     const resolved = isDraft(obj) ? current(obj) : obj;
//     return Object.keys(resolved).reduce((acc, key) => {
//       acc[key] = resolveProxies(resolved[key]);
//       return acc;
//     }, {});
//   }
//   return obj;
// };

export const recalculateStatusTotals = (state) => {
  const baseLabels = [
    "Belum_Diverifikasi",
    "Belum_Ditentukan",
    "Menunggu_Hasil", // Tambahkan status ini
    "Berkas_Diterima",
    "Berkas_Dikembalikan",
    "Lulus",
    "Tidak_Lulus",
  ];

  const countBy = (list) => {
    const counts = Object.fromEntries(baseLabels.map((k) => [k, 0]));
    list.forEach((r) => {
      let label = r?.validation_status?.label?.replace(/\s+/g, "_");

      // Normalisasi "Menunggu_Hasil" menjadi "Belum_Ditentukan" untuk admin
      if (
        label === "Menunggu_Hasil" &&
        state.auth.user?.role !== "user" &&
        r.period?.is_published !== false
      ) {
        label = "Belum_Ditentukan";
      }

      if (label && Object.prototype.hasOwnProperty.call(counts, label)) {
        counts[label]++;
      }
    });
    return {
      ...counts,
      total:
        counts.Lulus +
        counts.Tidak_Lulus +
        counts.Berkas_Diterima +
        counts.Berkas_Dikembalikan +
        counts.Belum_Diverifikasi +
        counts.Belum_Ditentukan +
        counts.Menunggu_Hasil,
      totalVisible:
        counts.Lulus +
        counts.Tidak_Lulus +
        counts.Berkas_Diterima +
        counts.Berkas_Dikembalikan +
        counts.Belum_Ditentukan +
        counts.Menunggu_Hasil,
      totalHidden: counts.Belum_Diverifikasi,
    };
  };

  const privateCounts = countBy(state.respondents ?? []);
  const publicCounts = countBy(state.publicRespondents ?? []);

  state.status_totals = { ...privateCounts };
  state.total = privateCounts.total;
  state.totalVisible = privateCounts.totalVisible;
  state.totalHidden = privateCounts.totalHidden;

  state.publicStatusTotals = { ...publicCounts };
  state.publicTotal = publicCounts.total;
  state.publicTotalVisible = publicCounts.totalVisible;
  state.publicTotalHidden = publicCounts.totalHidden;
};

export const fetchStatusTotalsOnly = createAsyncThunk(
  "answers/fetchStatusTotalsOnly",
  async (_, { getState, rejectWithValue }) => {
    const { filters } = getState().answers;

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/answer/status-totals`,
        {
          params: {
            period_id: filters.selectedPeriodId,
            fromDate: filters.fromDate,
            toDate: filters.toDate,
            search: filters.searchQuery,
          },
        }
      );

      return response.data?.status_totals ?? {};
    } catch (error) {
      return rejectWithValue(
        error.response?.data || error.message || "Unknown error"
      );
    }
  }
);

export const updateAllRelevantCaches = (
  state,
  updatedRespondentRaw,
  isPublic = false,
  preserveCurrentPage = false
) => {
  const updatedRespondent = toPlainObject(updatedRespondentRaw); // ✅ FIX 1: Always clone once di awal

  const submissionId = updatedRespondent.submission_id;
  const periodId =
    updatedRespondent?.answers?.[0]?.period_id || updatedRespondent?.period_id;
  const filters = state.filters || {};

  console.debug(
    `[updateAllRelevantCaches] Updating caches for submission: ${submissionId}, periodId: ${periodId}, isPublic: ${isPublic}`
  );

  // Update respondentCache
  for (const [cacheKey, cacheData] of respondentCache.entries()) {
    try {
      const params = JSON.parse(cacheKey);
      console.debug(
        `[updateAllRelevantCaches] Checking cache key: ${cacheKey}`
      );
      if (!periodId || params.periodId === periodId) {
        const updatedData = {
          ...cacheData,
          data: cacheData.data.map(
            (item) =>
              item.submission_id === submissionId
                ? { ...toPlainObject(item), ...updatedRespondent } // ✅ FIX 2: clone item too
                : toPlainObject(item) // ✅ FIX 3: clone all items
          ),
        };
        respondentCache.set(cacheKey, toPlainObject(updatedData)); // ✅ FIX 4: clone before save
        console.debug(
          `[updateAllRelevantCaches] Updated respondentCache: ${cacheKey}`
        );
      }
    } catch (e) {
      console.warn(
        "Skipping invalid cache key in respondentCache:",
        cacheKey,
        e
      );
    }
  }

  // Update publicRespondentCache
  if (isPublic) {
    for (const [cacheKey, cacheData] of publicRespondentCache.entries()) {
      try {
        const params = JSON.parse(cacheKey);
        console.debug(
          `[updateAllRelevantCaches] Checking public cache key: ${cacheKey}`
        );
        if (!periodId || params.periodId === periodId) {
          const updatedData = {
            ...cacheData,
            data: cacheData.data.map((item) =>
              item.submission_id === submissionId
                ? { ...toPlainObject(item), ...updatedRespondent }
                : toPlainObject(item)
            ),
          };
          publicRespondentCache.set(cacheKey, toPlainObject(updatedData)); // ✅ FIX 4
          console.debug(
            `[updateAllRelevantCaches] Updated publicRespondentCache: ${cacheKey}`
          );
        }
      } catch (e) {
        console.warn(
          "Skipping invalid cache key in publicRespondentCache:",
          cacheKey,
          e
        );
      }
    }
  }

  // Update respondentDetailCache
  if (respondentDetailCache.has(submissionId)) {
    const cacheEntry = toPlainObject(respondentDetailCache.get(submissionId)); // ✅ FIX 5
    respondentDetailCache.set(submissionId, {
      ...cacheEntry,
      data: {
        ...toPlainObject(cacheEntry.data),
        ...updatedRespondent,
      },
      timestamp: Date.now(),
    });
    console.debug(
      `[updateAllRelevantCaches] Updated respondentDetailCache for: ${submissionId}`
    );
  }

  // Update main cache key for current filters
  const cacheKey = JSON.stringify({
    page: 1,
    perPage: 10,
    periodId,
    searchQuery: filters.searchQuery || "",
    fromDate: filters.fromDate || "",
    toDate: filters.toDate || "",
    questionId: filters.questionId || null,
    specificAnswer: filters.specificAnswer || "",
  });

  const targetCache = isPublic ? publicRespondentCache : respondentCache;

  if (!preserveCurrentPage && targetCache.has(cacheKey)) {
    targetCache.delete(cacheKey);
    console.debug(
      `[updateAllRelevantCaches] Cleared cache for key: ${cacheKey}`
    );
  }

  if (targetCache.has(cacheKey)) {
    const cached = toPlainObject(targetCache.get(cacheKey)); // ✅ FIX 6
    const updatedData = cached.data.map((item) =>
      item.submission_id === submissionId
        ? { ...toPlainObject(item), ...updatedRespondent }
        : toPlainObject(item)
    );
    targetCache.set(cacheKey, { ...cached, data: updatedData });
    console.debug(
      `[updateAllRelevantCaches] Updated target cache for key: ${cacheKey}`
    );
  } else {
    console.debug(`[updateAllRelevantCaches] Cache key not found: ${cacheKey}`);
  }
};

// fetchAnswerGroupPublic Thunk
export const fetchAnswerGroupPublic = createAsyncThunk(
  "answers/fetchAnswerGroupPublic",
  async (
    {
      page = 1,
      perPage = 10,
      searchQuery = "",
      fromDate = "",
      toDate = "",
      periodId = null,
      fromCache = false,
      activeTab = "card",
      userAll = true,
      signal,
    },
    { rejectWithValue, getState }
  ) => {
    try {
      const params = {
        page,
        perPage,
        search: searchQuery,
        fromDate,
        toDate,
        period_id: periodId,
        activeTab,
        userAll,
      };
      const cacheKey = JSON.stringify({
        page,
        perPage,
        search: searchQuery,
        fromDate,
        toDate,
        periodId: periodId,
      });
      if (fromCache && respondentCache.has(cacheKey) && page !== 1) {
        return respondentCache.get(cacheKey);
      }

      const res = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/answer/group/respondent/public`,
        { params, signal }
      );
      console.log("Fetched public answer group:", res.data);

      const state = getState();
      const rawRespondents = periodId
        ? state.answers.respondentsByPeriod[periodId]?.data || []
        : state.answers.respondents || [];

      const reduxRespondents = rawRespondents.map((r) => toPlainObject(r));

      const newSubmissions = reduxRespondents.filter(
        (r) =>
          r.isNew &&
          !res.data.data.some((d) => d.submission_id === r.submission_id)
      );

      const mergedData = JSON.parse(
        JSON.stringify({
          ...res.data,
          data: [...newSubmissions, ...res.data.data],
          total: res.data.total + newSubmissions.length,
          total_visible:
            res.data.total_visible +
            newSubmissions.filter(
              (r) => r.validation_status?.label !== "Belum_Diverifikasi"
            ).length,
          total_hidden:
            res.data.total_hidden +
            newSubmissions.filter(
              (r) => r.validation_status?.label === "Belum_Diverifikasi"
            ).length,
        })
      );

      publicRespondentCache.set(cacheKey, mergedData);
      return mergedData;
    } catch (error) {
      if (error.name === "AbortError") {
        // Silently handle cancellation without logging as error
        return rejectWithValue("Request aborted");
      }
      console.error("Fetch answer group error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// src/helpers/statusHelper.js
export const getStatusFromResult = (
  status,
  is_approve,
  selection_type,
  is_published = true
) => {
  let statusLabel = "Belum_Diverifikasi";

  if (is_approve === true) statusLabel = "Berkas_Diterima";
  else if (is_approve === false) statusLabel = "Berkas_Dikembalikan";

  if (selection_type !== null && !is_published) {
    statusLabel = "Menunggu_Hasil";
  }

  if (is_published) {
    if (status === true) statusLabel = "Lulus";
    else if (status === false && selection_type !== null) {
      statusLabel = "Tidak_Lulus";
    }
  }

  return statusLabel;
};

// Fungsi untuk membuat objek validation_status
export const generateCacheKey = ({
  page,
  perPage,
  searchQuery,
  fromDate,
  toDate,
  periodId,
  userRole,
  user_id,
}) =>
  JSON.stringify({
    page,
    perPage,
    search: searchQuery,
    fromDate,
    toDate,
    period_id: periodId,
    userRole,
    user_id,
  });

// fetchAnswerGroup Thunk
export const fetchAnswerGroup = createAsyncThunk(
  "answers/fetchAnswerGroup",
  async (
    {
      page = 1,
      perPage = 10,
      searchQuery = "",
      fromDate = "",
      toDate = "",
      periodId = null,
      fromCache = false,
      activeTab = "card",
      userAll = false,
      signal,
      skipStatusTotals = false,
      user_id: userId,
    },
    { rejectWithValue, getState, dispatch }
  ) => {
    try {
      const state = getState();
      const userRole = state.auth.user?.role;

      const params = {
        page,
        perPage,
        search: searchQuery,
        fromDate,
        toDate,
        period_id: periodId, // ✅ API butuh snake_case
        activeTab,
        userAll,
        userRole,
        user_id: userId,
      };

      const cacheKey = generateCacheKey({
        page,
        perPage,
        searchQuery,
        fromDate,
        toDate,
        periodId,
        userRole,
        user_id: userId,
      });

      if (fromCache && respondentCache.has(cacheKey)) {
        console.debug(
          "[fetchAnswerGroup] Returning cached data for:",
          cacheKey
        );
        return respondentCache.get(cacheKey);
      }

      const res = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/answer/group/respondent`,
        { params, signal }
      );
      console.log("Fetched answer group:", res.data);

      const reduxRespondents = periodId
        ? state.answers.respondentsByPeriod[periodId]?.data || []
        : state.answers.respondents || [];

      const newSubmissions = reduxRespondents.filter(
        (r) =>
          r.isNew &&
          !res.data.data.some((d) => d.submission_id === r.submission_id)
      );

      const mergedData = {
        ...res.data,
        data: [...newSubmissions, ...res.data.data],
        total: res.data.total + newSubmissions.length,
        total_visible:
          res.data.total_visible +
          newSubmissions.filter(
            (r) => r.validation_status?.label !== "Belum_Diverifikasi"
          ).length,
        total_hidden:
          res.data.total_hidden +
          newSubmissions.filter(
            (r) => r.validation_status?.label === "Belum_Diverifikasi"
          ).length,
      };

      mergedData.data = mergedData.data.map((item) => {
        const match = reduxRespondents.find(
          (r) => r.submission_id === item.submission_id
        );
        return match?.isNew ? { ...toPlainObject(item), isNew: true } : item;
      });

      if (!skipStatusTotals && res.data.status_totals) {
        dispatch({
          type: "answers/updateStatusTotals",
          payload: {
            ...res.data.status_totals,
            total:
              (res.data.status_totals?.Belum_Diverifikasi || 0) +
              (res.data.status_totals?.Berkas_Diterima || 0) +
              (res.data.status_totals?.Berkas_Dikembalikan || 0) +
              (res.data.status_totals?.Lulus || 0) +
              (res.data.status_totals?.Tidak_Lulus || 0),
          },
        });
      }

      respondentCache.set(cacheKey, mergedData);

      newSubmissions.forEach((newR) => {
        dispatch({
          type: "answers/updateRespondentInPeriod",
          payload: {
            periodId,
            submissionId: newR.submission_id,
            updatedRespondent: newR,
          },
        });
      });

      return mergedData;
    } catch (error) {
      if (error.name === "AbortError" || error.name === "CanceledError") {
        return rejectWithValue("Request aborted");
      }
      console.error("Fetch answer group error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchRespondentByKey = createAsyncThunk(
  "answers/fetchRespondentByKey",
  async (key, { rejectWithValue, getState }) => {
    try {
      const cacheEntry = respondentDetailCache.get(key);
      const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

      if (
        cacheEntry &&
        Date.now() - cacheEntry.timestamp < CACHE_EXPIRY_MS &&
        cacheEntry.data?.answers?.length > 0
      ) {
        console.log("[fetchRespondentByKey] Cache hit for:", key);
        return { key, ...cacheEntry };
      }

      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/answer/group/respondent/${key}`
      );
      console.log("[fetchRespondentByKey] API response:", key, response.data);

      const answers = response.data.data?.answers || [];
      const sanitizedAnswers = answers.map((answer) => {
        if (
          (answer.type === "radio" || answer.type === "checkbox") &&
          answer.options
        ) {
          try {
            const parsedOptions =
              typeof answer.options === "string"
                ? JSON.parse(answer.options)
                : answer.options;
            if (
              !Array.isArray(parsedOptions) ||
              !parsedOptions.every(
                (opt) =>
                  opt &&
                  typeof opt === "object" &&
                  "id" in opt &&
                  "label" in opt
              )
            ) {
              console.warn(
                `Invalid options for answer ${answer.id}:`,
                answer.options
              );
              return { ...answer, options: [] };
            }
            return { ...answer, options: parsedOptions };
          } catch (e) {
            console.error(
              `Failed to parse options for answer ${answer.id}:`,
              e,
              answer.options
            );
            return { ...answer, options: [] };
          }
        }
        return answer;
      });

      const totalPages =
        answers.length > 0 ? Math.max(...answers.map((q) => q.page)) : 0;

      const state = getState();
      const periodId =
        response.data.data?.answers?.[0]?.period_id ||
        response.data.data?.period?.id;

      const rawList = state.answers.respondentsByPeriod?.[periodId]?.data;

      let respondents = [];
      if (Array.isArray(rawList)) {
        respondents = rawList.map((r) => toPlainObject(r));
      }

      const respondent = respondents.find((r) => r.submission_id === key);

      // ✅ CRITICAL: Preserve isNew flag dari Redux
      const isNew = respondent ? !!respondent.isNew : false;

      const result = {
        data: {
          ...toPlainObject(response.data.data),
          answers: sanitizedAnswers,
          isNew, // ✅ Preserve flag
          period_id: periodId || response.data.data?.period?.id,
        },
        totalPages,
        timestamp: Date.now(),
      };

      respondentDetailCache.set(key, result);
      console.log("[fetchRespondentByKey] Cached result:", key, result);
      return { key, ...result };
    } catch (error) {
      console.error("[fetchRespondentByKey] Error:", key, error);
      return rejectWithValue(
        error.response?.data || "Failed to fetch respondent"
      );
    }
  }
);

export const submitAnswers = createAsyncThunk(
  "answers/submit",
  async (formData, { rejectWithValue, dispatch }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/enggang/answer`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );

      const newSubmission = response.data.data || response.data;

      dispatch({
        type: "answers/addNewSubmission",
        payload: {
          ...newSubmission,
          isNew: true,
          validation_status: getValidationStatusObject("Belum_Diverifikasi"),
        },
      });

      // ❌ HAPUS: Force refresh yang meng-override data
      // await dispatch(
      //   fetchAnswerGroup({
      //     page: 1,
      //     perPage: 10,
      //     periodId: periodId || filters.selectedPeriodId,
      //     searchQuery: filters.searchQuery,
      //     fromDate: filters.fromDate,
      //     toDate: filters.toDate,
      //     fromCache: false, // ❌ Ini yang menyebabkan replace
      //   })
      // );

      // ✅ Cukup andalkan Redux state yang sudah di-update
      return response.data;
    } catch (error) {
      console.error("Submission error in thunk:", error.response?.data);
      return rejectWithValue(
        error.response?.data || { message: "Unknown error" }
      );
    }
  }
);

export const deleteRespondents = createAsyncThunk(
  "respondents/deleteRespondents",
  async (submissionIds, { rejectWithValue, dispatch }) => {
    try {
      await Promise.all(
        submissionIds.map((submissionId) =>
          axios.post(
            `${process.env.REACT_APP_API}api/enggang/answer/respondent/delete/${submissionId}`
          )
        )
      );
      submissionIds.forEach((submissionId) =>
        dispatch(removeRespondent(submissionId))
      );
      return submissionIds;
    } catch (err) {
      console.error("Delete respondents error:", err);
      return rejectWithValue(
        err.response?.data || "Failed to delete respondents"
      );
    }
  }
);

export const deleteRespondent = createAsyncThunk(
  "respondents/deleteRespondent",
  async (submissionId, { rejectWithValue, dispatch }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/enggang/answer/respondent/delete/${submissionId}`
      );
      if (response.data.success) {
        dispatch(removeRespondent(submissionId));
        return submissionId;
      } else {
        throw new Error(response.data.message || "Failed to delete respondent");
      }
    } catch (error) {
      console.error("Delete respondent error:", error);
      return rejectWithValue(
        error.response?.data || "Failed to delete respondent"
      );
    }
  }
);

export const fetchResult = createAsyncThunk(
  "answers/fetchResult",
  async ({ submission_id }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/respondent/result/${submission_id}`
      );
      console.log("Fetch result request:", submission_id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch result");
    }
  }
);
export const verifyResult = createAsyncThunk(
  "answers/verifyResult",
  async (
    { submission_id, is_approve },
    { rejectWithValue, dispatch, getState }
  ) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/respondent/result/verify/${submission_id}`,
        { is_approve },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to verify result");
      }

      const updatedResult = toPlainObject(response.data.result); // ✅ clone result
      const newStatus = getStatusFromResult(
        updatedResult.status,
        updatedResult.is_approve,
        updatedResult.selection_type
      );
      const validationStatusObject = getValidationStatusObject(newStatus);

      const state = getState();

      // ✅ AMAN: clone dari redux state atau cache
      const rawRespondent =
        state.answers.respondents.find(
          (r) => r.submission_id === submission_id
        ) ?? respondentDetailCache.get(submission_id)?.data;

      if (!rawRespondent) {
        throw new Error("Respondent not found");
      }

      const respondent = toPlainObject(rawRespondent); // ✅ clone agar bukan proxy

      const periodId =
        respondent?.answers?.[0]?.period?.id ??
        respondentDetailCache.get(submission_id)?.data?.answers?.[0]?.period
          ?.id ??
        null;

      // ✅ Dispatch ke Redux
      dispatch({
        type: "answers/updateResultState",
        payload: {
          submission_id,
          result: updatedResult,
          validation_status: validationStatusObject,
          period_id: periodId,
          userRole: state.auth.user?.role || "guest",
        },
      });

      dispatch({ type: "answers/recalculateStatusTotalsLocal" });

      // ✅ Build updatedRespondent
      const updatedRespondent = {
        ...respondent,
        submission_id,
        result: updatedResult,
        validation_status: validationStatusObject,
      };

      const safeUpdatedRespondent = toPlainObject(updatedRespondent);
      updateAllRelevantCaches(state, safeUpdatedRespondent);
      updateAllRelevantCaches(state, safeUpdatedRespondent, true);

      // ✅ Set ke respondentDetailCache
      respondentDetailCache.set(submission_id, {
        data: toPlainObject(updatedRespondent),
        totalPages:
          updatedRespondent.answers?.length > 0
            ? Math.max(...updatedRespondent.answers.map((q) => q.page))
            : 1,
        timestamp: Date.now(),
      });
      // ✅ Setelah updateAllRelevantCaches & respondentDetailCache
      const periodData = state.answers.respondentsByPeriod?.[periodId];
      if (periodData) {
        const updatedList = periodData.data.map((item) =>
          item.submission_id === submission_id ? safeUpdatedRespondent : item
        );

        dispatch({
          type: "answers/updateRespondentsByPeriod",
          payload: {
            periodId,
            data: updatedList,
            current_page: periodData.current_page,
            last_page: periodData.last_page,
            loading: false,
          },
        });
      }

      return updatedResult;
    } catch (error) {
      console.error("[verifyResult] Error verifying result:", error);
      return rejectWithValue(error.response?.data || "Failed to verify result");
    }
  }
);

export const updateResult = createAsyncThunk(
  "answers/updateResult",
  async (
    { submission_id, selection_type, value, status, is_approve },
    { rejectWithValue, dispatch, getState }
  ) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API}api/respondent/result/${submission_id}`,
        { selection_type, value, status, is_approve },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to update result");
      }

      const updatedResult = toPlainObject(response.data.result); // ✅ clone awal

      // Ambil respondent dari state atau cache (clone!)
      let rawRespondent =
        getState().answers.respondents.find(
          (r) => r.submission_id === submission_id
        ) ?? respondentDetailCache.get(submission_id)?.data;

      if (!rawRespondent) {
        const respondentData = await dispatch(
          fetchRespondentByKey(submission_id)
        ).unwrap();
        rawRespondent = respondentData?.data;
        if (!rawRespondent) {
          throw new Error("Respondent not found");
        }
      }

      const respondent = toPlainObject(rawRespondent); // ✅ fix proxy risk

      const periodId =
        respondent?.answers?.[0]?.period?.id ??
        respondentDetailCache.get(submission_id)?.data?.answers?.[0]?.period
          ?.id ??
        null;

      // Hitung ulang status validasi
      const newStatus = getStatusFromResult(
        updatedResult.result.status,
        updatedResult.result.is_approve,
        updatedResult.result.selection_type
      );

      const validationStatusObject = getValidationStatusObject(newStatus);

      const state = getState();
      dispatch({
        type: "answers/updateResultState",
        payload: {
          submission_id,
          result: updatedResult.result,
          validation_status: validationStatusObject,
          period_id: periodId,
          userRole: state.auth.user?.role || "guest",
        },
      });

      dispatch({ type: "answers/recalculateStatusTotalsLocal" });

      const updatedRespondent = {
        ...respondent,
        submission_id,
        result: updatedResult.result,
        validation_status: validationStatusObject,
      };

      const safeUpdatedRespondent = toPlainObject(updatedRespondent);
      updateAllRelevantCaches(state, safeUpdatedRespondent);
      updateAllRelevantCaches(state, safeUpdatedRespondent, true);

      respondentDetailCache.set(submission_id, {
        data: toPlainObject(updatedRespondent), // ✅ fix di cache
        totalPages:
          updatedRespondent.answers?.length > 0
            ? Math.max(...updatedRespondent.answers.map((q) => q.page))
            : 1,
        timestamp: Date.now(),
      });
      const periodData = state.answers.respondentsByPeriod?.[periodId];
      if (periodData) {
        const updatedList = periodData.data.map((item) =>
          item.submission_id === submission_id ? safeUpdatedRespondent : item
        );

        dispatch({
          type: "answers/updateRespondentsByPeriod",
          payload: {
            periodId,
            data: updatedList,
            current_page: periodData.current_page,
            last_page: periodData.last_page,
            loading: false,
          },
        });
      }

      console.log(
        `[updateResult] Updated submission ${submission_id} to status: ${newStatus}`
      );

      return updatedResult.result;
    } catch (error) {
      console.error("[updateResult] Error:", error);
      return rejectWithValue({
        message: error.message || "Failed to update result",
        code: error.response?.status || 500,
      });
    }
  }
);

// In answerSlice
// Async thunk untuk update submission
// Di Redux slice/thunk file Anda (contoh: answerSlice.js)

export const updateSubmission = createAsyncThunk(
  "answers/updateSubmission",
  async ({ submissionId, payload }, { rejectWithValue }) => {
    try {
      console.log("Redux updateSubmission called:", {
        submissionId,
        payload: payload instanceof FormData ? "FormData object" : payload,
      });

      const config = {
        headers: {
          Accept: "application/json",
        },
      };

      let requestData = payload;

      if (!(payload instanceof FormData)) {
        config.headers["Content-Type"] = "application/json";
      }
      // For FormData, do not set Content-Type; let browser handle it with boundary

      const response = await axios.post(
        `${process.env.REACT_APP_API}api/enggang/answer/update-submission/${submissionId}`,
        requestData,
        config
      );

      console.log("Update response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Redux updateSubmission error:", error);
      console.error("Error response:", error.response?.data);

      const errorData = error.response?.data || {};
      const errorMessage = errorData.message || error.message;
      const validationErrors = errorData.errors || {};

      return rejectWithValue({
        message: errorMessage,
        errors: validationErrors,
        status: error.response?.status,
        debug: errorData.debug,
      });
    }
  }
);
// Alternatif tanpa Content-Type (biarkan browser yang set)
export const updateSubmissionAlt = createAsyncThunk(
  "answers/updateSubmission",
  async ({ submissionId, formData }, { rejectWithValue }) => {
    try {
      console.log("Redux updateSubmission called:", {
        submissionId,
        formData:
          formData instanceof FormData ? "FormData object" : typeof formData,
      });

      // Debug: Log all FormData entries in Redux
      if (formData instanceof FormData) {
        console.log("FormData entries in Redux:");
        for (let [key, value] of formData.entries()) {
          console.log(
            `Redux FormData ${key}:`,
            value instanceof File ? `File: ${value.name}` : value
          );
        }
      }

      // Biarkan axios menentukan Content-Type otomatis untuk FormData
      const response = await axios.post(`/answers/${submissionId}`, formData);

      console.log("Update response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Redux updateSubmission error:", error);
      console.error("Error response:", error.response?.data);

      return rejectWithValue(
        error.response?.data || {
          message: error.message,
          status: error.response?.status,
        }
      );
    }
  }
);

export const notifyResultUpdated = createAsyncThunk(
  "answers/notifyResultUpdated",
  async () => {
    return true;
  }
);

const answerSlice = createSlice({
  name: "answers",
  initialState: {
    viewMode: "card",
    // Private data state
    updatePage: (state, action) => {
      state.page = action.payload;
    },
    respondents: [],
    submissionsByUser: {
      userId: {
        data: [],
        current_page: 1,
        last_page: 1,
        total: 0,
      },
    },

    respondentsByPeriod: {},
    respondentDetails: {},
    enumOptions: [],
    answers: [],
    result: null,
    groupedRespondents: {},
    status: "idle",
    error: null,
    resultStatus: "idle",
    resultError: null,
    page: 1,
    perPage: 10,
    total: null,
    totalPages: 1,
    newSubmission: null,
    totalVisible: 0,
    totalHidden: 0,
    activeTab: "card",
    status_totals_full: {
      Total_Submissions: 0,
      Belum_Diverifikasi: 0,
      Belum_Ditentukan: 0,
      Menunggu_Hasil: 0,
      Berkas_Diterima: 0,
      Berkas_Dikembalikan: 0,
      Lulus: 0,
      Tidak_lulus: 0,
    },
    status_totals: {
      Total_Submissions: 0,
      Belum_Ditentukan: 0,
      Menunggu_Hasil: 0,
      Berkas_Diterima: 0,
      Berkas_Dikembalikan: 0,
      Lulus: 0,
      Tidak_lulus: 0,
    },
    // Public data state
    publicRespondents: [],
    publicRespondentsByPeriod: {},
    publicStatus: "idle",
    publicError: null,
    publicPage: 1,
    publicTotalPages: 1,
    publicTotal: null,
    publicTotalVisible: 0,
    publicTotalHidden: 0,
    publicStatusTotals: {
      Belum_Diverifikasi: 0,
      Belum_Ditentukan: 0,
      Berkas_Diterima: 0,
      Berkas_Dikembalikan: 0,
      Lulus: 0,
      Tidak_Lulus: 0,
    },
    filters: {
      searchQuery: "",
      fromDate: "",
      toDate: "",
      selectedPeriodId: null,
      questionId: null,
      specificAnswer: "",
      activeTab: "card",
    },
    previewFilters: {
      selectedPeriodId: null,
      searchQuery: "",
      fromDate: "",
      toDate: "",
      questionId: null,
      specificAnswer: "",
      activeTab: "card",
    },

    sortConfig: { key: null, direction: null },
    manualSortSnapshot: [],
    isManualSortFrozen: false,
    lastFetchParams: null,
    cacheInvalidationTimestamp: null,
    status_totals_status: "idle",
    updateLoading: false,
    updateError: null,
  },
  reducers: {
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },

    setPage: (state, action) => {
      state.page = action.payload;
    },
    setCacheInvalidationTimestamp: (state, action) => {
      state.cacheInvalidationTimestamp = action.payload;
    },

    setSubmissionPageForUser: (state, action) => {
      const { userId, page } = action.payload;
      if (!state.submissionsByUser[userId]) {
        state.submissionsByUser[userId] = { data: [], current_page: page };
      } else {
        state.submissionsByUser[userId].current_page = page;
      }
    },

    setLastFetchParams: (state, action) => {
      state.lastFetchParams = action.payload;
    },
    setSortConfig: (state, action) => {
      state.sortConfig = action.payload;
    },
    setManualSortSnapshot: (state, action) => {
      state.manualSortSnapshot = action.payload;
    },
    setIsManualSortFrozen: (state, action) => {
      state.isManualSortFrozen = action.payload;
    },
    resetAnswers: (state, action) => {
      // state.respondents = [];
      // state.respondentsByPeriod = {};
      // state.respondentDetails = {};
      // state.publicRespondents = [];
      // state.publicRespondentsByPeriod = {};
      // state.page = 1;
      // state.publicPage = 1;
      // state.totalPages = 1;
      // state.publicTotalPages = 1;
      // state.total = 0;
      // state.publicTotal = 0;
      state.status_totals = {
        Belum_Diverifikasi: action.payload?.["Belum_Diverifikasi"] || 0,
        Belum_Ditentukan: action.payload?.["Belum_Ditentukan"] || 0,
        Berkas_Diterima: action.payload?.["Berkas_Diterima"] || 0,
        Berkas_Dikembalikan: action.payload?.["Berkas_Dikembalikan"] || 0,
        Lulus: action.payload?.["Lulus"] || 0,
        Tidak_Lulus: action.payload?.["Tidak_Lulus"] || 0,
      };
      state.publicStatusTotals = {
        Belum_Diverifikasi: 0,
        Belum_Ditentukan: 0,
        Berkas_Diterima: 0,
        Berkas_Dikembalikan: 0,
        Lulus: 0,
        Tidak_Lulus: 0,
      };
      // state.sortConfig = { key: null, direction: null };
      // state.manualSortSnapshot = [];
      // state.isManualSortFrozen = false;
      // respondentCache.clear();
      // publicRespondentCache.clear();
      // periodRespondentCache.clear();
      // respondentDetailCache.clear();
    },
    resetInfiniteScroll: (state) => {
      state.respondents = [];
      state.respondentsByPeriod = {};
      state.respondentDetails = {};
      state.publicRespondents = [];
      state.publicRespondentsByPeriod = {};
      state.page = 1;
      state.publicPage = 1;
      state.totalPages = 1;
      state.publicTotalPages = 1;
      state.total = 0;
      state.publicTotal = 0;
      state.status_totals = {
        Belum_Diverifikasi: 0,
        Belum_Ditentukan: 0,
        Berkas_Diterima: 0,
        Berkas_Dikembalikan: 0,
        Lulus: 0,
        Tidak_Lulus: 0,
      };
      state.publicStatusTotals = {
        Belum_Diverifikasi: 0,
        Belum_Ditentukan: 0,
        Berkas_Diterima: 0,
        Berkas_Dikembalikan: 0,
        Lulus: 0,
        Tidak_Lulus: 0,
      };
    },
    setAnswers: (state, action) => {
      state.answers = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPreviewFilters: (state, action) => {
      state.previewFilters = { ...state.previewFilters, ...action.payload }; // ✅ Betul!
    },

    setActiveTab: (state, action) => {
      state.filters.activeTab = action.payload;
    },
    removeRespondent(state, action) {
      const submissionId = action.payload;

      const deletedRespondent =
        state.respondents.find((r) => r.submission_id === submissionId) ||
        state.respondentDetails[submissionId]?.data;

      const statusLabel =
        deletedRespondent?.validation_status?.label || "Belum_Diverifikasi";
      const status = statusLabel.replace(/\s+/g, "_");

      state.respondents = state.respondents.filter(
        (respondent) => respondent.submission_id !== submissionId
      );

      state.status_totals = {
        ...state.status_totals,
        [status]: Math.max((state.status_totals[status] || 0) - 1, 0),
      };

      state.total = Math.max((state.total || 0) - 1, 0);
      state.totalVisible = Math.max(
        (state.totalVisible || 0) - (status !== "Belum_Diverifikasi" ? 1 : 0),
        0
      );
      state.totalHidden = Math.max(
        (state.totalHidden || 0) - (status === "Belum_Diverifikasi" ? 1 : 0),
        0
      );

      for (const periodId in state.respondentsByPeriod) {
        state.respondentsByPeriod[periodId].data = state.respondentsByPeriod[
          periodId
        ].data.filter(
          (respondent) => respondent.submission_id !== submissionId
        );
      }

      delete state.respondentDetails[submissionId];

      updateAllRelevantCaches(state, { removedSubmissionId: submissionId });
      respondentDetailCache.delete(submissionId);
    },
    updateRespondentInPeriod: (state, action) => {
      const { periodId, submissionId, updatedRespondent } = action.payload;

      // ✅ Inisialisasi jika data belum ada
      if (!state.respondentsByPeriod[periodId]) {
        state.respondentsByPeriod[periodId] = {
          data: [updatedRespondent],
        };
        return;
      }

      const prevRespondent = state.respondentsByPeriod[periodId].data.find(
        (r) => r.submission_id === submissionId
      );

      const prevStatus =
        prevRespondent?.validation_status?.label?.replace(/\s+/g, "_") ||
        "Belum_Diverifikasi";
      const newStatus =
        updatedRespondent.validation_status?.label?.replace(/\s+/g, "_") ||
        "Belum_Ditentukan";

      // ✅ Update data: replace atau push
      const index = state.respondentsByPeriod[periodId].data.findIndex(
        (r) => r.submission_id === submissionId
      );

      if (index !== -1) {
        state.respondentsByPeriod[periodId].data[index] = {
          ...state.respondentsByPeriod[periodId].data[index],
          result: updatedRespondent.result,
          validation_status: updatedRespondent.validation_status,
        };
      } else {
        state.respondentsByPeriod[periodId].data.unshift(updatedRespondent);
      }

      // ✅ Update status totals
      const newStatusTotals = { ...state.status_totals };
      if (prevStatus !== newStatus) {
        newStatusTotals[prevStatus] = Math.max(
          (newStatusTotals[prevStatus] || 0) - 1,
          0
        );
        newStatusTotals[newStatus] = (newStatusTotals[newStatus] || 0) + 1;
      }

      state.status_totals = newStatusTotals;
      state.total =
        (newStatusTotals.Belum_Diverifikasi || 0) +
        (newStatusTotals.Berkas_Diterima || 0) +
        (newStatusTotals.Berkas_Dikembalikan || 0) +
        (newStatusTotals.Lulus || 0) +
        (newStatusTotals.Tidak_Lulus || 0);

      state.totalVisible = state.respondents.filter(
        (r) => r.validation_status?.label !== "Belum_Diverifikasi"
      ).length;
      state.totalHidden = state.respondents.filter(
        (r) => r.validation_status?.label === "Belum_Diverifikasi"
      ).length;

      // updateAllRelevantCaches(state, updatedRespondent);
      const safeUpdatedRespondent = toPlainObject(updatedRespondent);
      updateAllRelevantCaches(state, safeUpdatedRespondent);
      updateAllRelevantCaches(state, safeUpdatedRespondent, true);

      // ✅ Perbarui respondent detail juga jika tersedia
      if (state.respondentDetails[submissionId]) {
        state.respondentDetails[submissionId].data = {
          ...state.respondentDetails[submissionId].data,
          result: updatedRespondent.result,
          validation_status: updatedRespondent.validation_status,
        };
      }
    },

    syncRespondentsWithPeriod: (state, action) => {
      const updatedPeriod = action.payload;

      if (
        !updatedPeriod?.id ||
        !updatedPeriod?.title ||
        updatedPeriod?.status === undefined
      ) {
        return;
      }

      // Update private respondents
      state.respondents = state.respondents.map((respondent) => {
        const firstAnswer = respondent.answers?.[0];
        if (firstAnswer && firstAnswer.period_id === updatedPeriod.id) {
          const updatedPeriodData = {
            id: updatedPeriod.id,
            key: updatedPeriod.key || respondent.period?.key || "",
            title: updatedPeriod.title,
            is_published: updatedPeriod.is_published,
            status: updatedPeriod.status,
            description:
              updatedPeriod.description || respondent.period?.description || "",
            created_at:
              updatedPeriod.created_at || respondent.period?.created_at || "",
            updated_at:
              updatedPeriod.updated_at || respondent.period?.updated_at || "",
          };

          const updatedRespondent = {
            ...respondent,
            period: {
              id: updatedPeriod.id,
              title: updatedPeriod.title,
              is_published: updatedPeriod.is_published,
              status: updatedPeriod.status,
            },
            answers: respondent.answers.map((answer) => {
              if (answer.period_id === updatedPeriod.id) {
                return {
                  ...answer,
                  period: updatedPeriodData,
                };
              }
              return answer;
            }),
            period_status: updatedPeriod.status,
          };

          if (state.respondentDetails[respondent.submission_id]) {
            state.respondentDetails[respondent.submission_id].data =
              updatedRespondent;
          }

          return updatedRespondent;
        }
        return respondent;
      });

      // Update public respondents
      state.publicRespondents = state.publicRespondents.map((respondent) => {
        const firstAnswer = respondent.answers?.[0];
        if (firstAnswer && firstAnswer.period_id === updatedPeriod.id) {
          const updatedPeriodData = {
            id: updatedPeriod.id,
            key: updatedPeriod.key || respondent.period?.key || "",
            title: updatedPeriod.title,
            is_published: updatedPeriod.is_published,
            status: updatedPeriod.status,
            description:
              updatedPeriod.description || respondent.period?.description || "",
            created_at:
              updatedPeriod.created_at || respondent.period?.created_at || "",
            updated_at:
              updatedPeriod.updated_at || respondent.period?.updated_at || "",
          };

          const updatedRespondent = {
            ...respondent,
            period: {
              id: updatedPeriod.id,
              title: updatedPeriod.title,
              is_published: updatedPeriod.is_published,
              status: updatedPeriod.status,
            },
            answers: respondent.answers.map((answer) => {
              if (answer.period_id === updatedPeriod.id) {
                return {
                  ...answer,
                  period: updatedPeriodData,
                };
              }
              return answer;
            }),
            period_status: updatedPeriod.status,
          };

          return updatedRespondent;
        }
        return respondent;
      });

      if (state.respondentsByPeriod[updatedPeriod.id]) {
        state.respondentsByPeriod[updatedPeriod.id].data =
          state.respondents.filter(
            (respondent) =>
              respondent.answers?.[0]?.period_id === updatedPeriod.id
          );
      }

      if (state.publicRespondentsByPeriod[updatedPeriod.id]) {
        state.publicRespondentsByPeriod[updatedPeriod.id].data =
          state.publicRespondents.filter(
            (respondent) =>
              respondent.answers?.[0]?.period_id === updatedPeriod.id
          );
      }

      const updatedCacheKeys = [];
      for (const [cacheKey, cacheData] of respondentCache.entries()) {
        try {
          const params = JSON.parse(cacheKey);
          if (!params.period_id || params.period_id === updatedPeriod.id) {
            const updatedPeriodData = {
              id: updatedPeriod.id,
              key: updatedPeriod.key || "",
              title: updatedPeriod.title,
              is_published: updatedPeriod.is_published,
              status: updatedPeriod.status,
              description: updatedPeriod.description || "",
              created_at: updatedPeriod.created_at || "",
              updated_at: updatedPeriod.updated_at || "",
            };

            const updatedData = {
              ...cacheData,
              data: cacheData.data.map((respondent) => {
                const firstAnswer = respondent.answers?.[0];
                if (firstAnswer && firstAnswer.period_id === updatedPeriod.id) {
                  return {
                    ...respondent,
                    period: {
                      id: updatedPeriod.id,
                      title: updatedPeriod.title,
                      is_published: updatedPeriod.is_published,
                      status: updatedPeriod.status,
                    },
                    answers: respondent.answers.map((answer) => {
                      if (answer.period_id === updatedPeriod.id) {
                        return {
                          ...answer,
                          period: updatedPeriodData,
                        };
                      }
                      return answer;
                    }),
                    period_status: updatedPeriod.status,
                  };
                }
                return respondent;
              }),
            };
            respondentCache.set(cacheKey, updatedData);
            updatedCacheKeys.push(cacheKey);
          }
        } catch (e) {
          console.warn("Skipping invalid cache key:", cacheKey, e);
        }
      }

      for (const [cacheKey, cacheData] of publicRespondentCache.entries()) {
        try {
          const params = JSON.parse(cacheKey);
          if (!params.period_id || params.period_id === updatedPeriod.id) {
            const updatedPeriodData = {
              id: updatedPeriod.id,
              key: updatedPeriod.key || "",
              title: updatedPeriod.title,
              is_published: updatedPeriod.is_published,
              status: updatedPeriod.status,
              description: updatedPeriod.description || "",
              created_at: updatedPeriod.created_at || "",
              updated_at: updatedPeriod.updated_at || "",
            };

            const updatedData = {
              ...cacheData,
              data: cacheData.data.map((respondent) => {
                const firstAnswer = respondent.answers?.[0];
                if (firstAnswer && firstAnswer.period_id === updatedPeriod.id) {
                  return {
                    ...respondent,
                    period: {
                      id: updatedPeriod.id,
                      title: updatedPeriod.title,
                      is_published: updatedPeriod.is_published,
                      status: updatedPeriod.status,
                    },
                    answers: respondent.answers.map((answer) => {
                      if (answer.period_id === updatedPeriod.id) {
                        return {
                          ...answer,
                          period: updatedPeriodData,
                        };
                      }
                      return answer;
                    }),
                    period_status: updatedPeriod.status,
                  };
                }
                return respondent;
              }),
            };
            publicRespondentCache.set(cacheKey, updatedData);
            updatedCacheKeys.push(cacheKey);
          }
        } catch (e) {
          console.warn("Skipping invalid cache key:", cacheKey, e);
        }
      }
    },
    // answerSlice.js
    clearNewSubmissionStatus: (state, action) => {
      const submissionId = action.payload;

      // Ubah isNew menjadi false di respondents
      state.respondents = state.respondents.map((respondent) =>
        respondent.submission_id === submissionId
          ? { ...respondent, isNew: false }
          : respondent
      );

      // Ubah isNew menjadi false di publicRespondents
      state.publicRespondents = state.publicRespondents.map((respondent) =>
        respondent.submission_id === submissionId
          ? { ...respondent, isNew: false }
          : respondent
      );

      // Cari periodId yang relevan dari respondent
      const targetRespondent = state.respondents.find(
        (r) => r.submission_id === submissionId
      );
      const periodId = targetRespondent?.answers?.[0]?.period_id;

      // Perbarui respondentsByPeriod hanya untuk periodId yang relevan
      if (periodId && state.respondentsByPeriod[periodId]) {
        state.respondentsByPeriod[periodId].data = state.respondentsByPeriod[
          periodId
        ].data.map((respondent) =>
          respondent.submission_id === submissionId
            ? { ...respondent, isNew: false }
            : respondent
        );
      }

      // Perbarui publicRespondentsByPeriod hanya untuk periodId yang relevan
      if (periodId && state.publicRespondentsByPeriod[periodId]) {
        state.publicRespondentsByPeriod[periodId].data =
          state.publicRespondentsByPeriod[periodId].data.map((respondent) =>
            respondent.submission_id === submissionId
              ? { ...respondent, isNew: false }
              : respondent
          );
      }

      // Perbarui respondentDetails
      if (state.respondentDetails[submissionId]) {
        state.respondentDetails[submissionId].data = {
          ...state.respondentDetails[submissionId].data,
          isNew: false,
        };
      }

      // Perbarui semua cache yang relevan
      const updateCache = (cache) => {
        cache.forEach((cachedData, key) => {
          if (cachedData.data.some((r) => r.submission_id === submissionId)) {
            cachedData.data = cachedData.data.map((respondent) =>
              respondent.submission_id === submissionId
                ? { ...respondent, isNew: false }
                : respondent
            );
            cache.set(key, cachedData);
          }
        });
      };

      updateCache(respondentCache);
      updateCache(publicRespondentCache);

      // Hapus newSubmission dari state
      if (state.newSubmission?.submission_id === submissionId) {
        state.newSubmission = null;
      }
    },

    // Di answerSlice.js reducers
    addNewSubmission: (state, action) => {
      const newSubmission = { ...action.payload, isNew: true };
      const submissionId = newSubmission.submission_id;

      if (state.respondents.some((r) => r.submission_id === submissionId)) {
        console.debug(
          `[answerSlice] Submission ${submissionId} already exists in global respondents, skipping`
        );
        return;
      }

      console.debug(`[answerSlice] Adding new submission:`, newSubmission);

      const validationStatus =
        newSubmission.validation_status?.label || "Belum_Diverifikasi";
      const normalizedStatus = validationStatus.replace(/\s+/g, "_");

      // Tambahkan ke respondents global
      state.respondents = [newSubmission, ...state.respondents];
      state.total = (state.total || 0) + 1;
      state.totalVisible =
        validationStatus !== "Belum_Diverifikasi"
          ? (state.totalVisible || 0) + 1
          : state.totalVisible || 0;
      state.totalHidden =
        validationStatus === "Belum_Diverifikasi"
          ? (state.totalHidden || 0) + 1
          : state.totalHidden || 0;
      state.status_totals[normalizedStatus] =
        (state.status_totals[normalizedStatus] || 0) + 1;

      // ✅ REMOVED: Jangan tambahkan ke respondentsByPeriod di sini
      // Biar addNewSubmissionToPeriod yang handle sepenuhnya

      // Tambahkan ke publicRespondents
      state.publicRespondents = [newSubmission, ...state.publicRespondents];
      state.publicTotal = (state.publicTotal || 0) + 1;
      state.publicTotalVisible =
        validationStatus !== "Belum_Diverifikasi"
          ? (state.publicTotalVisible || 0) + 1
          : state.publicTotalVisible || 0;
      state.publicTotalHidden =
        validationStatus === "Belum_Diverifikasi"
          ? (state.publicTotalHidden || 0) + 1
          : state.publicTotalHidden || 0;
      state.publicStatusTotals[normalizedStatus] =
        (state.publicStatusTotals[normalizedStatus] || 0) + 1;

      state.newSubmission = newSubmission;
    },

    addNewSubmissionToPeriod: (state, action) => {
      const { periodId, submission } = action.payload;
      const submissionId = submission.submission_id;

      console.debug(
        `[answerSlice] addNewSubmissionToPeriod for period ${periodId}, submission ${submissionId}`
      );

      // Preserve existing data
      const existingData = state.respondentsByPeriod[periodId]?.data || [];
      const existingMap = new Map(
        existingData.map((r) => [r.submission_id, r])
      );

      if (existingMap.has(submissionId)) {
        console.debug(
          `[answerSlice] Submission ${submissionId} already exists, updating...`
        );

        state.respondentsByPeriod[periodId].data = existingData.map((r) =>
          r.submission_id === submissionId
            ? { ...r, ...submission, isNew: r.isNew || submission.isNew }
            : r
        );
      } else {
        console.debug(`[answerSlice] Adding new submission ${submissionId}`);

        if (state.respondentsByPeriod[periodId]) {
          state.respondentsByPeriod[periodId].data = [
            { ...submission, isNew: true },
            ...existingData,
          ];
          state.respondentsByPeriod[periodId].total =
            (state.respondentsByPeriod[periodId].total || 0) + 1;
        } else {
          state.respondentsByPeriod[periodId] = {
            data: [{ ...submission, isNew: true }],
            loading: false,
            error: null,
            current_page: 1,
            last_page: 1,
            total: 1,
          };
        }
      }

      // Set skipNextFetch flag
      if (!state.respondentsByPeriod[periodId]) {
        state.respondentsByPeriod[periodId] = { data: [], skipNextFetch: true };
      }
      state.respondentsByPeriod[periodId].skipNextFetch = true;

      // ❌ HAPUS BARIS INI:
      // saveSkipNextFetchFlag(periodId);

      state.newSubmission = { ...submission, isNew: true };

      console.debug(
        `[answerSlice] Period ${periodId} now has ${state.respondentsByPeriod[periodId].data.length} items`
      );
    },

    // ✅ TAMBAHAN: Reducer baru untuk clear skipNextFetch
    clearSkipNextFetch: (state, action) => {
      const { periodId } = action.payload;
      if (state.respondentsByPeriod[periodId]) {
        state.respondentsByPeriod[periodId].skipNextFetch = false;

        // ✅ Clear dari sessionStorage
        clearSkipNextFetchFlag(periodId);

        console.debug(
          `[answerSlice] Cleared skipNextFetch for period ${periodId}`
        );
      }
    },

    // ✅ PERBAIKI: updateRespondentsByPeriod untuk preserve isNew
    updateRespondentsByPeriod: (state, action) => {
      const { periodId, data, current_page, last_page, loading } =
        action.payload;

      if (!state.respondentsByPeriod[periodId]) {
        state.respondentsByPeriod[periodId] = {
          data: data || [],
          loading: loading !== undefined ? loading : false,
          error: null,
          current_page: current_page || 1,
          last_page: last_page || 1,
          total: data?.length || 0,
        };
        return;
      }

      // ✅ CRITICAL: Preserve isNew dari existing data
      const existingData = state.respondentsByPeriod[periodId].data || [];
      const existingMap = new Map(
        existingData.map((item) => [item.submission_id, item])
      );

      const mergedData = (data || []).map((item) => {
        const existing = existingMap.get(item.submission_id);

        // preserve isNew dari existing
        if (existing && existing.isNew && !item.isNew) {
          return { ...item, isNew: true };
        }

        // kalau kebetulan ini submission yang baru saja dibuat → paksa isNew
        if (
          state.newSubmission &&
          state.newSubmission.submission_id === item.submission_id
        ) {
          return { ...item, isNew: true };
        }

        return item;
      });

      state.respondentsByPeriod[periodId] = {
        ...state.respondentsByPeriod[periodId],
        data: mergedData,
        loading:
          loading !== undefined
            ? loading
            : state.respondentsByPeriod[periodId].loading,
        current_page:
          current_page || state.respondentsByPeriod[periodId].current_page,
        last_page: last_page || state.respondentsByPeriod[periodId].last_page,
        total: mergedData.length,
      };
    },

    updateRespondentDetailsForPeriod: (state, action) => {
      const updatedPeriod = action.payload;

      if (!updatedPeriod?.id || !updatedPeriod?.title) {
        return;
      }

      // 1. Bersihkan respondentDetailCache
      for (const [
        submissionId,
        cacheEntry,
      ] of respondentDetailCache.entries()) {
        const firstAnswer = cacheEntry.data?.answers?.[0];
        if (firstAnswer && firstAnswer.period_id === updatedPeriod.id) {
          respondentDetailCache.delete(submissionId);
        }
      }

      const periodData = {
        id: updatedPeriod.id,
        key: updatedPeriod.key || "",
        title: updatedPeriod.title,
        is_published: updatedPeriod.is_published,
        status: updatedPeriod.status ?? true,
        description: updatedPeriod.description || "",
        created_at: updatedPeriod.created_at || "",
        updated_at: updatedPeriod.updated_at || "",
      };

      // 2. Update respondentDetails & cache
      for (const submissionId in state.respondentDetails) {
        const respondentRaw = state.respondentDetails[submissionId].data;
        const respondent = toPlainObject(respondentRaw); // ✅ clone before use
        const firstAnswer = respondent?.answers?.[0];
        if (firstAnswer && firstAnswer.period_id === updatedPeriod.id) {
          const updatedRespondent = {
            ...respondent,
            period: {
              id: updatedPeriod.id,
              title: updatedPeriod.title,
              status: updatedPeriod.status ?? true,
              is_published: updatedPeriod.is_published,
            },
            answers: respondent.answers.map((answer) =>
              answer.period_id === updatedPeriod.id
                ? { ...answer, period: periodData }
                : answer
            ),
            period_status: updatedPeriod.status ?? true,
          };

          state.respondentDetails[submissionId].data = updatedRespondent;

          if (respondentDetailCache.has(submissionId)) {
            const existing = toPlainObject(
              respondentDetailCache.get(submissionId)
            );
            respondentDetailCache.set(submissionId, {
              ...existing,
              data: toPlainObject(updatedRespondent), // ✅ clone before cache
            });
          }
        }
      }

      // 3. Update respondentCache
      for (const [cacheKey, cacheDataRaw] of respondentCache.entries()) {
        try {
          const params = JSON.parse(cacheKey);
          if (!params.period_id || params.period_id === updatedPeriod.id) {
            const cacheData = toPlainObject(cacheDataRaw); // ✅ clone
            const updatedData = {
              ...cacheData,
              data: cacheData.data.map((respondentRaw) => {
                const respondent = toPlainObject(respondentRaw);
                const firstAnswer = respondent.answers?.[0];
                if (firstAnswer && firstAnswer.period_id === updatedPeriod.id) {
                  return {
                    ...respondent,
                    period: {
                      id: updatedPeriod.id,
                      title: updatedPeriod.title,
                      is_published: updatedPeriod.is_published,
                      status: updatedPeriod.status ?? true,
                    },
                    answers: respondent.answers.map((answer) =>
                      answer.period_id === updatedPeriod.id
                        ? { ...answer, period: periodData }
                        : answer
                    ),
                    period_status: updatedPeriod.status ?? true,
                  };
                }
                return respondent;
              }),
            };
            respondentCache.set(cacheKey, updatedData);
          }
        } catch (e) {
          console.warn(
            "[updateRespondentDetailsForPeriod] Skipping invalid cache key:",
            cacheKey,
            e
          );
        }
      }

      // 4. Update publicRespondentCache
      for (const [cacheKey, cacheDataRaw] of publicRespondentCache.entries()) {
        try {
          const params = JSON.parse(cacheKey);
          if (!params.period_id || params.period_id === updatedPeriod.id) {
            const cacheData = toPlainObject(cacheDataRaw); // ✅ clone
            const updatedData = {
              ...cacheData,
              data: cacheData.data.map((respondentRaw) => {
                const respondent = toPlainObject(respondentRaw);
                const firstAnswer = respondent.answers?.[0];
                if (firstAnswer && firstAnswer.period_id === updatedPeriod.id) {
                  return {
                    ...respondent,
                    period: {
                      id: updatedPeriod.id,
                      title: updatedPeriod.title,
                      is_published: updatedPeriod.is_published,
                      status: updatedPeriod.status ?? true,
                    },
                    answers: respondent.answers.map((answer) =>
                      answer.period_id === updatedPeriod.id
                        ? { ...answer, period: periodData }
                        : answer
                    ),
                    period_status: updatedPeriod.status ?? true,
                  };
                }
                return respondent;
              }),
            };
            publicRespondentCache.set(cacheKey, updatedData);
          }
        } catch (e) {
          console.warn(
            "[updateRespondentDetailsForPeriod] Skipping invalid public cache key:",
            cacheKey,
            e
          );
        }
      }
    },
    // Di answerSlice.js

    updateResultState: (state, action) => {
      const {
        submission_id,
        result,
        validation_status,
        period_id,
        userRole = "guest",
      } = action.payload;

      console.debug(
        "[updateResultState] Processing submission:",
        submission_id,
        { result, validation_status, period_id, userRole }
      );

      const allowedRoles = ["administrator", "super admin", "user"];
      if (!allowedRoles.includes(userRole)) {
        console.warn("[updateResultState] Unauthorized role:", userRole);
        return;
      }

      // Clone all previous data
      const prevRespondentRaw = state.respondents.find(
        (r) => r.submission_id === submission_id
      );
      const prevPublicRespondentRaw = state.publicRespondents.find(
        (r) => r.submission_id === submission_id
      );

      const prevRespondent = toPlainObject(prevRespondentRaw);
      const prevPublicRespondent = toPlainObject(prevPublicRespondentRaw);

      const newStatusTotals = { ...state.status_totals };
      const newPublicStatusTotals = { ...state.publicStatusTotals };

      if (prevRespondent?.validation_status?.label) {
        newStatusTotals[prevRespondent.validation_status.label] =
          (newStatusTotals[prevRespondent.validation_status.label] || 0) - 1;
      }
      if (validation_status?.label) {
        newStatusTotals[validation_status.label] =
          (newStatusTotals[validation_status.label] || 0) + 1;
      }

      if (prevPublicRespondent?.validation_status?.label) {
        newPublicStatusTotals[prevPublicRespondent.validation_status.label] =
          (newPublicStatusTotals[
            prevPublicRespondent.validation_status.label
          ] || 0) - 1;
      }
      if (validation_status?.label) {
        newPublicStatusTotals[validation_status.label] =
          (newPublicStatusTotals[validation_status.label] || 0) + 1;
      }

      state.status_totals = newStatusTotals;
      state.publicStatusTotals = newPublicStatusTotals;

      // Update private respondents
      if (prevRespondent && (userRole !== "user" || prevRespondent)) {
        state.respondents = state.respondents.map((r) =>
          r.submission_id === submission_id
            ? {
                ...toPlainObject(r),
                result: { ...r.result, ...result },
                validation_status,
              }
            : r
        );

        if (period_id && state.respondentsByPeriod[period_id]) {
          state.respondentsByPeriod[period_id].data = state.respondentsByPeriod[
            period_id
          ].data.map((r) =>
            r.submission_id === submission_id
              ? {
                  ...toPlainObject(r),
                  result: { ...r.result, ...result },
                  validation_status,
                }
              : r
          );
        }

        if (state.respondentDetails[submission_id]) {
          const detail = toPlainObject(
            state.respondentDetails[submission_id].data
          );
          state.respondentDetails[submission_id].data = {
            ...detail,
            result: {
              ...detail.result,
              ...result,
            },
            validation_status,
          };
        }

        // Cache update (clone before save)
        respondentDetailCache.set(submission_id, {
          data: {
            ...prevRespondent,
            result: { ...prevRespondent?.result, ...result },
            validation_status,
          },
          totalPages: state.respondentDetails[submission_id]?.totalPages || 1,
          timestamp: Date.now(),
        });
      }

      // Update public respondents
      if (prevPublicRespondent) {
        state.publicRespondents = state.publicRespondents.map((r) =>
          r.submission_id === submission_id
            ? {
                ...toPlainObject(r),
                result: { ...r.result, ...result },
                validation_status,
              }
            : r
        );

        if (period_id && state.publicRespondentsByPeriod[period_id]) {
          state.publicRespondentsByPeriod[period_id].data =
            state.publicRespondentsByPeriod[period_id].data.map((r) =>
              r.submission_id === submission_id
                ? {
                    ...toPlainObject(r),
                    result: { ...r.result, ...result },
                    validation_status,
                  }
                : r
            );
        }
      }

      if (state.result?.submission_answers === submission_id) {
        state.result = {
          ...state.result,
          ...result,
        };
      }

      state.total = Object.values(newStatusTotals).reduce(
        (sum, val) => sum + val,
        0
      );
      state.publicTotal = Object.values(newPublicStatusTotals).reduce(
        (sum, val) => sum + val,
        0
      );

      state.totalVisible = state.respondents.filter(
        (r) => r.validation_status?.label !== "Belum_Diverifikasi"
      ).length;

      state.totalHidden = state.respondents.filter(
        (r) => r.validation_status?.label === "Belum_Diverifikasi"
      ).length;

      state.publicTotalVisible = state.publicRespondents.filter(
        (r) => r.validation_status?.label !== "Belum_Diverifikasi"
      ).length;

      state.publicTotalHidden = state.publicRespondents.filter(
        (r) => r.validation_status?.label === "Belum_Diverifikasi"
      ).length;

      const updatedRespondent = {
        ...(prevRespondent || prevPublicRespondent || {}),
        submission_id,
        result: {
          ...(prevRespondent?.result || prevPublicRespondent?.result || {}),
          ...result,
        },
        validation_status,
        answers: (prevRespondent || prevPublicRespondent)?.answers || [],
        period_id,
      };

      console.debug(
        "[updateResultState] Updating caches with:",
        updatedRespondent
      );

      updateAllRelevantCaches(state, toPlainObject(updatedRespondent));
      if (prevPublicRespondent) {
        updateAllRelevantCaches(state, toPlainObject(updatedRespondent), true);
      }

      state.cacheInvalidationTimestamp = Date.now();
    },
    updateStatusTotals: (state, action) => {
      state.status_totals = {
        Belum_Diverifikasi: action.payload["Belum_Diverifikasi"] || 0,
        Belum_Ditentukan: action.payload["Belum_Ditentukan"] || 0,
        Berkas_Diterima: action.payload["Berkas_Diterima"] || 0,
        Berkas_Dikembalikan: action.payload["Berkas_Dikembalikan"] || 0,
        Lulus: action.payload["Lulus"] || 0,
        Tidak_Lulus: action.payload["Tidak_Lulus"] || 0,
      };
      state.publicStatusTotals = {
        Belum_Diverifikasi: action.payload["Belum_Diverifikasi"] || 0,
        Belum_Ditentukan: action.payload["Belum_Ditentukan"] || 0,
        Berkas_Diterima: action.payload["Berkas_Diterima"] || 0,
        Berkas_Dikembalikan: action.payload["Berkas_Dikembalikan"] || 0,
        Lulus: action.payload["Lulus"] || 0,
        Tidak_Lulus: action.payload["Tidak_Lulus"] || 0,
      };
      state.total =
        state.status_totals["Belum_Diverifikasi"] +
        state.status_totals["Belum_Ditentukan"] +
        state.status_totals["Berkas_Diterima"] +
        state.status_totals["Berkas_Dikembalikan"] +
        state.status_totals["Lulus"] +
        state.status_totals["Tidak_Lulus"];
      state.publicTotal =
        state.publicStatusTotals["Belum_Diverifikasi"] +
        state.publicStatusTotals["Belum_Ditentukan"] +
        state.publicStatusTotals["Berkas_Diterima"] +
        state.publicStatusTotals["Berkas_Dikembalikan"] +
        state.publicStatusTotals["Lulus"] +
        state.publicStatusTotals["Tidak_Lulus"];
    },
    clearResultState: (state) => {
      state.result = null;
      state.resultStatus = "idle";
      state.resultError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchResult.pending, (state) => {
        state.resultStatus = "loading";
      })
      .addCase(fetchResult.fulfilled, (state, action) => {
        state.resultStatus = "succeeded";
        const newResult = action.payload.result || null;
        if (!isEqual(state.result, newResult)) {
          state.result = newResult;
        }
        state.enumOptions = action.payload.enumOptions || [];
      })
      .addCase(fetchResult.rejected, (state, action) => {
        state.resultStatus = "failed";
        state.resultError = action.payload;
      })
      .addCase(fetchRespondentByKey.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchRespondentByKey.fulfilled, (state, action) => {
        state.status = "succeeded";
        const { key, data, totalPages } = action.payload;
        state.respondentDetails[key] = { data, totalPages };
      })
      .addCase(fetchRespondentByKey.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.publicError = action.payload;
      })
      .addCase(verifyResult.pending, (state) => {
        state.status = "loading";
      })
      .addCase(verifyResult.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedResult = action.payload;
        if (!isEqual(state.result, updatedResult)) {
          state.result = isDraft(updatedResult)
            ? current(updatedResult)
            : updatedResult;
        }

        const submission_id = updatedResult.submission_answers;

        const respondent = state.respondents.find(
          (r) => r.submission_id === submission_id
        );
        const publicRespondent = state.publicRespondents.find(
          (r) => r.submission_id === submission_id
        );

        if (respondent) {
          const newStatus = getStatusFromResult(
            updatedResult.status,
            updatedResult.is_approve,
            updatedResult.selection_type
          );
          const validationStatus = getValidationStatusObject(newStatus);

          respondent.validation_status = validationStatus;
          respondent.result = { ...respondent.result, ...updatedResult };

          const periodId = respondent.answers?.[0]?.period_id;
          if (periodId && state.respondentsByPeriod[periodId]) {
            state.respondentsByPeriod[periodId].data =
              state.respondentsByPeriod[periodId].data.map((r) =>
                r.submission_id === submission_id
                  ? {
                      ...r,
                      validation_status: validationStatus,
                      result: { ...r.result, ...updatedResult },
                    }
                  : r
              );
          }

          if (state.respondentDetails[submission_id]) {
            state.respondentDetails[submission_id].data = {
              ...state.respondentDetails[submission_id].data,
              validation_status: validationStatus,
              result: {
                ...state.respondentDetails[submission_id].data.result,
                ...updatedResult,
              },
            };
          }

          updateAllRelevantCaches(state, {
            ...respondent,
            validation_status: validationStatus,
            result: { ...respondent.result, ...updatedResult },
            submission_id,
          });
        }

        if (publicRespondent) {
          const prevLabel =
            publicRespondent.validation_status?.label || "Belum_Diverifikasi";
          const prevStatus = prevLabel.replace(/\s+/g, "_");
          const newStatus = getStatusFromResult(
            updatedResult.status,
            updatedResult.is_approve,
            updatedResult.selection_type
          );
          const validationStatus = getValidationStatusObject(newStatus);

          const newPublicStatusTotals = { ...state.publicStatusTotals };
          if (prevStatus !== newStatus) {
            newPublicStatusTotals[prevStatus] = Math.max(
              (newPublicStatusTotals[prevStatus] || 0) - 1,
              0
            );
            newPublicStatusTotals[newStatus] =
              (newPublicStatusTotals[newStatus] || 0) + 1;
          }
          state.publicStatusTotals = newPublicStatusTotals;

          publicRespondent.validation_status = validationStatus;
          publicRespondent.result = {
            ...publicRespondent.result,
            ...updatedResult,
          };

          const periodId = publicRespondent.answers?.[0]?.period_id;
          if (periodId && state.publicRespondentsByPeriod[periodId]) {
            state.publicRespondentsByPeriod[periodId].data =
              state.publicRespondentsByPeriod[periodId].data.map((r) =>
                r.submission_id === submission_id
                  ? {
                      ...r,
                      validation_status: validationStatus,
                      result: { ...r.result, ...updatedResult },
                    }
                  : r
              );
          }

          updateAllRelevantCaches(
            state,
            {
              ...publicRespondent,
              validation_status: validationStatus,
              result: { ...publicRespondent.result, ...updatedResult },
              submission_id,
            },
            true
          );
        }

        // Hitung ulang status totals
        recalculateStatusTotals(state);
      })
      .addCase(verifyResult.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.publicError = action.payload;
      })
      .addCase(updateResult.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateResult.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedResult = action.payload;
        if (!isEqual(state.result, updatedResult)) {
          state.result = isDraft(updatedResult)
            ? current(updatedResult)
            : updatedResult;
        }

        const submission_id = updatedResult.submission_answers;

        const respondent = state.respondents.find(
          (r) => r.submission_id === submission_id
        );
        const publicRespondent = state.publicRespondents.find(
          (r) => r.submission_id === submission_id
        );

        if (respondent) {
          const newStatus = getStatusFromResult(
            updatedResult.status,
            updatedResult.is_approve,
            updatedResult.selection_type
          );
          const validationStatus = getValidationStatusObject(newStatus);

          state.respondents = state.respondents.map((r) =>
            r.submission_id === submission_id
              ? {
                  ...r,
                  result: { ...r.result, ...updatedResult },
                  validation_status: validationStatus,
                }
              : r
          );

          for (const periodId in state.respondentsByPeriod) {
            state.respondentsByPeriod[periodId].data =
              state.respondentsByPeriod[periodId].data.map((r) =>
                r.submission_id === submission_id
                  ? {
                      ...r,
                      result: { ...r.result, ...updatedResult },
                      validation_status: validationStatus,
                    }
                  : r
              );
          }

          if (state.respondentDetails[submission_id]) {
            state.respondentDetails[submission_id] = {
              ...state.respondentDetails[submission_id],
              data: {
                ...state.respondentDetails[submission_id].data,
                result: {
                  ...state.respondentDetails[submission_id].data.result,
                  ...updatedResult,
                },
                validation_status: validationStatus,
              },
            };
          }

          updateAllRelevantCaches(state, {
            ...respondent,
            result: updatedResult,
            validation_status: validationStatus,
          });
        }

        if (publicRespondent) {
          const prevStatus =
            publicRespondent.validation_status?.label?.replace(/\s+/g, "_") ||
            "Belum_Diverifikasi";
          const newStatus = getStatusFromResult(
            updatedResult.status,
            updatedResult.is_approve,
            updatedResult.selection_type
          );
          const validationStatus = getValidationStatusObject(newStatus);

          const newPublicStatusTotals = { ...state.publicStatusTotals };
          if (prevStatus !== newStatus) {
            newPublicStatusTotals[prevStatus] = Math.max(
              (newPublicStatusTotals[prevStatus] || 0) - 1,
              0
            );
            newPublicStatusTotals[newStatus] =
              (newPublicStatusTotals[newStatus] || 0) + 1;
          }

          state.publicStatusTotals = newPublicStatusTotals;
          state.publicTotal =
            newPublicStatusTotals.Belum_Diverifikasi +
            newPublicStatusTotals.Belum_Ditentukan +
            newPublicStatusTotals.Berkas_Diterima +
            newPublicStatusTotals.Berkas_Dikembalikan +
            newPublicStatusTotals.Lulus +
            newPublicStatusTotals.Tidak_Lulus;

          state.publicRespondents = state.publicRespondents.map((r) =>
            r.submission_id === submission_id
              ? {
                  ...r,
                  result: { ...r.result, ...updatedResult },
                  validation_status: validationStatus,
                }
              : r
          );

          for (const periodId in state.publicRespondentsByPeriod) {
            state.publicRespondentsByPeriod[periodId].data =
              state.publicRespondentsByPeriod[periodId].data.map((r) =>
                r.submission_id === submission_id
                  ? {
                      ...r,
                      result: { ...r.result, ...updatedResult },
                      validation_status: validationStatus,
                    }
                  : r
              );
          }

          updateAllRelevantCaches(
            state,
            {
              ...publicRespondent,
              result: updatedResult,
              validation_status: validationStatus,
            },
            true
          );
        }

        // Hitung ulang status totals
        recalculateStatusTotals(state);
      })
      .addCase(updateResult.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.publicError = action.payload;
      })
      .addCase(fetchStatusTotalsOnly.fulfilled, (state, action) => {
        state.status_totals_status = "success";
        state.status_totals_full = {
          Total_Submissions: action.payload?.Total_Submissions ?? 0,
          Belum_Diverifikasi: action.payload?.Belum_Diverifikasi ?? 0,
          Belum_Ditentukan: action.payload?.Belum_Ditentukan ?? 0,
          Menunggu_Hasil: action.payload?.Menunggu_Hasil ?? 0,
          Berkas_Diterima: action.payload?.Berkas_Diterima ?? 0,
          Berkas_Dikembalikan: action.payload?.Berkas_Dikembalikan ?? 0,
          Lulus: action.payload?.Lulus ?? 0,
          Tidak_Lulus: action.payload?.Tidak_Lulus ?? 0,
        };
      })

      .addCase(fetchAnswerGroup.fulfilled, (state, action) => {
        const {
          data,
          total,
          total_visible,
          total_hidden,
          current_page,
          last_page,
          status_totals,
        } = action.payload;

        const userId = action.meta?.arg?.user_id || null;
        const periodId = action.meta?.arg?.periodId || null;
        const searchQuery = action.meta?.arg?.searchQuery || "";
        const fromDate = action.meta?.arg?.fromDate || "";
        const toDate = action.meta?.arg?.toDate || "";

        const normalizedStatusTotals = {
          Belum_Diverifikasi: status_totals?.["Belum_Diverifikasi"] || 0,
          Belum_Ditentukan: status_totals?.["Belum_Ditentukan"] || 0,
          Berkas_Diterima: status_totals?.["Berkas_Diterima"] || 0,
          Berkas_Dikembalikan: status_totals?.["Berkas_Dikembalikan"] || 0,
          Lulus: status_totals?.["Lulus"] || 0,
          Tidak_Lulus: status_totals?.["Tidak_Lulus"] || 0,
        };

        // ✅ Jika berasal dari data spesifik user (CurrentSubmitted)
        if (userId) {
          const prevData =
            current_page === 1
              ? []
              : state.submissionsByUser?.[userId]?.data || [];

          state.submissionsByUser ??= {};
          state.submissionsByUser[userId] = {
            data: [...prevData, ...data],
            current_page,
            last_page,
            total,
            total_visible,
            total_hidden,
            status_totals: normalizedStatusTotals,
          };
          return;
        }

        // ✅ Jika berasal dari RespondentPage umum (tanpa filter period)
        state.status = "succeeded";
        if (!periodId) {
          state.page = current_page;
          state.totalPages = last_page;
          state.total = total;
          state.totalVisible = total_visible;
          state.totalHidden = total_hidden;
          state.respondents =
            current_page === 1 ? data : [...state.respondents, ...data];

          if (state.isManualSortFrozen) {
            state.manualSortSnapshot =
              current_page === 1
                ? data
                : [...state.manualSortSnapshot, ...data];
          } else {
            state.manualSortSnapshot = [];
          }

          if (!action.meta?.arg?.skipStatusTotals) {
            state.status_totals = normalizedStatusTotals;
          }

          data.forEach((r) => {
            const pages = r.answers?.length
              ? Math.max(...r.answers.map((a) => a.page))
              : 0;
            state.respondentDetails[r.submission_id] = {
              data: r,
              totalPages: pages,
            };
          });
        }

        // ✅ Jika berasal dari RespondentPage dengan filter period
        if (periodId) {
          const prev =
            current_page === 1
              ? []
              : state.respondentsByPeriod[periodId]?.data || [];

          // 🔁 Inject ulang isNew dari state lama jika tersedia
          const merged = data.map((item) => {
            const old = state.respondentsByPeriod[periodId]?.data?.find(
              (r) => r.submission_id === item.submission_id
            );
            return old?.isNew ? { ...item, isNew: true } : item;
          });

          state.respondentsByPeriod[periodId] = {
            data: [
              ...prev,
              ...merged.filter((r) => r.answers?.[0]?.period_id === periodId),
            ],
            loading: false,
            error: null,
            current_page,
            last_page,
            total,
          };
        }

        // ✅ Simpan ke cache (hanya jika bukan user_id)
        if (!userId) {
          const cacheKey = generateCacheKey({
            page: current_page,
            perPage: 10,
            searchQuery,
            fromDate,
            toDate,
            periodId,
            userRole: null,
            user_id: null,
          });

          respondentCache.set(cacheKey, {
            data,
            total,
            total_visible,
            total_hidden,
            status_totals: normalizedStatusTotals,
            current_page,
            last_page,
          });
        }
      })

      .addCase(fetchAnswerGroup.pending, (state, action) => {
        const periodId = action.meta?.arg?.periodId || null;
        if (periodId) {
          const prev = state.respondentsByPeriod[periodId] || {
            data: [],
            loading: false,
            error: null,
            current_page: 1,
            last_page: 1,
            total: 0,
          };
          state.respondentsByPeriod[periodId] = {
            ...prev,
            loading: true,
            error: null,
          };
        }
        state.status = "loading";
        state.status_totals = {
          Belum_Diverifikasi: 0,
          Belum_Ditentukan: 0,
          Berkas_Diterima: 0,
          Berkas_Dikembalikan: 0,
          Lulus: 0,
          Tidak_Lulus: 0,
        };
      })
      .addCase(fetchAnswerGroup.rejected, (state, action) => {
        const periodId = action.meta?.arg?.periodId || null;
        if (periodId) {
          state.respondentsByPeriod[periodId] = {
            data: [],
            loading: false,
            error: action.payload || "Failed to fetch",
            current_page: 1,
            last_page: 1,
            total: 0,
          };
        }
        state.status = "failed";
        state.error = action.payload;
        state.status_totals = {
          Belum_Diverifikasi: 0,
          Belum_Ditentukan: 0,
          Berkas_Diterima: 0,
          Berkas_Dikembalikan: 0,
          Lulus: 0,
          Tidak_Lulus: 0,
        };
      })
      .addCase(fetchAnswerGroupPublic.fulfilled, (state, action) => {
        const {
          data,
          total,
          total_visible,
          total_hidden,
          current_page,
          last_page,
          status_totals,
        } = action.payload;

        // Normalize status_totals to ensure consistent structure
        const normalizedStatusTotals = {
          Belum_Diverifikasi: status_totals?.["Belum_Diverifikasi"] || 0,
          Belum_Ditentukan:
            status_totals?.["Belum_Ditentukan"] ||
            status_totals?.["Menunggu_Hasil"] ||
            0,
          Berkas_Diterima: status_totals?.["Berkas_Diterima"] || 0,
          Berkas_Dikembalikan: status_totals?.["Berkas_Dikembalikan"] || 0,
          Lulus: status_totals?.["Lulus"] || 0,
          Tidak_Lulus: status_totals?.["Tidak_Lulus"] || 0,
        };

        const periodId = action.meta?.arg?.periodId || null;
        const searchQuery = action.meta?.arg?.searchQuery || "";
        const fromDate = action.meta?.arg?.fromDate || "";
        const toDate = action.meta?.arg?.toDate || "";

        let sortedData = [...data];
        if (state.sortConfig.key && state.isManualSortFrozen) {
          const key = state.sortConfig.key;
          const direction = state.sortConfig.direction;
          sortedData.sort((a, b) => {
            const getNestedValue = (obj, key) => {
              const value = key
                .split(".")
                .reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
              if (key === "result.value" && value !== null) {
                return parseFloat(value) || 0;
              }
              return value ?? "";
            };
            const aValue = getNestedValue(a, key);
            const bValue = getNestedValue(b, key);
            if (aValue === "" && bValue !== "")
              return direction === "asc" ? 1 : -1;
            if (bValue === "" && aValue !== "")
              return direction === "asc" ? -1 : 1;
            if (aValue === "" && bValue === "") return 0;
            if (aValue === bValue) return 0;
            return aValue < bValue
              ? direction === "asc"
                ? -1
                : 1
              : direction === "asc"
              ? 1
              : -1;
          });
        }

        // if (!periodId) {
        state.publicStatus = "succeeded";
        state.publicPage = current_page;
        state.publicTotalPages = last_page;
        state.publicTotal = total;
        state.publicTotalVisible = total_visible;
        state.publicTotalHidden = total_hidden;
        state.publicRespondents =
          current_page === 1
            ? sortedData
            : [...state.publicRespondents, ...sortedData];

        if (state.isManualSortFrozen) {
          state.manualSortSnapshot =
            current_page === 1
              ? sortedData
              : [...state.manualSortSnapshot, ...sortedData];
        } else {
          state.manualSortSnapshot = [];
        }

        data.forEach((respondent) => {
          const answers = respondent.answers || [];
          const totalPages =
            answers.length > 0 ? Math.max(...answers.map((q) => q.page)) : 0;
          state.respondentDetails[respondent.submission_id] = {
            data: respondent,
            totalPages,
          };
        });
        // }

        if (periodId) {
          const prev =
            current_page === 1
              ? []
              : state.publicRespondentsByPeriod[periodId]?.data || [];

          state.publicRespondentsByPeriod[periodId] = {
            data: [
              ...prev,
              ...sortedData.filter(
                (respondent) => respondent.answers?.[0]?.period_id === periodId
              ),
            ],
            loading: false,
            error: null,
            current_page,
            last_page,
            total,
          };
        }

        // Hitung ulang publicStatusTotals berdasarkan semua data di state.publicRespondents
        recalculateStatusTotals(state);

        const cacheKey = JSON.stringify({
          page: current_page,
          perPage: 10,
          searchQuery,
          fromDate,
          toDate,
          periodId,
        });
        publicRespondentCache.set(cacheKey, {
          data: sortedData,
          total,
          total_visible,
          total_hidden,
          status_totals: normalizedStatusTotals,
          current_page,
          last_page,
        });
      })
      .addCase(fetchAnswerGroupPublic.pending, (state, action) => {
        const periodId = action.meta?.arg?.periodId || null;
        if (periodId) {
          const prev = state.publicRespondentsByPeriod[periodId] || {
            data: [],
            loading: false,
            error: null,
            current_page: 1,
            last_page: 1,
            total: 0,
          };
          state.publicRespondentsByPeriod[periodId] = {
            ...prev,
            loading: true,
            error: null,
          };
        }
        state.publicStatus = "loading";
        // Hapus inisialisasi publicStatusTotals
        // state.publicStatusTotals = { ... }; // Komentar atau hapus bagian ini
      })
      .addCase(fetchAnswerGroupPublic.rejected, (state, action) => {
        const periodId = action.meta?.arg?.periodId || null;
        if (periodId) {
          state.publicRespondentsByPeriod[periodId] = {
            data: [],
            loading: false,
            error: action.payload || "Failed to fetch",
            current_page: 1,
            last_page: 1,
            total: 0,
          };
        }
        state.publicStatus = "failed";
        state.publicError = action.payload;
        state.publicStatusTotals = {
          Belum_Diverifikasi: 0,
          Belum_Ditentukan: 0,
          Lulus: 0,
          Tidak_Lulus: 0,
        };
      })
      .addCase(submitAnswers.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.publicError = null;
      })
      .addCase(submitAnswers.fulfilled, (state) => {
        state.status = "succeeded";
        state.error = null;
        state.publicError = null;
        state.answers = [];
      })
      .addCase(submitAnswers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.publicError = action.payload;
      })
      .addCase(deleteRespondent.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteRespondent.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(deleteRespondent.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Failed to delete respondent";
        state.publicError =
          action.payload?.message || "Failed to delete respondent";
      })
      .addCase(deleteRespondents.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteRespondents.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(deleteRespondents.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.publicError = action.payload;
      })
      .addCase(createPeriod.fulfilled, (state, action) => {
        const newPeriod = action.payload;

        if (!newPeriod?.id || !newPeriod?.title) {
          console.warn("Invalid newPeriod data, skipping:", newPeriod);
          return;
        }

        state.respondents = state.respondents.map((respondent) => {
          const firstAnswer = respondent.answers?.[0];
          if (firstAnswer && firstAnswer.period_id === newPeriod.id) {
            const periodData = {
              id: newPeriod.id,
              key: newPeriod.key || "",
              title: newPeriod.title,
              is_published: newPeriod.is_published,
              status: newPeriod.status ?? true,
              description: newPeriod.description || "",
              created_at: newPeriod.created_at || "",
              updated_at: newPeriod.updated_at || "",
            };

            const updatedRespondent = {
              ...respondent,
              period: {
                id: newPeriod.id,
                title: newPeriod.title,
                is_published: newPeriod.is_published,
                status: newPeriod.status ?? true,
              },
              answers: respondent.answers.map((answer) => {
                if (answer.period_id === newPeriod.id) {
                  return {
                    ...answer,
                    period: periodData,
                  };
                }
                return answer;
              }),
              period_status: newPeriod.status ?? true,
            };

            if (state.respondentDetails[respondent.submission_id]) {
              state.respondentDetails[respondent.submission_id].data =
                updatedRespondent;
            }

            return updatedRespondent;
          }
          return respondent;
        });

        state.publicRespondents = state.publicRespondents.map((respondent) => {
          const firstAnswer = respondent.answers?.[0];
          if (firstAnswer && firstAnswer.period_id === newPeriod.id) {
            const periodData = {
              id: newPeriod.id,
              key: newPeriod.key || "",
              title: newPeriod.title,
              is_published: newPeriod.is_published,
              status: newPeriod.status ?? true,
              description: newPeriod.description || "",
              created_at: newPeriod.created_at || "",
              updated_at: newPeriod.updated_at || "",
            };

            const updatedRespondent = {
              ...respondent,
              period: {
                id: newPeriod.id,
                title: newPeriod.title,
                is_published: newPeriod.is_published,
                status: newPeriod.status ?? true,
              },
              answers: respondent.answers.map((answer) => {
                if (answer.period_id === newPeriod.id) {
                  return {
                    ...answer,
                    period: periodData,
                  };
                }
                return answer;
              }),
              period_status: newPeriod.status ?? true,
            };

            return updatedRespondent;
          }
          return respondent;
        });

        if (!state.respondentsByPeriod[newPeriod.id]) {
          state.respondentsByPeriod[newPeriod.id] = {
            data: state.respondents.filter(
              (respondent) =>
                respondent.answers?.[0]?.period_id === newPeriod.id
            ),
            loading: false,
            error: null,
          };
        }

        if (!state.publicRespondentsByPeriod[newPeriod.id]) {
          state.publicRespondentsByPeriod[newPeriod.id] = {
            data: state.publicRespondents.filter(
              (respondent) =>
                respondent.answers?.[0]?.period_id === newPeriod.id
            ),
            loading: false,
            error: null,
          };
        }

        const updatedCacheKeys = [];
        for (const [cacheKey, cacheData] of respondentCache.entries()) {
          try {
            const params = JSON.parse(cacheKey);
            if (!params.period_id || params.period_id === newPeriod.id) {
              const periodData = {
                id: newPeriod.id,
                key: newPeriod.key || "",
                title: newPeriod.title,
                is_published: newPeriod.is_published,
                status: newPeriod.status ?? true,
                description: newPeriod.description || "",
                created_at: newPeriod.created_at || "",
                updated_at: newPeriod.updated_at || "",
              };

              const updatedData = {
                ...cacheData,
                data: cacheData.data.map((respondent) => {
                  const firstAnswer = respondent.answers?.[0];
                  if (firstAnswer && firstAnswer.period_id === newPeriod.id) {
                    return {
                      ...respondent,
                      period: {
                        id: newPeriod.id,
                        title: newPeriod.title,
                        is_published: newPeriod.is_published,
                        status: newPeriod.status ?? true,
                      },
                      answers: respondent.answers.map((answer) => {
                        if (answer.period_id === newPeriod.id) {
                          return {
                            ...answer,
                            period: periodData,
                          };
                        }
                        return answer;
                      }),
                      period_status: newPeriod.status ?? true,
                    };
                  }
                  return respondent;
                }),
              };
              respondentCache.set(cacheKey, updatedData);
              updatedCacheKeys.push(cacheKey);
            }
          } catch (e) {
            console.warn("Skipping invalid cache key:", cacheKey, e);
          }
        }

        for (const [cacheKey, cacheData] of publicRespondentCache.entries()) {
          try {
            const params = JSON.parse(cacheKey);
            if (!params.period_id || params.period_id === newPeriod.id) {
              const periodData = {
                id: newPeriod.id,
                key: newPeriod.key || "",
                title: newPeriod.title,
                is_published: newPeriod.is_published,
                status: newPeriod.status ?? true,
                description: newPeriod.description || "",
                created_at: newPeriod.created_at || "",
                updated_at: newPeriod.updated_at || "",
              };

              const updatedData = {
                ...cacheData,
                data: cacheData.data.map((respondent) => {
                  const firstAnswer = respondent.answers?.[0];
                  if (firstAnswer && firstAnswer.period_id === newPeriod.id) {
                    return {
                      ...respondent,
                      period: {
                        id: newPeriod.id,
                        title: newPeriod.title,
                        is_published: newPeriod.is_published,
                        status: newPeriod.status ?? true,
                      },
                      answers: respondent.answers.map((answer) => {
                        if (answer.period_id === newPeriod.id) {
                          return {
                            ...answer,
                            period: periodData,
                          };
                        }
                        return answer;
                      }),
                      period_status: newPeriod.status ?? true,
                    };
                  }
                  return respondent;
                }),
              };
              publicRespondentCache.set(cacheKey, updatedData);
              updatedCacheKeys.push(cacheKey);
            }
          } catch (e) {
            console.warn("Skipping invalid cache key:", cacheKey, e);
          }
        }
      })
      .addCase(updateSinglePeriod, (state, action) => {
        const updatedPeriod = action.payload;

        if (!updatedPeriod?.id || !updatedPeriod?.title) {
          console.warn("Invalid updatedPeriod data, skipping:", updatedPeriod);
          return;
        }

        // Update private respondents
        state.respondents = state.respondents.map((respondent) => {
          const firstAnswer = respondent.answers?.[0];
          if (firstAnswer && firstAnswer.period_id === updatedPeriod.id) {
            const periodData = {
              id: updatedPeriod.id,
              key: updatedPeriod.key || respondent.period?.key || "",
              title: updatedPeriod.title,
              is_published: updatedPeriod.is_published,
              status: updatedPeriod.status ?? true,
              description:
                updatedPeriod.description ||
                respondent.period?.description ||
                "",
              created_at:
                updatedPeriod.created_at || respondent.period?.created_at || "",
              updated_at:
                updatedPeriod.updated_at || respondent.period?.updated_at || "",
            };

            const updatedRespondent = {
              ...respondent,
              period: {
                id: updatedPeriod.id,
                title: updatedPeriod.title,
                is_published: updatedPeriod.is_published,
                status: updatedPeriod.status ?? true,
              },
              answers: respondent.answers.map((answer) => {
                if (answer.period_id === updatedPeriod.id) {
                  return {
                    ...answer,
                    period: periodData,
                  };
                }
                return answer;
              }),
              period_status: updatedPeriod.status ?? true,
            };

            if (state.respondentDetails[respondent.submission_id]) {
              state.respondentDetails[respondent.submission_id].data =
                updatedRespondent;
            }

            return updatedRespondent;
          }
          return respondent;
        });

        // Update public respondents
        state.publicRespondents = state.publicRespondents.map((respondent) => {
          const firstAnswer = respondent.answers?.[0];
          if (firstAnswer && firstAnswer.period_id === updatedPeriod.id) {
            const periodData = {
              id: updatedPeriod.id,
              key: updatedPeriod.key || respondent.period?.key || "",
              title: updatedPeriod.title,
              is_published: updatedPeriod.is_published,
              status: updatedPeriod.status ?? true,
              description:
                updatedPeriod.description ||
                respondent.period?.description ||
                "",
              created_at:
                updatedPeriod.created_at || respondent.period?.created_at || "",
              updated_at:
                updatedPeriod.updated_at || respondent.period?.updated_at || "",
            };

            const updatedRespondent = {
              ...respondent,
              period: {
                id: updatedPeriod.id,
                title: updatedPeriod.title,
                is_published: updatedPeriod.is_published,
                status: updatedPeriod.status ?? true,
              },
              answers: respondent.answers.map((answer) => {
                if (answer.period_id === updatedPeriod.id) {
                  return {
                    ...answer,
                    period: periodData,
                  };
                }
                return answer;
              }),
              period_status: updatedPeriod.status ?? true,
            };

            return updatedRespondent;
          }
          return respondent;
        });

        // Update respondents by period for private data
        if (state.respondentsByPeriod[updatedPeriod.id]) {
          state.respondentsByPeriod[updatedPeriod.id].data =
            state.respondents.filter(
              (respondent) =>
                respondent.answers?.[0]?.period_id === updatedPeriod.id
            );
        }

        // Update respondents by period for public data
        if (state.publicRespondentsByPeriod[updatedPeriod.id]) {
          state.publicRespondentsByPeriod[updatedPeriod.id].data =
            state.publicRespondents.filter(
              (respondent) =>
                respondent.answers?.[0]?.period_id === updatedPeriod.id
            );
        }

        // Update private respondent cache
        const updatedCacheKeys = [];
        for (const [cacheKey, cacheData] of respondentCache.entries()) {
          try {
            const params = JSON.parse(cacheKey);
            if (!params.period_id || params.period_id === updatedPeriod.id) {
              const periodData = {
                id: updatedPeriod.id,
                key: updatedPeriod.key || "",
                title: updatedPeriod.title,
                is_published: updatedPeriod.is_published,
                status: updatedPeriod.status ?? true,
                description: updatedPeriod.description || "",
                created_at: updatedPeriod.created_at || "",
                updated_at: updatedPeriod.updated_at || "",
              };

              const updatedData = {
                ...cacheData,
                data: cacheData.data.map((respondent) => {
                  const firstAnswer = respondent.answers?.[0];
                  if (
                    firstAnswer &&
                    firstAnswer.period_id === updatedPeriod.id
                  ) {
                    return {
                      ...respondent,
                      period: {
                        id: updatedPeriod.id,
                        title: updatedPeriod.title,
                        is_published: updatedPeriod.is_published,
                        status: updatedPeriod.status ?? true,
                      },
                      answers: respondent.answers.map((answer) => {
                        if (answer.period_id === updatedPeriod.id) {
                          return {
                            ...answer,
                            period: periodData,
                          };
                        }
                        return answer;
                      }),
                      period_status: updatedPeriod.status ?? true,
                    };
                  }
                  return respondent;
                }),
              };
              respondentCache.set(cacheKey, updatedData);
              updatedCacheKeys.push(cacheKey);
            }
          } catch (e) {
            console.warn("Skipping invalid cache key:", cacheKey, e);
          }
        }

        // Update public respondent cache
        for (const [cacheKey, cacheData] of publicRespondentCache.entries()) {
          try {
            const params = JSON.parse(cacheKey);
            if (!params.period_id || params.period_id === updatedPeriod.id) {
              const periodData = {
                id: updatedPeriod.id,
                key: updatedPeriod.key || "",
                title: updatedPeriod.title,
                is_published: updatedPeriod.is_published,
                status: updatedPeriod.status ?? true,
                description: updatedPeriod.description || "",
                created_at: updatedPeriod.created_at || "",
                updated_at: updatedPeriod.updated_at || "",
              };

              const updatedData = {
                ...cacheData,
                data: cacheData.data.map((respondent) => {
                  const firstAnswer = respondent.answers?.[0];
                  if (
                    firstAnswer &&
                    firstAnswer.period_id === updatedPeriod.id
                  ) {
                    return {
                      ...respondent,
                      period: {
                        id: updatedPeriod.id,
                        title: updatedPeriod.title,
                        is_published: updatedPeriod.is_published,
                        status: updatedPeriod.status ?? true,
                      },
                      answers: respondent.answers.map((answer) => {
                        if (answer.period_id === updatedPeriod.id) {
                          return {
                            ...answer,
                            period: periodData,
                          };
                        }
                        return answer;
                      }),
                      period_status: updatedPeriod.status ?? true,
                    };
                  }
                  return respondent;
                }),
              };
              publicRespondentCache.set(cacheKey, updatedData);
              updatedCacheKeys.push(cacheKey);
            }
          } catch (e) {
            console.warn("Skipping invalid cache key:", cacheKey, e);
          }
        }
      })
      .addCase(deletePeriod.fulfilled, (state, action) => {
        const deletedPeriodId = action.payload?.id;

        if (!deletedPeriodId) {
          console.warn("Invalid deleted period ID, skipping:", deletedPeriodId);
          return;
        }

        // Remove respondents associated with the deleted period from private state
        state.respondents = state.respondents.filter(
          (respondent) => respondent.answers?.[0]?.period_id !== deletedPeriodId
        );

        // Remove respondents associated with the deleted period from public state
        state.publicRespondents = state.publicRespondents.filter(
          (respondent) => respondent.answers?.[0]?.period_id !== deletedPeriodId
        );

        // Remove period-specific data from private respondentsByPeriod
        delete state.respondentsByPeriod[deletedPeriodId];

        // Remove period-specific data from public respondentsByPeriod
        delete state.publicRespondentsByPeriod[deletedPeriodId];

        // Update respondent details
        for (const submissionId in state.respondentDetails) {
          const respondent = state.respondentDetails[submissionId].data;
          if (respondent.answers?.[0]?.period_id === deletedPeriodId) {
            delete state.respondentDetails[submissionId];
            respondentDetailCache.delete(submissionId);
          }
        }

        // Clear private respondent cache entries for the deleted period
        for (const [cacheKey, cacheData] of respondentCache.entries()) {
          try {
            const params = JSON.parse(cacheKey);
            if (params.period_id === deletedPeriodId) {
              respondentCache.delete(cacheKey);
            } else {
              const updatedData = {
                ...cacheData,
                data: cacheData.data.filter(
                  (respondent) =>
                    respondent.answers?.[0]?.period_id !== deletedPeriodId
                ),
              };
              respondentCache.set(cacheKey, updatedData);
            }
          } catch (e) {
            console.warn("Skipping invalid cache key:", cacheKey, e);
          }
        }

        // Clear public respondent cache entries for the deleted period
        for (const [cacheKey, cacheData] of publicRespondentCache.entries()) {
          try {
            const params = JSON.parse(cacheKey);
            if (params.period_id === deletedPeriodId) {
              publicRespondentCache.delete(cacheKey);
            } else {
              const updatedData = {
                ...cacheData,
                data: cacheData.data.filter(
                  (respondent) =>
                    respondent.answers?.[0]?.period_id !== deletedPeriodId
                ),
              };
              publicRespondentCache.set(cacheKey, updatedData);
            }
          } catch (e) {
            console.warn("Skipping invalid cache key:", cacheKey, e);
          }
        }

        // Update totals for private state
        state.total = state.respondents.length;
        state.totalVisible = state.respondents.filter(
          (r) => r.validation_status?.label !== "Belum_Diverifikasi"
        ).length;
        state.totalHidden = state.respondents.filter(
          (r) => r.validation_status?.label === "Belum_Diverifikasi"
        ).length;

        // Update totals for public state
        state.publicTotal = state.publicRespondents.length;
        state.publicTotalVisible = state.publicRespondents.filter(
          (r) => r.validation_status?.label !== "Belum_Diverifikasi"
        ).length;
        state.publicTotalHidden = state.publicRespondents.filter(
          (r) => r.validation_status?.label === "Belum_Diverifikasi"
        ).length;

        // Recalculate status totals for private state
        const newStatusTotals = {
          Belum_Diverifikasi: 0,
          Belum_Ditentukan: 0,
          Berkas_Diterima: 0,
          Berkas_Dikembalikan: 0,
          Lulus: 0,
          Tidak_Lulus: 0,
        };
        state.respondents.forEach((respondent) => {
          const status =
            respondent.validation_status?.label?.replace(/\s+/g, "_") ||
            "Belum_Diverifikasi";
          newStatusTotals[status] = (newStatusTotals[status] || 0) + 1;
        });
        state.status_totals = newStatusTotals;

        // Recalculate status totals for public state
        const newPublicStatusTotals = {
          Belum_Diverifikasi: 0,
          Belum_Ditentukan: 0,
          Berkas_Diterima: 0,
          Berkas_Dikembalikan: 0,
          Lulus: 0,
          Tidak_Lulus: 0,
        };
        state.publicRespondents.forEach((respondent) => {
          const status =
            respondent.validation_status?.label?.replace(/\s+/g, "_") ||
            "Belum_Diverifikasi";
          newPublicStatusTotals[status] =
            (newPublicStatusTotals[status] || 0) + 1;
        });
        state.publicStatusTotals = newPublicStatusTotals;
      })
      .addCase(notifyResultUpdated.fulfilled, (state, action) => {
        const { submission_id, result, validation_status } = action.payload;

        // === Update Private Respondents ===
        const prevPrivateRespondent = state.respondents.find(
          (r) => r.submission_id === submission_id
        );

        if (prevPrivateRespondent) {
          state.respondents = state.respondents.map((respondent) =>
            respondent.submission_id === submission_id
              ? { ...respondent, result, validation_status }
              : respondent
          );

          for (const periodId in state.respondentsByPeriod) {
            state.respondentsByPeriod[periodId].data =
              state.respondentsByPeriod[periodId].data.map((respondent) =>
                respondent.submission_id === submission_id
                  ? { ...respondent, result, validation_status }
                  : respondent
              );
          }

          if (state.respondentDetails[submission_id]) {
            state.respondentDetails[submission_id].data = {
              ...state.respondentDetails[submission_id].data,
              result,
              validation_status,
            };
          }

          updateAllRelevantCaches(state, {
            ...prevPrivateRespondent,
            result,
            validation_status,
            submission_id,
          });
        }

        // === Update Public Respondents ===
        const prevPublicRespondent = state.publicRespondents.find(
          (r) => r.submission_id === submission_id
        );

        if (prevPublicRespondent) {
          state.publicRespondents = state.publicRespondents.map((respondent) =>
            respondent.submission_id === submission_id
              ? { ...respondent, result, validation_status }
              : respondent
          );

          for (const periodId in state.publicRespondentsByPeriod) {
            state.publicRespondentsByPeriod[periodId].data =
              state.publicRespondentsByPeriod[periodId].data.map((respondent) =>
                respondent.submission_id === submission_id
                  ? { ...respondent, result, validation_status }
                  : respondent
              );
          }

          updateAllRelevantCaches(
            state,
            {
              ...prevPublicRespondent,
              result,
              validation_status,
              submission_id,
            },
            true
          );
        }

        // === Update result if currently selected ===
        if (state.result?.submission_answers === submission_id) {
          state.result = result;
        }

        // === Recalculate status counts ===
        recalculateStatusTotals(state);
      })

      .addCase(notifyResultUpdated.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Failed to update result";
        state.publicError =
          action.payload?.message || "Failed to update result";
      })
      .addCase(updateSubmission.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateSubmission.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.updateError = null;

        const updatedData = action.payload.data; // Asumsi response.data.data adalah updated respondent
        const submissionId = updatedData.submission_id;

        // Update respondents
        state.respondents = state.respondents.map((resp) =>
          resp.submission_id === submissionId
            ? { ...resp, ...updatedData }
            : resp
        );

        // Update respondentDetails jika ada
        if (state.respondentDetails[submissionId]) {
          state.respondentDetails[submissionId].data = {
            ...state.respondentDetails[submissionId].data,
            ...updatedData,
          };
        }

        // Update publicRespondents jika ada
        state.publicRespondents = state.publicRespondents.map((resp) =>
          resp.submission_id === submissionId
            ? { ...resp, ...updatedData }
            : resp
        );

        // Update respondentsByPeriod
        const periodId = updatedData.answers?.[0]?.period_id;
        if (periodId && state.respondentsByPeriod[periodId]) {
          state.respondentsByPeriod[periodId].data = state.respondentsByPeriod[
            periodId
          ].data.map((resp) =>
            resp.submission_id === submissionId
              ? { ...resp, ...updatedData }
              : resp
          );
        }

        // Update publicRespondentsByPeriod
        if (periodId && state.publicRespondentsByPeriod[periodId]) {
          state.publicRespondentsByPeriod[periodId].data =
            state.publicRespondentsByPeriod[periodId].data.map((resp) =>
              resp.submission_id === submissionId
                ? { ...resp, ...updatedData }
                : resp
            );
        }

        // Update semua cache yang relevan
        updateAllRelevantCaches(state, updatedData);
        updateAllRelevantCaches(state, updatedData, true);
      })
      .addCase(updateSubmission.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      });
  },
});
const selectAnswers = (state) => state.answers || {};

export const selectRespondentsByPeriod = createSelector(
  [selectAnswers, (_, periodId) => periodId],
  (answers, periodId) => {
    if (!answers.respondentsByPeriod || !periodId) {
      return {
        data: [],
        loading: false,
        last_page: 1,
        current_page: 1,
        total: 0,
      };
    }
    return (
      answers.respondentsByPeriod[periodId] || {
        data: [],
        loading: false,
        last_page: 1,
        current_page: 1,
        total: 0,
      }
    );
  }
);
// Stabilize respondents data to prevent unnecessary re-renders
export const selectStableRespondentsByPeriod = createSelector(
  [(state, periodId) => selectRespondentsByPeriod(state, periodId)],
  (respondentState) => {
    if (!respondentState?.data?.length) return [];

    const seen = new Set();

    return respondentState.data
      .map((respondent) => {
        const plain = toPlainObject(respondent);
        if (!plain?.submission_id) return null;

        // 🔑 cek cache detail dulu
        const detailCache = respondentDetailCache.get(plain.submission_id);
        if (detailCache?.data) {
          return {
            ...detailCache.data,
            period_id: plain.period_id || detailCache.data.period_id,
            isNew: plain.isNew ?? detailCache.data.isNew ?? false,
          };
        }

        // fallback ke summary
        return plain;
      })
      .filter((respondent) => {
        if (!respondent) return false;
        const submissionId = respondent.submission_id;
        if (seen.has(submissionId)) return false;
        seen.add(submissionId);
        return true;
      });
  }
);

export const {
  setSortConfig,
  setManualSortSnapshot,
  setIsManualSortFrozen,
  resetAnswers,
  resetInfiniteScroll,
  setAnswers,
  setFilters,
  removeRespondent,
  updateRespondentInPeriod,
  syncRespondentsWithPeriod,
  clearNewSubmissionStatus,
  addNewSubmission,
  addNewSubmissionToPeriod,
  updateRespondentDetailsForPeriod,
  updateResultState,
  updateStatusTotals,
  clearResultState,
  setPreviewFilters,
  setLastFetchParams,
  setSubmissionPageForUser,
  updateRespondentsByPeriod,
  setCacheInvalidationTimestamp,
  setPage,
  setViewMode,
  clearNewSubmissionFlags,
  batchClearNewFlags,
  clearSkipNextFetch,
} = answerSlice.actions;

export default answerSlice.reducer;

const SKIP_FETCH_KEY = "respondent_skip_fetch_flags";

export const saveSkipNextFetchFlag = (periodId) => {
  try {
    const flags = JSON.parse(sessionStorage.getItem(SKIP_FETCH_KEY) || "{}");
    flags[periodId] = {
      timestamp: Date.now(),
      skipNextFetch: true,
    };
    sessionStorage.setItem(SKIP_FETCH_KEY, JSON.stringify(flags));
    console.debug(`[skipFetch] Saved flag for period ${periodId}`);
  } catch (error) {
    console.warn("[skipFetch] Failed to save flag:", error);
  }
};

export const loadSkipNextFetchFlag = (periodId) => {
  try {
    const flags = JSON.parse(sessionStorage.getItem(SKIP_FETCH_KEY) || "{}");
    const flag = flags[periodId];

    // Flag valid selama 5 menit
    if (flag && Date.now() - flag.timestamp < 5 * 60 * 1000) {
      console.debug(`[skipFetch] Loaded flag for period ${periodId}: true`);
      return flag.skipNextFetch;
    }
    console.debug(`[skipFetch] No valid flag for period ${periodId}`);
    return false;
  } catch (error) {
    console.warn("[skipFetch] Failed to load flag:", error);
    return false;
  }
};
export const clearSkipNextFetchFlag = (periodId) => {
  try {
    const flags = JSON.parse(sessionStorage.getItem(SKIP_FETCH_KEY) || "{}");
    delete flags[periodId];
    sessionStorage.setItem(SKIP_FETCH_KEY, JSON.stringify(flags));
    console.debug(`[skipFetch] Cleared flag for period ${periodId}`);
  } catch (error) {
    console.warn("[skipFetch] Failed to clear flag:", error);
  }
};
