import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";
import { disconnectSocket } from "../../utils/SocketContext";
// Async thunk for checking authentication (sync with backend)
const getAuthHeaders = () => {
  const token = secureLocalStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const token = secureLocalStorage.getItem("auth_token");
      if (!token) return rejectWithValue({ message: "No token found" });

      const response = await axios.get(
        `${process.env.REACT_APP_API}api/is-authenticated`,
        { headers: getAuthHeaders() }
      );

      const { user } = response.data;

      secureLocalStorage.setItem("user", JSON.stringify(user));
      return { user, token };
    } catch (error) {
      console.error("❌ checkAuth error:", error.response?.data);
      secureLocalStorage.removeItem("auth_token");
      secureLocalStorage.removeItem("user");
      return rejectWithValue({
        status: error.response?.status || 401,
        message: error.response?.data?.message || "Unauthorized",
      });
    }
  }
);

// Async thunk for logging in
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/login`,
        credentials
      );

      return {
        ...response.data,
        statusCode: response.data.status,
      };
    } catch (error) {
      const err = error.response?.data;

      if (err?.status === 403 && err?.user) {
        return rejectWithValue({
          ...err,
          statusCode: 403,
          pendingUser: err.user,
        });
      }

      return rejectWithValue(err || { message: "Login failed" });
    }
  }
);

// Async thunk for registering
export const register = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/register`,
        userData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create user"
      );
    }
  }
);
export const changePhoneNumber = createAsyncThunk(
  "auth/changePhoneNumber",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/change-phone-number`,
        data
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          status: 500,
          message: "Failed to change phone number",
        }
      );
    }
  }
);

// Async thunk for verifying OTP
export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async ({ user_id, otp_code, type }, { rejectWithValue }) => {
    try {
      if (!user_id) {
        return rejectWithValue({ message: "User ID is required" });
      }

      if (!otp_code) {
        return rejectWithValue({ message: "OTP code is required" });
      }

      if (!type) {
        return rejectWithValue({ message: "Type is required" });
      }

      const otpString = String(otp_code).trim();
      if (otpString.length !== 6 || !/^\d{6}$/.test(otpString)) {
        return rejectWithValue({ message: "OTP must be exactly 6 digits" });
      }

      console.log("Sending OTP verification request:", {
        user_id,
        otp_code: otpString,
        type,
      });

      const response = await axios.post(
        `${process.env.REACT_APP_API}api/verify-otp`,
        {
          user_id: user_id,
          otp_code: otpString,
          type: type,
        }
      );

      console.log("OTP verification response:", response.data);

      return { ...response.data, type };
    } catch (error) {
      console.error("OTP verification error:", error.response?.data);
      return rejectWithValue(error.response?.data || "OTP verification failed");
    }
  }
);

// Async thunk for resending OTP
export const resendOtp = createAsyncThunk(
  "auth/resendOtp",
  async ({ user_id, type }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/resend-otp`,
        {
          user_id: user_id,
          type,
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to resend OTP");
    }
  }
);

// Async thunk for requesting password reset OTP
export const requestPasswordReset = createAsyncThunk(
  "auth/requestPasswordReset",
  async ({ login, type }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/request-password-reset-otp`,
        { login, type }
      );
      return {
        message: response.data.message,
        user_id: response.data.user_id,
        otp_expires_at: response.data.otp_expires_at,
      };
    } catch (error) {
      console.error("Password reset request error:", error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || "Failed to request password reset"
      );
    }
  }
);

// Async thunk for changing password
export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async ({ user_id, password, password_confirmation }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/change-password`,
        {
          user_id,
          password,
          password_confirmation,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Password change error:", error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || "Password change failed"
      );
    }
  }
);

// Async thunk for requesting login OTP
export const requestLoginOtp = createAsyncThunk(
  "auth/requestLoginOtp",
  async ({ login, type }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/request-login-otp`,
        { login, type }
      );
      const { user_id, message, otp_expires_at, cooldown } = response.data;

      // Validasi manual jika perlu
      if (!user_id || !otp_expires_at) {
        return rejectWithValue({
          status: response.status,
          message: "Invalid response structure from server.",
        });
      }

      return {
        user_id,
        message,
        otp_expires_at,
        cooldown: cooldown || 60,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: "Unknown error occurred",
        }
      );
    }
  }
);

// Async thunk for logging out
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API}api/logout`,
        {},
        { headers: getAuthHeaders() }
      );

      secureLocalStorage.clear();
      disconnectSocket();
      return {};
    } catch (error) {
      secureLocalStorage.clear();
      disconnectSocket();
      return rejectWithValue(error.response?.data?.message || "Logout failed.");
    }
  }
);

