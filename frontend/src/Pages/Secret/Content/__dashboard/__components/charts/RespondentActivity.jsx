import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  NotebookPen,
  RotateCcw,
  TrendingUp,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Bar } from "react-chartjs-2";
import { fetchRespondentByPeriod } from "../../../../../../features/ppdb/periodSlice";
import { useDispatch, useSelector } from "react-redux";
import { formatDate } from "../../../../../../Context/__formatDate";

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

// Map status labels to display text
const statusDisplayMap = {
  Belum_Diverifikasi: "Belum Diverifikasi",
  Berkas_Diterima: "Berkas Diterima",
  Berkas_Dikembalikan: "Berkas Dikembalikan",
  Menunggu_Hasil: "Menunggu Hasil",
  Lulus: "Lulus",
  Tidak_Lulus: "Tidak Lulus",
};

// Map status labels to Lucide icons
const statusIconMap = {
  Belum_Diverifikasi: Clock,
  Berkas_Diterima: CheckCircle,
  Berkas_Dikembalikan: XCircle,
  Menunggu_Hasil: AlertCircle,
  Lulus: Trophy,
  Tidak_Lulus: XCircle,
};

// Truncate function with mobile-specific adjustments
const truncateTitle = (title, isMobile = false) => {
  const length = isMobile ? 12 : 20;
  return title && title.length > length
    ? title.substring(0, length) + "..."
    : title || "Untitled";
};

