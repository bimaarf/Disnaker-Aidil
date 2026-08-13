import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { QueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-toastify";
import { syncRespondentsWithPeriod, updateResultState } from "./answerSlice";

export const queryClient = new QueryClient();
export const periodCache = new Map();
export const questionCache = new Map();

export const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export const createPeriod = createAsyncThunk(
  "periods/createPeriod",
  async (periodData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/ppdb/period`,
        periodData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );
      const period = response.data.period;
      periodCache.set(`single-${period.key}`, {
        period,
        questions: [],
        answers: [],
        respondents: [],
        timestamp: Date.now(),
      });
      return period;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create period"
      );
    }
  }
);

export const fetchPeriodTabs = createAsyncThunk(
  "periodTabs/fetchPeriodTabs",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/ppdb/period`
      );
      if (response.data.status === 200) {
        return response.data.data;
      } else {
        throw new Error("Failed to fetch period tabs");
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch period tabs"
      );
    }
  }
);

export const fetchAllPeriods = createAsyncThunk(
  "periods/fetchAllPeriods",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/ppdb/period/all`
      );
      if (response.data.status === 200) {
        const payload = {
          allPeriods: response.data.data,
        };
        response.data.data.forEach((period) => {
          questionCache.set(period.key, {
            data: Array.isArray(period.questions) ? period.questions : [],
            timestamp: Date.now(),
          });
          periodCache.set(`single-${period.key}`, {
            period,
            questions: period.questions || [],
            answers: [],
            respondents: [],
            timestamp: Date.now(),
          });
        });
        return payload;
      } else {
        throw new Error("Failed to fetch periods");
      }
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch periods");
    }
  }
);

export const fetchPeriod = createAsyncThunk(
  "periods/fetchPeriod",
  async (periodKey, { rejectWithValue, dispatch }) => {
    if (!periodKey) {
      console.error("[fetchPeriod] periodKey is undefined or null");
      return rejectWithValue("Period key is required");
    }

    const cacheKey = `answers-${periodKey}`;
    const cachedPeriod = periodCache.get(cacheKey);
    if (
      cachedPeriod &&
      Date.now() - cachedPeriod.timestamp < CACHE_EXPIRY_MS &&
      cachedPeriod.questions?.length > 0
    ) {
      console.log(`[fetchPeriod] Returning cached data for ${periodKey}`);
      return cachedPeriod;
    }

    try {
      periodCache.delete(cacheKey);
      questionCache.delete(periodKey);

      const response = await axios.get(
        `${process.env.REACT_APP_API}api/ppdb/period/${periodKey}`,
        {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

      if (!response.data?.period) {
        console.error(
          `[fetchPeriod] No period data in response for ${periodKey}`
        );
        return rejectWithValue("No period data returned from API");
      }

      const period = response.data.period;
      const questions = Array.isArray(period.questions) ? period.questions : [];
      const cacheData = {
        period,
        questions,
        answers: cachedPeriod?.answers || [],
        respondents: cachedPeriod?.respondents || [],
        timestamp: Date.now(),
      };

      periodCache.set(cacheKey, cacheData);
      questionCache.set(periodKey, {
        data: questions,
        timestamp: Date.now(),
      });

      dispatch(fetchPeriodAnswers(periodKey));
      return cacheData;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to fetch period";
      console.error(`[fetchPeriod] Error for ${periodKey}:`, errorMessage, err);
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchPeriods = createAsyncThunk(
  "periods/fetchPeriods",
  async (
    { page, perPage, searchQuery, fromDate, toDate, periodId },
    { rejectWithValue }
  ) => {
    try {
      const params = {
        page,
        perPage,
        q: searchQuery,
        fromDate,
        toDate,
        periodId,
      };
      const cacheKey = JSON.stringify(params);
      const cached = periodCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY_MS) {
        return cached;
      }

      periodCache.delete(cacheKey);

      for (const [key] of periodCache.entries()) {
        if (key.includes(`"page":${page}`) && key !== cacheKey) {
          periodCache.delete(key);
        }
      }

      const response = await axios.get(
        `${process.env.REACT_APP_API}api/ppdb/period`,
        {
          params,
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
      if (response.data.status === 200) {
        const payload = {
          periods: response.data.data,
          total: response.data.total,
          page: response.data.current_page,
          totalPages: response.data.last_page,
          totalVisible: response.data.totalVisible || 0,
          totalHidden: response.data.totalHidden || 0,
          totalPublished: response.data.totalPublished || 0,
          timestamp: Date.now(),
        };
        periodCache.set(cacheKey, payload);
        payload.periods.forEach((period) => {
          questionCache.set(period.key, {
            data: Array.isArray(period.questions) ? period.questions : [],
            timestamp: Date.now(),
          });
          periodCache.set(`single-${period.key}`, {
            period,
            questions: period.questions || [],
            answers: [],
            respondents: [],
            timestamp: Date.now(),
          });
        });
        return payload;
      } else {
        throw new Error("Failed to fetch periods");
      }
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch periods");
    }
  }
);

export const fetchPeriodAnswers = createAsyncThunk(
  "periods/fetchPeriodAnswers",
  async (periodKey, { rejectWithValue }) => {
    try {
      const cacheKey = `answers-${periodKey}`;
      const cached = periodCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY_MS) {
        return cached.data;
      }

      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/answer/period/${periodKey}`,
        {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
      const answers = Array.isArray(response.data.answers)
        ? response.data.answers
        : [];
      const respondents = answers.map((answer) => ({
        respondentId: answer.respondent_id,
        submissionId: answer.submission_id,
        submittedAt: answer.submitted_at,
        validationStatus:
          answer.validation_status?.label || "Belum_Diverifikasi",
      }));
      const data = { answers, respondents };
      periodCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (err) {
      console.warn(
        `[fetchPeriodAnswers] Failed to fetch answers for period ${periodKey}:`,
        err.response?.status,
        err.response?.data || err.message
      );
      if (err.response?.status === 404) {
        const data = { answers: [], respondents: [] };
        periodCache.set(`answers-${periodKey}`, {
          data,
          timestamp: Date.now(),
        });
        return data;
      }

      return rejectWithValue(err.response?.data || "Failed to fetch answers");
    }
  }
);

export const updatePeriod = createAsyncThunk(
  "periods/updatePeriod",
  async ({ key, periodData }, { rejectWithValue, dispatch, getState }) => {
    try {
      if (!key) {
        throw new Error("Period key is missing");
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API}api/ppdb/period/${key}`,
        periodData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const updatedPeriod = response.data.period;
      if (!updatedPeriod?.key || !updatedPeriod?.id) {
        throw new Error("Invalid period data received from API");
      }

      // Check if state.periods is populated
      const state = getState();
      if (!Array.isArray(state.periods.periods)) {
        console.warn(
          "[updatePeriod] state.periods is not an array:",
          state.periods.periods
        );
        await dispatch(fetchPeriods({ page: 1, perPage: 10 })).unwrap();
      }

      queryClient.invalidateQueries(["periods"]);
      queryClient.invalidateQueries([`period-${key}`]);
      periodCache.set(`single-${key}`, {
        period: updatedPeriod,
        questions: periodCache.get(`single-${key}`)?.questions || [],
        answers: periodCache.get(`single-${key}`)?.answers || [],
        respondents: periodCache.get(`single-${key}`)?.respondents || [],
        timestamp: Date.now(),
      });

      for (const [cacheKey, payload] of periodCache.entries()) {
        if (cacheKey.startsWith("single-")) continue;
        const updatedPayload = {
          ...payload,
          periods: Array.isArray(payload.periods)
            ? payload.periods.map((p) =>
                p.key === updatedPeriod.key ? updatedPeriod : p
              )
            : [],
          timestamp: Date.now(),
        };
        periodCache.set(cacheKey, updatedPayload);
      }

      dispatch(syncRespondentsWithPeriod(updatedPeriod));

      return updatedPeriod;
    } catch (error) {
      console.error("[updatePeriod] Error:", error);
      return rejectWithValue(
        error.response?.data || error.message || "Failed to update period"
      );
    }
  }
);

export const deletePeriod = createAsyncThunk(
  "periods/deletePeriod",
  async (periodId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/ppdb/period/${periodId}`
      );
      queryClient.invalidateQueries(["periods"]);
      return periodId;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete period");
    }
  }
);