// Create slice
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: (() => {
      try {
        const userStr = secureLocalStorage.getItem("user");
        return userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        console.error("Failed to parse user from secureLocalStorage:", e);
        return null;
      }
    })(),

    token: secureLocalStorage.getItem("auth_token") || null,
    isAuthenticated: !!secureLocalStorage.getItem("auth_token"),
    status: "idle",
    error: null,
    message: "",
    otpStatus: "idle",
    otpError: null,
    otpMessage: "",
    isOtpSent: false,
    canResendOtp: false,
    resendCooldown: 0,
    pendingUserId: null,
    pendingUserEmail: null,
    pendingUserPhone: null,
    otpExpiresAt: null,
    passwordResetStatus: "idle",
    passwordResetError: null,
    passwordResetMessage: "",
    isPasswordResetOtpSent: false,
    passwordResetEmail: null,
    isPasswordResetOtpVerified: false,
    otpAttempts: 0,
    maxOtpAttempts: 5,
    otpAttemptResetTime: null,
    changePhoneLoading: false,
    changePhoneError: null,
    changePhoneMessage: null,
  },
  reducers: {
    clearChangePhoneMessages: (state) => {
      state.changePhoneError = null;
      state.changePhoneMessage = null;
    },
    setErrors: (state, action) => {
      state.error = action.payload;
    },
    clearErrors: (state) => {
      state.error = null;
      state.otpError = null;
      state.passwordResetError = null;
    },
    clearMessages: (state) => {
      state.message = "";
      state.otpMessage = "";
      state.passwordResetMessage = "";
    },
    resetState: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.status = "idle";
      state.error = null;
      state.message = "";
      state.otpStatus = "idle";
      state.otpError = null;
      state.otpMessage = "";
      state.isOtpSent = false;
      state.canResendOtp = false;
      state.resendCooldown = 0;
      state.pendingUserId = null;
      state.pendingUserEmail = null;
      state.pendingUserPhone = null;
      state.otpExpiresAt = null;
      state.passwordResetStatus = "idle";
      state.passwordResetError = null;
      state.passwordResetMessage = "";
      state.isPasswordResetOtpSent = false;
      state.passwordResetEmail = null;
      state.isPasswordResetOtpVerified = false;
      state.otpAttempts = 0;
      state.otpAttemptResetTime = null;
    },
    resetOtpState: (state) => {
      state.otpStatus = "idle";
      state.otpError = null;
      state.otpMessage = "";
      state.isOtpSent = false;
      state.canResendOtp = false;
      state.resendCooldown = 0;
      state.pendingUserId = null;
      state.pendingUserEmail = null;
      state.pendingUserPhone = null;
      state.otpExpiresAt = null;
      state.otpAttempts = 0;
      state.otpAttemptResetTime = null;
    },
    resetPasswordResetState: (state) => {
      state.passwordResetStatus = "idle";
      state.passwordResetError = null;
      state.passwordResetMessage = "";
      state.isPasswordResetOtpSent = false;
      state.passwordResetEmail = null;
      state.isPasswordResetOtpVerified = false;
    },
    setResendCooldown: (state, action) => {
      state.resendCooldown = action.payload;
      state.canResendOtp = action.payload === 0;
    },
    decrementCooldown: (state) => {
      if (state.resendCooldown > 0) {
        state.resendCooldown -= 1;
        state.canResendOtp = state.resendCooldown === 0;
      }
    },

    updateSingleUser: (state, action) => {
      const updatedUser = action.payload;
      state.user = {
        ...state.user,
        name: updatedUser.name,
        email: updatedUser.email,
        status: updatedUser.status,
        avatar: updatedUser.avatar,
        device: updatedUser.device,
        roles: updatedUser.roles,
        phone_number: updatedUser.phone_number,
        last_online_at: updatedUser.last_online_at,
        created_at: updatedUser.created_at,
      };
      secureLocalStorage.setItem(
        "user",
        JSON.stringify({
          ...state.user,
          name: updatedUser.name,
          email: updatedUser.email,
          status: updatedUser.status,
          avatar: updatedUser.avatar,
          created_at: updatedUser.created_at,
          device: updatedUser.device,
          roles: updatedUser.roles,
          last_online_at: updatedUser.last_online_at,
          phone_number: updatedUser.phone_number,
        })
      );
    },
    incrementOtpAttempts: (state) => {
      state.otpAttempts += 1;
      if (state.otpAttempts >= state.maxOtpAttempts) {
        state.otpAttemptResetTime = Date.now() + 15 * 60 * 1000;
        state.canResendOtp = false;
      }
    },
    resetOtpAttempts: (state) => {
      state.otpAttempts = 0;
      state.otpAttemptResetTime = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuth.pending, (state) => {
        state.status = "loading";
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.status = "failed";
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })

      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        const { token, user, statusCode, otp_expires_at, user_id } =
          action.payload;

        if (statusCode === 200 && token) {
          state.status = "succeeded";
          state.user = { ...user, token };
          state.token = token;
          state.isAuthenticated = true;
          state.error = null;
          state.pendingUserId = null; // Reset pendingUserId
          secureLocalStorage.setItem("auth_token", token);
          secureLocalStorage.setItem(
            "user",
            JSON.stringify({ ...user, token })
          );
        } else if (statusCode === 200 && otp_expires_at && user_id) {
          state.status = "succeeded";
          state.otpStatus = "pending";
          state.otpMessage = action.payload.message;
          state.otpExpiresAt = otp_expires_at;
          state.pendingUserId = user_id;
          state.isOtpSent = true;
          state.canResendOtp = false;
          state.resendCooldown = action.payload.cooldown || 60;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Login failed";

        if (action.payload?.statusCode === 403 && action.payload?.pendingUser) {
          state.pendingUserId = action.payload.pendingUser.id;
          state.isOtpSent = true;
          state.otpMessage = "Kode OTP dikirim";
          state.otpStatus = "pending";
          state.canResendOtp = false;
          state.otpExpiresAt = null;
        }
      })
      .addCase(requestLoginOtp.pending, (state) => {
        state.otpStatus = "loading";
        state.otpError = null;
      })
      .addCase(requestLoginOtp.fulfilled, (state, action) => {
        state.otpStatus = "succeeded";
        state.otpMessage = action.payload.message;
        state.otpError = null;
        state.isOtpSent = true;
        state.resendCooldown = action.payload.cooldown;
        state.otpExpiresAt = action.payload.otp_expires_at;
        state.canResendOtp = false;
        state.pendingUserId = action.payload.user_id;
      })
      .addCase(requestLoginOtp.rejected, (state, action) => {
        state.otpStatus = "failed";
        state.otpError = action.payload;
      })
      .addCase(register.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.error = null;
        state.message = action.payload.message;
        state.pendingUserId = action.payload.user_id;
        state.pendingUserEmail = action.payload.user_email;
        state.pendingUserPhone = action.payload.user_phone;
        state.isOtpSent = true;
        state.resendCooldown = action.payload.cooldown || 60;
        state.otpExpiresAt = action.payload.otp_expires_at;
        state.canResendOtp = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(changePhoneNumber.pending, (state) => {
        state.changePhoneLoading = true;
        state.changePhoneError = null;
        state.changePhoneMessage = null;
      })
      .addCase(changePhoneNumber.fulfilled, (state, action) => {
        state.changePhoneLoading = false;
        state.changePhoneMessage = action.payload.message;
        // Update pending user id if needed
        if (action.payload.user_id) {
          state.pendingUserId = action.payload.user_id;
        }
      })
      .addCase(changePhoneNumber.rejected, (state, action) => {
        state.changePhoneLoading = false;
        state.changePhoneError = action.payload;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.otpStatus = "loading";
        state.otpError = null;
        state.otpAttempts += 1;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.otpStatus = "succeeded";
        state.otpError = null;
        state.otpMessage = action.payload.message;
        state.isOtpSent = false;
        state.pendingUserId = null;
        state.resendCooldown = 0;
        state.canResendOtp = false;
        state.otpExpiresAt = null;
        state.otpAttempts = 0;
        state.otpAttemptResetTime = null;

        console.log("OTP verified, resetting pendingUserId");

        const { type } = action.meta.arg;

        if (type === "password_reset") {
          state.isPasswordResetOtpVerified = true;
        }

        if (action.payload.token && action.payload.user) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;

          secureLocalStorage.setItem("auth_token", action.payload.token);
          secureLocalStorage.setItem(
            "user",
            JSON.stringify(action.payload.user)
          );
        }
      })

      .addCase(verifyOtp.rejected, (state, action) => {
        state.otpStatus = "failed";
        state.otpError = action.payload;
        if (state.otpAttempts >= state.maxOtpAttempts) {
          state.otpAttemptResetTime = Date.now() + 15 * 60 * 1000;
          state.canResendOtp = false;
        }
      })
      .addCase(resendOtp.pending, (state) => {
        state.otpStatus = "loading";
        state.otpError = null;
      })
      .addCase(resendOtp.fulfilled, (state, action) => {
        state.otpStatus = "succeeded";
        state.otpMessage = action.payload.message;
        state.otpError = null;
        state.resendCooldown = action.payload.cooldown || 60;
        state.otpExpiresAt = action.payload.otp_expires_at;
        state.canResendOtp = false;

        // ✅ Tambahkan ini jika server mengirimkan user_id saat resend
        if (action.payload.user_id) {
          state.pendingUserId = action.payload.user_id;
        }
      })

      .addCase(resendOtp.rejected, (state, action) => {
        state.otpStatus = "failed";
        state.otpError = action.payload;
      })
      .addCase(requestPasswordReset.pending, (state) => {
        state.passwordResetStatus = "loading";
        state.passwordResetError = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state, action) => {
        state.passwordResetStatus = "succeeded";
        state.passwordResetMessage = action.payload.message;
        state.passwordResetError = null;
        state.isPasswordResetOtpSent = true;
        state.pendingUserId = action.payload.user_id;
        state.otpExpiresAt = action.payload.otp_expires_at;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.passwordResetStatus = "failed";
        state.passwordResetError = action.payload;
      })
      .addCase(changePassword.pending, (state) => {
        state.passwordResetStatus = "loading";
        state.passwordResetError = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.passwordResetStatus = "succeeded";
        state.passwordResetMessage = action.payload.message;
        state.passwordResetError = null;
        state.isPasswordResetOtpSent = false;
        state.isPasswordResetOtpVerified = false;
        state.otpExpiresAt = null;
        state.pendingUserId = null; // Reset pendingUserId
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.passwordResetStatus = "failed";
        state.passwordResetError = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.status = "idle";
        state.error = null;
        state.pendingUserId = null; // Reset pendingUserId
      })
      .addCase(logout.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.pendingUserId = null; // Reset pendingUserId
      });
  },
});

