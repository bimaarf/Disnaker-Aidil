import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Bell,
  X,
  Check,
  Clock,
  AlertCircle,
  Info,
  CheckCircle,
  Trash2,
} from "lucide-react";
import {
  deleteNotification,
  fetchNotifications,
} from "../../../features/notifications/notificationSlice";
import { useNavigate } from "react-router-dom";

const SidebarNotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();

  const { notifications, status, total } = useSelector(
    (state) => state.notifications
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchNotifications({ page: 1, perPage: 10 }));
    }
  }, [dispatch, isOpen]);

  const handleNotificationClick = (notificationId) => {
    setSelectedNotifications((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation();
    try {
      await dispatch(deleteNotification(notificationId)).unwrap();
      setSelectedNotifications((prev) =>
        prev.filter((id) => id !== notificationId)
      );
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "info":
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const navigate = useNavigate();
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-base-content bg-base-100 hover:bg-base-200 transition-all duration-200 hover:scale-105"
        aria-label="Notifications">
        <Bell className="w-5 h-5 text-base-content" />

        {/* Notification Badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-base-100 rounded-2xl shadow-2xl border border-base-300 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-base-300">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-base-content" />
              <h3 className="font-semibold text-base-content">Notifications</h3>
              {total > 0 && (
                <span className="text-xs bg-base-100 px-2 py-1 rounded-full">
                  {total}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-base-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-base-content/60" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {status === "loading" && (
              <div className="flex items-center justify-center p-8">
                <div className="flex items-center gap-2 text-base-content/60">
                  <div className="w-4 h-4 border-2 border-base-300 rounded-full animate-spin"></div>
                  <span>Loading notifications...</span>
                </div>
              </div>
            )}

            {status === "failed" && (
              <div className="p-4 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 dark:text-red-400 text-sm">
                  Failed to load notifications
                </p>
                <button
                  onClick={() =>
                    dispatch(fetchNotifications({ page: 1, perPage: 10 }))
                  }
                  className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-600 dark:text-red-400 rounded-lg text-xs transition-colors">
                  Try Again
                </button>
              </div>
            )}

            {status === "succeeded" && notifications.length === 0 && (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-base-content/60 mx-auto mb-3" />
                <p className="text-base-content/60 font-medium">
                  No notifications yet
                </p>
                <p className="text-base-content/60 text-sm mt-1">
                  {"You're all caught up!"}
                </p>
              </div>
            )}

            {/* Notification List */}
            {notifications.length > 0 && (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id)}
                    className={`p-4 hover:bg-gray-50/50 cursor-pointer transition-colors ${
                      !notification.read_at ? "bg-base-200" : ""
                    } ${
                      selectedNotifications.includes(notification.id)
                        ? "bg-base-100 dark:bg-primary/20"
                        : ""
                    }`}>
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4
                              className={`text-sm font-medium ${
                                !notification.read_at
                                  ? "text-gray-900 dark:text-base-content"
                                  : "text-gray-700 dark:text-gray-300"
                              }`}>
                              {notification.title}
                            </h4>
                            {notification.message && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                            )}
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={(e) =>
                              handleDeleteNotification(notification.id, e)
                            }
                            className="flex-shrink-0 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete notification">
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 text-xs text-base-content/60">
                            <Clock className="w-3 h-3" />
                            <span>
                              {formatTimeAgo(notification.created_at)}
                            </span>
                          </div>

                          {/* Status Indicators */}
                          <div className="flex items-center gap-1">
                            {!notification.read_at && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                            {notification.read_at && (
                              <Check className="w-3 h-3 text-green-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-base-300 bg-base-200/100">
              <div className="flex items-center justify-between">
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  Mark all as read
                </button>
                <button
                  onClick={() => navigate("/notifications")}
                  className="text-xs text-gray-600 hover:underline">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SidebarNotificationDropdown;