export const deletePeriods = createAsyncThunk(
  "periods/deletePeriods",
  async (periodIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        periodIds.map((id) =>
          axios.delete(`${process.env.REACT_APP_API}api/ppdb/period/${id}`)
        )
      );
      queryClient.invalidateQueries(["periods"]);
      return periodIds;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete periods");
    }
  }
);

export const fetchRespondentByPeriod = createAsyncThunk(
  "periods/fetchRespondentByPeriod",
  async (_, { rejectWithValue, getState }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/answer/group/respondent/period`
      );
      const state = getState();
      const periodStatusMap = {};
      if (state.periods.periods && Array.isArray(state.periods.periods)) {
        state.periods.periods.forEach((p) => {
          periodStatusMap[p.id] = p.status;
        });
      }
      const enrichedData = response.data.data.map((period) => ({
        ...period,
        status: periodStatusMap[period.period_id] ?? period.status ?? 1,
      }));
      return enrichedData;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchRespondentPerDayDetail = createAsyncThunk(
  "periods/fetchRespondentPerDayDetail",
  async (periodId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/answer/group/respondent/perday/detail/${periodId}`
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchRespondentByPeriodPerDay = createAsyncThunk(
  "periods/fetchRespondentByPeriodPerDay",
  async (_, { rejectWithValue, getState }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/answer/group/respondent/period/perday`
      );
      const state = getState();
      const periodStatusMap = {};
      if (state.periods.periods && Array.isArray(state.periods.periods)) {
        state.periods.periods.forEach((p) => {
          periodStatusMap[p.id] = p.status;
        });
      }
      const enrichedData = response.data.data.map((period) => ({
        ...period,
        status: periodStatusMap[period.period_id] ?? period.status ?? 1,
      }));
      return enrichedData;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchQuestions = createAsyncThunk(
  "periods/fetchQuestions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/question/show`
      );
      if (response.data.success) {
        return Array.isArray(response.data.questions)
          ? response.data.questions
          : [];
      } else {
        throw new Error("Failed to fetch questions");
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch questions"
      );
    }
  }
);

export const fetchQuestionByPeriod = createAsyncThunk(
  "periods/fetchQuestionByPeriod",
  async (periodKey, { rejectWithValue }) => {
    try {
      const cached = questionCache.get(periodKey);
      if (
        cached &&
        Array.isArray(cached.data) &&
        cached.data.length > 0 &&
        Date.now() - cached.timestamp < CACHE_EXPIRY_MS
      ) {
        // Return cached data with period details
        const periodCached = periodCache.get(`single-${periodKey}`);
        return {
          periodKey,
          questions: cached.data,
          period_title: periodCached?.period?.title || "",
          period_description: periodCached?.period?.description || "",
          period_status: periodCached?.period?.status ?? true,
        };
      }

      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/question/find/${periodKey}`,
        {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch questions");
      }

      const questions = Array.isArray(response.data.questions)
        ? response.data.questions
        : [];
      questionCache.set(periodKey, {
        data: questions,
        timestamp: Date.now(),
      });

      return {
        periodKey,
        questions,
        period_title: response.data.period_title || "",
        period_description: response.data.period_description || "",
        period_status: response.data.period_status ?? true,
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || err.message || "Failed to fetch questions"
      );
    }
  }
);

export const createQuestion = createAsyncThunk(
  "periods/createQuestion",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/enggang/question`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.error || "Failed to create question");
      }
    } catch (error) {
      const errorData = error.response?.data || {
        error: "Failed to create question",
      };
      return rejectWithValue(errorData);
    }
  }
);

