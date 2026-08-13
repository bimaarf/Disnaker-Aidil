import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";

const CheckoutActivityChart = ({ className = "" }) => {
  const dispatch = useDispatch();
  const checkouts = useSelector((state) => state.checkout.checkouts);
  const status = useSelector((state) => state.checkout.status);
  const page = useSelector((state) => state.checkout.pagination.current_page);
  const totalPages = useSelector(
    (state) => state.checkout.pagination.last_page
  );
  const searchParams = useSelector((state) => state.checkout.searchParams);

  const [currentPage, setCurrentPage] = useState(page || 1);
  const [lastLoadedPage, setLastLoadedPage] = useState(0);
  const [isUserTriggeredLoadMore, setIsUserTriggeredLoadMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const isFetchingRef = useRef(false);

  // Initial load effect
  useEffect(() => {
    if (status === "idle" && checkouts.length === 0) {
      dispatch({
        type: "checkout/fetchCheckouts",
        payload: {
          page: 1,
          perPage: 15,
          searchQuery: searchParams.query,
          fromDate: searchParams.fromDate,
          toDate: searchParams.toDate,
          loadMore: false,
        },
      });
    }
  }, [dispatch, searchParams, checkouts.length, status]);

  // Load more effect
  useEffect(() => {
    if (
      currentPage > 1 &&
      isUserTriggeredLoadMore &&
      currentPage > lastLoadedPage &&
      status === "succeeded" &&
      !isFetchingRef.current &&
      currentPage <= totalPages &&
      !isLoadingMore
    ) {
      isFetchingRef.current = true;
      setIsLoadingMore(true);
      dispatch({
        type: "checkout/fetchCheckouts",
        payload: {
          page: currentPage,
          perPage: 15,
          searchQuery: searchParams.query,
          fromDate: searchParams.fromDate,
          toDate: searchParams.toDate,
          loadMore: true,
        },
      });
    }
  }, [
    currentPage,
    isUserTriggeredLoadMore,
    lastLoadedPage,
    searchParams,
    dispatch,
    status,
    totalPages,
    isLoadingMore,
  ]);

  const handleLoadMore = useCallback(() => {
    if (
      currentPage < totalPages &&
      !isFetchingRef.current &&
      !isLoadingMore &&
      status === "succeeded"
    ) {
      setIsUserTriggeredLoadMore(true);
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages, isLoadingMore, status]);

  useEffect(() => {
    if (status === "succeeded" && isLoadingMore) {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
      setLastLoadedPage(currentPage);
      setIsUserTriggeredLoadMore(false);
    } else if (status === "succeeded" && currentPage === 1 && !isLoadingMore) {
      setLastLoadedPage(1);
    } else if (status === "failed") {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
      setIsUserTriggeredLoadMore(false);
    }
  }, [status, isLoadingMore, currentPage]);

  // Get unique checkouts
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

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    if (!uniqueCheckouts.length) return {};

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    const todayCheckouts = uniqueCheckouts.filter(
      (c) => new Date(c.created_at) >= today
    );
    const yesterdayCheckouts = uniqueCheckouts.filter((c) => {
      const date = new Date(c.created_at);
      return date >= yesterday && date < today;
    });
    const last7DaysCheckouts = uniqueCheckouts.filter(
      (c) => new Date(c.created_at) >= last7Days
    );
    const last30DaysCheckouts = uniqueCheckouts.filter(
      (c) => new Date(c.created_at) >= last30Days
    );

    return {
      total: uniqueCheckouts.length,
      today: todayCheckouts.length,
      yesterday: yesterdayCheckouts.length,
      last7Days: last7DaysCheckouts.length,
      last30Days: last30DaysCheckouts.length,
      totalRevenue: uniqueCheckouts.reduce(
        (sum, c) => sum + (c.total_price || 0),
        0
      ),
      todayRevenue: todayCheckouts.reduce(
        (sum, c) => sum + (c.total_price || 0),
        0
      ),
      averageOrderValue:
        uniqueCheckouts.length > 0
          ? uniqueCheckouts.reduce((sum, c) => sum + (c.total_price || 0), 0) /
            uniqueCheckouts.length
          : 0,
      completed: uniqueCheckouts.filter((c) => c.status === "completed").length,
      pending: uniqueCheckouts.filter((c) => c.status === "pending").length,
      cancelled: uniqueCheckouts.filter((c) => c.status === "cancelled").length,
    };
  }, [uniqueCheckouts]);

  // Daily activity data (last 30 days)
  const dailyActivityData = useMemo(() => {
    if (!uniqueCheckouts.length) return [];

    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last30Days.push({
        date: date.toISOString().split("T")[0],
        displayDate: date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
        }),
        fullDate: date.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        count: 0,
        revenue: 0,
        completed: 0,
        pending: 0,
      });
    }

    uniqueCheckouts.forEach((checkout) => {
      const checkoutDate = new Date(checkout.created_at)
        .toISOString()
        .split("T")[0];
      const dayData = last30Days.find((day) => day.date === checkoutDate);
      if (dayData) {
        dayData.count += 1;
        dayData.revenue += checkout.total_price || 0;
        if (checkout.status === "completed") dayData.completed += 1;
        if (checkout.status === "pending") dayData.pending += 1;
      }
    });

    return last30Days;
  }, [uniqueCheckouts]);

  // Weekly activity data
  const weeklyActivityData = useMemo(() => {
    if (!uniqueCheckouts.length) return [];

    const weekdays = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const weeklyData = weekdays.map((day, index) => ({
      day,
      dayIndex: index,
      count: 0,
      revenue: 0,
    }));

    uniqueCheckouts.forEach((checkout) => {
      const dayIndex = new Date(checkout.created_at).getDay();
      weeklyData[dayIndex].count += 1;
      weeklyData[dayIndex].revenue += checkout.total_price || 0;
    });

    return weeklyData;
  }, [uniqueCheckouts]);

  // Hourly activity data
  const hourlyActivityData = useMemo(() => {
    if (!uniqueCheckouts.length) return [];

    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      displayHour: `${i.toString().padStart(2, "0")}:00`,
      timeRange: `${i.toString().padStart(2, "0")}:00 - ${(i + 1)
        .toString()
        .padStart(2, "0")}:00`,
      count: 0,
      revenue: 0,
    }));

    uniqueCheckouts.forEach((checkout) => {
      const hour = new Date(checkout.created_at).getHours();
      if (hours[hour]) {
        hours[hour].count += 1;
        hours[hour].revenue += checkout.total_price || 0;
      }
    });

    return hours.filter((h) => h.count > 0);
  }, [uniqueCheckouts]);

  // Payment method distribution
  const paymentMethodData = useMemo(() => {
    if (!uniqueCheckouts.length) return [];

    const methods = uniqueCheckouts.reduce((acc, checkout) => {
      const method = checkout.payment?.payment_method || "unknown";
      const methodName =
        method === "bank_transfer"
          ? "Transfer Bank"
          : method === "midtrans"
          ? "Midtrans"
          : method === "cash_on_delivery"
          ? "Bayar di Tempat"
          : method.charAt(0).toUpperCase() + method.slice(1);

      if (!acc[methodName]) {
        acc[methodName] = { count: 0, revenue: 0 };
      }
      acc[methodName].count += 1;
      acc[methodName].revenue += checkout.total_price || 0;
      return acc;
    }, {});

    return Object.entries(methods).map(([method, data]) => ({
      name: method,
      count: data.count,
      revenue: data.revenue,
      percentage: ((data.count / uniqueCheckouts.length) * 100).toFixed(1),
    }));
  }, [uniqueCheckouts]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    if (!uniqueCheckouts.length) return [];

    const statusCount = uniqueCheckouts.reduce((acc, checkout) => {
      const status = checkout.status || "pending";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusNames = {
      completed: "Selesai",
      pending: "Menunggu",
      cancelled: "Dibatalkan",
      failed: "Gagal",
    };

    return Object.entries(statusCount).map(([status, count]) => ({
      name: statusNames[status] || status,
      value: count,
      percentage: ((count / uniqueCheckouts.length) * 100).toFixed(1),
    }));
  }, [uniqueCheckouts]);

  // Product performance
  const productPerformance = useMemo(() => {
    if (!uniqueCheckouts.length) return [];

    const productStats = uniqueCheckouts.reduce((acc, checkout) => {
      checkout.products?.forEach((product) => {
        const productName = product.product_name || "Unknown Product";
        if (!acc[productName]) {
          acc[productName] = {
            name: productName,
            quantity: 0,
            revenue: 0,
            orders: 0,
          };
        }
        acc[productName].quantity += product.quantity || 0;
        acc[productName].revenue +=
          (product.price || 0) * (product.quantity || 0);
        acc[productName].orders += 1;
      });
      return acc;
    }, {});

    return Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [uniqueCheckouts]);

  const COLORS = [
    "#8b5cf6",
    "#06b6d4",
    "#f59e0b",
    "#ef4444",
    "#10b981",
    "#f97316",
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-base-100 border border-base-200 rounded-lg p-3 shadow-xl backdrop-blur-sm">
          <p className="text-base-content font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p
              key={index}
              className="text-sm flex justify-between items-center"
              style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span className="ml-2 font-semibold">
                {entry.name.includes("Revenue") || entry.name.includes("Total")
                  ? `Rp ${entry.value.toLocaleString("id-ID")}`
                  : entry.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatCurrency = (value) => `Rp ${value.toLocaleString("id-ID")}`;

  // Loading State
  if (status === "loading" && uniqueCheckouts.length === 0) {
    return (
      <div
        className={`bg-base-100 dark:bg-base-200 rounded-2xl p-4 md:p-6 ${className}`}>
        <div className="text-center py-8 md:py-12">
          <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg md:text-xl font-semibold text-base-content/80 mb-2">
            Memuat Data Aktivitas
          </h3>
          <p className="text-sm md:text-base text-base-content/40">
            Sedang mengambil data checkout terbaru...
          </p>
        </div>
      </div>
    );
  }

  // Empty State
  if (!uniqueCheckouts || uniqueCheckouts.length === 0) {
    return (
      <div
        className={`bg-base-100 dark:bg-base-200 rounded-2xl p-4 md:p-6 ${className}`}>
        <div className="text-center py-8 md:py-12">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-base-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 md:w-8 md:h-8 text-base-content/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-base-content/80 mb-2">
            Belum Ada Data Aktivitas
          </h3>
          <p className="text-sm md:text-base text-base-content/40">
            Data aktivitas checkout akan ditampilkan di sini setelah ada
            transaksi
          </p>
        </div>
      </div>
    );
  }

  const tabButtons = [
    { id: "overview", label: "Ringkasan", icon: "📊" },
    { id: "trends", label: "Tren", icon: "📈" },
    { id: "products", label: "Produk", icon: "🛍️" },
    { id: "payments", label: "Pembayaran", icon: "💳" },
  ];

  return (
    <div
      className={`bg-base-100 dark:bg-base-200 rounded-2xl p-4 md:p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-base-content mb-2">
              Dashboard Checkout
            </h2>
            <p className="text-base-content/60 text-sm md:text-base">
              Analisis komprehensif aktivitas checkout Anda
            </p>
          </div>
          {currentPage < totalPages && status === "succeeded" && (
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore || status === "loading"}
              className="px-4 py-2 bg-primary text-white rounded-xl hover:brightness-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2">
              {isLoadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memuat...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Muat Lebih Banyak
                </>
              )}
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-base-300">
          {tabButtons.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 md:px-4 py-2 text-sm md:text-base font-medium rounded-t-lg transition-all duration-200 flex items-center gap-2 ${
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-base-content/60 hover:text-base-content/80 hover:bg-base-200/50"
              }`}>
              <span className="text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-3 md:p-4 rounded-xl border border-primary/20">
              <div className="text-xl md:text-2xl font-bold text-primary">
                {stats.total}
              </div>
              <div className="text-base-content/60 text-xs md:text-sm">
                Total Checkout
              </div>
              <div className="text-xs text-primary/80 mt-1">
                +{stats.today} hari ini
              </div>
            </div>
            <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 p-3 md:p-4 rounded-xl border border-cyan-500/20">
              <div className="text-lg md:text-xl font-bold text-cyan-600">
                {formatCurrency(stats.totalRevenue)}
              </div>
              <div className="text-base-content/60 text-xs md:text-sm">
                Total Revenue
              </div>
              <div className="text-xs text-cyan-600/80 mt-1">
                {formatCurrency(stats.todayRevenue)} hari ini
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-3 md:p-4 rounded-xl border border-amber-500/20">
              <div className="text-lg md:text-xl font-bold text-amber-600">
                {formatCurrency(stats.averageOrderValue)}
              </div>
              <div className="text-base-content/60 text-xs md:text-sm">
                Rata-rata Order
              </div>
              <div className="text-xs text-amber-600/80 mt-1">
                Per transaksi
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-3 md:p-4 rounded-xl border border-emerald-500/20">
              <div className="text-lg md:text-xl font-bold text-emerald-600">
                {((stats.completed / stats.total) * 100).toFixed(1)}%
              </div>
              <div className="text-base-content/60 text-xs md:text-sm">
                Success Rate
              </div>
              <div className="text-xs text-emerald-600/80 mt-1">
                {stats.completed} selesai
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-base-200/30 p-4 md:p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-base-content/80 mb-4">
                Distribusi Status
              </h3>
              <div className="h-48 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={window.innerWidth < 768 ? 60 : 80}
                      fill="#8884d8"
                      dataKey="value">
                      {statusDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-base-200/30 p-4 md:p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-base-content/80 mb-4">
                Aktivitas Hari dalam Seminggu
              </h3>
              <div className="h-48 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyActivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="day"
                      stroke="#6b7280"
                      fontSize={window.innerWidth < 768 ? 10 : 12}
                      angle={window.innerWidth < 768 ? -45 : 0}
                      textAnchor={window.innerWidth < 768 ? "end" : "middle"}
                    />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={window.innerWidth < 768 ? 10 : 12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="count"
                      fill="#8b5cf6"
                      name="Jumlah Checkout"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Trends Tab */}
      {activeTab === "trends" && (
        <>
          {/* Daily Activity Chart */}
          <div className="bg-base-200/30 p-4 md:p-6 rounded-xl mb-6">
            <h3 className="text-lg font-semibold text-base-content/80 mb-4">
              Tren Aktivitas Harian (30 Hari Terakhir)
            </h3>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="displayDate"
                    stroke="#6b7280"
                    fontSize={window.innerWidth < 768 ? 10 : 12}
                    angle={window.innerWidth < 768 ? -45 : 0}
                    textAnchor={window.innerWidth < 768 ? "end" : "middle"}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#6b7280"
                    fontSize={window.innerWidth < 768 ? 10 : 12}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#06b6d4"
                    fontSize={window.innerWidth < 768 ? 10 : 12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Jumlah Checkout"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ fill: "#06b6d4", strokeWidth: 2, r: 3 }}
                    name="Revenue"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hourly Activity */}
          {hourlyActivityData.length > 0 && (
            <div className="bg-base-200/30 p-4 md:p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-base-content/80 mb-4">
                Distribusi Jam Checkout
              </h3>
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyActivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="displayHour"
                      stroke="#6b7280"
                      fontSize={window.innerWidth < 768 ? 10 : 12}
                    />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={window.innerWidth < 768 ? 10 : 12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.4}
                      name="Jumlah Checkout"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {/* Products Tab */}
      {activeTab === "products" && (
        <div className="bg-base-200/30 p-4 md:p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-base-content/80 mb-4">
            Performa Produk Terpopuler
          </h3>
          {productPerformance.length > 0 ? (
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productPerformance} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    stroke="#6b7280"
                    fontSize={window.innerWidth < 768 ? 10 : 12}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#6b7280"
                    fontSize={window.innerWidth < 768 ? 10 : 12}
                    width={window.innerWidth < 768 ? 80 : 120}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="revenue"
                    fill="#8b5cf6"
                    name="Revenue"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-base-content/40 mb-2">
                Tidak ada data produk
              </div>
              <div className="text-sm text-base-content/60">
                Data produk akan muncul setelah ada transaksi
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === "payments" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Methods Distribution */}
            <div className="bg-base-200/30 p-4 md:p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-base-content/80 mb-4">
                Metode Pembayaran
              </h3>
              {paymentMethodData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) =>
                          `${name} (${percentage}%)`
                        }
                        outerRadius={window.innerWidth < 768 ? 60 : 80}
                        fill="#8884d8"
                        dataKey="count">
                        {paymentMethodData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-base-content/40">
                    Tidak ada data pembayaran
                  </div>
                </div>
              )}
            </div>

            {/* Payment Methods Revenue */}
            <div className="bg-base-200/30 p-4 md:p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-base-content/80 mb-4">
                Revenue per Metode Pembayaran
              </h3>
              {paymentMethodData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentMethodData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="name"
                        stroke="#6b7280"
                        fontSize={window.innerWidth < 768 ? 10 : 12}
                        angle={window.innerWidth < 768 ? -45 : 0}
                        textAnchor={window.innerWidth < 768 ? "end" : "middle"}
                      />
                      <YAxis
                        stroke="#6b7280"
                        fontSize={window.innerWidth < 768 ? 10 : 12}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="revenue"
                        fill="#06b6d4"
                        name="Revenue"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-base-content/40">
                    Tidak ada data revenue
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Status Details */}
          <div className="mt-6 bg-base-200/30 p-4 md:p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-base-content/80 mb-4">
              Detail Status Pembayaran
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-success/5 border border-success/20 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">
                      {
                        uniqueCheckouts.filter(
                          (c) => c.payment?.payment_status === "paid"
                        ).length
                      }
                    </div>
                    <div className="text-emerald-700 text-sm">
                      Pembayaran Berhasil
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-xs text-emerald-600">
                  {formatCurrency(
                    uniqueCheckouts
                      .filter((c) => c.payment?.payment_status === "paid")
                      .reduce((sum, c) => sum + (c.total_price || 0), 0)
                  )}
                </div>
              </div>

              <div className="bg-warning/5 border border-warning/20 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-amber-600">
                      {
                        uniqueCheckouts.filter(
                          (c) =>
                            c.payment?.payment_status === "pending" ||
                            c.payment?.payment_status === "unpaid"
                        ).length
                      }
                    </div>
                    <div className="text-amber-700 text-sm">
                      Menunggu Pembayaran
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-warning.10 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-amber-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-xs text-amber-600">
                  {formatCurrency(
                    uniqueCheckouts
                      .filter(
                        (c) =>
                          c.payment?.payment_status === "pending" ||
                          c.payment?.payment_status === "unpaid"
                      )
                      .reduce((sum, c) => sum + (c.total_price || 0), 0)
                  )}
                </div>
              </div>

              <div className="bg-error/5 border border-error/20 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {
                        uniqueCheckouts.filter(
                          (c) =>
                            c.payment?.payment_status === "failed" ||
                            c.payment?.payment_status === "cancelled"
                        ).length
                      }
                    </div>
                    <div className="text-red-700 text-sm">Pembayaran Gagal</div>
                  </div>
                  <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-xs text-red-600">
                  {formatCurrency(
                    uniqueCheckouts
                      .filter(
                        (c) =>
                          c.payment?.payment_status === "failed" ||
                          c.payment?.payment_status === "cancelled"
                      )
                      .reduce((sum, c) => sum + (c.total_price || 0), 0)
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Loading More Indicator */}
      {isLoadingMore && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center px-4 py-3 bg-base-200/50 rounded-xl backdrop-blur-sm border border-base-300">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3"></div>
            <span className="text-base-content/80 text-sm font-medium">
              Memuat data tambahan...
            </span>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-base-300">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-base-content/60">
          <div className="flex items-center gap-4">
            <span>
              Data terakhir diperbarui: {new Date().toLocaleString("id-ID")}
            </span>
            <span className="hidden sm:inline">•</span>
            <span>Total {stats.total} checkout dimuat</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span>Real-time data</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutActivityChart;
