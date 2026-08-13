import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { useDispatch, useSelector } from "react-redux";
import { fetchCheckouts } from "../../../../features/product/checkoutSlice";
import { Calendar, ShoppingCart, Check, Clock } from "lucide-react";
import useIsMobile from "../../../../Context/__useIsMobile";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const themeColors = {
  wireframe: {
    text: "#111827",
    gray: "#6B7280",
    bg: "#FFFFFF",
    border: "#E5E7EB",
    primary: "#6366F1",
    secondary: "#8B5CF6",
    accent: "#EC4899",
  },
  black: {
    text: "#F9FAFB",
    gray: "#9CA3AF",
    bg: "#121212",
    border: "#374151",
    primary: "#6366F1",
    secondary: "#8B5CF6",
    accent: "#EC4899",
  },
};

// Map checkout status to display text
const statusDisplayMap = {
  completed: "Selesai",
  pending: "Menunggu",
  cancelled: "Dibatalkan",
  processing: "Diproses",
  failed: "Gagal",
};

// Map status to icons
const statusIconMap = {
  completed: "✅",
  pending: "⏳",
  cancelled: "❌",
  processing: "🔄",
  failed: "⚠️",
};

// Truncate function
const CheckoutBarChart = () => {
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const scrollRef = useRef(null);
  const chartRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [chartView, setChartView] = useState("bar");
  const [isAnimating, setIsAnimating] = useState(false);

  const localTheme = useSelector((state) => state.themes?.local) || "wireframe";
  const colors = themeColors[localTheme] || themeColors.wireframe;

  const checkouts = useSelector((state) => state.checkout.checkouts);
  const status = useSelector((state) => state.checkout.status);
  const searchParams = useSelector((state) => state.checkout.searchParams);

  // Deduplicate checkouts
  const uniqueCheckouts = useMemo(() => {
    if (!checkouts.length) return [];

    const seen = new Set();
    return checkouts.filter((checkout) => {
      const id = checkout.id || checkout.key;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [checkouts]);

  // Fetch data on component mount
  useEffect(() => {
    if (status === "idle" && checkouts.length === 0) {
      dispatch(
        fetchCheckouts({
          page: 1,
          perPage: 50,
          searchQuery: searchParams.query,
          fromDate: searchParams.fromDate,
          toDate: searchParams.toDate,
          loadMore: false,
        })
      );
    }
  }, [dispatch, status, checkouts.length, searchParams]);

  // Auto-scroll to latest data with smooth animation
  useEffect(() => {
    if (scrollRef.current && uniqueCheckouts?.length > 0) {
      const scrollContainer = scrollRef.current;
      setTimeout(() => {
        scrollContainer.scrollTo({
          left: scrollContainer.scrollWidth - scrollContainer.clientWidth,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [uniqueCheckouts]);

  // Resize chart with proper checks
  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      const resizeObserver = new ResizeObserver(() => {
        if (chart.canvas && chart.canvas.parentNode) {
          chart.resize();
        }
      });
      if (chart.canvas && chart.canvas.parentNode) {
        resizeObserver.observe(chart.canvas.parentNode);
      }
      return () => resizeObserver.disconnect();
    }
  }, []);

  // Process checkout data for daily chart
  const dailyCheckoutData = useMemo(() => {
    if (!Array.isArray(uniqueCheckouts) || uniqueCheckouts.length === 0) {
      return [];
    }

    // Group checkouts by date
    const groupedData = {};

    uniqueCheckouts.forEach((checkout) => {
      const date = new Date(checkout.created_at).toISOString().split("T")[0];
      if (!groupedData[date]) {
        groupedData[date] = {
          date,
          total_checkouts: 0,
          total_revenue: 0,
          status_counts: {
            completed: 0,
            pending: 0,
            cancelled: 0,
            processing: 0,
            failed: 0,
          },
          checkouts: [],
        };
      }

      groupedData[date].total_checkouts += 1;
      groupedData[date].total_revenue += checkout.total_price || 0;
      groupedData[date].status_counts[checkout.status || "completed"] += 1;
      groupedData[date].checkouts.push(checkout);
    });

    // Convert to array and sort by date
    return Object.values(groupedData).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [uniqueCheckouts]);

  // Memoized chart data for main Bar chart
  const chartData = useMemo(() => {
    if (!Array.isArray(dailyCheckoutData) || dailyCheckoutData.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: "Jumlah Checkout",
            data: [],
            backgroundColor: colors.primary,
            borderColor: colors.primary,
            borderWidth: 0,
            borderRadius: 12,
            borderSkipped: false,
          },
        ],
      };
    }

    const processedData = dailyCheckoutData.map((item) => {
      // Determine bar color based on checkout volume
      let barColor;
      if (item.total_checkouts >= 10) {
        barColor = "#10B981"; // High volume - green
      } else if (item.total_checkouts >= 5) {
        barColor = "#F59E0B"; // Medium volume - amber
      } else {
        barColor = "#6366F1"; // Low volume - primary
      }

      return {
        date: new Date(item.date).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
        }),
        count: item.total_checkouts,
        revenue: item.total_revenue,
        originalData: item,
        barColor,
      };
    });

    return {
      labels: processedData.map((item) => item.date),
      datasets: [
        {
          label: "Total Checkouts",
          data: processedData.map((item) => item.count),
          backgroundColor: processedData.map((item) => item.barColor + "CC"),
          borderColor: processedData.map((item) => item.barColor),
          borderWidth: 0,
          borderRadius: 12,
          borderSkipped: false,
          hoverBackgroundColor: processedData.map((item) => item.barColor),
          hoverBorderWidth: 2,
          hoverBorderColor: processedData.map((item) => item.barColor),
        },
      ],
    };
  }, [dailyCheckoutData, colors.primary]);

  // Memoized chart options for main Bar chart
  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      animation: {
        duration: 600,
        easing: "easeInOutQuart",
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            color: colors.text,
            font: { size: 14, weight: "600" },
            usePointStyle: true,
            pointStyle: "circle",
            padding: 24,
          },
        },
        title: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: colors.bg + "F5",
          titleColor: colors.text,
          bodyColor: colors.text,
          borderColor: colors.border,
          borderWidth: 1,
          cornerRadius: 16,
          padding: 16,
          displayColors: true,
          titleFont: { size: 14, weight: "bold" },
          bodyFont: { size: 13 },
          titleSpacing: 4,
          bodySpacing: 6,
          multiKeyBackground: colors.primary,
          usePointStyle: true,
          callbacks: {
            title: (context) => `📅 Tanggal: ${context[0]?.label || "N/A"}`,
            label: (context) =>
              `🛒 Total Checkouts: ${context.parsed.y.toLocaleString("id-ID")}`,
            afterBody: (context) => {
              const dataIndex = context[0]?.dataIndex;
              if (dataIndex !== undefined && dailyCheckoutData[dataIndex]) {
                const item = dailyCheckoutData[dataIndex];
                const statusCounts = item.status_counts || {};
                return [
                  `💰 Total Revenue: Rp ${item.total_revenue.toLocaleString(
                    "id-ID"
                  )}`,
                  `✅ Selesai: ${statusCounts.completed || 0}`,
                  `⏳ Menunggu: ${statusCounts.pending || 0}`,
                  `❌ Dibatalkan: ${statusCounts.cancelled || 0}`,
                  `🔄 Diproses: ${statusCounts.processing || 0}`,
                  `⚠️ Gagal: ${statusCounts.failed || 0}`,
                ];
              }
              return [];
            },
          },
        },
        datalabels: {
          display: (context) => context.chart.data.labels.length <= 20,
          color: colors.text,
          font: { size: 11, weight: "600" },
          anchor: "end",
          align: "top",
          offset: 6,
          formatter: (value) =>
            value > 0 ? value.toLocaleString("id-ID") : "",
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: colors.gray,
            font: { size: isMobile ? 11 : 12, weight: "500" },
            maxRotation: isMobile ? 45 : 30,
            minRotation: 0,
            padding: 8,
          },
          border: { color: colors.border, width: 1 },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: colors.border + "80",
            drawBorder: false,
            lineWidth: 1,
            borderDash: [5, 5],
          },
          ticks: {
            color: colors.gray,
            font: { size: 12, weight: "500" },
            callback: (value) => Number(value).toLocaleString("id-ID"),
            padding: 10,
          },
          border: { display: false },
        },
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const dataIndex = elements[0].index;
          if (dailyCheckoutData[dataIndex]) {
            setIsAnimating(true);
            setSelectedDate(dailyCheckoutData[dataIndex]);
            setTimeout(() => setIsAnimating(false), 200);
          }
        }
      },
    }),
    [colors, isMobile, dailyCheckoutData]
  );

  // Memoized chart data for modal Bar chart
  const modalChartData = useMemo(() => {
    if (!selectedDate) return null;
    const statusCounts = selectedDate.status_counts || {};
    return {
      labels: ["Selesai", "Menunggu", "Dibatalkan", "Diproses", "Gagal"],
      datasets: [
        {
          label: "Status Distribution",
          data: [
            statusCounts.completed || 0,
            statusCounts.pending || 0,
            statusCounts.cancelled || 0,
            statusCounts.processing || 0,
            statusCounts.failed || 0,
          ],
          backgroundColor: [
            "#10B981CC",
            "#F59E0BCC",
            "#EF4444CC",
            "#3B82F6CC",
            "#EF4444CC",
          ],
          borderColor: ["#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#EF4444"],
          borderWidth: 0,
          borderRadius: 8,
          hoverBackgroundColor: [
            "#10B981",
            "#F59E0B",
            "#EF4444",
            "#3B82F6",
            "#EF4444",
          ],
          hoverBorderWidth: 2,
        },
      ],
    };
  }, [selectedDate]);

  // Memoized chart options for modal Bar chart
  const modalChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 500,
        easing: "easeInOutQuart",
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: colors.bg + "F5",
          titleColor: colors.text,
          bodyColor: colors.text,
          borderColor: colors.border,
          borderWidth: 1,
          cornerRadius: 12,
          padding: 12,
          titleFont: { size: 13, weight: "bold" },
          bodyFont: { size: 12 },
        },
        datalabels: {
          display: true,
          color: colors.text,
          font: { size: 11, weight: "600" },
          anchor: "end",
          align: "top",
          offset: 4,
          formatter: (value) =>
            value > 0 ? value.toLocaleString("id-ID") : "",
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: colors.gray,
            font: { size: 11, weight: "500" },
            padding: 6,
          },
          border: { color: colors.border },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: colors.border + "60",
            borderDash: [3, 3],
          },
          ticks: {
            color: colors.gray,
            font: { size: 11, weight: "500" },
            callback: (value) => Number(value).toLocaleString("id-ID"),
            padding: 6,
          },
          border: { display: false },
        },
      },
    }),
    [colors]
  );

  // Memoized statistics
  const statistics = useMemo(() => {
    if (!Array.isArray(uniqueCheckouts) || uniqueCheckouts.length === 0) {
      return {
        totalCheckouts: 0,
        totalRevenue: 0,
        totalCompleted: 0,
        totalPending: 0,
        averageOrderValue: 0,
      };
    }

    const totalRevenue = uniqueCheckouts.reduce(
      (sum, item) => sum + (item?.total_price || 0),
      0
    );
    const totalCompleted = uniqueCheckouts.filter(
      (item) => item.status === "completed"
    ).length;
    const totalPending = uniqueCheckouts.filter(
      (item) => item.status === "pending"
    ).length;

    return {
      totalCheckouts: uniqueCheckouts.length,
      totalRevenue,
      totalCompleted,
      totalPending,
      averageOrderValue:
        uniqueCheckouts.length > 0
          ? Math.round(totalRevenue / uniqueCheckouts.length)
          : 0,
    };
  }, [uniqueCheckouts]);

  // Event handlers
  const handleViewChange = useCallback((view) => {
    setChartView(view);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 200);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setSelectedDate(null);
      setIsAnimating(false);
    }, 150);
  }, []);

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div
              className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent"
              style={{
                borderColor: colors.primary + "30",
                borderTopColor: colors.primary,
              }}
            />
            <div
              className="absolute top-3 left-3 h-6 w-6 rounded-full animate-pulse"
              style={{ backgroundColor: colors.primary + "20" }}
            />
          </div>
          <div className="text-center">
            <p className="text-base font-medium" style={{ color: colors.text }}>
              Memuat data checkout...
            </p>
            <p className="text-sm mt-1" style={{ color: colors.gray }}>
              Mohon tunggu sebentar
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div
          className="p-8 rounded-2xl border-2 border-dashed text-center max-w-md"
          style={{
            backgroundColor: colors.bg,
            borderColor: colors.border,
            color: colors.text,
          }}>
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Gagal memuat data</h3>
          <p className="text-sm mb-4" style={{ color: colors.gray }}>
            Terjadi kesalahan saat memuat data checkout
          </p>
          <button
            onClick={() =>
              dispatch(
                fetchCheckouts({ page: 1, perPage: 50, loadMore: false })
              )
            }
            className="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            style={{
              backgroundColor: colors.primary,
              color: "white",
              boxShadow: `0 4px 14px ${colors.primary}30`,
            }}>
            🔄 Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!Array.isArray(uniqueCheckouts) || uniqueCheckouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div
          className="p-8 rounded-2xl border-2 border-dashed text-center max-w-md"
          style={{
            backgroundColor: colors.bg,
            borderColor: colors.border,
            color: colors.text,
          }}>
          <div className="text-4xl mb-4">🛒</div>
          <h3 className="text-lg font-semibold mb-2">Tidak ada data</h3>
          <p className="text-sm" style={{ color: colors.gray }}>
            Data checkout belum tersedia untuk ditampilkan
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative space-y-6">
      {/* Chart Header */}
      <div className="flex group p-3 bg-base-100 dark:bg-base-200 shdaow-sm backdrop-blur-sm rounded-2xl border border-base-200/50 flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h3 className="text-xl font-bold flex items-center gap-2 text-base-content">
            🛒 Aktivitas Checkout
          </h3>
          <p className="text-[10px] text-base-content/60">
            Grafik menampilkan aktivitas checkout harian
          </p>
        </div>
        <div className="flex rounded-xl p-1.5">
          <button
            onClick={() => handleViewChange("bar")}
            className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
              chartView === "bar"
                ? "shadow-md transform scale-105"
                : "hover:scale-105 hover:shadow-sm"
            }`}
            style={{
              backgroundColor:
                chartView === "bar" ? colors.primary : "transparent",
              color: chartView === "bar" ? "white" : colors.text,
            }}>
            📊 Bar Chart
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div
        className={`w-full overflow-x-auto shadow-sm backdrop-blur-sm group bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-2xl border border-base-200/50 relative transition-all duration-300 ${
          isAnimating ? "scale-[0.98]" : "scale-100"
        }`}
        ref={scrollRef}>
        <div
          className="p-6"
          style={{ minWidth: isMobile ? "600px" : "100%", height: "400px" }}>
          <Bar
            ref={chartRef}
            data={chartData}
            options={chartOptions}
            redraw={false}
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
        {[
          {
            label: "Total Checkout",
            value: statistics.totalCheckouts,
            icon: <ShoppingCart />,
            color: "text-primary/80",
          },
          {
            label: "Total Revenue",
            value: `Rp ${statistics.totalRevenue.toLocaleString("id-ID")}`,
            icon: <Calendar />,
            color: "text-warning/80",
          },
          {
            label: "Selesai",
            value: statistics.totalCompleted,
            icon: <Check />,
            color: "text-success/80",
          },
          {
            label: "Menunggu",
            value: statistics.totalPending,
            icon: <Clock />,
            color: "text-error/80",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className={`text-center p-5 group bg-base-100 dark:bg-base-200 shadow-sm backdrop-blur-sm rounded-2xl border border-base-200/50 ${stat.color}`}>
            <div
              className={`text-2xl mb-2 flex justify-center items-center gap-2`}>
              {stat.icon}
              <p className="text-sm whitespace-nowrap font-semibold mb-1 font-body">
                {stat.label}
              </p>
            </div>
            <p
              className={`${
                stat.label === "Total Revenue" ? "text-lg" : "text-2xl"
              } font-bold font-mono`}>
              {typeof stat.value === "string"
                ? stat.value
                : stat.value.toLocaleString("id-ID")}
            </p>
          </div>
        ))}
      </div>

      {/* Date Detail Modal */}
      {selectedDate && (
        <div
          className="fixed inset-0 bg-black -top-6 bg-opacity-60 backdrop-blur-sm flex items-center justify-center animate-fadeIn"
          style={{ zIndex: 9999 }}>
          <div
            className={`rounded-2xl p-8 max-w-screen-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border transition-all duration-300 ${
              isAnimating ? "scale-95 opacity-0" : "scale-100 opacity-100"
            }`}
            style={{
              backgroundColor: colors.bg,
              borderColor: colors.border,
              willChange: "transform, opacity",
            }}>
            <div className="flex justify-between items-center mb-6">
              <h4
                className="text-xl font-bold flex items-center gap-2"
                style={{ color: colors.text }}>
                📋 Detail Checkout
              </h4>
              <button
                onClick={handleCloseDetail}
                className="p-2 rounded-xl hover:scale-110 transition-all duration-200 hover:shadow-md"
                style={{
                  backgroundColor: colors.border + "50",
                  color: colors.gray,
                }}
                aria-label="Tutup detail">
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p
                      className="text-sm font-semibold mb-2 flex items-center gap-1"
                      style={{ color: colors.gray }}>
                      📅 Tanggal:
                    </p>
                    <p
                      className="text-lg font-bold p-3 rounded-xl border"
                      style={{
                        color: colors.text,
                        backgroundColor: colors.border + "20",
                        borderColor: colors.border,
                      }}>
                      {new Date(selectedDate.date).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <div>
                    <p
                      className="text-sm font-semibold mb-2 flex items-center gap-1"
                      style={{ color: colors.gray }}>
                      🛒 Total Checkout:
                    </p>
                    <p
                      className="text-xl font-bold p-3 rounded-xl border text-center"
                      style={{
                        color: colors.primary,
                        backgroundColor: colors.primary + "10",
                        borderColor: colors.primary + "30",
                      }}>
                      {selectedDate.total_checkouts.toLocaleString("id-ID")}
                    </p>
                  </div>

                  <div>
                    <p
                      className="text-sm font-semibold mb-2 flex items-center gap-1"
                      style={{ color: colors.gray }}>
                      💰 Total Revenue:
                    </p>
                    <p
                      className="text-xl font-bold p-3 rounded-xl border text-center"
                      style={{
                        color: colors.secondary,
                        backgroundColor: colors.secondary + "10",
                        borderColor: colors.secondary + "30",
                      }}>
                      Rp {selectedDate.total_revenue.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 md:space-y-0">
                  {/* Modal Chart */}
                  {modalChartData && (
                    <div
                      className="h-64 p-4 rounded-xl border"
                      style={{
                        backgroundColor: colors.border + "10",
                        borderColor: colors.border,
                      }}>
                      <Bar
                        data={modalChartData}
                        options={modalChartOptions}
                        redraw={false}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(selectedDate.status_counts || {}).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="p-4 rounded-xl border text-center hover:shadow-md transition-all duration-200"
                      style={{
                        backgroundColor: colors.border + "10",
                        borderColor: colors.border,
                      }}>
                      <div className="text-lg mb-1">
                        {statusIconMap[key] || "📊"}
                      </div>
                      <p
                        className="text-xs font-semibold mb-1"
                        style={{ color: colors.gray }}>
                        {statusDisplayMap[key] || key}
                      </p>
                      <p
                        className="text-lg font-bold"
                        style={{ color: colors.text }}>
                        {value.toLocaleString("id-ID")}
                      </p>
                    </div>
                  )
                )}
              </div>

              <div
                className="pt-4 border-t rounded-xl p-4"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.border + "10",
                }}>
                <div
                  className="text-sm space-y-1"
                  style={{ color: colors.gray }}>
                  <p className="flex items-center gap-2">
                    <span>📊</span>
                    <strong>Average Order Value:</strong> Rp{" "}
                    {selectedDate.total_checkouts > 0
                      ? Math.round(
                          selectedDate.total_revenue /
                            selectedDate.total_checkouts
                        ).toLocaleString("id-ID")
                      : "0"}
                  </p>
                  <p className="flex items-center gap-2">
                    <span>✅</span>
                    <strong>Success Rate:</strong>{" "}
                    {selectedDate.total_checkouts > 0
                      ? Math.round(
                          (selectedDate.status_counts.completed /
                            selectedDate.total_checkouts) *
                            100
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CheckoutBarChart;
