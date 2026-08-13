import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// Fetch all questions
export const fetchQuestions = createAsyncThunk(
  "questions/fetchQuestions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/question/show`
      );
      if (response.data.success) {
        return response.data.questions;
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
  "periodQuestion/fetchQuestionByPeriod",
  async (periodKey, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/question/find/${periodKey}`
      );
      return response.data.questions;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch period");
    }
  }
);

// Create new questions

export const createQuestion = createAsyncThunk(
  "questions/createQuestion",
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
        return response.data; // Kembalikan seluruh respons agar frontend bisa mengakses message dan questions
      } else {
        throw new Error(response.data.error || "Failed to create question");
      }
    } catch (error) {
      // Tangani error dengan lebih spesifik
      const errorData = error.response?.data || {
        error: "Failed to create question",
      };
      return rejectWithValue(errorData);
    }
  }
);

// Update questions
export const updateQuestion = createAsyncThunk(
  "questions/updateQuestion",
  async ({ id, questionData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/enggang/question/${id}`,
        questionData,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      if (response.data.success) {
        return response.data.questions;
      } else {
        throw new Error("Failed to update question");
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update question"
      );
    }
  }
);
export const updateQuestionOrder = createAsyncThunk(
  "questions/updateQuestionOrder",
  async (reorderedQuestionsData, { rejectWithValue }) => {
    try {
      console.log(reorderedQuestionsData);
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/enggang/question/order`,
        { questions: reorderedQuestionsData },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        return response.data.questions;
      } else {
        throw new Error("Failed to update question order");
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update question order"
      );
    }
  }
);

// Delete a question
export const deleteQuestion = createAsyncThunk(
  "questions/deleteQuestion",
  async (questionId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API}api/enggang/question/${questionId}`
      );

      if (response.data.success) {
        return questionId; // Return the ID of deleted question
      } else {
        throw new Error("Failed to delete question");
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to delete question"
      );
    }
  }
);

