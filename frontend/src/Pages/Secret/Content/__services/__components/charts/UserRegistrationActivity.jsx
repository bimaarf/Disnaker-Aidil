import {
  Activity,
  BarChart3,
  Calendar,
  Eye,
  EyeOff,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchAllUsers } from "../../../../../../features/users/userSlice";

const UserRegistrationActivity = () => {
  const dispatch = useDispatch();
  const [hoveredStatus, setHoveredStatus] = useState(null);
  const [visibleLines, setVisibleLines] = useState({
    "New Users": true,
    "Active Users": true,
    "Suspended Users": true,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { allUsers, allUsersStatus, total } = useSelector(
    (state) => state.users
  );
  const localTheme = useSelector((state) => state.themes.local);
  const isDark = localTheme === "black";

  // Fetch user data
  useEffect(() => {
    if (allUsersStatus === "idle") {
      dispatch(
        fetchAllUsers({
          search: "",
          sortKey: "created_at",
          sortDirection: "desc",
        })
      );
    }
  }, [dispatch, allUsersStatus]);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await dispatch(
      fetchAllUsers({
        search: "",
        sortKey: "created_at",
        sortDirection: "desc",
      })
    );
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Determine the last registration date and the 30-day range
  const dateRange = useMemo(() => {
    if (
      allUsersStatus !== "succeeded" ||
      !Array.isArray(allUsers) ||
      allUsers.length === 0
    ) {
      return { startDate: null, endDate: null, allDates: [] };
    }

    // Find the latest registration date
    const latestDate = allUsers.reduce((latest, user) => {
      const date = new Date(user.created_at);
      return !isNaN(date) && (!latest || date > latest) ? date : latest;
    }, null);

    if (!latestDate) {
      return { startDate: null, endDate: null, allDates: [] };
    }

    const endDate = new Date(latestDate);
    const startDate = new Date(latestDate);
    startDate.setDate(endDate.getDate() - 29); // 30 days including start and end

    // Generate all dates in the range
    const allDates = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      allDates.push(new Date(d).toISOString().split("T")[0]);
    }

    return { startDate, endDate, allDates };
  }, [allUsers, allUsersStatus]);

  // Process data for chart
  const processedChartData = useMemo(() => {
    if (
      allUsersStatus !== "succeeded" ||
      !Array.isArray(allUsers) ||
      allUsers.length === 0 ||
      !dateRange.allDates.length
    ) {
      return [];
    }

    // Deduplicate users by id
    const uniqueUsers = Array.from(
      new Map(allUsers.map((user) => [user.id, user])).values()
    );

    // Aggregate data by date
    const newUsersByDate = {};
    const activeUsersByDate = {};
    const suspendedUsersByDate = {};

    uniqueUsers.forEach((user) => {
      const dateObj = new Date(user.created_at);
      if (isNaN(dateObj)) {
        console.warn(`Invalid date for user ID ${user.id}: ${user.created_at}`);
        return;
      }
      const date = dateObj.toISOString().split("T")[0];

      // Only include dates within the range
      if (
        date < dateRange.allDates[0] ||
        date > dateRange.allDates[dateRange.allDates.length - 1]
      ) {
        return;
      }

      // New registrations (all users by created_at)
      newUsersByDate[date] = (newUsersByDate[date] || 0) + 1;

      // Active users (status: true)
      if (user.status === 1 || user.status === "1") {
        activeUsersByDate[date] = (activeUsersByDate[date] || 0) + 1;
      }

      // Suspended users (status: false)
      if (user.status === 0 || user.status === "0") {
        suspendedUsersByDate[date] = (suspendedUsersByDate[date] || 0) + 1;
      }
    });

    // Format data for recharts
    return dateRange.allDates.map((date) => {
      const formattedDate = new Date(date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      });

      return {
        date: formattedDate,
        fullDate: date,
        "New Users": newUsersByDate[date] || 0,
        "Active Users": activeUsersByDate[date] || 0,
        "Suspended Users": suspendedUsersByDate[date] || 0,
      };
    });
  }, [allUsers, allUsersStatus, dateRange]);

  // Calculate total users and peak activity
  const totalUsers = useMemo(() => {
    return total || 0;
  }, [total]);

  const peakDay = useMemo(() => {
    if (!processedChartData.length) return null;
    return processedChartData.reduce(
      (peak, day) => {
        const dayTotal =
          (day["New Users"] || 0) +
          (day["Active Users"] || 0) +
          (day["Suspended Users"] || 0);
        return dayTotal > peak.total
          ? { date: day.date, total: dayTotal }
          : peak;
      },
      { date: "", total: 0 }
    );
  }, [processedChartData]);

  // Format date range for display
  const dateRangeText = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) {
      return "Tracking 30 hari terakhir";
    }
    const startFormatted = dateRange.startDate.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const endFormatted = dateRange.endDate.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return `Tracking dari ${startFormatted} hingga ${endFormatted}`;
  }, [dateRange]);

  const toggleLineVisibility = (status) => {
    setVisibleLines((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  // Modern Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`rounded-2xl border backdrop-blur-sm shadow-sm p-5 transform transition-all duration-300 ${
            isDark
              ? "bg-[#0a0a0a]/95 border-[#1A1A1D] text-white"
              : "bg-[#FFFFFF]/95 border-[#E5E7EB] text-gray-900"
          }`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600" />
            <p className="font-bold text-sm">{label}</p>
          </div>
          <div className="space-y-3">
            {payload.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{
                      backgroundColor: entry.color,
                      boxShadow: `0 0 8px ${entry.color}40`,
                    }}
                  />
                  <span className="font-medium">{entry.name}</span>
                </div>
                <span className="font-bold text-lg">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Colors for each line (unchanged)
  const statusColors = {
    "New Users": "#8B5CF6", // Purple
    "Active Users": "#10B981", // Green
    "Suspended Users": "#EF4444", // Red
  };

  // Loading state with modern skeleton
  if (allUsersStatus === "loading") {
    return (
      <div
        className={`rounded-3xl lg:rounded-[2rem] border border-base-300 backdrop-blur-sm overflow-hidden ${
          isDark ? "bg-[#0a0a0a]/90" : "bg-[#FFFFFF]/90"
        }`}>
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header Skeleton */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl animate-pulse ${
                  isDark ? "bg-[#121214]" : "bg-[#F3F4F6]"
                }`}
              />
              <div className="space-y-3">
                <div
                  className={`h-7 w-48 rounded-xl animate-pulse ${
                    isDark ? "bg-[#121214]" : "bg-[#F3F4F6]"
                  }`}
                />
                <div
                  className={`h-4 w-64 rounded-lg animate-pulse ${
                    isDark ? "bg-[#121214]" : "bg-[#F3F4F6]"
                  }`}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div
                className={`w-32 h-20 rounded-2xl animate-pulse ${
                  isDark ? "bg-[#121214]" : "bg-[#F3F4F6]"
                }`}
              />
              <div
                className={`w-32 h-20 rounded-2xl animate-pulse ${
                  isDark ? "bg-[#121214]" : "bg-[#F3F4F6]"
                }`}
              />
            </div>
          </div>

          {/* Chart Skeleton */}
          <div
            className={`w-full h-80 lg:h-96 rounded-2xl lg:rounded-3xl animate-pulse ${
              isDark ? "bg-[#121214]" : "bg-[#F3F4F6]"
            }`}
          />

          {/* Legend Skeleton */}
          <div className="flex flex-wrap gap-3 justify-center lg:justify-start mt-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-28 h-12 rounded-xl animate-pulse ${
                  isDark ? "bg-[#121214]" : "bg-[#F3F4F6]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state with modern design
  if (allUsersStatus === "failed") {
    return (
      <div
        className={`rounded-3xl lg:rounded-[2rem] border border-red-200/50 p-6 lg:p-8 text-center backdrop-blur-sm ${
          isDark
            ? "bg-[#0a0a0a]/90 text-[#DC2626] border-red-900/50"
            : "bg-[#FFFFFF]/90 text-[#EF4444]"
        }`}>
        <div
          className={`rounded-3xl p-6 inline-block mb-6 ${
            isDark ? "bg-[#DC2626]/10" : "bg-[#EF4444]/10"
          }`}>
          <BarChart3 className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold mb-3">Gagal Memuat Data</h3>
        <p className="text-base opacity-70 mb-6 max-w-md mx-auto">
          Terjadi kesalahan saat mengambil data aktivitas pengguna. Silakan coba
          lagi.
        </p>
        <button
          onClick={handleRefresh}
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all duration-300  shadow-sm">
          Coba Lagi
        </button>
      </div>
    );
  }

  // No data state with modern design
  if (!processedChartData.length) {
    return (
      <div
        className={`rounded-3xl lg:rounded-[2rem] border border-base-300 p-6 lg:p-8 text-center backdrop-blur-sm ${
          isDark
            ? "bg-[#0a0a0a]/90 text-[#6B7280]"
            : "bg-[#FFFFFF]/90 text-[#6B7280]"
        }`}>
        <div
          className={`rounded-3xl p-6 inline-block mb-6 ${
            isDark ? "bg-[#6B7280]/10" : "bg-[#6B7280]/10"
          }`}>
          <Calendar className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold mb-3">Tidak Ada Data</h3>
        <p className="text-base opacity-70 max-w-md mx-auto">
          Belum ada aktivitas pengguna dalam periode ini. Data akan muncul
          setelah ada registrasi baru.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-3xl lg:rounded-[2rem] border border-base-200 shadow-sm backdrop-blur-sm transition-all duration-500 bg-base-100 dark:bg-base-200 text-base-content overflow-hidden`}>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Modern Header */}
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between mb-8 lg:mb-12 gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6">
            <div
              className={`p-4 lg:p-5 rounded-2xl lg:rounded-3xl transition-all duration-300  shadow-sm ${
                isDark
                  ? "bg-[#4F46E5] shadow-blue-500/20"
                  : "bg-[#3B82F6] shadow-blue-500/20"
              }`}>
              <Activity className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2
                  className={`text-xl lg:text-2xl font-bold ${
                    isDark ? "text-white" : "text-[#6B7280]"
                  }`}>
                  User Activity
                </h2>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`p-2 rounded-xl transition-all duration-300  ${
                    isDark ? "hover:bg-[#121214]" : "hover:bg-[#F3F4F6]"
                  }`}>
                  <RefreshCw
                    className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""} ${
                      isDark ? "text-[#6B7280]" : "text-[#6B7280]"
                    }`}
                  />
                </button>
              </div>
              <p
                className={`text-sm lg:text-base ${
                  isDark ? "text-[#6B7280]" : "text-[#6B7280]"
                }`}>
                {dateRangeText}
              </p>
            </div>
          </div>

          {/* Modern Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
            <div
              className={`px-4 lg:px-6 py-4 lg:py-5 rounded-2xl lg:rounded-3xl transition-all duration-300  shadow-sm backdrop-blur-sm ${
                isDark
                  ? "bg-base-300/50 hover:bg-base-300/70"
                  : "bg-base-200/50 hover:bg-base-200/70"
              }`}>
              <div className="flex items-center gap-3 lg:gap-4">
                <div
                  className={`p-3 rounded-2xl shadow-sm ${
                    isDark ? "bg-[#F472B6]/20" : "bg-[#EC4899]/10"
                  }`}>
                  <Users
                    className={`w-5 h-5 lg:w-6 lg:h-6 ${
                      isDark ? "text-[#F472B6]" : "text-[#EC4899]"
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-xs lg:text-sm font-medium ${
                      isDark ? "text-[#6B7280]" : "text-[#6B7280]"
                    }`}>
                    Total Users
                  </p>
                  <p
                    className={`font-bold text-lg lg:text-xl truncate ${
                      isDark ? "text-white" : "text-[#6B7280]"
                    }`}>
                    {totalUsers.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </div>

            {peakDay && (
              <div
                className={`px-4 lg:px-6 py-4 lg:py-5 rounded-2xl lg:rounded-3xl transition-all duration-300  shadow-sm backdrop-blur-sm ${
                  isDark
                    ? "bg-base-300/50 hover:bg-base-300/70"
                    : "bg-base-200/50 hover:bg-base-200/70"
                }`}>
                <div className="flex items-center gap-3 lg:gap-4">
                  <div
                    className={`p-3 rounded-2xl shadow-sm ${
                      isDark ? "bg-[#059669]/20" : "bg-[#10B981]/10"
                    }`}>
                    <TrendingUp
                      className={`w-5 h-5 lg:w-6 lg:h-6 ${
                        isDark ? "text-[#059669]" : "text-[#10B981]"
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-xs lg:text-sm font-medium ${
                        isDark ? "text-[#6B7280]" : "text-[#6B7280]"
                      }`}>
                      Peak Activity
                    </p>
                    <p
                      className={`font-bold text-base lg:text-lg truncate ${
                        isDark ? "text-white" : "text-[#6B7280]"
                      }`}>
                      {peakDay.total} ({peakDay.date})
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart Container with Modern Design */}
        <div className="rounded-2xl lg:rounded-3xl p-4 lg:p-6 mb-6 lg:mb-8 bg-gradient-to-br from-transparent via-white/5 to-blue-50/10 dark:from-transparent dark:via-black/5 dark:to-slate-900/10 border border-white/10 dark:border-black/10">
          <div className="h-64 sm:h-80 lg:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={processedChartData}
                margin={{
                  top: 20,
                  right: window.innerWidth < 640 ? 10 : 30,
                  left: window.innerWidth < 640 ? 10 : 20,
                  bottom: 20,
                }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? "#1A1A1D" : "#E5E7EB"}
                  opacity={0.3}
                />
                <XAxis
                  dataKey="date"
                  tick={{
                    fontSize: window.innerWidth < 640 ? 10 : 12,
                    fill: isDark ? "#6B7280" : "#6B7280",
                  }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{
                    fontSize: window.innerWidth < 640 ? 10 : 12,
                    fill: isDark ? "#6B7280" : "#6B7280",
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={window.innerWidth < 640 ? 30 : 60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: window.innerWidth < 640 ? "10px" : "12px",
                  }}
                />

                {["New Users", "Active Users", "Suspended Users"].map(
                  (status) => {
                    const color = statusColors[status];
                    const isVisible = visibleLines[status];

                    if (!isVisible) return null;

                    return (
                      <Line
                        key={status}
                        type="monotone"
                        dataKey={status}
                        stroke={color}
                        strokeWidth={
                          hoveredStatus === status
                            ? 4
                            : window.innerWidth < 640
                            ? 2
                            : 3
                        }
                        dot={{
                          fill: color,
                          strokeWidth: 2,
                          r:
                            hoveredStatus === status
                              ? window.innerWidth < 640
                                ? 4
                                : 5
                              : window.innerWidth < 640
                              ? 3
                              : 4,
                          stroke: isDark ? "#1A1A1D" : "#FFFFFF",
                        }}
                        activeDot={{
                          r: window.innerWidth < 640 ? 6 : 7,
                          fill: color,
                          stroke: isDark ? "#1A1A1D" : "#FFFFFF",
                          strokeWidth: 2,
                          filter: "drop-shadow(0 0 6px rgba(0,0,0,0.3))",
                        }}
                        strokeDasharray={hoveredStatus === status ? "5 5" : "0"}
                        onMouseEnter={() => setHoveredStatus(status)}
                        onMouseLeave={() => setHoveredStatus(null)}
                      />
                    );
                  }
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Enhanced Custom Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
          {["New Users", "Active Users", "Suspended Users"].map((status) => {
            const color = statusColors[status];
            const isVisible = visibleLines[status];
            return (
              <div
                key={status}
                className={`px-4 lg:px-6 py-4 lg:py-5 rounded-2xl lg:rounded-3xl cursor-pointer transition-all duration-300  shadow-sm backdrop-blur-sm border ${
                  hoveredStatus === status || !isVisible
                    ? isDark
                      ? "bg-[#121214]/80 border-white/10"
                      : "bg-[#F3F4F6]/80 border-black/5"
                    : isDark
                    ? "bg-[#121214]/40 hover:bg-[#121214]/60 border-white/5"
                    : "bg-[#F3F4F6]/40 hover:bg-[#F3F4F6]/60 border-black/5"
                }`}
                onMouseEnter={() => setHoveredStatus(status)}
                onMouseLeave={() => setHoveredStatus(null)}
                onClick={() => toggleLineVisibility(status)}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 lg:gap-4">
                    <div
                      className={`w-4 h-4 lg:w-5 lg:h-5 rounded-full transition-all duration-300 shadow-sm ${
                        hoveredStatus === status ? "scale-125" : ""
                      } ${!isVisible ? "opacity-50" : ""}`}
                      style={{
                        backgroundColor: color,
                        boxShadow:
                          hoveredStatus === status
                            ? `0 0 15px ${color}40`
                            : `0 0 5px ${color}20`,
                      }}
                    />
                    <span
                      className={`text-sm lg:text-base font-semibold transition-colors duration-300 ${
                        isDark ? "text-[#6B7280]" : "text-[#6B7280]"
                      } ${
                        hoveredStatus === status ? "opacity-100" : "opacity-80"
                      } ${!isVisible ? "line-through opacity-50" : ""}`}>
                      {status}
                    </span>
                  </div>
                  <button
                    className={`p-1.5 rounded-lg transition-all duration-300  ${
                      isDark ? "hover:bg-[#1A1A1D]" : "hover:bg-white/50"
                    }`}>
                    {isVisible ? (
                      <Eye className="w-4 h-4 text-green-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-red-500" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
 export default UserRegistrationActivity