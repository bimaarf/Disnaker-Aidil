import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useDispatch, useStore } from "react-redux";
import { toast } from "react-toastify";
import { debounce } from "lodash";
import { io } from "socket.io-client";
import {
  addNewSubmission as addNewSubmissionAnswer,
  fetchStatusTotalsOnly,
  removeRespondent,
  respondentCache,
  respondentDetailCache,
  saveSkipNextFetchFlag,
  updateAllRelevantCaches,
  updateResultState,
} from "../features/ppdb/answerSlice";
import {
  addNewSubmission as addNewSubmissionPeriod,
  createPeriod,
  deletePeriods,
  fetchAllPeriods,
  updateSinglePeriod,
} from "../features/ppdb/periodSlice";
import { store } from "../features/store";
import { toPlainObject } from "./toPlainObject";
import { getValidationStatusObject } from "./validationUtils";

const SocketWhatsappContext = createContext(null);

export const useWhatsappSocket = () => useContext(SocketWhatsappContext);

const VALID_ROLES = ["administrator", "super admin", "user", "teacher"];

const getPeriodData = async (identifier) => {
  const state = store.getState();
  let period =
    state.periods.allPeriods.find(
      (p) => p.key === identifier || p.id === identifier
    ) ||
    Object.values(state.periods.periodDetails).find(
      (detail) =>
        detail.period?.key === identifier || detail.period?.id === identifier
    )?.period;

  if (!period) {
    try {
      await store.dispatch(fetchAllPeriods()).unwrap();
      const updatedState = store.getState();
      period = updatedState.periods.allPeriods.find(
        (p) => p.key === identifier || p.id === identifier
      );
    } catch (error) {
      console.error("[WA-SOCKET] Failed to fetch periods:", error);
    }
  }

  return period
    ? { ...period, is_published: period.is_published ?? false }
    : null;
};

const getStatusFromResult = (
  status,
  is_approve,
  selection_type,
  is_published = true,
  userRole = "administrator"
) => {
  let statusLabel = "Belum_Ditentukan";

  // Cek approve
  if (is_approve === true) statusLabel = "Berkas_Diterima";
  else if (is_approve === false) statusLabel = "Berkas_Dikembalikan";

  // Menunggu hasil untuk user biasa jika periode belum publish
  if (userRole === "user" && selection_type !== null && !is_published) {
    statusLabel = "Menunggu_Hasil";
  }

  // Status hasil seleksi hanya jika periode sudah publish
  if (is_published) {
    if (status === true) statusLabel = "Lulus";
    else if (status === false && selection_type !== null)
      statusLabel = "Tidak_Lulus";
  }

  return statusLabel;
};

const validatePayload = (data, requiredFields, eventName) => {
  if (!data) {
    console.warn(`[WA-SOCKET] ${eventName} payload is null or undefined`);
    return false;
  }
  const missingFields = requiredFields.filter(
    (field) => data[field] === undefined || data[field] === null
  );
  if (missingFields.length) {
    console.warn(
      `[WA-SOCKET] Invalid ${eventName} payload, missing: ${missingFields.join(
        ", "
      )}`,
      data
    );
    return false;
  }
  return true;
};

const hasValidRole = (userRole) => VALID_ROLES.includes(userRole);

const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.warn("[WA-SOCKET] Notification API not supported");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (error) {
    console.warn(
      "[WA-SOCKET] Error requesting notification permission:",
      error
    );
    return false;
  }
};

const subscribeToPush = async () => {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("[WA-SOCKET] Push notifications not supported");
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(
        process.env.REACT_APP_VAPID_PUBLIC_KEY
      ),
    });

    const response = await fetch(
      `${process.env.REACT_APP_API_BASE}/subscribe`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      }
    );

    if (!response.ok) {
      throw new Error(`Subscription failed: ${response.statusText}`);
    }

    console.debug("[WA-SOCKET] Push subscription created:", subscription);
  } catch (error) {
    console.error("[WA-SOCKET] Error subscribing to push:", error);
  }
};