const RespondentActivityChart = () => {
  // Mock hooks untuk demo - replace dengan hooks asli
  const dispatch = useDispatch();
  const isMobile = window.innerWidth <= 768;
  const scrollRef = useRef(null);
  const chartRef = useRef(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [chartView, setChartView] = useState("bar");
  const [isAnimating, setIsAnimating] = useState(false);

  // Mock selector data - replace dengan selector asli
  const localTheme = "wireframe";
  const { respondentChart, respondentChartStatus } = useSelector(
    (state) => state.periods || {}
  );

  const colors = themeColors[localTheme] || themeColors.wireframe;

  // Extract data array from API response
  const chartDataArray = respondentChart?.data || respondentChart || [];

  // Fetch data on component mount
  useEffect(() => {
    if (respondentChartStatus === "idle") {
      dispatch(fetchRespondentByPeriod());
    }
  }, [respondentChartStatus]);

  // Auto-scroll to latest data with smooth animation
  useEffect(() => {
    if (scrollRef.current && chartDataArray?.length > 0) {
      const scrollContainer = scrollRef.current;
      setTimeout(() => {
        scrollContainer.scrollTo({
          left: scrollContainer.scrollWidth - scrollContainer.clientWidth,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [chartDataArray]);

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

  // Memoized chart data for main Bar chart
  const chartData = useMemo(() => {
    if (!Array.isArray(chartDataArray) || chartDataArray.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: "Jumlah Responden",
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

    const processedData = chartDataArray.map((item) => {
      // Determine bar color based on status and is_published
      let barColor;
      if (item.status === 0 && item.is_published === true) {
        barColor = "#3B82F6";
      } else if (item.status === 1 && item.is_published === false) {
        barColor = "#F59E0B";
      } else if (item.status === 0 && item.is_published === false) {
        barColor = "#EF4444";
      } else {
        barColor = colors.primary;
      }

      return {
        period: truncateTitle(
          item?.title || `Period ${item?.period_id}`,
          isMobile
        ),
        count: item?.total_submissions || 0,
        originalData: item,
        barColor,
      };
    });

    return {
      labels: processedData.map((item) => item.period),
      datasets: [
        {
          label: "Total Submissions",
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
  }, [chartDataArray, colors.primary, isMobile]);

  // Memoized chart options for main Bar chart with mobile optimizations
  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      animation: {
        duration: 1000,
        easing: "easeInOutQuart",
      },
      plugins: {
        legend: {
          display: !isMobile, // Hide legend on mobile to save space
          position: "top",
          labels: {
            color: colors.text,
            font: { size: isMobile ? 12 : 14, weight: "600" },
            usePointStyle: true,
            pointStyle: "circle",
            padding: isMobile ? 16 : 24,
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
          padding: isMobile ? 12 : 16,
          displayColors: true,
          titleFont: { size: isMobile ? 12 : 14, weight: "bold" },
          bodyFont: { size: isMobile ? 11 : 13 },
          titleSpacing: 4,
          bodySpacing: 6,
          multiKeyBackground: colors.primary,
          usePointStyle: true,
          callbacks: {
            title: (context) => `📊 Periode: ${context[0]?.label || "N/A"}`,
            label: (context) =>
              `📈 Total: ${context.parsed.y.toLocaleString("id-ID")}`,
            afterBody: (context) => {
              const dataIndex = context[0]?.dataIndex;
              if (dataIndex !== undefined && chartDataArray[dataIndex]) {
                const item = chartDataArray[dataIndex];
                const validationStatus = item.validation_status || {};
                const statusCounts = item.status_counts || {};
                return [
                  `📋 Status: ${
                    statusDisplayMap[validationStatus.label] || "N/A"
                  }`,
                  `⏳ Belum: ${statusCounts.Belum_Diverifikasi || 0}`,
                  `✅ Diterima: ${statusCounts.Berkas_Diterima || 0}`,
                  `❌ Dikembalikan: ${statusCounts.Berkas_Dikembalikan || 0}`,
                  `📢 Menunggu: ${statusCounts.Menunggu_Hasil || 0}`,
                  `🎉 Lulus: ${statusCounts.Lulus || 0}`,
                  `❌ Tidak Lulus: ${statusCounts.Tidak_Lulus || 0}`,
                ];
              }
              return [];
            },
          },
        },
        datalabels: {
          display: (context) => {
            const dataLength = context.chart.data.labels.length;
            return isMobile ? dataLength <= 10 : dataLength <= 20;
          },
          color: colors.text,
          font: { size: isMobile ? 10 : 11, weight: "600" },
          anchor: "end",
          align: "top",
          offset: 6,
          formatter: (value) =>
            value > 0
              ? isMobile && value > 999
                ? `${Math.round(value / 1000)}k`
                : value.toLocaleString("id-ID")
              : "",
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: colors.gray,
            font: { size: isMobile ? 10 : 12, weight: "500" },
            maxRotation: isMobile ? 45 : 30,
            minRotation: 0,
            padding: isMobile ? 4 : 8,
            maxTicksLimit: isMobile ? 8 : undefined,
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
            font: { size: isMobile ? 10 : 12, weight: "500" },
            callback: (value) => {
              if (isMobile && value >= 1000) {
                return `${Math.round(value / 1000)}k`;
              }
              return Number(value).toLocaleString("id-ID");
            },
            padding: isMobile ? 6 : 10,
            maxTicksLimit: isMobile ? 6 : 8,
          },
          border: { display: false },
        },
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const dataIndex = elements[0].index;
          if (chartDataArray[dataIndex]) {
            setIsAnimating(true);
            setSelectedPeriod(chartDataArray[dataIndex]);
            setTimeout(() => setIsAnimating(false), 300);
          }
        }
      },
    }),
    [colors, isMobile, chartDataArray]
  );

  // Memoized chart data for modal Bar chart
  const modalChartData = useMemo(() => {
    if (!selectedPeriod) return null;
    const statusCounts = selectedPeriod.status_counts || {};
    return {
      labels: [
        "Belum Verif.",
        "Diterima",
        "Dikembalikan",
        "Menunggu",
        "Lulus",
        "Tidak Lulus",
      ].map((label) =>
        isMobile
          ? label.substring(0, 8) + (label.length > 8 ? "..." : "")
          : label
      ),
      datasets: [
        {
          label: "Period Details",
          data: [
            statusCounts.Belum_Diverifikasi || 0,
            statusCounts.Berkas_Diterima || 0,
            statusCounts.Berkas_Dikembalikan || 0,
            statusCounts.Menunggu_Hasil || 0,
            statusCounts.Lulus || 0,
            statusCounts.Tidak_Lulus || 0,
          ],
          backgroundColor: [
            "#6B7280CC",
            "#10B981CC",
            "#EF4444CC",
            "#3B82F6CC",
            "#10B981CC",
            "#EF4444CC",
          ],
          borderColor: [
            "#6B7280",
            "#10B981",
            "#EF4444",
            "#3B82F6",
            "#10B981",
            "#EF4444",
          ],
          borderWidth: 0,
          borderRadius: 8,
          hoverBackgroundColor: [
            "#6B7280",
            "#10B981",
            "#EF4444",
            "#3B82F6",
            "#10B981",
            "#EF4444",
          ],
          hoverBorderWidth: 2,
        },
      ],
    };
  }, [selectedPeriod, isMobile]);

  // Memoized chart options for modal Bar chart with mobile optimizations
  const modalChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
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
          padding: isMobile ? 8 : 12,
          titleFont: { size: isMobile ? 11 : 13, weight: "bold" },
          bodyFont: { size: isMobile ? 10 : 12 },
        },
        datalabels: {
          display: true,
          color: colors.text,
          font: { size: isMobile ? 10 : 11, weight: "600" },
          anchor: "end",
          align: "top",
          offset: 4,
          formatter: (value) =>
            value > 0
              ? isMobile && value > 999
                ? `${Math.round(value / 1000)}k`
                : value.toLocaleString("id-ID")
              : "",
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: colors.gray,
            font: { size: isMobile ? 9 : 11, weight: "500" },
            padding: 6,
            maxRotation: isMobile ? 45 : 0,
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
            font: { size: isMobile ? 9 : 11, weight: "500" },
            callback: (value) => {
              if (isMobile && value >= 1000) {
                return `${Math.round(value / 1000)}k`;
              }
              return Number(value).toLocaleString("id-ID");
            },
            padding: 6,
            maxTicksLimit: isMobile ? 5 : 8,
          },
          border: { display: false },
        },
      },
    }),
    [colors, isMobile]
  );

  // Memoized statistics
  const statistics = useMemo(() => {
    if (!Array.isArray(chartDataArray) || chartDataArray.length === 0) {
      return {
        totalPeriods: 0,
        totalSubmissions: 0,
        totalBelumDiverifikasi: 0,
        totalBerkasDiterima: 0,
        totalLulus: 0,
      };
    }

    const totalSubmissions = chartDataArray.reduce(
      (sum, item) => sum + (item?.total_submissions || 0),
      0
    );
    const totalBelumDiverifikasi = chartDataArray.reduce(
      (sum, item) => sum + (item?.status_counts?.Belum_Diverifikasi || 0),
      0
    );
    const totalBerkasDiterima = chartDataArray.reduce(
      (sum, item) => sum + (item?.status_counts?.Berkas_Diterima || 0),
      0
    );
    const totalLulus = chartDataArray.reduce(
      (sum, item) => sum + (item?.status_counts?.Lulus || 0),
      0
    );
    const counts = chartDataArray.map((item) => item?.total_submissions || 0);

    return {
      totalPeriods: chartDataArray.length,
      totalSubmissions,
      totalBelumDiverifikasi,
      totalBerkasDiterima,
      totalLulus,
      average:
        chartDataArray.length > 0
          ? Math.round(totalSubmissions / chartDataArray.length)
          : 0,
      highest: Math.max(...counts, 0),
    };
  }, [chartDataArray]);

  // Event handlers
  const handleViewChange = useCallback((view) => {
    setChartView(view);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setSelectedPeriod(null);
      setIsAnimating(false);
    }, 200);
  }, []);

  // Loading state with mobile-friendly loader
  if (respondentChartStatus === "loading") {
    return (
      <div className="flex items-center justify-center h-64 px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2
              className="animate-spin h-8 w-8 sm:h-12 sm:w-12"
              style={{ color: colors.primary }}
            />
          </div>
          <div className="text-center">
            <p
              className="text-sm sm:text-base font-medium"
              style={{ color: colors.text }}>
              Memuat data chart...
            </p>
            <p
              className="text-xs sm:text-sm mt-1"
              style={{ color: colors.gray }}>
              Mohon tunggu sebentar
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state with mobile-friendly design
  if (respondentChartStatus === "failed") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 px-4">
        <div
          className="p-4 sm:p-8 rounded-2xl border-2 border-dashed text-center max-w-md w-full"
          style={{
            backgroundColor: colors.bg,
            borderColor: colors.border,
            color: colors.text,
          }}>
          <AlertCircle
            className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4"
            style={{ color: colors.primary }}
          />
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            Gagal memuat data
          </h3>
          <p className="text-xs sm:text-sm mb-4" style={{ color: colors.gray }}>
            Terjadi kesalahan saat memuat data chart responden
          </p>
          <button
            onClick={() => {
              dispatch(fetchRespondentByPeriod());
            }} // dispatch(fetchRespondentByPeriod())
            className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
            style={{
              backgroundColor: colors.primary,
              color: "white",
              boxShadow: `0 4px 14px ${colors.primary}30`,
            }}>
            <RotateCcw className="h-4 w-4" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // Empty state with mobile-friendly design
  if (!Array.isArray(chartDataArray) || chartDataArray.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 px-4">
        <div
          className="p-4 sm:p-8 rounded-2xl border-2 border-dashed text-center max-w-md w-full"
          style={{
            backgroundColor: colors.bg,
            borderColor: colors.border,
            color: colors.text,
          }}>
          <Activity
            className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4"
            style={{ color: colors.primary }}
          />
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            Tidak ada data
          </h3>
          <p className="text-xs sm:text-sm" style={{ color: colors.gray }}>
            Data chart responden belum tersedia untuk ditampilkan
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Chart Header - Mobile Optimized */}
      <div className="flex flex-col gap-3 sm:gap-4 bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm rounded-xl sm:rounded-2xl border border-base-300 p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="space-y-1 sm:space-y-2 flex-1">
            <div className="text-base sm:text-xl font-bold flex items-center gap-2 text-base-content">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <span className="truncate">Aktivitas Responden</span>
            </div>
            <p className="text-xs text-base-content/60">
              Grafik menampilkan aktivitas responden per periode
            </p>
          </div>
          <div className="flex rounded-lg p-1 bg-base-200/50 w-full sm:w-auto">
            <button
              onClick={() => handleViewChange("bar")}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all duration-300 flex items-center justify-center gap-2 ${
                chartView === "bar"
                  ? "shadow-sm transform scale-105"
                  : "hover:scale-105 hover:shadow-sm"
              }`}
              style={{
                backgroundColor:
                  chartView === "bar" ? colors.primary : "transparent",
                color: chartView === "bar" ? "white" : colors.text,
              }}>
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Bar Chart</span>
              <span className="sm:hidden">Chart</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chart Container - Mobile Optimized */}
      <div
        className={`w-full overflow-x-auto bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm rounded-xl sm:rounded-2xl border border-base-300 transition-all duration-300 ${
          isAnimating ? "scale-[0.98]" : "scale-100"
        }`}
        ref={scrollRef}>
        <div
          className="p-3 sm:p-6"
          style={{
            minWidth: isMobile ? "500px" : "100%",
            height: isMobile ? "300px" : "400px",
          }}>
          <Bar
            ref={chartRef}
            data={chartData}
            options={chartOptions}
            redraw={false}
          />
        </div>
      </div>

      {/* Statistics - Mobile Optimized Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {[
          {
            label: isMobile ? "Periode" : "Total Periode",
            value: statistics.totalPeriods,
            icon: Calendar,
            color: "text-primary/80",
          },
          {
            label: isMobile ? "Submissions" : "Total Submissions",
            value: statistics.totalSubmissions,
            icon: TrendingUp,
            color: "text-warning/80",
          },
          {
            label: isMobile ? "Belum Verif." : "Belum Diverifikasi",
            value: statistics.totalBelumDiverifikasi,
            icon: Clock,
            color: "text-error/80",
          },
          {
            label: isMobile ? "Diterima" : "Berkas Diterima",
            value: statistics.totalBerkasDiterima,
            icon: CheckCircle,
            color: "text-success/80",
          },
        ].map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className={`p-3 sm:p-5 bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm backdrop-blur-sm rounded-xl sm:rounded-2xl border border-base-300 dark:border-base-300 ${stat.color}`}>
              <div className="flex flex-col items-center gap-1 sm:gap-2 text-center">
                <div className="flex items-center gap-1 sm:gap-2">
                  <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm font-semibold font-body truncate">
                    {stat.label}
                  </p>
                </div>
                <p className="text-lg sm:text-2xl font-bold font-mono">
                  {isMobile && stat.value >= 1000
                    ? `${Math.round(stat.value / 1000)}k`
                    : stat.value.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Period Detail Modal - Mobile Optimized */}
      {selectedPeriod && (
        <div className="fixed -top-6 inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div
            className={`rounded-xl bg-base-100 dark:bg-base-200 border border-base-300 sm:rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl transition-all duration-300 ${
              isAnimating ? "scale-95 opacity-0" : "scale-100 opacity-100"
            }`}>
            {/* Modal Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between bg-base-100 dark:bg-base-200 backdrop-blur-sm border-b border-base-300 px-4 py-3 sm:px-6 sm:py-4 shadow-sm rounded-t-xl">
              <h4 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-base-content">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Detail Periode
              </h4>
              <button
                onClick={handleCloseDetail}
                className="p-2 rounded-lg hover:scale-110 transition-all duration-200 hover:shadow-sm border border-base-300 text-base-content"
                aria-label="Tutup detail">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6">
              {/* Period Info Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  {/* Period Name */}
                  <div>
                    <p className="text-xs sm:text-sm font-semibold mb-2 flex items-center gap-1 text-base-content">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      Periode:
                    </p>
                    <p
                      className="text-sm sm:text-sm font-bold p-2 sm:p-3 rounded-lg break-words text-base-content bg-base-300/30 dark:bg-base-300 border border-base-300"
                      title={
                        selectedPeriod.title ||
                        `Period ${selectedPeriod.period_id}` ||
                        "N/A"
                      }>
                      {truncateTitle(
                        selectedPeriod.title ||
                          `Period ${selectedPeriod.period_id}`,
                        isMobile
                      ) || "N/A"}
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-xs sm:text-sm font-semibold mb-2 flex items-center gap-1 text-base-content">
                      <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                      Status Pendaftaran:
                    </p>
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg text-sm bg-base-300/30 dark:bg-base-300 border border-base-300">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          selectedPeriod.status ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <span className="text-base-content">
                        {selectedPeriod.status ? "Dibuka" : "Ditutup"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold mb-2 flex items-center gap-1 text-base-content">
                      <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                      Status (Lulus / Tidak Lulus):
                    </p>
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg text-sm bg-base-300/30 dark:bg-base-300 border border-base-300">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          selectedPeriod.is_published
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      />
                      <span className="text-base-content">
                        {selectedPeriod.is_published
                          ? "Ditampilkan"
                          : "Disembunyikan"}
                      </span>
                    </div>
                  </div>

                  {/* Total Submissions */}
                  <div>
                    <p className="text-xs sm:text-sm font-semibold mb-2 flex items-center gap-1 text-base-content text-base-content">
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                      Total Submissions:
                    </p>
                    <p className="text-lg sm:text-xl font-bold p-2 sm:p-3 rounded-lg text-center bg-primary/10 text-primary border border-primary/30">
                      {(selectedPeriod.total_submissions || 0).toLocaleString(
                        "id-ID"
                      )}
                    </p>
                  </div>
                </div>

                {/* Modal Chart */}
                <div className="space-y-3 sm:space-y-4">
                  {modalChartData && (
                    <div className="h-48 sm:h-64 p-3 sm:p-4 rounded-lg bg-base-300/30 dark:bg-base-300 border border-base-300">
                      <Bar
                        data={modalChartData}
                        options={modalChartOptions}
                        redraw={false}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Status Breakdown Grid - Mobile Optimized */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-3 sm:gap-4">
                {Object.entries(selectedPeriod.status_counts || {}).map(
                  ([key, value]) => {
                    const IconComponent = statusIconMap[key] || Activity;
                    return (
                      <div
                        key={key}
                        className="p-3 sm:p-4 rounded-lg text-center hover:shadow-sm transition-all duration-200 bg-base-300/30 dark:bg-base-300 border border-base-300">
                        <div className="flex flex-col items-center gap-1 sm:gap-2">
                          <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          <p className="text-xs font-semibold leading-tight text-center text-base-content">
                            {isMobile
                              ? (statusDisplayMap[key] || key).substring(0, 8) +
                                (statusDisplayMap[key]?.length > 8 ? "..." : "")
                              : statusDisplayMap[key] || key}
                          </p>
                          <p className="text-sm sm:text-lg font-bold text-base-content">
                            {isMobile && value >= 1000
                              ? `${Math.round(value / 1000)}k`
                              : value.toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* Additional Info */}
              <div className="pt-3 sm:pt-4 border-t rounded-lg p-3 sm:p-4 border border-base-300">
                <div className="text-xs sm:text-sm space-y-3 text-base-content">
                  {/* Created */}

                  {/* Status Active/Inactive */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-start gap-2">
                      <NotebookPen className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold">Keterangan:</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold">Created:</span>
                        <span className="ml-1 break-words">
                          {formatDate(selectedPeriod.period_created_at) ||
                            "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Status Pendaftaran */}
                  <div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          selectedPeriod.status ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <span className="font-semibold">Pendaftaran:</span>
                      <span className="ml-1">
                        {selectedPeriod.status ? "Dibuka" : "Ditutup"}
                      </span>
                    </div>
                    <p className="ml-5 text-[11px] sm:text-xs text-base-content/70">
                      {selectedPeriod.status
                        ? "Jika status dibuka, user dapat melakukan submit."
                        : "Jika status ditutup, user tidak dapat melakukan submit."}
                    </p>
                  </div>

                  {/* Status Kelulusan */}
                  <div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          selectedPeriod.is_published
                            ? "bg-green-500"
                            : "bg-gray-500"
                        }`}
                      />
                      <span className="font-semibold">Kelulusan:</span>
                      <span className="ml-1">
                        {selectedPeriod.is_published
                          ? "Ditampilkan"
                          : "Tidak Ditampilkan"}
                      </span>
                    </div>
                    <p className="ml-5 text-[11px] sm:text-xs text-base-content/70">
                      {selectedPeriod.is_published
                        ? "Status (lulus/tidak lulus) akan ditampilkan ke user."
                        : "Status (lulus/tidak lulus) tidak akan ditampilkan ke user."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
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
          animation: fadeIn 0.3s ease-out;
        }

        /* Mobile scroll optimization */
        @media (max-width: 768px) {
          .overflow-x-auto {
            scrollbar-width: thin;
            scrollbar-color: ${colors.border} transparent;
          }
          
          .overflow-x-auto::-webkit-scrollbar {
            height: 4px;
          }
          
          .overflow-x-auto::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .overflow-x-auto::-webkit-scrollbar-thumb {
            background: ${colors.border};
            border-radius: 2px;
          }
          
          .overflow-x-auto::-webkit-scrollbar-thumb:hover {
            background: ${colors.gray};
          }
        }

        /* Mobile modal optimization */
        @media (max-width: 640px) {
          .modal-content {
            margin: 0.5rem;
            max-height: calc(100vh - 1rem);
          }
        }
      `}</style>
    </div>
  );
};

export default RespondentActivityChart;