export const updateQuestion = createAsyncThunk(
  "periods/updateQuestion",
  async ({ periodId, questionData }, { rejectWithValue }) => {
    if (!periodId) {
      return rejectWithValue({ message: "Invalid period ID" });
    }
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/enggang/question/update/${periodId}`,
        questionData,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      if (response.data.success) {
        const questions = Array.isArray(response.data.questions)
          ? response.data.questions
          : questionData.questions;
        return { periodKey: periodId, questions };
      } else {
        throw new Error(response.data.message || "Failed to update question");
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to update question" }
      );
    }
  }
);

export const updateQuestionOrder = createAsyncThunk(
  "periods/updateQuestionOrder",
  async ({ period_key, page, questions }, { rejectWithValue }) => {
    try {
      if (!period_key) {
        throw new Error("period_key is required");
      }
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/enggang/question/order`,
        {
          period_key,
          page,
          questions,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        const questionsWithPeriodKey = Array.isArray(response.data.questions)
          ? response.data.questions.map((q) => ({
              ...q,
              period_key: q.period_key || period_key,
            }))
          : [];
        questionCache.set(period_key, {
          data: questionsWithPeriodKey,
          timestamp: Date.now(),
        });
        return { periodKey: period_key, questions: questionsWithPeriodKey };
      } else {
        throw new Error(
          response.data.error || "Failed to update question order"
        );
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to update question order";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteQuestion = createAsyncThunk(
  "periods/deleteQuestion",
  async (questionId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API}api/enggang/question/${questionId}`
      );

      if (response.data.success) {
        return {
          questionId,
          periodKey: response.data.period_key, // Now available from backend
        };
      } else {
        throw new Error(response.data.error || "Failed to delete question");
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to delete question"
      );
    }
  }
);

const periodSlice = createSlice({
  name: "periods",
  initialState: {
    allPeriods: [],
    periods: [],
    periodDetails: {},
    status: "idle",
    statusAll: "idle",
    error: null,
    page: 1,
    perPage: 10,
    totalVisible: 0,
    totalHidden: 0,
    totalPublished: 0,
    totalPages: 1,
    total: null,
    period: null,
    lastFetchedKey: null,
    filters: {
      searchQuery: "",
      fromDate: "",
      toDate: "",
      selectedPeriodId: null,
      activeTab: "list",
    },
    respondentChart: [],
    respondentChartStatus: "idle",
    respondentChartPerDay: [],
    respondentChartPerDayStatus: "idle",
    respondentChartError: null,
    respondentPerDayDetail: {},
    respondentPerDayDetailStatus: "idle",
    respondentPerDayDetailError: null,
    questions: [],
    periodQuestion: [],
    questionStatus: "idle",
    questionError: null,
    activeTab: "list",
  },
  reducers: {
    resetPeriodsState: (state) => {
      state.periods = [];
      state.allPeriods = [];
      state.period = null;
      state.periodDetails = {};
      state.error = null;
      state.status = "idle";
      state.statusAll = "idle";
    },
    resetPeriods: (state) => {
      state.periods = [];
      state.allPeriods = [];
      state.period = null;
      state.periodDetails = {};
      state.error = null;
      state.status = "idle";
      state.statusAll = "idle";
    },
    resetPeriodStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setActiveTab: (state, action) => {
      state.filters.activeTab = action.payload;
      state.activeTab = action.payload;
    },
    resetQuestionsState: (state) => {
      state.periodQuestion = [];
      state.questionError = null;
      state.questionStatus = "idle";
    },
    setPeriodPage: (state, action) => {
      state.page = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    updateSinglePeriod: (state, action) => {
      const updatedPeriod = {
        ...action.payload,
        is_published: action.payload.is_published || false, // Ensure is_published exists
      };

      // Find the previous period data to compare status and is_published
      const previousPeriod =
        state.periods.find((p) => p.key === updatedPeriod.key) ||
        state.periodDetails[updatedPeriod.key]?.period;

      // Update periods and allPeriods
      state.periods = Array.isArray(state.periods) ? state.periods : [];
      state.periods = state.periods.map((period) =>
        period.key === updatedPeriod.key ? updatedPeriod : period
      );

      state.allPeriods = Array.isArray(state.allPeriods)
        ? state.allPeriods
        : [];
      state.allPeriods = state.allPeriods.map((period) =>
        period.key === updatedPeriod.key ? updatedPeriod : period
      );

      // Update period if it matches
      if (state.period && state.period.key === updatedPeriod.key) {
        state.period = updatedPeriod;
      }

      // Update periodDetails
      state.periodDetails[updatedPeriod.key] = {
        period: updatedPeriod,
        questions: state.periodDetails[updatedPeriod.key]?.questions || [],
        answers: state.periodDetails[updatedPeriod.key]?.answers || [],
        respondents: state.periodDetails[updatedPeriod.key]?.respondents || [],
      };

      // Update cache
      periodCache.set(`single-${updatedPeriod.key}`, {
        period: updatedPeriod,
        questions: state.periodDetails[updatedPeriod.key]?.questions || [],
        answers: state.periodDetails[updatedPeriod.key]?.answers || [],
        respondents: state.periodDetails[updatedPeriod.key]?.respondents || [],
        timestamp: Date.now(),
      });

      for (const [cacheKey, payload] of periodCache.entries()) {
        if (cacheKey.startsWith("single-")) continue;
        const updatedPayload = {
          ...payload,
          periods: Array.isArray(payload.periods)
            ? payload.periods.map((p) =>
                p.key === updatedPeriod.key ? updatedPeriod : p
              )
            : [],
          timestamp: Date.now(),
        };
        periodCache.set(cacheKey, updatedPayload);
      }

      // Update counts based on status and is_published changes
      if (previousPeriod) {
        if (previousPeriod.status !== updatedPeriod.status) {
          if (updatedPeriod.status) {
            state.totalVisible = (state.totalVisible || 0) + 1;
            state.totalHidden = Math.max((state.totalHidden || 0) - 1, 0);
          } else {
            state.totalVisible = Math.max((state.totalVisible || 0) - 1, 0);
            state.totalHidden = (state.totalHidden || 0) + 1;
          }
        }

        if (previousPeriod.is_published !== updatedPeriod.is_published) {
          if (updatedPeriod.is_published) {
            state.totalPublished = (state.totalPublished || 0) + 1;
          } else {
            state.totalPublished = Math.max((state.totalPublished || 0) - 1, 0);
          }
        }
        state.lastSocketUpdate = Date.now();
      }

      // Update respondentChart
      state.respondentChart = Array.isArray(state.respondentChart)
        ? state.respondentChart.map((item) =>
            item.period_id === updatedPeriod.id
              ? {
                  ...item,
                  status: updatedPeriod.status,
                  title: updatedPeriod.title,
                  is_published: updatedPeriod.is_published,
                }
              : item
          )
        : [];

      // Update respondentPerDayDetail
      if (state.respondentPerDayDetail[updatedPeriod.id]) {
        state.respondentPerDayDetail[updatedPeriod.id] = {
          ...state.respondentPerDayDetail[updatedPeriod.id],
          title: updatedPeriod.title,
          status: updatedPeriod.status,
          is_published: updatedPeriod.is_published,
        };
        state.respondentPerDayDetailStatus = "idle";
      }

      // Handle status = false for respondent data
      if (updatedPeriod.status === false) {
        state.respondentChart = Array.isArray(state.respondentChart)
          ? state.respondentChart.map((item) =>
              item.period_id === updatedPeriod.id
                ? {
                    ...item,
                    total_submissions: 0,
                    verified_only: 0,
                    pass: 0,
                    fail: 0,
                    undecided: 0,
                  }
                : item
            )
          : [];

        if (state.respondentPerDayDetail[updatedPeriod.id]) {
          state.respondentPerDayDetail[updatedPeriod.id] = {
            ...state.respondentPerDayDetail[updatedPeriod.id],
            total_submissions: 0,
            verified_only: 0,
            pass: 0,
            fail: 0,
            undecided: 0,
            submissions_by_date: [],
          };
          state.respondentPerDayDetailStatus = "idle";
        }
      }
    },
    updatePeriodItem: (state, action) => {
      const updated = {
        ...action.payload,
        is_published: action.payload.is_published || false, // Ensure is_published exists
      };
      state.periods = state.periods.map((p) =>
        p.id === updated.id ? updated : p
      );
      state.periodDetails[updated.key] = {
        period: updated,
        questions: state.periodDetails[updated.key]?.questions || [],
        answers: state.periodDetails[updated.key]?.answers || [],
        respondents: state.periodDetails[updated.key]?.respondents || [],
      };
    },
    // addNewSubmission
    addNewSubmission: (state, action) => {
      console.log("[periodSlice] addNewSubmission payload:", action.payload);
      const submission = action.payload;
      const periodId = submission.period_id || submission.period?.id;
      const periodKey = submission.period?.key;
      const periodTitle =
        submission.period_title || submission.period?.title || "Unknown Period";
      const periodStatus = submission.period?.status ?? true;
      const periodCreatedAt =
        submission.period?.created_at ||
        submission.period_created_at ||
        new Date().toISOString();

      if (!periodId || !submission.submission_id) {
        console.warn("[periodSlice] Invalid submission data:", submission);
        return;
      }

      let submissionDate;
      try {
        const date = new Date(submission.created_at);
        submissionDate = isNaN(date.getTime())
          ? new Date().toISOString().split("T")[0]
          : date.toISOString().split("T")[0];
      } catch (error) {
        console.warn(
          "[periodSlice] Error parsing created_at:",
          submission.created_at,
          error
        );
        submissionDate = new Date().toISOString().split("T")[0];
      }

      const label = submission.validation_status?.label || "Belum_Diverifikasi";

      let periodExists = state.respondentChart.some(
        (item) => item.period_id === periodId
      );
      if (!periodExists) {
        state.respondentChart = [
          {
            period_id: periodId,
            period_created_at: periodCreatedAt,
            title: periodTitle,
            status: periodStatus,
            total_submissions: 1,
            verified_only: label === "Belum_Diverifikasi" ? 0 : 1,
            pass: label === "Lulus" ? 1 : 0,
            fail: label === "Tidak_Lulus" ? 1 : 0,
            undecided: label === "Belum_Ditentukan" ? 1 : 0,
            berkas_diterima: label === "Berkas_Diterima" ? 1 : 0,
            berkas_dikembalikan: label === "Berkas_Dikembalikan" ? 1 : 0,
          },
          ...state.respondentChart,
        ];
      } else {
        state.respondentChart = state.respondentChart.map((item) =>
          item.period_id === periodId
            ? {
                ...item,
                total_submissions: (item.total_submissions || 0) + 1,
                verified_only:
                  label === "Belum_Diverifikasi"
                    ? item.verified_only || 0
                    : (item.verified_only || 0) + 1,
                pass: label === "Lulus" ? (item.pass || 0) + 1 : item.pass || 0,
                fail:
                  label === "Tidak_Lulus"
                    ? (item.fail || 0) + 1
                    : item.fail || 0,
                undecided:
                  label === "Belum_Ditentukan"
                    ? (item.undecided || 0) + 1
                    : item.undecided || 0,
                berkas_diterima:
                  label === "Berkas_Diterima"
                    ? (item.berkas_diterima || 0) + 1
                    : item.berkas_diterima || 0,
                berkas_dikembalikan:
                  label === "Berkas_Dikembalikan"
                    ? (item.berkas_dikembalikan || 0) + 1
                    : item.berkas_dikembalikan || 0,
              }
            : item
        );
      }

      state.respondentChart = [...state.respondentChart].sort((a, b) => {
        if (!a.period_created_at) return 1;
        if (!b.period_created_at) return -1;
        return new Date(b.period_created_at) - new Date(a.period_created_at);
      });

      // Respondent Per Day Details Update
      if (state.respondentPerDayDetail[periodId]) {
        const detail = { ...state.respondentPerDayDetail[periodId] };
        const existingDate = detail.submissions_by_date.find(
          (s) => s.date.split("T")[0] === submissionDate
        );
        if (existingDate) {
          existingDate.count += 1;
        } else {
          detail.submissions_by_date.push({
            date: submission.created_at || new Date().toISOString(),
            count: 1,
          });
        }
        detail.total_submissions = (detail.total_submissions || 0) + 1;
        detail.verified_only =
          label === "Belum_Diverifikasi"
            ? detail.verified_only
            : (detail.verified_only || 0) + 1;
        detail.pass =
          label === "Lulus" ? (detail.pass || 0) + 1 : detail.pass || 0;
        detail.fail =
          label === "Tidak_Lulus" ? (detail.fail || 0) + 1 : detail.fail || 0;
        detail.undecided =
          label === "Belum_Ditentukan"
            ? (detail.undecided || 0) + 1
            : detail.undecided || 0;
        detail.berkas_diterima =
          label === "Berkas_Diterima"
            ? (detail.berkas_diterima || 0) + 1
            : detail.berkas_diterima || 0;
        detail.berkas_dikembalikan =
          label === "Berkas_Dikembalikan"
            ? (detail.berkas_dikembalikan || 0) + 1
            : detail.berkas_dikembalikan || 0;
        detail.submissions_by_date.sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        state.respondentPerDayDetail = {
          ...state.respondentPerDayDetail,
          [periodId]: { ...detail },
        };
      } else {
        state.respondentPerDayDetail = {
          ...state.respondentPerDayDetail,
          [periodId]: {
            period_id: periodId,
            title: periodTitle,
            submissions_by_date: [
              {
                date: submission.created_at || new Date().toISOString(),
                count: 1,
              },
            ],
            total_submissions: 1,
            verified_only: label === "Belum_Diverifikasi" ? 0 : 1,
            pass: label === "Lulus" ? 1 : 0,
            fail: label === "Tidak_Lulus" ? 1 : 0,
            undecided: label === "Belum_Ditentukan" ? 1 : 0,
            berkas_diterima: label === "Berkas_Diterima" ? 1 : 0,
            berkas_dikembalikan: label === "Berkas_Dikembalikan" ? 1 : 0,
          },
        };
      }

      // Update period details in state and cache
      if (periodKey && state.periodDetails[periodKey]) {
        state.periodDetails[periodKey].answers = [
          ...(state.periodDetails[periodKey].answers || []),
          submission,
        ];
        state.periodDetails[periodKey].respondents = [
          ...(state.periodDetails[periodKey].respondents || []),
          {
            respondentId: submission.respondent_id,
            submissionId: submission.submission_id,
            submittedAt: submission.created_at,
            validationStatus: label,
          },
        ];
        periodCache.set(`single-${periodKey}`, {
          ...state.periodDetails[periodKey],
          timestamp: Date.now(),
        });
      }

      // Update total_respondent in periods, allPeriods, periodDetails, and periodCache
      state.periods = state.periods.map((period) =>
        period.id === periodId
          ? {
              ...period,
              total_respondent: (period.total_respondent || 0) + 1,
            }
          : period
      );

      state.allPeriods = state.allPeriods.map((period) =>
        period.id === periodId
          ? {
              ...period,
              total_respondent: (period.total_respondent || 0) + 1,
            }
          : period
      );

      if (state.period && state.period.id === periodId) {
        state.period = {
          ...state.period,
          total_respondent: (state.period.total_respondent || 0) + 1,
        };
      }

      if (state.periodDetails[periodKey]) {
        state.periodDetails[periodKey].period = {
          ...state.periodDetails[periodKey].period,
          total_respondent:
            (state.periodDetails[periodKey].period.total_respondent || 0) + 1,
        };
        periodCache.set(`single-${periodKey}`, {
          ...state.periodDetails[periodKey],
          timestamp: Date.now(),
        });
      }

      // Update other caches
      for (const [cacheKey, payload] of periodCache.entries()) {
        if (cacheKey.startsWith("single-")) continue;
        const updatedPayload = {
          ...payload,
          periods: Array.isArray(payload.periods)
            ? payload.periods.map((p) =>
                p.id === periodId
                  ? {
                      ...p,
                      total_respondent: (p.total_respondent || 0) + 1,
                    }
                  : p
              )
            : [],
          timestamp: Date.now(),
        };
        periodCache.set(cacheKey, updatedPayload);
      }

      state.respondentChartStatus = "succeeded";
      state.respondentPerDayDetailStatus = "succeeded";
    },

    updateSubmissionStatus: (state, action) => {
      const submission = action.payload;
      const periodId = submission.period_id || submission.period?.id;
      const periodKey = submission.period?.key;
      const submissionId = submission.submission_id;
      const newStatus =
        submission.validation_status?.label || "Belum_Diverifikasi";

      if (!periodId || !submissionId) {
        console.warn("[periodSlice] Invalid submission data:", submission);
        return;
      }

      state.respondentChart = state.respondentChart.map((item) => {
        if (item.period_id === periodId) {
          let updatedItem = { ...item };

          updatedItem.verified_only =
            newStatus === "Belum_Diverifikasi"
              ? (updatedItem.verified_only || 1) - 1
              : (updatedItem.verified_only || 0) + 1;

          updatedItem.pass =
            newStatus === "Lulus"
              ? (updatedItem.pass || 0) + 1
              : updatedItem.pass || 0;

          updatedItem.fail =
            newStatus === "Tidak_Lulus"
              ? (updatedItem.fail || 0) + 1
              : updatedItem.fail || 0;

          updatedItem.undecided =
            newStatus === "Belum_Ditentukan"
              ? (updatedItem.undecided || 0) + 1
              : updatedItem.undecided || 0;

          updatedItem.berkas_diterima =
            newStatus === "Berkas_Diterima"
              ? (updatedItem.berkas_diterima || 0) + 1
              : updatedItem.berkas_diterima || 0;

          updatedItem.berkas_dikembalikan =
            newStatus === "Berkas_Dikembalikan"
              ? (updatedItem.berkas_dikembalikan || 0) + 1
              : updatedItem.berkas_dikembalikan || 0;

          return updatedItem;
        }
        return item;
      });

      if (state.respondentPerDayDetail[periodId]) {
        const detail = { ...state.respondentPerDayDetail[periodId] };
        detail.verified_only =
          newStatus === "Belum_Diverifikasi"
            ? (detail.verified_only || 1) - 1
            : (detail.verified_only || 0) + 1;

        detail.pass =
          newStatus === "Lulus" ? (detail.pass || 0) + 1 : detail.pass || 0;

        detail.fail =
          newStatus === "Tidak_Lulus"
            ? (detail.fail || 0) + 1
            : detail.fail || 0;

        detail.undecided =
          newStatus === "Belum_Ditentukan"
            ? (detail.undecided || 0) + 1
            : detail.undecided || 0;

        detail.berkas_diterima =
          newStatus === "Berkas_Diterima"
            ? (detail.berkas_diterima || 0) + 1
            : detail.berkas_diterima || 0;

        detail.berkas_dikembalikan =
          newStatus === "Berkas_Dikembalikan"
            ? (detail.berkas_dikembalikan || 0) + 1
            : detail.berkas_dikembalikan || 0;

        state.respondentPerDayDetail = {
          ...state.respondentPerDayDetail,
          [periodId]: { ...detail },
        };
      }

      if (periodKey && state.periodDetails[periodKey]) {
        state.periodDetails[periodKey].answers = state.periodDetails[
          periodKey
        ].answers.map((answer) =>
          answer.submission_id === submissionId
            ? {
                ...answer,
                validation_status: submission.validation_status,
                result: { ...answer.result, ...submission.result },
              }
            : answer
        );

        state.periodDetails[periodKey].respondents = state.periodDetails[
          periodKey
        ].respondents.map((respondent) =>
          respondent.submission_id === submissionId
            ? {
                ...respondent,
                validation_status: submission.validation_status,
                result: { ...respondent.result, ...submission.result },
              }
            : respondent
        );

        periodCache.set(`single-${periodKey}`, {
          ...state.periodDetails[periodKey],
          timestamp: Date.now(),
        });
      }

      state.respondentChartStatus = "succeeded";
      state.respondentPerDayDetailStatus = "succeeded";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRespondentPerDayDetail.pending, (state) => {
        state.respondentPerDayDetailStatus = "loading";
      })
      .addCase(fetchRespondentPerDayDetail.fulfilled, (state, action) => {
        state.respondentPerDayDetailStatus = "succeeded";
        const detail = action.payload;
        state.respondentPerDayDetail[detail.period_id] = detail;
      })
      .addCase(fetchRespondentPerDayDetail.rejected, (state, action) => {
        state.respondentPerDayDetailStatus = "failed";
        state.respondentPerDayDetailError = action.payload;
      })
      .addCase(fetchRespondentByPeriod.pending, (state) => {
        state.respondentChartStatus = "loading";
      })
      .addCase(fetchRespondentByPeriod.fulfilled, (state, action) => {
        state.respondentChartStatus = "succeeded";
        state.respondentChart = action.payload;
      })
      .addCase(fetchRespondentByPeriod.rejected, (state, action) => {
        state.respondentChartStatus = "failed";
        state.respondentChartError = action.payload;
      })
      .addCase(fetchRespondentByPeriodPerDay.pending, (state) => {
        state.respondentChartPerDayStatus = "loading";
      })
      .addCase(fetchRespondentByPeriodPerDay.fulfilled, (state, action) => {
        state.respondentChartPerDayStatus = "succeeded";
        state.respondentChartPerDay = action.payload;
      })
      .addCase(fetchRespondentByPeriodPerDay.rejected, (state, action) => {
        state.respondentChartPerDayStatus = "failed";
        state.respondentChartError = action.payload;
      })
      .addCase(fetchAllPeriods.pending, (state) => {
        state.statusAll = "loading";
      })
      .addCase(fetchAllPeriods.fulfilled, (state, action) => {
        state.statusAll = "succeeded";
        state.allPeriods = action.payload.allPeriods;
        action.payload.allPeriods.forEach((period) => {
          state.periodDetails[period.key] = {
            period: {
              ...period,
              is_published: period.is_published || false, // Ensure is_published exists
            },
            questions: Array.isArray(period.questions) ? period.questions : [],
            answers: state.periodDetails[period.key]?.answers || [],
            respondents: state.periodDetails[period.key]?.respondents || [],
          };
        });
      })
      .addCase(fetchAllPeriods.rejected, (state, action) => {
        state.statusAll = "failed";
        state.error = action.payload;
      })
      .addCase(fetchPeriods.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPeriods.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.periods =
          action.payload.page === 1
            ? action.payload.periods
            : [
                ...state.periods,
                ...action.payload.periods.filter(
                  (p) => !state.periods.some((existing) => existing.id === p.id)
                ),
              ];

        action.payload.periods.forEach((period) => {
          state.periodDetails[period.key] = {
            period: {
              ...period,
              is_published: period.is_published || false, // Ensure is_published exists
            },
            questions: period.questions || [],
            answers: state.periodDetails[period.key]?.answers || [],
            respondents: state.periodDetails[period.key]?.respondents || [],
          };
        });

        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
        state.total = action.payload.total;

        // Update counts including totalPublished
        const now = Date.now();
        if (!state.lastSocketUpdate || now - state.lastSocketUpdate > 5000) {
          state.totalVisible = action.payload.totalVisible;
          state.totalHidden = action.payload.totalHidden;
          state.totalPublished = action.payload.totalPublished || 0; // Add fallback
        }
      })
      .addCase(fetchPeriods.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchPeriod.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPeriod.fulfilled, (state, action) => {
        state.status = "succeeded";
        if (!action.payload) {
          console.error("[fetchPeriod.fulfilled] action.payload is undefined");
          state.status = "failed";
          state.error = "No period data received";
          return;
        }

        const {
          period,
          questions,
          answers = [],
          respondents = [],
        } = action.payload;

        if (!period?.key) {
          console.error(
            "[fetchPeriod.fulfilled] Invalid period data:",
            action.payload
          );
          state.status = "failed";
          state.error = "Invalid period data";
          return;
        }

        state.period = {
          ...period,
          is_published: period.is_published || false, // Ensure is_published exists
        };

        state.periodDetails[period.key] = {
          period: {
            ...period,
            is_published: period.is_published || false, // Ensure is_published exists
          },
          questions: questions.map((q) => ({
            ...q,
            options:
              typeof q.options === "string"
                ? JSON.parse(q.options)
                : Array.isArray(q.options)
                ? q.options
                : [],
            fileTypes:
              typeof q.fileTypes === "string"
                ? q.fileTypes.startsWith("[")
                  ? JSON.parse(q.fileTypes)
                  : q.fileTypes.split(",").map((item) => item.trim())
                : Array.isArray(q.fileTypes)
                ? q.fileTypes
                : [],
          })),
          answers,
          respondents,
        };
        state.lastFetchedKey = action.meta.arg;
      })
      .addCase(fetchPeriod.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchPeriodAnswers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPeriodAnswers.fulfilled, (state, action) => {
        state.status = "succeeded";
        const periodKey = action.meta.arg;

        if (!action.payload || !action.payload.answers) {
          console.warn(
            `[fetchPeriodAnswers.fulfilled] Empty payload for period ${periodKey}`
          );
          return;
        }

        const { answers, respondents } = action.payload;

        if (state.periodDetails[periodKey]) {
          state.periodDetails[periodKey].answers = answers;
          state.periodDetails[periodKey].respondents = respondents;
          periodCache.set(`single-${periodKey}`, {
            ...state.periodDetails[periodKey],
            timestamp: Date.now(),
          });
        }
      })
      .addCase(fetchPeriodAnswers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createPeriod.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createPeriod.fulfilled, (state, action) => {
        state.status = "succeeded";
        const newPeriod = {
          ...action.payload,
          is_published: action.payload.is_published || false, // Ensure is_published exists
        };
        state.periods = [newPeriod, ...state.periods];
        state.allPeriods = [newPeriod, ...state.allPeriods];
        state.periodDetails[newPeriod.key] = {
          period: newPeriod,
          questions: [],
          answers: [],
          respondents: [],
        };
        state.total = (state.total || 0) + 1;
        if (newPeriod.status) {
          state.totalVisible = (state.totalVisible || 0) + 1;
        } else {
          state.totalHidden = (state.totalHidden || 0) + 1;
        }
        if (newPeriod.is_published) {
          state.totalPublished = (state.totalPublished || 0) + 1;
        }
        state.respondentChartStatus = "idle";
      })
      .addCase(createPeriod.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updatePeriod.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updatePeriod.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedPeriod = {
          ...action.payload,
          is_published: action.payload.is_published || false, // Ensure is_published exists
        };

        // Find the previous period data to compare status and is_published
        const previousPeriod =
          state.periods.find((p) => p.key === updatedPeriod.key) ||
          state.periodDetails[updatedPeriod.key]?.period;

        state.periods = state.periods.map((period) =>
          period.key === updatedPeriod.key ? updatedPeriod : period
        );

        state.allPeriods = state.allPeriods.map((period) =>
          period.key === updatedPeriod.key ? updatedPeriod : period
        );

        if (state.period && state.period.key === updatedPeriod.key) {
          state.period = updatedPeriod;
        }

        state.periodDetails[updatedPeriod.key] = {
          period: updatedPeriod,
          questions: state.periodDetails[updatedPeriod.key]?.questions || [],
          answers: state.periodDetails[updatedPeriod.key]?.answers || [],
          respondents:
            state.periodDetails[updatedPeriod.key]?.respondents || [],
        };

        // Update counts based on status and is_published changes
        if (previousPeriod) {
          if (previousPeriod.status !== updatedPeriod.status) {
            if (updatedPeriod.status) {
              state.totalVisible = (state.totalVisible || 0) + 1;
              state.totalHidden = Math.max((state.totalHidden || 0) - 1, 0);
            } else {
              state.totalVisible = Math.max((state.totalVisible || 0) - 1, 0);
              state.totalHidden = (state.totalHidden || 0) + 1;
            }
          }

          if (previousPeriod.is_published !== updatedPeriod.is_published) {
            if (updatedPeriod.is_published) {
              state.totalPublished = (state.totalPublished || 0) + 1;
            } else {
              state.totalPublished = Math.max(
                (state.totalPublished || 0) - 1,
                0
              );
            }
          }
        }

        // Update respondent chart
        state.respondentChart = state.respondentChart.map((item) =>
          item.period_id === updatedPeriod.id
            ? {
                ...item,
                status: updatedPeriod.status,
                title: updatedPeriod.title,
              }
            : item
        );

        if (state.respondentPerDayDetail[updatedPeriod.id]) {
          state.respondentPerDayDetail[updatedPeriod.id] = {
            ...state.respondentPerDayDetail[updatedPeriod.id],
            title: updatedPeriod.title,
          };
          state.respondentPerDayDetailStatus = "idle";
        }
      })
      .addCase(updatePeriod.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deletePeriod.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deletePeriod.fulfilled, (state, action) => {
        state.status = "succeeded";
        const periodId = action.payload;

        // Ensure state.periods is an array
        state.periods = Array.isArray(state.periods) ? state.periods : [];
        const periodToDelete = state.periods.find((p) => p.id === periodId);
        state.periods = state.periods.filter(
          (period) => period.id !== periodId
        );

        // Ensure state.allPeriods is an array
        state.allPeriods = Array.isArray(state.allPeriods)
          ? state.allPeriods
          : [];
        state.allPeriods = state.allPeriods.filter(
          (period) => period.id !== periodId
        );

        if (state.period && state.period.id === periodId) {
          state.period = null;
        }

        if (periodToDelete) {
          // Clean up periodDetails
          delete state.periodDetails[periodToDelete.key];
          periodCache.delete(`single-${periodToDelete.key}`);
          questionCache.delete(periodToDelete.key);

          // Clean up respondentChart
          state.respondentChart = Array.isArray(state.respondentChart)
            ? state.respondentChart.filter(
                (item) => item.period_id !== periodId
              )
            : [];

          // Clean up respondentPerDayDetail
          delete state.respondentPerDayDetail[periodId];
          state.respondentPerDayDetailStatus = "idle";
        }

        // Update periodCache
        for (const [cacheKey, payload] of periodCache.entries()) {
          if (cacheKey.startsWith("single-")) continue;
          const updatedPayload = {
            ...payload,
            periods: Array.isArray(payload.periods)
              ? payload.periods.filter((p) => p.id !== periodId)
              : [],
            total: payload.total ? payload.total - 1 : 0,
            timestamp: Date.now(),
          };
          periodCache.set(cacheKey, updatedPayload);
        }

        queryClient.invalidateQueries(["periods"]);
      })
      .addCase(deletePeriod.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deletePeriods.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deletePeriods.fulfilled, (state, action) => {
        state.status = "succeeded";
        const periodIds = Array.isArray(action.payload)
          ? action.payload
          : [action.payload]; // Handle single ID or array

        // Ensure state.periods is an array
        state.periods = Array.isArray(state.periods) ? state.periods : [];
        const periodsToDelete = state.periods.filter((p) =>
          periodIds.includes(p.id)
        );
        state.periods = state.periods.filter(
          (period) => !periodIds.includes(period.id)
        );

        // Ensure state.allPeriods is an array
        state.allPeriods = Array.isArray(state.allPeriods)
          ? state.allPeriods
          : [];
        state.allPeriods = state.allPeriods.filter(
          (period) => !periodIds.includes(period.id)
        );

        if (state.period && periodIds.includes(state.period.id)) {
          state.period = null;
        }

        // Clean up periodDetails and caches
        periodsToDelete.forEach((period) => {
          delete state.periodDetails[period.key];
          periodCache.delete(`single-${period.key}`);
          questionCache.delete(period.key);
        });

        // Clean up respondentChart
        state.respondentChart = Array.isArray(state.respondentChart)
          ? state.respondentChart.filter(
              (item) => !periodIds.includes(item.period_id)
            )
          : [];

        // Clean up respondentPerDayDetail
        periodIds.forEach((id) => delete state.respondentPerDayDetail[id]);
        state.respondentPerDayDetailStatus = "idle";

        // Update periodCache
        for (const [cacheKey, payload] of periodCache.entries()) {
          if (cacheKey.startsWith("single-")) continue;
          const updatedPayload = {
            ...payload,
            periods: Array.isArray(payload.periods)
              ? payload.periods.filter((p) => !periodIds.includes(p.id))
              : [],
            total: payload.total ? payload.total - periodIds.length : 0,
            timestamp: Date.now(),
          };
          periodCache.set(cacheKey, updatedPayload);
        }

        queryClient.invalidateQueries(["periods"]);
      })
      .addCase(deletePeriods.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchQuestions.pending, (state) => {
        state.questionStatus = "loading";
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.questionStatus = "succeeded";
        state.questions = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.questionStatus = "failed";
        state.questionError = action.payload;
      })
      .addCase(fetchQuestionByPeriod.pending, (state) => {
        state.questionStatus = "loading";
      })
      .addCase(fetchQuestionByPeriod.fulfilled, (state, action) => {
        state.questionStatus = "succeeded";
        const {
          periodKey,
          questions,
          period_title,
          period_description,
          period_status,
        } = action.payload;

        if (!state.periodDetails[periodKey]) {
          state.periodDetails[periodKey] = {
            period: {
              key: periodKey,
              title: "",
              description: "",
              status: true,
            },
            questions: [],
            answers: [],
            respondents: [],
          };
        }

        // Update period details
        state.periodDetails[periodKey].period = {
          ...state.periodDetails[periodKey].period,
          title: period_title,
          description: period_description,
          status: period_status,
        };

        // Update questions
        state.periodDetails[periodKey].questions = questions.map((q) => ({
          ...q,
          options:
            typeof q.options === "string"
              ? JSON.parse(q.options)
              : Array.isArray(q.options)
              ? q.options
              : [],
          fileTypes:
            typeof q.fileTypes === "string"
              ? q.fileTypes.startsWith("[")
                ? JSON.parse(q.fileTypes)
                : q.fileTypes.split(",").map((item) => item.trim())
              : Array.isArray(q.fileTypes)
              ? q.fileTypes
              : [],
          is_required: q.is_required ?? false,
        }));

        // Update periodCache
        periodCache.set(`single-${periodKey}`, {
          ...state.periodDetails[periodKey],
          timestamp: Date.now(),
        });
      })
      .addCase(fetchQuestionByPeriod.rejected, (state, action) => {
        state.questionStatus = "failed";
        state.questionError = action.payload;
      })
      .addCase(createQuestion.pending, (state) => {
        state.questionStatus = "loading";
      })
      .addCase(createQuestion.fulfilled, (state, action) => {
        state.questionStatus = "succeeded";
        const payload = action.payload;

        if (!payload?.questions?.length) {
          console.warn(
            "[createQuestion.fulfilled] No questions in payload:",
            payload
          );
          return;
        }

        const periodKey = payload.questions[0]?.period_key;
        if (!periodKey) {
          console.error(
            "[createQuestion.fulfilled] Missing period_key in payload"
          );
          return;
        }

        if (!state.periodDetails[periodKey]) {
          state.periodDetails[periodKey] = {
            period: { key: periodKey },
            questions: [],
            answers: [],
            respondents: [],
          };
        }

        // Add label if provided (assuming payload.label exists from thunk)
        if (payload.label) {
          state.periodDetails[periodKey].period.label = payload.label;
        }

        let newQuestions = payload.questions.map((q, index) => {
          let parsedOptions = q.options || [];
          let parsedFileTypes = q.fileTypes || [];
          try {
            if (typeof q.options === "string") {
              parsedOptions = JSON.parse(q.options);
            }
            if (typeof q.fileTypes === "string") {
              parsedFileTypes = q.fileTypes.startsWith("[")
                ? JSON.parse(q.fileTypes)
                : q.fileTypes.split(",").map((item) => item.trim());
            }
          } catch (err) {
            console.warn("[createQuestion.fulfilled] Parsing error:", err);
            parsedOptions = [];
            parsedFileTypes = [];
          }

          return {
            ...q,
            sort_order: q.sort_order + 1 ?? index,
            page: q.page || 1,
            options: parsedOptions,
            fileTypes: parsedFileTypes,
            is_required: q.is_required ?? false,
          };
        });

        // Get existing questions and merge with new ones
        const existingQuestions =
          state.periodDetails[periodKey].questions || [];

        // Insert new questions at the correct position based on sort_order
        const mergedQuestions = [...existingQuestions];

        newQuestions.forEach((newQuestion) => {
          // Find the correct position to insert the new question
          const insertIndex = mergedQuestions.findIndex(
            (q) =>
              q.page === newQuestion.page &&
              q.sort_order >= newQuestion.sort_order
          );

          if (insertIndex === -1) {
            // If no question with higher sort_order found, add to the end
            mergedQuestions.push(newQuestion);
          } else {
            // Insert at the found position
            mergedQuestions.splice(insertIndex, 0, newQuestion);
          }
        });

        // Reindex sort_order for all questions on the same page
        const questionsByPage = {};
        mergedQuestions.forEach((q) => {
          if (!questionsByPage[q.page]) questionsByPage[q.page] = [];
          questionsByPage[q.page].push(q);
        });

        // Re-sort each page's questions by sort_order
        Object.keys(questionsByPage).forEach((page) => {
          questionsByPage[page] = questionsByPage[page]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((q, index) => ({ ...q, sort_order: index }));
        });

        // Flatten back to array
        const finalQuestions = Object.values(questionsByPage).flat();

        state.periodDetails[periodKey].questions = finalQuestions;

        // Cache and invalidation remain the same
        periodCache.set(`single-${periodKey}`, {
          ...state.periodDetails[periodKey],
          timestamp: Date.now(),
        });
        questionCache.set(periodKey, {
          data: state.periodDetails[periodKey].questions,
          timestamp: Date.now(),
        });

        state.periods = state.periods.map((p) =>
          p.key === periodKey
            ? { ...p, questions: state.periodDetails[periodKey].questions }
            : p
        );
        state.allPeriods = state.allPeriods.map((p) =>
          p.key === periodKey
            ? { ...p, questions: state.periodDetails[periodKey].questions }
            : p
        );

        queryClient.invalidateQueries(["periods"]);
        queryClient.invalidateQueries([`period-${periodKey}`]);
      })

      .addCase(createQuestion.rejected, (state, action) => {
        state.questionStatus = "failed";
        state.questionError =
          action.payload?.message || "Failed to create question";
      })
      .addCase(updateQuestion.pending, (state) => {
        state.questionStatus = "loading";
      })
      .addCase(updateQuestion.fulfilled, (state, action) => {
        state.questionStatus = "succeeded";
        const { periodKey, questions } = action.payload;
        const processedQuestions = questions.map((question, index) => ({
          ...question,
          sort_order: question.sort_order ?? index,
          options:
            typeof question.options === "string"
              ? JSON.parse(question.options)
              : Array.isArray(question.options)
              ? question.options
              : [],
          fileTypes:
            typeof question.fileTypes === "string"
              ? question.fileTypes.startsWith("[")
                ? JSON.parse(question.fileTypes)
                : question.fileTypes.split(",").map((item) => item.trim())
              : Array.isArray(question.fileTypes)
              ? question.fileTypes
              : [],
          is_required: question.is_required ?? false,
        }));

        if (state.periodDetails[periodKey]) {
          state.periodDetails[periodKey].questions = processedQuestions;
          periodCache.set(`single-${periodKey}`, {
            ...state.periodDetails[periodKey],
            timestamp: Date.now(),
          });
        } else {
          state.periodDetails[periodKey] = {
            period: { key: periodKey },
            questions: processedQuestions,
            answers: [],
            respondents: [],
          };
          periodCache.set(`single-${periodKey}`, {
            ...state.periodDetails[periodKey],
            timestamp: Date.now(),
          });
        }

        questionCache.set(periodKey, {
          data: processedQuestions,
          timestamp: Date.now(),
        });

        state.periods = state.periods.map((period) =>
          period.key === periodKey
            ? { ...period, questions: processedQuestions }
            : period
        );
        state.allPeriods = state.allPeriods.map((period) =>
          period.key === periodKey
            ? { ...period, questions: processedQuestions }
            : period
        );

        for (const [cacheKey, payload] of periodCache.entries()) {
          if (cacheKey.startsWith("single-") || !payload.periods) continue;
          const updatedPayload = {
            ...payload,
            periods: payload.periods.map((p) =>
              p.key === periodKey ? { ...p, questions: processedQuestions } : p
            ),
            timestamp: Date.now(),
          };
          periodCache.set(cacheKey, updatedPayload);
        }

        queryClient.invalidateQueries(["periods"]);
        queryClient.invalidateQueries([`period-${periodKey}`]);
      })
      .addCase(updateQuestion.rejected, (state, action) => {
        state.questionStatus = "failed";
        state.questionError =
          action.payload?.message || "Failed to update question";
      })
      .addCase(updateQuestionOrder.pending, (state) => {
        state.questionStatus = "loading";
      })
      .addCase(updateQuestionOrder.fulfilled, (state, action) => {
        state.questionStatus = "succeeded";
        const { periodKey, questions } = action.payload;
        const processedQuestions = questions.map((question, index) => ({
          ...question,
          sort_order: question.sort_order ?? index,
          page: question.page || 1,
          options:
            typeof question.options === "string"
              ? JSON.parse(question.options)
              : Array.isArray(question.options)
              ? question.options
              : [],
          fileTypes:
            typeof question.fileTypes === "string"
              ? question.fileTypes.startsWith("[")
                ? JSON.parse(question.fileTypes)
                : question.fileTypes.split(",").map((item) => item.trim())
              : Array.isArray(question.fileTypes)
              ? question.fileTypes
              : [],
          is_required: question.is_required ?? false, // Tambahkan is_required
        }));

        if (state.periodDetails[periodKey]) {
          state.periodDetails[periodKey].questions = processedQuestions;
          periodCache.set(`single-${periodKey}`, {
            ...state.periodDetails[periodKey],
            timestamp: Date.now(),
          });
        } else {
          state.periodDetails[periodKey] = {
            period: { key: periodKey },
            questions: processedQuestions,
            answers: [],
            respondents: [],
          };
          periodCache.set(`single-${periodKey}`, {
            ...state.periodDetails[periodKey],
            timestamp: Date.now(),
          });
        }

        questionCache.set(periodKey, {
          data: processedQuestions,
          timestamp: Date.now(),
        });

        state.periods = state.periods.map((period) =>
          period.key === periodKey
            ? { ...period, questions: processedQuestions }
            : period
        );
        state.allPeriods = state.allPeriods.map((period) =>
          period.key === periodKey
            ? { ...period, questions: processedQuestions }
            : period
        );

        for (const [cacheKey, payload] of periodCache.entries()) {
          if (cacheKey.startsWith("single-") || !payload.periods) continue;
          const updatedPayload = {
            ...payload,
            periods: payload.periods.map((p) =>
              p.key === periodKey ? { ...p, questions: processedQuestions } : p
            ),
            timestamp: Date.now(),
          };
          periodCache.set(cacheKey, updatedPayload);
        }

        queryClient.invalidateQueries(["periods"]);
        queryClient.invalidateQueries([`period-${periodKey}`]);
      })
      .addCase(updateQuestionOrder.rejected, (state, action) => {
        state.questionStatus = "failed";
        state.questionError =
          action.payload || "Failed to update question order";
        toast.error(action.payload);
      })
      .addCase(deleteQuestion.pending, (state) => {
        state.questionStatus = "loading";
      })
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        state.questionStatus = "succeeded";
        const { questionId, periodKey } = action.payload;

        if (!periodKey) {
          console.error("Period key missing in deleteQuestion response");
          return;
        }

        // Clear relevant caches
        questionCache.delete(periodKey);
        periodCache.delete(`single-${periodKey}`);

        // Update period details
        if (state.periodDetails[periodKey]) {
          state.periodDetails[periodKey].questions = state.periodDetails[
            periodKey
          ].questions.filter((q) => q.id !== questionId);
        }

        // Update periods list
        state.periods = state.periods.map((period) =>
          period.key === periodKey
            ? {
                ...period,
                questions:
                  period.questions?.filter((q) => q.id !== questionId) || [],
              }
            : period
        );

        // Update all periods list
        state.allPeriods = state.allPeriods.map((period) =>
          period.key === periodKey
            ? {
                ...period,
                questions:
                  period.questions?.filter((q) => q.id !== questionId) || [],
              }
            : period
        );

        // Update other caches
        for (const [cacheKey, payload] of periodCache.entries()) {
          if (cacheKey.startsWith("single-") || !payload.periods) continue;

          const updatedPayload = {
            ...payload,
            periods: payload.periods.map((p) =>
              p.key === periodKey
                ? {
                    ...p,
                    questions:
                      p.questions?.filter((q) => q.id !== questionId) || [],
                  }
                : p
            ),
            timestamp: Date.now(),
          };
          periodCache.set(cacheKey, updatedPayload);
        }

        queryClient.invalidateQueries(["periods"]);
        queryClient.invalidateQueries([`period-${periodKey}`]);
      })
      .addCase(deleteQuestion.rejected, (state, action) => {
        state.questionStatus = "failed";
        state.questionError =
          action.payload?.message || "Failed to delete question";
      })
      // In periodSlice.js, replace the updateResultState case in extraReducers
      .addCase(updateResultState, (state, action) => {
        console.debug(
          "[periodSlice] Handling updateResultState:",
          JSON.stringify(action.payload, null, 2)
        );

        const submission = action.payload;
        if (!submission) {
          console.error(
            "[periodSlice] Received null submission in updateResultState"
          );
          return;
        }

        const {
          submission_id,
          validation_status,
          previous_validation_status,
          period_id,
          period,
          result,
        } = submission;
        const periodId = period_id || period?.id || period_id;
        const periodKey = period?.key;
        const newStatus = validation_status?.label || "Belum_Diverifikasi";
        const previousStatus =
          previous_validation_status?.label || "Belum_Diverifikasi";

        if (!submission_id) {
          console.error(
            "[periodSlice] Invalid submission data: Missing submission_id",
            submission
          );
          return;
        }

        if (!periodId) {
          console.warn(
            "[periodSlice] Missing period_id for submission, skipping period-specific updates:",
            submission
          );
          return;
        }

        // Initialize periodDetails if missing
        if (periodKey && !state.periodDetails[periodKey]) {
          console.warn(
            `[periodSlice] periodDetails[${periodKey}] is undefined, initializing with empty data`
          );
          state.periodDetails[periodKey] = {
            period: { id: periodId, key: periodKey },
            questions: [],
            answers: [],
            respondents: [],
          };
        }

        // Update respondentChart
        state.respondentChart = state.respondentChart.map((item) => {
          if (item.period_id === periodId) {
            let updatedItem = { ...item };

            if (previousStatus !== newStatus) {
              // Decrement previous status counts
              if (previousStatus !== "Belum_Diverifikasi") {
                updatedItem.verified_only = Math.max(
                  (updatedItem.verified_only || 1) - 1,
                  0
                );
              }
              if (previousStatus === "Lulus") {
                updatedItem.pass = Math.max((updatedItem.pass || 1) - 1, 0);
              } else if (previousStatus === "Tidak_Lulus") {
                updatedItem.fail = Math.max((updatedItem.fail || 1) - 1, 0);
              } else if (previousStatus === "Belum_Ditentukan") {
                updatedItem.undecided = Math.max(
                  (updatedItem.undecided || 1) - 1,
                  0
                );
              } else if (previousStatus === "Berkas_Diterima") {
                updatedItem.berkas_diterima = Math.max(
                  (updatedItem.berkas_diterima || 1) - 1,
                  0
                );
              } else if (previousStatus === "Berkas_Dikembalikan") {
                updatedItem.berkas_dikembalikan = Math.max(
                  (updatedItem.berkas_dikembalikan || 1) - 1,
                  0
                );
              }

              // Increment new status counts
              if (newStatus !== "Belum_Diverifikasi") {
                updatedItem.verified_only =
                  (updatedItem.verified_only || 0) + 1;
              }
              if (newStatus === "Lulus") {
                updatedItem.pass = (updatedItem.pass || 0) + 1;
              } else if (newStatus === "Tidak_Lulus") {
                updatedItem.fail = (updatedItem.fail || 0) + 1;
              } else if (newStatus === "Belum_Ditentukan") {
                updatedItem.undecided = (updatedItem.undecided || 0) + 1;
              } else if (newStatus === "Berkas_Diterima") {
                updatedItem.berkas_diterima =
                  (updatedItem.berkas_diterima || 0) + 1;
              } else if (newStatus === "Berkas_Dikembalikan") {
                updatedItem.berkas_dikembalikan =
                  (updatedItem.berkas_dikembalikan || 0) + 1;
              }
            }

            return updatedItem;
          }
          return item;
        });

        // Update respondentPerDayDetail
        if (state.respondentPerDayDetail[periodId]) {
          const detail = { ...state.respondentPerDayDetail[periodId] };
          if (previousStatus !== newStatus) {
            // Decrement previous status counts
            if (previousStatus !== "Belum_Diverifikasi") {
              detail.verified_only = Math.max(
                (detail.verified_only || 1) - 1,
                0
              );
            }
            if (previousStatus === "Lulus") {
              detail.pass = Math.max((detail.pass || 1) - 1, 0);
            } else if (previousStatus === "Tidak_Lulus") {
              detail.fail = Math.max((detail.fail || 1) - 1, 0);
            } else if (previousStatus === "Belum_Ditentukan") {
              detail.undecided = Math.max((detail.undecided || 1) - 1, 0);
            } else if (previousStatus === "Berkas_Diterima") {
              detail.berkas_diterima = Math.max(
                (detail.berkas_diterima || 1) - 1,
                0
              );
            } else if (previousStatus === "Berkas_Dikembalikan") {
              detail.berkas_dikembalikan = Math.max(
                (detail.berkas_dikembalikan || 1) - 1,
                0
              );
            }

            // Increment new status counts
            if (newStatus !== "Belum_Diverifikasi") {
              detail.verified_only = (detail.verified_only || 0) + 1;
            }
            if (newStatus === "Lulus") {
              detail.pass = (detail.pass || 0) + 1;
            } else if (newStatus === "Tidak_Lulus") {
              detail.fail = (detail.fail || 0) + 1;
            } else if (newStatus === "Belum_Ditentukan") {
              detail.undecided = (detail.undecided || 0) + 1;
            } else if (newStatus === "Berkas_Diterima") {
              detail.berkas_diterima = (detail.berkas_diterima || 0) + 1;
            } else if (newStatus === "Berkas_Dikembalikan") {
              detail.berkas_dikembalikan =
                (detail.berkas_dikembalikan || 0) + 1;
            }

            state.respondentPerDayDetail = {
              ...state.respondentPerDayDetail,
              [periodId]: { ...detail },
            };
          }
        }

        // Update periodDetails if periodKey exists
        if (periodKey && state.periodDetails[periodKey]) {
          state.periodDetails[periodKey].answers = state.periodDetails[
            periodKey
          ].answers.map((answer) =>
            answer.submission_id === submission_id
              ? {
                  ...answer,
                  validation_status,
                  result: { ...answer.result, ...result },
                }
              : answer
          );
          state.periodDetails[periodKey].respondents = state.periodDetails[
            periodKey
          ].respondents.map((respondent) =>
            respondent.submission_id === submission_id
              ? {
                  ...respondent,
                  validation_status,
                  result: { ...respondent.result, ...result },
                }
              : respondent
          );

          periodCache.set(`single-${periodKey}`, {
            ...state.periodDetails[periodKey],
            timestamp: Date.now(),
          });
        }

        // Invalidate relevant periodCache entries
        for (const [cacheKey] of periodCache.entries()) {
          if (cacheKey.startsWith(`single-${periodKey}`)) continue;
          try {
            const params = JSON.parse(cacheKey);
            if (params.periodId === periodId || !params.periodId) {
              periodCache.delete(cacheKey);
              console.debug(
                `[periodSlice] Invalidated periodCache key: ${cacheKey}`
              );
            }
          } catch (e) {
            console.warn(
              `[periodSlice] Skipping invalid cache key: ${cacheKey}`,
              e
            );
          }
        }

        // Invalidate React Query caches
        queryClient.invalidateQueries(["periods"]);
        queryClient.invalidateQueries([`period-${periodKey}`]);

        state.respondentChartStatus = "succeeded";
        state.respondentPerDayDetailStatus = "succeeded";
      });
  },
});

export const {
  resetPeriodsState,
  resetPeriods,
  resetPeriodStatus,
  setPeriodPage,
  setFilters,
  updateSinglePeriod,
  updatePeriodItem,
  resetQuestionsState,
  setQuestions,
  setActiveTab,
  addNewSubmission,
  updateSubmissionStatus,
} = periodSlice.actions;

export default periodSlice.reducer;