const urlB64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const showBrowserNotification = async (title, options = {}) => {
  const hasPermission = await requestNotificationPermission();

  if (!hasPermission) {
    console.warn("[WA-SOCKET] No notification permission");
    return null;
  }

  try {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;

      const notificationOptions = {
        body: options.body || "New update received",
        icon:
          options.icon || `${process.env.REACT_APP_API}logo/images/logo.png`,
        badge:
          options.badge || `${process.env.REACT_APP_API}logo/images/logo.png`,
        tag: options.tag || "default",
        vibrate: options.vibrate || [200, 100, 200],
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        renotify: options.renotify || false,
        timestamp: Date.now(),
        data: {
          url: options.url || window.location.href,
          timestamp: Date.now(),
          ...options.data,
        },
        actions: options.actions || [
          {
            action: "view-detail",
            title: "Lihat Detail",
            icon: `${process.env.REACT_APP_API}logo/images/logo.png`,
          },
        ],
      };

      await registration.showNotification(title, notificationOptions);
      console.debug("[WA-SOCKET] Notification sent via Service Worker:", title);
      return { title, options: notificationOptions };
    } else {
      const notificationOptions = {
        body: options.body || "New update received",
        icon:
          options.icon || `${process.env.REACT_APP_API}logo/images/logo.png`,
        badge:
          options.badge || `${process.env.REACT_APP_API}logo/images/logo.png`,
        tag: options.tag || "default",
        vibrate: options.vibrate || [200, 100, 200],
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        renotify: options.renotify || false,
        timestamp: Date.now(),
        data: {
          url: options.url || window.location.href,
          timestamp: Date.now(),
          ...options.data,
        },
      };

      const notification = new Notification(title, notificationOptions);

      notification.onshow = () => {
        console.debug("[WA-SOCKET] Notification shown:", title);
      };

      notification.onclick = (event) => {
        event.preventDefault();
        console.debug("[WA-SOCKET] Notification clicked:", title);
        if (window) {
          window.focus();
        }
        if (options.onClick && typeof options.onClick === "function") {
          options.onClick(event);
        }
        notification.close();
      };

      notification.onclose = () => {
        console.debug("[WA-SOCKET] Notification closed:", title);
      };

      notification.onerror = (error) => {
        console.error("[WA-SOCKET] Notification error:", error);
      };

      const autoCloseTime = options.autoClose || 8000;
      if (autoCloseTime > 0) {
        setTimeout(() => {
          notification.close();
        }, autoCloseTime);
      }

      return notification;
    }
  } catch (error) {
    console.error("[WA-SOCKET] Error showing browser notification:", error);

    try {
      const fallbackNotification = new Notification(title, {
        body: options.body || "New update received",
        icon: `${process.env.REACT_APP_API}logo/images/logo.png`,
      });

      fallbackNotification.onclick = () => {
        window.focus();
        fallbackNotification.close();
      };

      setTimeout(() => fallbackNotification.close(), 5000);
      return fallbackNotification;
    } catch (fallbackError) {
      console.error(
        "[WA-SOCKET] Fallback notification also failed:",
        fallbackError
      );
      return null;
    }
  }
};

const backgroundSync = {
  pendingUpdates: new Map(),

  addPendingUpdate: (type, data) => {
    const key = `${type}-${Date.now()}`;
    backgroundSync.pendingUpdates.set(key, {
      type,
      data,
      timestamp: Date.now(),
    });

    try {
      sessionStorage.setItem(
        "socket_pending_updates",
        JSON.stringify(Array.from(backgroundSync.pendingUpdates.entries()))
      );
    } catch (error) {
      console.warn("[WA-SOCKET] Failed to persist pending updates:", error);
      try {
        sessionStorage.clear();
        sessionStorage.setItem(
          "socket_pending_updates",
          JSON.stringify(Array.from(backgroundSync.pendingUpdates.entries()))
        );
      } catch (retryError) {
        console.error(
          "[WA-SOCKET] Failed to persist pending updates after retry:",
          retryError
        );
      }
    }
  },

  processPendingUpdates: (handlers) => {
    backgroundSync.loadPendingUpdates();

    let processedCount = 0;
    backgroundSync.pendingUpdates.forEach(({ type, data }) => {
      console.debug(`[WA-SOCKET] Processing pending ${type} update:`, data);

      try {
        switch (type) {
          case "result-verified":
            handlers.handleResultVerified(data);
            processedCount++;
            break;
          case "result-updated":
            handlers.handleResultUpdated(data);
            processedCount++;
            break;
          case "new-submission":
            handlers.handleNewSubmission(data);
            processedCount++;
            break;
          default:
            console.warn(`[WA-SOCKET] Unknown pending update type: ${type}`);
        }
      } catch (error) {
        console.error(
          `[WA-SOCKET] Error processing pending ${type} update:`,
          error
        );
      }
    });

    if (processedCount > 0) {
      showBrowserNotification("📱 Updates Processed", {
        body: `${processedCount} pending updates were processed`,
        tag: "background-sync",
        autoClose: 3000,
      });
    }

    backgroundSync.pendingUpdates.clear();
    try {
      sessionStorage.removeItem("socket_pending_updates");
    } catch (error) {
      console.warn(
        "[WA-SOCKET] Failed to clear pending updates from storage:",
        error
      );
    }
  },

  loadPendingUpdates: () => {
    try {
      const stored = sessionStorage.getItem("socket_pending_updates");
      if (stored) {
        const updates = JSON.parse(stored);
        backgroundSync.pendingUpdates = new Map(updates);
      }
    } catch (error) {
      console.warn("[WA-SOCKET] Failed to load pending updates:", error);
      try {
        sessionStorage.removeItem("socket_pending_updates");
      } catch (clearError) {
        console.error(
          "[WA-SOCKET] Failed to clear corrupted pending updates:",
          clearError
        );
      }
    }
  },
};