const questionSlice = createSlice({
  name: "questions",
  initialState: {
    questions: [],
    periodQuestion: [],
    status: "idle",
    error: null,
  },
  reducers: {
    resetQuestionState: (state) => {
      state.questions = [];
      state.error = null;
      state.status = "idle";
    },
    setQuestions: (state, action) => {
      state.questions = action.payload;
    },
    addQuestion: (state, action) => {
      state.questions.push(action.payload); // Add the new question to the state
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch questions
      .addCase(fetchQuestions.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.questions = action.payload;
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchQuestionByPeriod.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchQuestionByPeriod.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.periodQuestion = action.payload;
      })
      .addCase(fetchQuestionByPeriod.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(createQuestion.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createQuestion.fulfilled, (state, action) => {
        state.status = "succeeded";

        const newQuestions = Array.isArray(action.payload.questions)
          ? action.payload.questions
          : [action.payload.questions];

        const processedQuestions = newQuestions.map((question) => {
          // Hitung sort_order untuk state.questions berdasarkan halaman yang sama
          const existingQuestionsOnPage = state.questions.filter(
            (q) => q.page === question.page
          );
          const maxSortOrderQuestions =
            existingQuestionsOnPage.length > 0
              ? Math.max(...existingQuestionsOnPage.map((q) => q.sort_order))
              : -1;

          const requestedSortOrder =
            question.sort_order !== undefined
              ? question.sort_order
              : maxSortOrderQuestions + 1;

          // Jika sort_order dari request ada, geser pertanyaan yang ada dengan sort_order >= requestedSortOrder
          if (question.sort_order !== undefined) {
            state.questions = state.questions.map((q) => {
              if (
                q.page === question.page &&
                q.sort_order >= requestedSortOrder
              ) {
                return { ...q, sort_order: q.sort_order + 1 };
              }
              return q;
            });
          }

          return {
            ...question,
            sort_order: requestedSortOrder, // Gunakan sort_order dari request atau increment dari tertinggi
            options:
              typeof question.options === "string"
                ? JSON.parse(question.options)
                : question.options || [],
            fileTypes:
              typeof question.fileTypes === "string"
                ? question.fileTypes.startsWith("[")
                  ? JSON.parse(question.fileTypes)
                  : question.fileTypes.split(",").map((item) => item.trim())
                : question.fileTypes || [],
          };
        });

        // Tambahkan ke state.questions dan urutkan
        state.questions = [...state.questions, ...processedQuestions];
        state.questions.sort((a, b) => {
          if (a.page === b.page) {
            return a.sort_order - b.sort_order;
          }
          return a.page - b.page;
        });

        const periodId = processedQuestions[0]?.period_id;
        if (periodId) {
          // Hitung sort_order untuk state.periodQuestion berdasarkan halaman yang sama
          const existingPeriodQuestionsOnPage = state.periodQuestion.filter(
            (q) =>
              q.page === processedQuestions[0].page && q.period_id === periodId
          );
          const maxSortOrderPeriod =
            existingPeriodQuestionsOnPage.length > 0
              ? Math.max(
                  ...existingPeriodQuestionsOnPage.map((q) => q.sort_order)
                )
              : -1;

          const updatedProcessedQuestions = processedQuestions.map((q) => {
            const requestedSortOrder =
              q.sort_order !== undefined
                ? q.sort_order
                : maxSortOrderPeriod + 1;

            // Jika sort_order dari request ada, geser pertanyaan yang ada dengan sort_order >= requestedSortOrder
            if (q.sort_order !== undefined) {
              state.periodQuestion = state.periodQuestion.map((existingQ) => {
                if (
                  existingQ.page === q.page &&
                  existingQ.period_id === periodId &&
                  existingQ.sort_order >= requestedSortOrder
                ) {
                  return { ...existingQ, sort_order: existingQ.sort_order + 1 };
                }
                return existingQ;
              });
            }

            return {
              ...q,
              sort_order: requestedSortOrder, // Gunakan sort_order dari request atau increment dari tertinggi
            };
          });

          if (state.periodQuestion.some((q) => q.period_id === periodId)) {
            state.periodQuestion = state.periodQuestion.map((question) =>
              question.period_id === periodId &&
              question.page === processedQuestions[0].page
                ? {
                    ...question,
                    options:
                      typeof question.options === "string"
                        ? JSON.parse(question.options)
                        : question.options || [],
                    fileTypes:
                      typeof question.fileTypes === "string"
                        ? question.fileTypes.startsWith("[")
                          ? JSON.parse(question.fileTypes)
                          : question.fileTypes
                              .split(",")
                              .map((item) => item.trim())
                        : question.fileTypes || [],
                  }
                : question
            );
            state.periodQuestion = [
              ...state.periodQuestion,
              ...updatedProcessedQuestions,
            ];
          } else {
            state.periodQuestion = [
              ...state.periodQuestion,
              ...updatedProcessedQuestions,
            ];
          }
          state.periodQuestion.sort((a, b) => {
            if (a.page === b.page) {
              return a.sort_order - b.sort_order;
            }
            return a.page - b.page;
          });
        }
      })

      .addCase(createQuestion.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Failed to create question";
      })

      // Update questions
      .addCase(updateQuestion.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateQuestion.fulfilled, (state, action) => {
        state.status = "succeeded";
        action.payload.forEach((updatedQuestion) => {
          const index = state.questions.findIndex(
            (q) => q.id === updatedQuestion.id
          );
          if (index !== -1) {
            state.questions[index] = updatedQuestion; // Update pertanyaan yang sudah ada
          }
        });
      })
      .addCase(updateQuestion.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateQuestionOrder.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateQuestionOrder.fulfilled, (state, action) => {
        state.status = "succeeded";

        // Get the reordered questions from the response
        const reorderedQuestions = action.payload;

        // Map through the reordered questions to update their sort_order correctly
        const updatedQuestions = reorderedQuestions.map((question, index) => ({
          ...question,
          sort_order: index, // Update the sort_order based on the new position
        }));

        // Update the state with the correctly ordered questions
        state.questions = updatedQuestions;
      })

      .addCase(updateQuestionOrder.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(deleteQuestion.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        state.status = "succeeded";
        const deletedQuestionId = action.payload;

        // Filter out the deleted question
        state.questions = state.questions.filter(
          (question) => question.id !== deletedQuestionId
        );
      })
      .addCase(deleteQuestion.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Failed to delete question";
      });
  },
});

export const { resetQuestionState, setQuestions, addQuestion } =
  questionSlice.actions;

export default questionSlice.reducer;
