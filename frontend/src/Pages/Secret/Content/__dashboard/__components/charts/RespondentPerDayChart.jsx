import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useDispatch, useSelector } from "react-redux";
import { TrendingUp, Users, Calendar, BarChart3, Activity } from "lucide-react";
import { fetchRespondentByPeriodPerDay } from "../../../../../../features/ppdb/periodSlice";

const RespondentLineActivity = () => {
  const dispatch = useDispatch();
  const [hoveredPeriod, setHoveredPeriod] = useState(null);

  const { respondentChartPerDay, respondentChartPerDayStatus } = useSelector(
    (state) => state.periods
  );
  const localTheme = useSelector((state) => state.themes.local);

  const isDark = localTheme === "black";

  useEffect(() => {
    if (respondentChartPerDayStatus === "idle") {
      const toDate = new Date().toISOString().split("T")[0];
      const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      dispatch(fetchRespondentByPeriodPerDay({ fromDate, toDate }));
    }
  }, [dispatch, respondentChartPerDayStatus]);

  const processedChartData = useMemo(() => {
    if (
      respondentChartPerDayStatus !== "succeeded" ||
      !Array.isArray(respondentChartPerDay) ||
      respondentChartPerDay.length === 0
    )
      return [];

    const allDatesSet = new Set();
    const periodMap = {};

    respondentChartPerDay.forEach((period) => {
      const label = period.title || `Periode ${period.period_id}`;
      periodMap[label] = {};
      period.submissions_by_date.forEach(({ date, count }) => {
        allDatesSet.add(date);
        periodMap[label][date] = count;
      });
    });

    const sortedDates = Array.from(allDatesSet).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    return sortedDates.map((date) => {
      const formattedDate = new Date(date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      });

      const dataPoint = { date: formattedDate, fullDate: date };

      respondentChartPerDay.forEach((period) => {
        const label = period.title || `Periode ${period.period_id}`;
        dataPoint[label] = periodMap[label][date] || 0;
      });

      return dataPoint;
    });
  }, [respondentChartPerDay, respondentChartPerDayStatus]);

  const totalRegistrations = useMemo(() => {
    if (!processedChartData.length) return 0;
    return processedChartData.reduce((total, day) => {
      return (
        total +
        Object.keys(day)
          .filter((key) => key !== "date" && key !== "fullDate")
          .reduce((dayTotal, period) => dayTotal + (day[period] || 0), 0)
      );
    }, 0);
  }, [processedChartData]);

  const peakDay = useMemo(() => {
    if (!processedChartData.length) return null;
    return processedChartData.reduce(
      (peak, day) => {
        const dayTotal = Object.keys(day)
          .filter((key) => key !== "date" && key !== "fullDate")
          .reduce((total, period) => total + (day[period] || 0), 0);
        return dayTotal > peak.total
          ? { date: day.date, total: dayTotal }
          : peak;
      },
      { date: "", total: 0 }
    );
  }, [processedChartData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`p-4 rounded-xl border ${
            isDark
              ? "bg-[#0a0a0a]/90 border-[#1A1A1D] text-white"
              : "bg-[#FFFFFF]/90 border-[#E5E7EB] text-gray-900"
          }`}>
          <p className="font-semibold mb-2 text-sm">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium">{entry.name}:</span>
              <span className="font-bold">{entry.value} pendaftar</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const periodColors = [
    "#8B5CF6",
    "#06B6D4",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#EC4899",
    "#84CC16",
    "#F97316",
  ];

  if (respondentChartPerDayStatus === "loading") {
    return (
      <div
        className={`rounded-3xl lg:rounded-[2rem] bg-base-100 dark:bg-base-200 shadow-md backdrop-blur-sm border border-base-200/50`}>
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div
              className={`p-3 rounded-xl ${
                isDark ? "bg-[#4F46E5]" : "bg-[#3B82F6]"
              }`}>
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <div
                className={`h-6 w-48 rounded-lg ${
                  isDark ? "bg-[#121214]" : "bg-[#F3F4F6]"
                }`}
              />
              <div
                className={`h-4 w-32 rounded mt-2 ${
                  isDark ? "bg-[#121214]" : "bg-[#F3F4F6]"
                }`}
              />
            </div>
          </div>

          <div
            className={`w-full h-80 rounded-xl ${
              isDark ? "bg-[#121214]" : "bg-[#F3F4F6]"
            }`}
          />
        </div>
      </div>
    );
  }

  if (respondentChartPerDayStatus === "failed") {
    return (
      <div
        className={`rounded-3xl lg:rounded-[2rem] bg-base-100 dark:bg-base-200 shadow-md backdrop-blur-sm border border-base-200/50`}>
        <div
          className={`p-4 rounded-full ${
            isDark ? "bg-[#DC2626]/10" : "bg-[#EF4444]/10"
          } inline-block mb-4`}>
          <BarChart3
            className={`w-8 h-8 ${
              isDark ? "text-[#DC2626]" : "text-[#EF4444]"
            }`}
          />
        </div>
        <h3 className="text-lg font-semibold mb-2">Gagal Memuat Data</h3>
        <p className="text-sm opacity-70">
          Terjadi kesalahan saat mengambil data aktivitas pendaftar.
        </p>
      </div>
    );
  }

  if (!processedChartData.length) {
    return (
      <div
        className={`rounded-3xl lg:rounded-[2rem] bg-base-100 dark:bg-base-200 shadow-md backdrop-blur-sm border border-base-200/50`}>
        <div
          className={`p-4 rounded-full ${
            isDark ? "bg-[#6B7280]/10" : "bg-[#6B7280]/10"
          } inline-block mb-4`}>
          <Calendar className="w-8 h-8 text-[#6B7280]" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Tidak Ada Data</h3>
        <p className="text-sm opacity-70">
          Belum ada aktivitas pendaftar dalam periode ini.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-3xl lg:rounded-[2rem] bg-base-100 dark:bg-base-200 shadow-md backdrop-blur-sm border border-base-200/50`}>
      <div className="p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center gap-4 mb-4 lg:mb-0">
            <div
              className={`p-3 rounded-xl ${
                isDark ? "bg-[#4F46E5]" : "bg-[#3B82F6]"
              } shadow-lg`}>
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2
                className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-[#6B7280]"
                }`}>
                Aktivitas Pendaftar
              </h2>
              <p
                className={`text-sm ${
                  isDark ? "text-[#6B7280]" : "text-[#6B7280]"
                }`}>
                Tracking 30 hari terakhir
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="flex gap-4">
            <div
              className={`px-4 py-3 rounded-xl ${
                isDark ? "bg-[#121214]" : "bg-[#F3F4F6]"
              }`}>
              <div className="flex items-center gap-2">
                <Users
                  className={`w-4 h-4 ${
                    isDark ? "text-[#F472B6]" : "text-[#EC4899]"
                  }`}
                />
                <div>
                  <p
                    className={`text-xs ${
                      isDark ? "text-[#6B7280]" : "text-[#6B7280]"
                    }`}>
                    Total Pendaftar
                  </p>
                  <p
                    className={`font-bold ${
                      isDark ? "text-white" : "text-[#6B7280]"
                    }`}>
                    {totalRegistrations.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </div>

            {peakDay && (
              <div
                className={`px-4 py-3 rounded-xl ${
                  isDark ? "bg-[#121214]" : "bg-[#F3F4F6]"
                }`}>
                <div className="flex items-center gap-2">
                  <TrendingUp
                    className={`w-4 h-4 ${
                      isDark ? "text-[#059669]" : "text-[#10B981]"
                    }`}
                  />
                  <div>
                    <p
                      className={`text-xs ${
                        isDark ? "text-[#6B7280]" : "text-[#6B7280]"
                      }`}>
                      Puncak Aktivitas
                    </p>
                    <p
                      className={`font-bold ${
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

        {/* Chart */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={processedChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? "#1A1A1D" : "#E5E7EB"}
                opacity={0.5}
              />
              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 12,
                  fill: isDark ? "#6B7280" : "#6B7280",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fontSize: 12,
                  fill: isDark ? "#6B7280" : "#6B7280",
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  paddingTop: "20px",
                  fontSize: "12px",
                }}
              />

              {respondentChartPerDay.map((period, index) => {
                const label = period.title || `Periode ${period.period_id}`;
                const color = periodColors[index % periodColors.length];

                return (
                  <Line
                    key={label}
                    type="monotone"
                    dataKey={label}
                    stroke={color}
                    strokeWidth={3}
                    dot={{
                      fill: color,
                      strokeWidth: 2,
                      r: 4,
                      stroke: isDark ? "#1A1A1D" : "#FFFFFF",
                    }}
                    activeDot={{
                      r: 6,
                      fill: color,
                      stroke: isDark ? "#1A1A1D" : "#FFFFFF",
                      strokeWidth: 2,
                    }}
                    strokeDasharray={hoveredPeriod === label ? "5 5" : "0"}
                    onMouseEnter={() => setHoveredPeriod(label)}
                    onMouseLeave={() => setHoveredPeriod(null)}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Period Legend */}
        <div className="mt-6 flex flex-wrap gap-2">
          {respondentChartPerDay.map((period, index) => {
            const label = period.title || `Periode ${period.period_id}`;
            const color = periodColors[index % periodColors.length];

            return (
              <div
                key={label}
                className={`px-3 py-2 rounded-lg cursor-pointer ${
                  hoveredPeriod === label
                    ? isDark
                      ? "bg-[#121214]"
                      : "bg-[#F3F4F6]"
                    : isDark
                    ? "bg-[#121214]/30"
                    : "bg-[#F3F4F6]/30"
                }`}
                onMouseEnter={() => setHoveredPeriod(label)}
                onMouseLeave={() => setHoveredPeriod(null)}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span
                    className={`text-sm font-medium ${
                      isDark ? "text-[#6B7280]" : "text-[#6B7280]"
                    }`}>
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RespondentLineActivity;