export const SocketWhatsappProvider = ({ children }) => {
  const [status, setStatus] = useState("initializing");
  const [qrCode, setQrCode] = useState(null);
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden);
  const socketRef = useRef(null);
  const dispatch = useDispatch();
  const store = useStore();
  const lastProcessedEvents = useRef(new Map());
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);

  const showToast = useCallback(
    debounce((message, options = {}) => {
      if (isPageVisible || options.priority === "high") {
        toast[options.type || "success"](message, {
          position: "bottom-left",
          autoClose: options.priority === "high" ? 8000 : 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          ...options,
        });
      }
    }, 300),
    [isPageVisible]
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsPageVisible(visible);

      if (visible) {
        console.debug(
          "[WA-SOCKET] Page became visible, processing pending updates"
        );

        backgroundSync.loadPendingUpdates();
        backgroundSync.processPendingUpdates({
          handleResultUpdated,
          handleResultVerified,
          handleNewSubmission,
        });

        if (socketRef.current && !socketRef.current.connected) {
          console.debug(
            "[WA-SOCKET] Reconnecting socket after visibility change"
          );
          socketRef.current.connect();
        }

        // dispatch(fetchStatusTotalsOnly());
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [dispatch, store]);

  const initializeSocket = useCallback(() => {
    if (socketRef.current) {
      return socketRef.current;
    }

    console.debug("[WA-SOCKET] Initializing new socket connection");
    const socket = io(process.env.REACT_APP_WS_URL, {
      path: process.env.REACT_APP_SOCKET_PATH,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      forceNew: true, // pakai instance baru
    });

    // ✅ Emit identify event agar server tahu user ID dan role-nya
    const authUser = store.getState().auth.user;
    if (authUser) {
      socket.emit("identify", {
        user_id: authUser.id,
        role: authUser.role,
        submission_id: authUser.submission_id, // pastikan ini ada di auth user
      });
    }

    socketRef.current = socket;
    return socket;
  }, []);

  const reconnectSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && !socketRef.current.connected) {
        console.debug("[WA-SOCKET] Attempting to reconnect socket");
        socketRef.current.connect();
      } else if (!socketRef.current) {
        initializeSocket();
      }
    }, 1000);
  }, [initializeSocket]);

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("ping", { timestamp: Date.now() });
      } else {
        console.debug("[WA-SOCKET] Heartbeat failed, reconnecting...");
        reconnectSocket();
      }
    }, 30000);
  }, [reconnectSocket]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  //handle dari socketContext
  const handleNewSubmission = useCallback(
    async (submission) => {
      console.debug(
        "[WA-SOCKET] Received new-submission payload:",
        JSON.stringify(submission, null, 2)
      );

      const currentUser = store.getState().auth.user;
      const userRole = store.getState().auth.user?.role;

      if (!hasValidRole(userRole)) {
        console.debug("[WA-SOCKET] Invalid user role, ignoring");
        return;
      }

      if (userRole === "user" && submission.user_email !== currentUser.email) {
        return;
      }

      if (
        !validatePayload(
          submission,
          ["submission_id", "user_name", "period_id", "answers", "created_at"],
          "new-submission"
        )
      ) {
        showToast("Received invalid submission data", {
          type: "error",
          priority: "high",
        });
        return;
      }

      if (!isPageVisible) {
        backgroundSync.addPendingUpdate("new-submission", submission);
        await showBrowserNotification("📝 Pendaftaran Baru", {
          body: `Pendaftaran baru dari ${submission.user_name} (ID: ${submission.submission_id})`,
          tag: `new-submission-${submission.submission_id}`,
          icon: `${process.env.REACT_APP_API}logo/images/logo.png`,
          vibrate: [200, 100, 200, 100, 200],
          requireInteraction: true,
          url: `/form/respondent/preview/${submission.submission_id}`,
        });
        return;
      }

      const formattedSubmission = {
        ...toPlainObject(submission),
        validation_status: submission.validation_status?.label
          ? {
              label: submission.validation_status.label.replace(/_/g, " "),
              icon: submission.validation_status.icon,
              color: submission.validation_status.color,
            }
          : getValidationStatusObject("Belum_Diverifikasi"),
        isNew: true,
        answers: submission.answers.map((answer) => ({
          ...answer,
          options:
            typeof answer.options === "string"
              ? JSON.parse(answer.options)
              : answer.options,
        })),
      };

      // ✅ CHECK: Apakah submission sudah ada di Redux?
      const reduxState = store.getState();
      const existingPeriodData =
        reduxState.answers?.respondentsByPeriod?.[submission.period_id];

      const isDuplicateInRedux = existingPeriodData?.data?.some(
        (r) => r.submission_id === submission.submission_id
      );

      // ✅ CHECK: Apakah submission sudah ada di cache?
      const periodCacheKey = JSON.stringify({
        page: 1,
        perPage: 10,
        periodId: submission.period_id,
      });
      const cachedPeriodData = respondentDetailCache.get(periodCacheKey);
      const isDuplicateInCache = cachedPeriodData?.data?.some(
        (r) => r.submission_id === submission.submission_id
      );

      if (isDuplicateInRedux && isDuplicateInCache) {
        console.log(
          `[WA-SOCKET] Submission ${submission.submission_id} already exists, skip processing`
        );
        return;
      }

      console.log(
        `[WA-SOCKET] Processing new submission ${submission.submission_id} for period ${submission.period_id}`
      );

      // ✅ UPDATE CACHE FIRST (sebelum dispatch)
      const globalCacheKey = JSON.stringify({
        page: 1,
        perPage: 10,
        periodId: submission.period_id,
        searchQuery: "",
        fromDate: "",
        toDate: "",
      });

      const existingGlobalCache = respondentCache.get(globalCacheKey) || {
        data: [],
        total: 0,
        total_visible: 0,
        total_hidden: 0,
        current_page: 1,
        last_page: 1,
      };

      if (!isDuplicateInCache) {
        respondentCache.set(globalCacheKey, {
          ...toPlainObject(existingGlobalCache),
          data: [
            toPlainObject(formattedSubmission),
            ...toPlainObject(existingGlobalCache.data),
          ],
          total: existingGlobalCache.total + 1,
          total_visible:
            formattedSubmission.validation_status.label !== "Belum_Diverifikasi"
              ? existingGlobalCache.total_visible + 1
              : existingGlobalCache.total_visible,
          timestamp: Date.now(),
        });
      }

      // Update respondentDetailCache
      if (cachedPeriodData && !isDuplicateInCache) {
        respondentDetailCache.set(periodCacheKey, {
          ...cachedPeriodData,
          data: [toPlainObject(formattedSubmission), ...cachedPeriodData.data],
          timestamp: Date.now(),
        });
        console.log(
          `[WA-SOCKET] Updated cache: ${cachedPeriodData.data.length} -> ${
            cachedPeriodData.data.length + 1
          } items`
        );
      } else if (!cachedPeriodData) {
        const baseData = existingPeriodData?.data || [];
        respondentDetailCache.set(periodCacheKey, {
          data: [toPlainObject(formattedSubmission), ...baseData],
          current_page: 1,
          last_page: existingPeriodData?.last_page || 1,
          timestamp: Date.now(),
        });
        console.log(
          `[WA-SOCKET] Created new cache with ${baseData.length + 1} items`
        );
      }

      // ✅ DISPATCH ONLY ONCE - Gunakan batch dispatch
      const batchActions = [];

      // 1. Add to global respondents (jika belum ada)
      if (!isDuplicateInRedux) {
        console.log(`[WA-SOCKET] Dispatching addNewSubmissionAnswer`);
        dispatch(addNewSubmissionAnswer(formattedSubmission));
      }

      // 2. Add to period respondents
      console.log(`[WA-SOCKET] Dispatching addNewSubmissionToPeriod`);
      dispatch({
        type: "answers/addNewSubmissionToPeriod",
        payload: {
          periodId: submission.period_id,
          submission: formattedSubmission,
        },
      });

      // 3. Execute batch
      batchActions.forEach((action) => dispatch(action));

      // ✅ Save skip flag ONCE
      saveSkipNextFetchFlag(submission.period_id);

      // 4. Update period stats
      dispatch(addNewSubmissionPeriod(formattedSubmission));

      if (submission.period) {
        dispatch(updateSinglePeriod(submission.period));
      }

      // ✅ Debug log (setelah semua dispatch selesai)
      const updatedState = store.getState();
      console.log(
        `[WA-SOCKET] After dispatch for period ${submission.period_id}:`,
        {
          globalRespondents: updatedState.answers.respondents?.length,
          periodDataLength:
            updatedState.answers.respondentsByPeriod[submission.period_id]?.data
              ?.length,
          skipNextFetch:
            updatedState.answers.respondentsByPeriod[submission.period_id]
              ?.skipNextFetch,
          firstItem:
            updatedState.answers.respondentsByPeriod[submission.period_id]
              ?.data?.[0]?.submission_id,
          hasIsNew:
            updatedState.answers.respondentsByPeriod[submission.period_id]
              ?.data?.[0]?.isNew,
        }
      );

      const message = `Pendaftaran baru dari ${submission.user_name} (ID: ${submission.submission_id})`;
      showToast(message, { type: "success" });

      await showBrowserNotification("📝 Pendaftaran Baru", {
        body: message,
        tag: `new-submission-${submission.submission_id}`,
        icon: `${process.env.REACT_APP_API}logo/images/logo.png`,
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true,
        url: `/form/respondent/preview/${submission.submission_id}`,
      });

      dispatch(fetchStatusTotalsOnly());
    },
    [dispatch, store, showToast, isPageVisible]
  );

  const handleResultVerified = useCallback(
    async (resultData) => {
      console.debug(
        "[WA-SOCKET] Handling result-verified:",
        JSON.stringify(resultData, null, 2)
      );

      const userRole = store.getState().auth.user?.role;
      if (!hasValidRole(userRole)) {
        console.debug("[WA-SOCKET] Unauthorized role, skipping");
        return;
      }

      if (
        !validatePayload(
          resultData,
          ["submission_id", "result", "is_approve"],
          "result-verified"
        )
      ) {
        showToast("Data verifikasi tidak valid", { type: "error" });
        return;
      }

      const periodIdentifier =
        resultData.period?.id ||
        resultData.period_id ||
        resultData.period?.key ||
        resultData.period_key;
      let period = resultData.period;
      let isPublished = resultData.period?.is_published ?? false;

      if (!period && periodIdentifier) {
        period = await getPeriodData(periodIdentifier);
        isPublished = period?.is_published ?? false;
      }

      if (!period) {
        console.error(`Period not found for identifier: ${periodIdentifier}`);
        return;
      }

      const previousStatus = resultData.previous_validation_status || {
        label: "Belum_Diverifikasi",
      };
      const newStatus = getValidationStatusObject(
        getStatusFromResult(
          resultData.result.status,
          resultData.result.is_approve,
          resultData.result.selection_type,
          isPublished,
          userRole
        )
      );

      if (!isPageVisible) {
        backgroundSync.addPendingUpdate("result-verified", {
          ...resultData,
          period_key: period.key,
          period_id: period.id,
          period_status: period.status,
          is_published: isPublished,
        });
        return;
      }

      const eventKey = `result-verified-${resultData.submission_id}`;
      if (
        lastProcessedEvents.current.get(eventKey) ===
        resultData.result.updated_at
      ) {
        console.debug("[WA-SOCKET] Duplicate verify event, skipping");
        return;
      }
      lastProcessedEvents.current.set(eventKey, resultData.result.updated_at);

      dispatch(
        updateResultState({
          submission_id: resultData.submission_id,
          result: resultData.result,
          previous_validation_status: previousStatus,
          validation_status: newStatus,
          period_key: period.key,
          period_id: period.id,
          is_published: isPublished,
          userRole,
        })
      );

      const state = store.getState();
      const respondent =
        state.answers.respondents.find(
          (r) => r.submission_id === resultData.submission_id
        ) ?? respondentDetailCache.get(resultData.submission_id)?.data;

      if (respondent) {
        const updatedRespondent = {
          ...toPlainObject(respondent),

          submission_id: resultData.submission_id,
          result: resultData.result,
          validation_status: newStatus,
          period: { ...respondent.period, is_published: isPublished },
        };

        updateAllRelevantCaches(state, toPlainObject(updatedRespondent));
        updateAllRelevantCaches(state, toPlainObject(updatedRespondent), true);
      }

      const statusMsg =
        previousStatus.label !== newStatus.label
          ? `Status berubah dari ${previousStatus.label} ke ${newStatus.label}`
          : `Data diverifikasi (${newStatus.label})`;

      showToast(`✅ Verifikasi berhasil: ${statusMsg}`);
      await showBrowserNotification("✅ Hasil Diverifikasi", {
        body: `ID: ${resultData.submission_id}\n${statusMsg}`,
        data: { url: `/form/respondent/preview/${resultData.submission_id}` },
      });

      dispatch(fetchStatusTotalsOnly());
    },
    [dispatch, store, showToast, isPageVisible]
  );

  const handleResultUpdated = useCallback(
    async (resultData) => {
      console.debug(
        "[WA-SOCKET] Handling result-updated:",
        JSON.stringify(resultData, null, 2)
      );

      const userRole = store.getState().auth.user?.role;
      if (!hasValidRole(userRole)) {
        console.debug("[WA-SOCKET] Unauthorized role, skipping");
        return;
      }

      if (
        !validatePayload(
          resultData,
          ["submission_id", "result"],
          "result-updated"
        )
      ) {
        showToast("Data update tidak valid", { type: "error" });
        return;
      }

      const periodIdentifier =
        resultData.period?.id ||
        resultData.period_id ||
        resultData.period?.key ||
        resultData.period_key;
      let period = resultData.period;
      let isPublished = resultData.period?.is_published ?? false;

      if (!period && periodIdentifier) {
        period = await getPeriodData(periodIdentifier);
        isPublished = period?.is_published ?? false;
      }

      if (!period) {
        console.error(`Period not found for identifier: ${periodIdentifier}`);
        return;
      }

      const previousStatus = resultData.previous_validation_status || {
        label: "Belum_Ditentukan",
      };
      const newStatus = getValidationStatusObject(
        getStatusFromResult(
          resultData.result.status,
          resultData.result.is_approve,
          resultData.result.selection_type,
          isPublished,
          userRole
        )
      );

      if (!isPageVisible) {
        backgroundSync.addPendingUpdate("result-updated", {
          ...resultData,
          period_key: period.key,
          period_id: period.id,
          period_status: period.status,
          is_published: isPublished,
        });
        return;
      }

      const eventKey = `result-updated-${resultData.submission_id}`;
      if (
        lastProcessedEvents.current.get(eventKey) ===
        resultData.result.updated_at
      ) {
        console.debug("[WA-SOCKET] Duplicate event, skipping");
        return;
      }
      lastProcessedEvents.current.set(eventKey, resultData.result.updated_at);

      dispatch(
        updateResultState({
          submission_id: resultData.submission_id,
          result: resultData.result,
          previous_validation_status: previousStatus,
          validation_status: newStatus,
          period_key: period.key,
          period_id: period.id,
          is_published: isPublished,
          userRole,
        })
      );

      const state = store.getState();
      const respondent =
        state.answers.respondents.find(
          (r) => r.submission_id === resultData.submission_id
        ) ?? respondentDetailCache.get(resultData.submission_id)?.data;

      if (respondent) {
        const updatedRespondent = {
          ...toPlainObject(respondent),
          submission_id: resultData.submission_id,
          result: resultData.result,
          validation_status: newStatus,
          period: { ...respondent.period, is_published: isPublished },
        };

        updateAllRelevantCaches(state, toPlainObject(updatedRespondent));
        updateAllRelevantCaches(state, toPlainObject(updatedRespondent), true);
      }

      const statusChangeMsg =
        previousStatus.label !== newStatus.label
          ? `Status berubah dari ${previousStatus.label} ke ${newStatus.label}`
          : `Data diperbarui (${newStatus.label})`;

      showToast(`Update hasil: ${statusChangeMsg}`);
      await showBrowserNotification("🔄 Hasil Diupdate", {
        body: `ID: ${resultData.submission_id}\n${statusChangeMsg}`,
        data: { url: `/form/respondent/preview/${resultData.submission_id}` },
      });

      dispatch(fetchStatusTotalsOnly());
    },
    [dispatch, store, showToast, isPageVisible]
  );

  const handleRespondentDeleted = useCallback(
    async (data) => {
      const userRole = store.getState().auth.user?.role;

      if (!hasValidRole(userRole)) {
        console.debug(
          "[WA-SOCKET] Invalid user role, ignoring respondent-deleted"
        );
        return;
      }

      if (!validatePayload(data, ["submission_id"], "respondent-deleted")) {
        showToast("Received invalid respondent deletion data", {
          type: "error",
          priority: "high",
        });
        return;
      }

      const eventKey = `respondent-deleted-${data.submission_id}`;
      if (lastProcessedEvents.current.get(eventKey)) {
        console.debug(
          "[WA-SOCKET] Duplicate respondent-deleted event, skipping"
        );
        return;
      }

      lastProcessedEvents.current.set(eventKey, Date.now());

      dispatch(removeRespondent(data.submission_id));
      respondentDetailCache.delete(data.submission_id);

      respondentCache.forEach((value, key) => {
        const updatedData = value.data.filter(
          (item) => item.submission_id !== data.submission_id
        );
        respondentCache.set(key, {
          ...value,
          data: toPlainObject(updatedData),
        });
      });

      const message = `Data pendaftaran dengan ID: ${data.submission_id} telah dihapus`;
      showToast(message, { type: "info" });

      await showBrowserNotification("🗑‍💼 Informasi", {
        body: message,
        tag: eventKey,
        icon: `${process.env.REACT_APP_API}logo/images/logo.png`,
        vibrate: [200],
        url: "/",
        actions: [
          {
            action: "view-detail",
            title: "Lihat",
            icon: `${process.env.REACT_APP_API}logo/images/logo.png`,
          },
        ],
      });
    },
    [dispatch]
  );

  const handleNewPeriod = useCallback(
    async (period) => {
      const userRole = store.getState().auth.user?.role;

      if (!hasValidRole(userRole)) {
        console.debug("[WA-SOCKET] Invalid user role for new-period");
        return;
      }

      if (!validatePayload(period, ["id", "title"], "new-period")) {
        showToast("Received invalid period data", {
          type: "error",
          priority: "high",
        });
        return;
      }

      const eventKey = `new-period-${period.id}`;
      if (lastProcessedEvents.current.get(eventKey)) {
        console.debug("[WA-SOCKET] Duplicate new-period event, skipping");
        return;
      }

      lastProcessedEvents.current.set(eventKey, Date.now());

      dispatch(createPeriod.fulfilled(period, "createPeriod", period));

      const message = `Periode baru: ${period.title} (ID: ${period.id})`;
      showToast(message, { type: "success" });

      await showBrowserNotification("📅 Periode Baru", {
        body: message,
        tag: eventKey,
        icon: `${process.env.REACT_APP_API}logo/images/logo.png`,
        vibrate: [300],
        url: `/period/${period.id}`,
        actions: [
          {
            action: "view-detail",
            title: "Lihat Detail",
            icon: `${process.env.REACT_APP_API}logo/images/logo.png`,
          },
        ],
      });
    },
    [dispatch, showToast]
  );

  const handlePeriodUpdated = useCallback(
    async (period) => {
      const userRole = store.getState().auth.user?.role;

      if (!hasValidRole(userRole)) {
        console.debug("[WA-SOCKET] Invalid user role, ignoring period-updated");
        return;
      }

      if (!validatePayload(period, ["id", "title"], "period-updated")) {
        showToast("Received invalid period update data", {
          type: "error",
          priority: "high",
        });
        return;
      }

      const eventKey = `period-updated-${period.id}`;
      if (lastProcessedEvents.current.get(eventKey) === period.updated_at) {
        console.debug("[WA-SOCKET] Duplicate period-updated event, skipping");
        return;
      }

      lastProcessedEvents.current.set(eventKey, period.updated_at);

      dispatch(updateSinglePeriod(period));

      // Update semua status pendaftaran (answers) untuk period ini, terlepas dari is_published true/false
      const state = store.getState();
      const isPublished = period.is_published ?? false;

      // Update respondents di Redux state
      const updatedRespondents = state.answers.respondents.map((respondent) => {
        if (
          respondent.period_id === period.id ||
          respondent.period?.id === period.id
        ) {
          const result = respondent.result || {};
          const newStatus = getValidationStatusObject(
            getStatusFromResult(
              result.status,
              result.is_approve,
              result.selection_type,
              isPublished,
              userRole
            )
          );

          return {
            ...toPlainObject(respondent),
            validation_status: newStatus,
            period: { ...respondent.period, is_published: isPublished },
          };
        }
        return respondent;
      });

      // Dispatch update bulk jika diperlukan (asumsi ada action untuk update multiple, atau update satu per satu)
      updatedRespondents.forEach((updatedRespondent) => {
        if (updatedRespondent.period_id === period.id) {
          dispatch(
            updateResultState({
              submission_id: updatedRespondent.submission_id,
              result: updatedRespondent.result,
              previous_validation_status: updatedRespondent.validation_status, // Gunakan current sebagai previous untuk simplicity
              validation_status: updatedRespondent.validation_status,
              period_key: period.key,
              period_id: period.id,
              is_published: isPublished,
              userRole,
            })
          );
        }
      });

      // Update respondentCache
      respondentCache.forEach((cacheValue, cacheKey) => {
        const updatedData = cacheValue.data.map((item) => {
          if (item.period_id === period.id || item.period?.id === period.id) {
            const result = item.result || {};
            const newStatus = getValidationStatusObject(
              getStatusFromResult(
                result.status,
                result.is_approve,
                result.selection_type,
                isPublished,
                userRole
              )
            );

            return {
              ...toPlainObject(item),
              validation_status: newStatus,
              period: { ...item.period, is_published: isPublished },
            };
          }
          return item;
        });

        respondentCache.set(cacheKey, {
          ...cacheValue,
          data: toPlainObject(updatedData),
        });
      });

      // Update respondentDetailCache
      respondentDetailCache.forEach((detailValue, detailKey) => {
        const item = detailValue.data;
        if (
          item &&
          (item.period_id === period.id || item.period?.id === period.id)
        ) {
          const result = item.result || {};
          const newStatus = getValidationStatusObject(
            getStatusFromResult(
              result.status,
              result.is_approve,
              result.selection_type,
              isPublished,
              userRole
            )
          );

          respondentDetailCache.set(detailKey, {
            ...detailValue,
            data: {
              ...toPlainObject(item),
              validation_status: newStatus,
              period: { ...item.period, is_published: isPublished },
            },
          });
        }
      });

      // Invalidasi cache dan refresh totals
      dispatch({
        type: "answers/setCacheInvalidationTimestamp",
        payload: Date.now(),
      });
      dispatch(fetchStatusTotalsOnly());

      const message = `Periode diperbarui: ${period.title} (ID: ${period.id}). Status semua pendaftaran telah diperbarui.`;
      showToast(message, { type: "info" });

      await showBrowserNotification("🔄 Periode Diperbarui", {
        body: message,
        tag: eventKey,
        icon: `${process.env.REACT_APP_API}logo/images/logo.png`,
        vibrate: [200],
        url: `/period/${period.id}`,
        actions: [
          {
            action: "view-detail",
            title: "Lihat Detail",
            icon: `${process.env.REACT_APP_API}logo/images/logo.png`,
          },
        ],
      });
    },
    [dispatch, showToast]
  );

  const handlePeriodDeleted = useCallback(
    async (period) => {
      const userRole = store.getState().auth.user?.role;

      if (!hasValidRole(userRole)) {
        console.debug("[WA-SOCKET] Invalid user role, ignoring period-deleted");
        return;
      }

      if (!validatePayload(period, ["id"], "period-deleted")) {
        showToast("Data penghapusan periode tidak valid", {
          type: "error",
          priority: "high",
        });
        return;
      }

      const eventKey = `period-deleted-${period.id}`;
      if (lastProcessedEvents.current.get(eventKey)) {
        console.debug("[WA-SOCKET] Duplikat event period-deleted, diabaikan");
        return;
      }

      lastProcessedEvents.current.set(eventKey, Date.now());

      dispatch(
        deletePeriods.fulfilled([period.id], "deletePeriods", [period.id])
      );

      const message = `Periode dihapus: ${period.title} (ID: ${period.id})`;
      showToast(message, { type: "warning" });

      await showBrowserNotification("🗑️ Periode Dihapus", {
        body: message,
        tag: eventKey,
        icon: `${process.env.REACT_APP_API}logo/images/logo.png`,
        vibrate: [300],
        url: "/",
        actions: [
          {
            action: "view-detail",
            title: "Lihat",
            icon: `${process.env.REACT_APP_API}logo/images/logo.png`,
          },
        ],
      });
    },
    [dispatch, showToast]
  );

  const setupSocketHandlers = useCallback(
    (socket) => {
      socket.on("connect", () => {
        console.debug("[WA-SOCKET] Connected to server");
        setStatus("connected");
        startHeartbeat();

        // ✅ Kirim identify di sini, setelah connect
        const authUser = store.getState().auth.user;
        if (authUser) {
          console.debug("[WA-SOCKET] Sending identify:", authUser);
          socket.emit("identify", {
            user_id: authUser.id,
            role: authUser.role,
            submission_id: authUser.submission_id ?? null,
          });
        }

        if (isPageVisible) {
          backgroundSync.loadPendingUpdates();
          backgroundSync.processPendingUpdates({
            handleResultUpdated,
            handleResultVerified,
            handleNewSubmission,
          });
        }
      });

      socket.on("disconnect", (reason) => {
        console.debug("[WA-SOCKET] Disconnected from server:", reason);
        setStatus("disconnected");
        stopHeartbeat();

        if (reason === "io server disconnect" || reason === "ping timeout") {
          reconnectSocket();
        }
      });

      socket.on("connect_error", (error) => {
        console.error("[WA-SOCKET] Connection error:", error);
        setStatus("error");
        stopHeartbeat();
      });

      socket.on("whatsapp-qr", ({ qr }) => {
        console.debug("[WA-SOCKET] Received QR code");
        setQrCode(qr);
        setStatus("qr-pending");
      });

      socket.on("whatsapp-status", ({ status }) => {
        console.debug("[WA-SOCKET] Status update:", status);

        if (status === "ready") {
          setStatus("ready");
          setQrCode(null);
        } else if (status === "authenticated") {
          setStatus("authenticated");
          setQrCode(null);
        } else if (status === "auth_failure") {
          setStatus("auth_failure");
          setQrCode(null);
          showToast("Autentikasi WhatsApp gagal", {
            type: "error",
            priority: "high",
          });
        } else if (status === "disconnected") {
          setStatus("disconnected");
          setQrCode(null);
          showToast("WhatsApp terputus", { type: "warning" });
        } else {
          setStatus(status);
        }
      });

      socket.on("ready", () => {
        console.debug("[WA-SOCKET] WhatsApp client is ready");
        setStatus("ready");
        setQrCode(null);
        showToast("WhatsApp terhubung dan siap digunakan!", {
          type: "success",
        });
      });

      socket.on("authenticated", () => {
        console.debug("[WA-SOCKET] WhatsApp client authenticated");
        setStatus("authenticated");
        setQrCode(null);
      });

      socket.on("auth_failure", (message) => {
        console.error("[WA-SOCKET] Authentication failed:", message);
        setStatus("auth_failure");
        showToast("Autentikasi WhatsApp gagal", {
          type: "error",
          priority: "high",
        });
      });

      socket.on("disconnected", (reason) => {
        console.debug("[WA-SOCKET] WhatsApp disconnected:", reason);
        setStatus("disconnected");
        setQrCode(null);
        showToast("WhatsApp terputus", { type: "warning" });
      });

      socket.on("new-submission", (data) => {
        try {
          handleNewSubmission(data);
        } catch (error) {
          console.error("[WA-SOCKET] Error handling new-submission:", error);
          showToast("Error processing new submission", {
            type: "error",
            priority: "high",
          });
        }
      });

      socket.on("result-verified", (data) => {
        try {
          console.debug("Raw result-verified payload:", data);
          const normalizedData = {
            ...data,
            period_key: data.period?.key || data.period_key,
            period_id: data.period?.id || data.period_id,
          };
          handleResultVerified(normalizedData).catch((error) => {
            console.error("Error processing result-verified:", error);
          });
        } catch (error) {
          console.error("Error in result-verified handler:", error);
        }
      });

      socket.on("result-updated", (data) => {
        try {
          console.debug("Raw result-updated payload:", data);
          const normalizedData = {
            ...data,
            period_key: data.period?.key || data.period_key,
            period_id: data.period?.id || data.period_id,
            previous_validation_status:
              data.previous_validation_status || data.previous_status,
          };
          handleResultUpdated(normalizedData).catch((error) => {
            console.error("Error processing result-updated:", error);
          });
        } catch (error) {
          console.error("Error in result-updated handler:", error);
        }
      });

      socket.on("respondent-deleted", (data) => {
        try {
          handleRespondentDeleted(data);
        } catch (error) {
          console.error(
            "[WA-SOCKET] Error handling respondent-deleted:",
            error
          );
          showToast("Error processing respondent deletion", {
            type: "error",
            priority: "high",
          });
        }
      });

      socket.on("new-period", (data) => {
        try {
          handleNewPeriod(data);
        } catch (error) {
          console.error("[WA-SOCKET] Error handling new-period:", error);
          showToast("Error processing new period", {
            type: "error",
            priority: "high",
          });
        }
      });

      socket.on("period-updated", (data) => {
        try {
          handlePeriodUpdated(data);
        } catch (error) {
          console.error("[WA-SOCKET] Error handling period-updated:", error);
          showToast("Error processing period update", {
            type: "error",
            priority: "high",
          });
        }
      });

      socket.on("period-deleted", (data) => {
        try {
          handlePeriodDeleted(data);
        } catch (error) {
          console.error("[WA-SOCKET] Error handling period-deleted:", error);
          showToast("Error processing period deletion", {
            type: "error",
            priority: "high",
          });
        }
      });

      socket.on("pong", (data) => {
        console.debug("[WA-SOCKET] Received pong:", data);
      });

      socket.on("error", (error) => {
        console.error("[WA-SOCKET] Socket error:", error);
        showToast("Socket connection error", {
          type: "error",
          priority: "high",
        });
      });

      return socket;
    },
    [
      handleResultUpdated,
      handleResultVerified,
      handleNewSubmission,
      handleRespondentDeleted,
      handleNewPeriod,
      handlePeriodUpdated,
      handlePeriodDeleted,
      showToast,
      startHeartbeat,
      stopHeartbeat,
      reconnectSocket,
      isPageVisible,
    ]
  );

  useEffect(() => {
    const socket = initializeSocket();
    setupSocketHandlers(socket);

    backgroundSync.loadPendingUpdates();

    const setupPushNotifications = async () => {
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        await subscribeToPush();
      }
    };
    setupPushNotifications();

    socket.connect();

    return () => {
      console.debug("[WA-SOCKET] Cleaning up socket connection");
      stopHeartbeat();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [initializeSocket, setupSocketHandlers, stopHeartbeat]);

  useEffect(() => {
    return () => {
      lastProcessedEvents.current.clear();
      backgroundSync.pendingUpdates.clear();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      socket: socketRef.current,
      status,
      qrCode,
      isPageVisible,
      reconnect: () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current.connect();
        } else {
          initializeSocket();
        }
      },
      disconnect: () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      },
      isConnected: () => status === "connected" || status === "ready",
      isReady: () => status === "ready",
      hasQrCode: !!qrCode,
      getPendingUpdatesCount: () => backgroundSync.pendingUpdates.size,
      processPendingUpdates: () => {
        backgroundSync.processPendingUpdates({
          handleResultUpdated,
          handleResultVerified,
          handleNewSubmission,
        });
      },
    }),
    [
      status,
      qrCode,
      isPageVisible,
      initializeSocket,
      handleResultUpdated,
      handleResultVerified,
      handleNewSubmission,
    ]
  );

  return (
    <SocketWhatsappContext.Provider value={contextValue}>
      {children}
    </SocketWhatsappContext.Provider>
  );
};
