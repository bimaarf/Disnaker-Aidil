import {
  BookOpen,
  CalendarCheck,
  CircleX,
  Megaphone,
  Settings,
  RefreshCw,
  ArrowLeft,
  Edit,
  Users,
  GraduationCap,
  Hash,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useClassroomDetail } from "../../../../features/classroom/classroomHook";
import useIsMobile from "../../../../Context/__useIsMobile";
import { useSelector } from "react-redux";
import useSaveLastClassroomParams from "../../../../hooks/useSaveLastClassroomParams";

// Optimized MenuItem - reduced animations
const MenuItem = memo(({ item, isActive, onClick }) => {
  const handleClick = useCallback(
    () => onClick(item.params, item.url),
    [onClick, item.params, item.url]
  );

  return (
    <div
      onClick={handleClick}
      className={`group cursor-pointer transition-transform duration-200 ease-out 
        hover:scale-[0.98] active:scale-95
        ${isActive ? "scale-[0.98]" : ""}`}>
      <div
        className={`relative overflow-hidden rounded-2xl p-4 md:p-6 shadow-lg 
          bg-gradient-to-br from-base-100 to-base-100 dark:from-base-200 dark:to-base-200
          border-2 transition-all duration-200
          ${
            isActive
              ? `border-${item.color}-400 shadow-${item.color}-300/30 bg-gradient-to-br from-${item.color}-50 to-base-100`
              : "border-base-300/30 hover:border-base-300/50 hover:shadow-xl"
          }`}>
        {/* Simplified background decoration */}
        <div
          className={`absolute inset-0 opacity-5 transition-opacity duration-200
            ${isActive ? "opacity-10" : "group-hover:opacity-10"}`}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br from-current to-transparent transform translate-x-8 -translate-y-8"></div>
        </div>

        <div className="relative flex flex-col md:flex-row items-center md:items-start text-center md:text-left">
          {/* Simplified Icon */}
          <div
            className={`relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center 
              rounded-2xl mb-3 md:mb-0 md:mr-5 transition-all duration-200
              ${
                isActive
                  ? `bg-${item.color}-100 text-${item.color}-600 shadow-lg`
                  : `bg-${item.color}-50 text-${item.color}-500 group-hover:bg-${item.color}-100 group-hover:shadow-lg`
              }`}>
            <div className="transition-transform duration-200 group-hover:scale-110">
              {React.cloneElement(item.icon, {
                className: "w-6 h-6 md:w-7 md:h-7",
              })}
            </div>
          </div>

          {/* Simplified Text */}
          <div className="flex-1">
            <p
              className={`text-xs md:text-sm font-medium mb-1 transition-colors duration-200
              ${
                isActive
                  ? `text-${item.color}-600`
                  : "text-base-content/60 group-hover:text-base-content/80"
              }`}>
              {item.title}
            </p>
            <p
              className={`text-lg md:text-xl font-bold capitalize transition-all duration-200
                ${
                  isActive
                    ? `text-${item.color}-700`
                    : "text-base-content group-hover:text-base-content/90"
                }`}>
              {item.params}
            </p>
          </div>
        </div>

        {/* Active indicator */}
        {isActive && (
          <div
            className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-${item.color}-400 to-${item.color}-600 rounded-b-2xl`}></div>
        )}
      </div>
    </div>
  );
});

MenuItem.displayName = "MenuItem";

// Optimized LoadingSpinner - simplified animation
const LoadingSpinner = memo(({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  return (
    <div className="relative flex items-center justify-center">
      <div
        className={`rounded-full animate-spin border-4 border-primary/20 border-t-primary ${sizeClasses[size]} ${className}`}
        style={{
          animationDuration: "1s",
          animationTimingFunction: "linear",
        }}
        aria-label="Memuat"
      />
    </div>
  );
});
LoadingSpinner.displayName = "LoadingSpinner";

// Optimized LoadingState - reduced floating animations
const LoadingState = memo(() => (
  <div className="min-h-[80vh] flex items-center justify-center">
    <div className="text-center max-w-md mx-auto p-8">
      <div className="relative mb-8">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
        {/* Simplified floating dots - reduced to 2 dots */}
        <div
          className="absolute -top-2 -right-2 w-3 h-3 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: "0ms", animationDuration: "1s" }}></div>
        <div
          className="absolute -bottom-2 -left-2 w-2 h-2 bg-primary/60 rounded-full animate-bounce"
          style={{ animationDelay: "500ms", animationDuration: "1s" }}></div>
      </div>

      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-base-content">
          Memuat Data Classroom
        </h3>
        <p className="text-base-content/60 leading-relaxed">
          Sedang mengambil informasi classroom terbaru untuk Anda
        </p>

        {/* Simplified progress dots */}
        <div className="flex justify-center space-x-2 mt-6">
          {[1, 2, 3].map((step, index) => (
            <div
              key={step}
              className="w-2 h-2 rounded-full bg-primary/30"
              style={{
                animation: `pulse 1.5s infinite ${index * 0.2}s`,
              }}></div>
          ))}
        </div>
      </div>
    </div>
  </div>
));
LoadingState.displayName = "LoadingState";

// Optimized ErrorState - reduced complex animations
const ErrorState = React.memo(({ error, onBackToClassrooms, onRetry }) => (
  <div className="min-h-[80vh] flex justify-center items-center px-4">
    <div className="max-w-lg w-full">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-error/5 to-error/10 border border-error/20 p-8 text-center">
        {/* Simplified background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-error/10 to-transparent rounded-full transform translate-x-16 -translate-y-16"></div>

        <div className="relative">
          {/* Simplified error icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-error/20 to-error/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-error" />
          </div>

          <h2 className="text-2xl font-bold text-error mb-4">
            Oops! Terjadi Kesalahan
          </h2>
          <p className="text-error/80 mb-8 leading-relaxed">
            {error?.message ||
              error ||
              "Classroom tidak ditemukan. Silakan coba lagi atau kembali ke daftar classroom."}
          </p>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={onRetry}
              className="group relative overflow-hidden px-8 py-4 bg-primary text-white rounded-2xl 
                transition-all duration-200 hover:scale-105 hover:shadow-lg
                active:scale-95 disabled:opacity-50">
              <div className="relative flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
                <span className="font-semibold">Coba Lagi</span>
              </div>
            </button>
            <button
              onClick={onBackToClassrooms}
              className="group relative overflow-hidden px-8 py-4 bg-base-100 dark:bg-base-200 
                border-2 border-base-300 text-base-content rounded-2xl 
                transition-all duration-200 hover:scale-105 hover:shadow-lg
                active:scale-95">
              <div className="relative flex items-center justify-center gap-2">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="font-semibold">Kembali</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
));
ErrorState.displayName = "ErrorState";

// Optimized ClassroomHeader - simplified animations
const ClassroomHeader = React.memo(({ displayClassroom }) => (
  <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-primary/20 mb-8">
    {/* Simplified background */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/90"></div>
    <div className="absolute inset-0 opacity-20">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full transform translate-x-32 -translate-y-32"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full transform -translate-x-16 translate-y-16"></div>
    </div>

    <div className="relative text-white p-6 md:p-10 text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-5xl font-extrabold mb-4">
          E-Learning {displayClassroom?.name}
        </h1>
        <p className="text-sm md:text-xl text-primary-100 mb-8 leading-relaxed max-w-2xl mx-auto">
          Bergabunglah dengan program pendidikan terbaik dan wujudkan impian
          masa depanmu!
        </p>

        {/* Simplified stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto">
          {/* Teachers count */}
          <div className="group bg-white/10 rounded-2xl p-4 transition-all duration-200 hover:bg-white/15">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl mb-2 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                <GraduationCap className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <span className="text-xl md:text-2xl font-bold">
                {displayClassroom.teacher_count}
              </span>
              <span className="text-xs md:text-sm text-primary-100">Guru</span>
            </div>
          </div>

          {/* Students count */}
          <div className="group bg-white/10 rounded-2xl p-4 transition-all duration-200 hover:bg-white/15">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl mb-2 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                <Users className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <span className="text-xl md:text-2xl font-bold">
                {displayClassroom.student_count}
              </span>
              <span className="text-xs md:text-sm text-primary-100">Siswa</span>
            </div>
          </div>

          {/* Classroom code */}
          <div className="group bg-white/10 rounded-2xl p-4 transition-all duration-200 hover:bg-white/15">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl mb-2 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                <Hash className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <span className="text-sm md:text-lg font-bold truncate max-w-full">
                {displayClassroom.code}
              </span>
              <span className="text-xs md:text-sm text-primary-100">Kode</span>
            </div>
          </div>

          {/* Status */}
          <div className="group bg-white/10 rounded-2xl p-4 transition-all duration-200 hover:bg-white/15">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl mb-2 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                {displayClassroom.status === "active" ? (
                  <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-green-200" />
                ) : (
                  <CircleX className="w-5 h-5 md:w-6 md:h-6 text-red-200" />
                )}
              </div>
              <span className="text-sm md:text-base font-bold">
                {displayClassroom.status === "active" ? "Aktif" : "Tidak Aktif"}
              </span>
              <span className="text-xs md:text-sm text-primary-100">
                Status
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
));
ClassroomHeader.displayName = "ClassroomHeader";

const ClassroomDetailParent = ({ children }) => {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  useSaveLastClassroomParams();

  const itemCode = useMemo(() => code || null, [code]);
  const isMobile = useIsMobile();
  const currentUser = useSelector((state) => state.auth.user);

  // Refs to prevent unnecessary operations
  const lastRefreshTimeRef = useRef(null);
  const initialLoadAttemptedRef = useRef(false);
  const retryTimeoutRef = useRef(null);
  const [activeMenu, setActiveMenu] = useState("");

  // State for managing error and retry logic
  const [retryCount, setRetryCount] = useState(0);
  const [showRetry, setShowRetry] = useState(false);
  const [manualRefreshTriggered, setManualRefreshTriggered] = useState(false);

  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pathParts = location.pathname.split("/");
    let targetSegment = "";

    if (pathParts.length > 3 && pathParts[3]) {
      targetSegment = pathParts[3];
    }

    setActiveMenu(targetSegment ?? "");
  }, []);

  useEffect(() => {
    const pathParts = location.pathname.split("/");
    let targetSegment = "class";

    if (pathParts.length > 3 && pathParts[3]) {
      targetSegment = pathParts[3];
    }

    setActiveMenu(targetSegment ?? "class");
  }, [location.pathname]);

  const initialDataProps = useMemo(() => {
    try {
      const dataProps = location?.state?.dataProps;
      if (!dataProps || typeof dataProps !== "object" || !dataProps.id) {
        return null;
      }
      return {
        id: dataProps.id,
        name: dataProps.name || "",
        code: dataProps.code || "",
        description: dataProps.description || "",
        status: dataProps.status || "active",
        teachers: dataProps.teachers || [],
        students: dataProps.students || [],
        teacher_count:
          dataProps.teachers?.length || dataProps.teacher_count || 0,
        student_count:
          dataProps.students?.length || dataProps.student_count || 0,
      };
    } catch (error) {
      console.warn("[ClassRoomDetailPage] Error parsing dataProps:", error);
      return null;
    }
  }, [location?.state?.dataProps]);

  const classroomOnlyProps = useMemo(() => {
    const isValid =
      initialDataProps && itemCode && initialDataProps.code === itemCode;
    return isValid ? initialDataProps : null;
  }, [initialDataProps, itemCode]);

  const {
    currentClassroom,
    isLoading,
    error,
    smartRefresh,
    refreshDetail,
    isStale: isDetailStale,
    teachers,
    students,
    isTeachersStale,
    isStudentsStale,
    isFetching,
    isNotFound,
    canRetry,
  } = useClassroomDetail(itemCode, {
    dataProps: classroomOnlyProps,
    autoLoad: true,
    enablePolling: false,
    cacheTimeout: 5 * 60 * 1000,
  });

  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  const menuItems = useMemo(
    () => [
      {
        title: "Kelas",
        params: "class",
        url: `/classrooms/${itemCode}`,
        color: "blue",
        icon: <Settings />,
      },
      {
        title: "Materi Pembelajaran",
        params: "material",
        url: `/classrooms/${itemCode}/material`,
        color: "yellow",
        icon: <Megaphone />,
      },
      {
        title: "Pertemuan",
        params: "attendance",
        url: `/classrooms/${itemCode}/attendance`,
        color: "red",
        icon: <CalendarCheck />,
      },
      {
        title: "Tugas",
        params: "assignment",
        url: `/classrooms/${itemCode}/assignment`,
        color: "green",
        icon: <BookOpen />,
      },
    ],
    [itemCode]
  );

  const cacheStatus = useMemo(() => {
    return {
      detail: isDetailStale ? "stale" : "fresh",
      teachers: isTeachersStale ? "stale" : "fresh",
      students: isStudentsStale ? "stale" : "fresh",
      anyStale: isDetailStale || isTeachersStale || isStudentsStale,
    };
  }, [isDetailStale, isTeachersStale, isStudentsStale]);

  const displayClassroom = useMemo(() => {
    try {
      const baseClassroom = classroomOnlyProps || currentClassroom;
      if (!baseClassroom) {
        return null;
      }
      return {
        id: baseClassroom.id || itemCode,
        name: baseClassroom.name || "Unnamed Classroom",
        code: baseClassroom.code || "No Code",
        description: baseClassroom.description || "",
        status: baseClassroom.status || "active",
        teacher_count: teachers?.length || baseClassroom.teacher_count || 0,
        student_count: students?.length || baseClassroom.student_count || 0,
        teachers: teachers || [],
        students: students || [],
        _source: classroomOnlyProps ? "props" : "api",
        _cacheStatus: cacheStatus,
      };
    } catch (error) {
      console.error(
        "[ClassRoomDetailPage] Error computing displayClassroom:",
        error
      );
      return null;
    }
  }, [
    classroomOnlyProps,
    currentClassroom,
    teachers,
    students,
    itemCode,
    cacheStatus,
    isNotFound,
    error,
  ]);

  const handleRefreshAll = useCallback(() => {
    try {
      const now = Date.now();
      if (
        lastRefreshTimeRef.current &&
        now - lastRefreshTimeRef.current < 2000
      ) {
        return;
      }

      lastRefreshTimeRef.current = now;
      setLastRefreshTime(new Date());
      setManualRefreshTriggered(true);
      setRetryCount(0);
      setShowRetry(false);

      refreshDetail().finally(() => {
        setManualRefreshTriggered(false);
      });
    } catch (error) {
      console.error("[ClassRoomDetailPage] Error refreshing:", error);
      setManualRefreshTriggered(false);
    }
  }, [refreshDetail]);

  const shouldShowError = useMemo(() => {
    if (isLoading && !initialLoadAttemptedRef.current) {
      return false;
    }
    if (isNotFound) {
      return true;
    }
    if (error && !isLoading && !displayClassroom) {
      return true;
    }
    if (
      initialLoadAttemptedRef.current &&
      !displayClassroom &&
      !isLoading &&
      !canRetry
    ) {
      return true;
    }
    return false;
  }, [isLoading, isNotFound, error, displayClassroom, canRetry]);

  const shouldShowLoading = useMemo(() => {
    return (isLoading || isFetching) && !displayClassroom && !shouldShowError;
  }, [isLoading, isFetching, displayClassroom, shouldShowError]);

  // Auto-retry logic for failed loads
  useEffect(() => {
    if (
      itemCode &&
      !isLoading &&
      !displayClassroom &&
      !isNotFound &&
      canRetry &&
      retryCount < MAX_RETRY_ATTEMPTS &&
      !manualRefreshTriggered
    ) {
      setRetryCount((prev) => prev + 1);

      retryTimeoutRef.current = setTimeout(() => {
        smartRefresh();
      }, RETRY_DELAY * (retryCount + 1));

      return () => {
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
      };
    }

    if (retryCount >= MAX_RETRY_ATTEMPTS && !displayClassroom && !isNotFound) {
      setShowRetry(true);
      console.log(showRetry);
    }
  }, [
    itemCode,
    isLoading,
    displayClassroom,
    isNotFound,
    canRetry,
    retryCount,
    smartRefresh,
    manualRefreshTriggered,
  ]);

  useEffect(() => {
    if (itemCode && (isLoading || displayClassroom || error)) {
      initialLoadAttemptedRef.current = true;
    }
  }, [itemCode, isLoading, displayClassroom, error]);

  const handleMenuClick = useCallback(
    (params, url) => {
      setActiveMenu(params);
      navigate(url, { state: { dataProps: displayClassroom } });
    },
    [navigate, displayClassroom]
  );

  const handleBackToClassrooms = useCallback(
    () => navigate("/classrooms"),
    [navigate]
  );

  const contextValue = useMemo(
    () => ({
      displayClassroom,
      teachers,
      students,
      isTeachersStale,
      isStudentsStale,
      cacheStatus,
      activeMenu,
      setActiveMenu,
      itemCode,
    }),
    [
      displayClassroom,
      teachers,
      students,
      isTeachersStale,
      isStudentsStale,
      cacheStatus,
      activeMenu,
      itemCode,
    ]
  );

  if (!itemCode) {
    return (
      <ErrorState
        error="ID classroom tidak valid"
        onBackToClassrooms={handleBackToClassrooms}
        onRetry={handleRefreshAll}
      />
    );
  }

  if (shouldShowLoading) {
    return <LoadingState />;
  }

  if (shouldShowError) {
    return (
      <ErrorState
        error={error || "Classroom tidak ditemukan"}
        onBackToClassrooms={handleBackToClassrooms}
        onRetry={handleRefreshAll}
      />
    );
  }

  if (!displayClassroom) {
    return (
      <ErrorState
        error="Data classroom tidak tersedia"
        onBackToClassrooms={handleBackToClassrooms}
        onRetry={handleRefreshAll}
      />
    );
  }

  const renderChildren = () => {
    if (!children) return null;

    if (typeof children === "function") {
      return children(contextValue);
    }

    if (React.isValidElement(children)) {
      if (typeof children.type === "string") {
        return children;
      }
      return React.cloneElement(children, contextValue);
    }

    if (Array.isArray(children)) {
      return React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) {
          return child;
        }
        if (typeof child.type === "string") {
          return child;
        }
        return React.cloneElement(child, contextValue);
      });
    }

    return children;
  };

  return (
    <div className="min-h-[90vh] max-w-full">
      <ClassroomHeader displayClassroom={displayClassroom} />

      {/* Optimized Menu Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-8">
        {menuItems.map((item) => (
          <MenuItem
            key={item.params}
            item={item}
            isActive={item.params === activeMenu}
            onClick={handleMenuClick}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Optimized Sidebar */}
        <div
          className={`lg:col-span-2 ${
            isMobile && activeMenu !== "class" && "hidden"
          }`}>
          <div className="sticky top-4">
            <div
              className="relative group overflow-hidden bg-gradient-to-br from-base-100 to-base-100 dark:from-base-200 dark:to-base-200 rounded-3xl shadow-sm backdrop-blur-sm 
              border border-base-200/50">
              {/* Simplified decorative background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/2 to-transparent opacity-50"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full transform translate-x-16 -translate-y-16"></div>

              <div className="relative p-6 space-y-6">
                {/* Optimized Header */}
                <div className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl 
                    flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-105">
                    <div className="w-8 h-8 text-primary">
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        className="w-full h-full">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-base-content mb-2 leading-tight">
                      {displayClassroom.name}
                    </h1>
                    <div className="flex flex-col gap-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-base-300/30 rounded-xl text-sm font-medium text-base-content/70 w-fit">
                        <Hash className="w-3 h-3" />
                        {displayClassroom.code}
                      </div>
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-semibold w-fit transition-all duration-200 ${
                          displayClassroom.status === "active"
                            ? "bg-success/20 text-success shadow-lg shadow-success/10"
                            : "bg-warning/20 text-warning shadow-lg shadow-warning/10"
                        }`}>
                        {displayClassroom.status === "active" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Aktif
                          </>
                        ) : (
                          <>
                            <CircleX className="w-3 h-3" />
                            Tidak Aktif
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optimized Description */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-base-content/80 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
                    Keterangan
                  </h3>
                  <div className="bg-base-300/30 rounded-2xl p-4 border border-base-300/30">
                    <div className="text-sm text-base-content leading-relaxed">
                      <div
                        className="quill-content prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html:
                            displayClassroom.description ||
                            "Tidak ada deskripsi tersedia.",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Optimized Stats Cards */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-base-content/80 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-success to-success/50 rounded-full"></div>
                    Statistik
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Teachers card */}
                    <div className="group bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-4 border border-primary/20 hover:border-primary/30 transition-all duration-200 hover:shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                              <GraduationCap className="w-5 h-5 text-primary" />
                            </div>
                            <p className="text-sm font-medium text-base-content/70">
                              Total Guru
                            </p>
                          </div>
                          <p className="text-xl font-bold text-primary">
                            {displayClassroom.teacher_count}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Students card */}
                    <div className="group bg-gradient-to-r from-success/5 to-success/10 rounded-2xl p-4 border border-success/20 hover:border-success/30 transition-all duration-200 hover:shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="w-10 h-10 bg-success/20 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                              <Users className="w-5 h-5 text-success" />
                            </div>
                            <p className="text-sm font-medium text-base-content/70">
                              Total Siswa
                            </p>
                          </div>
                          <p className="text-xl font-bold text-success">
                            {displayClassroom.student_count}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optimized Cache Status */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-base-content/80 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-info to-info/50 rounded-full"></div>
                    Status Data
                  </h3>
                  <div className="bg-base-300/30 rounded-2xl p-4 border border-base-300/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={`relative w-3 h-3 rounded-full transition-all duration-300 ${
                          cacheStatus.anyStale
                            ? "bg-warning shadow-lg shadow-warning/30"
                            : "bg-success shadow-lg shadow-success/30"
                        }`}>
                        {/* Simplified pulse effect */}
                        {cacheStatus.anyStale && (
                          <div
                            className="absolute inset-0 rounded-full bg-warning opacity-30"
                            style={{
                              animation:
                                "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
                            }}></div>
                        )}
                      </div>
                      <span
                        className={`text-sm font-semibold transition-colors duration-200 ${
                          cacheStatus.anyStale ? "text-warning" : "text-success"
                        }`}>
                        {cacheStatus.anyStale
                          ? "Memperbarui Data..."
                          : "Data Terbaru"}
                      </span>
                    </div>
                    {lastRefreshTime && (
                      <div className="flex items-center gap-2 text-xs text-base-content/50">
                        <Clock className="w-3 h-3" />
                        <span>
                          Update terakhir:{" "}
                          {lastRefreshTime.toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: false,
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Optimized Action Buttons */}
                <div className="space-y-3 pt-2">
                  {currentUser.role !== "user" && (
                    <Link
                      to={`/classrooms/${itemCode}/edit`}
                      className="group relative overflow-hidden flex items-center justify-center gap-2 w-full px-4 py-4 
                        bg-gradient-to-r from-warning/10 to-warning/20 text-warning border-2 border-warning/30 
                        rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-lg
                        active:scale-95">
                      <div className="absolute inset-0 bg-gradient-to-r from-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      <Edit className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
                      <span className="font-semibold relative">Edit Kelas</span>
                    </Link>
                  )}

                  <button
                    onClick={handleRefreshAll}
                    disabled={isLoading}
                    className="group relative overflow-hidden flex items-center justify-center gap-2 w-full px-4 py-4 
                      bg-gradient-to-r from-base-100 to-base-200 dark:from-base-200 dark:to-base-300 
                      border-2 border-base-300 text-base-content rounded-2xl 
                      transition-all duration-200 hover:scale-105 hover:shadow-lg
                      active:scale-95 disabled:opacity-50 disabled:transform-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-base-200/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    {isLoading ? (
                      <>
                        <LoadingSpinner
                          size="sm"
                          className="text-base-content"
                        />
                        <span className="font-semibold relative">
                          Memperbarui...
                        </span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
                        <span className="font-semibold relative">
                          Refresh Data
                        </span>
                      </>
                    )}
                  </button>

                  <Link
                    to="/classrooms"
                    className="group relative overflow-hidden flex items-center justify-center gap-2 w-full px-4 py-4 
                      bg-gradient-to-r from-base-100 to-base-200 dark:from-base-200 dark:to-base-300 
                      border-2 border-base-300 text-base-content rounded-2xl 
                      transition-all duration-200 hover:scale-105 hover:shadow-lg
                      active:scale-95">
                    <div className="absolute inset-0 bg-gradient-to-r from-base-200/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
                    <span className="font-semibold relative">
                      Kembali ke Daftar
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-5">{renderChildren()}</div>
      </div>
    </div>
  );
};

export default memo(ClassroomDetailParent);