// Selectors
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectOtpStatus = (state) => state.auth.otpStatus;
export const selectOtpError = (state) => state.auth.otpError;
export const selectOtpMessage = (state) => state.auth.otpMessage;
export const selectIsOtpSent = (state) => state.auth.isOtpSent;
export const selectCanResendOtp = (state) => state.auth.canResendOtp;
export const selectResendCooldown = (state) => state.auth.resendCooldown;
export const selectPendingUserId = (state) => state.auth.pendingUserId;
export const selectOtpExpiresAt = (state) => state.auth.otpExpiresAt;
export const selectPasswordResetStatus = (state) =>
  state.auth.passwordResetStatus;
export const selectPasswordResetError = (state) =>
  state.auth.passwordResetError;
export const selectPasswordResetMessage = (state) =>
  state.auth.passwordResetMessage;
export const selectIsPasswordResetOtpSent = (state) =>
  state.auth.isPasswordResetOtpSent;
export const selectIsPasswordResetOtpVerified = (state) =>
  state.auth.isPasswordResetOtpVerified;
export const selectOtpAttempts = (state) => state.auth.otpAttempts;
export const selectOtpAttemptResetTime = (state) =>
  state.auth.otpAttemptResetTime;
export const selectUserRoles = (state) => state.auth.user?.role;

// Export reducer and actions
export default authSlice.reducer;
export const {
  resetState,
  resetOtpState,
  resetPasswordResetState,
  updateBalance,
  updateSingleUser,
  setErrors,
  clearErrors,
  clearMessages,
  setResendCooldown,
  decrementCooldown,
  incrementOtpAttempts,
  resetOtpAttempts,
  clearChangePhoneMessages,
} = authSlice.actions;
