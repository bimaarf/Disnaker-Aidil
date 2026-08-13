import debounce from "lodash/debounce";
import {
  ArrowRight,
  Calendar,
  CircleArrowRight,
  FileText,
  Heart,
  Users,
  XCircle,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchPeriods, periodCache } from "../features/ppdb/periodSlice";
import { formatDateMonthYear } from "../Context/__formatDate";
import { truncateText } from "../Context/__useTruncate";
import { selectLandingByRouteName } from "../features/LandingPages/routesHook";
import { DynamicLucideIcon } from "../Helper/dinamycLucideIcon";
import useIsMobile from "../Context/__useIsMobile";

export const RegistrationSectionHome = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const periods = useSelector((state) => state.periods.periods);
  const total = useSelector((state) => state.periods.total);
  const status = useSelector((state) => state.periods.status);
  const totalPages = useSelector((state) => state.periods.totalPages);
  const landing = useSelector(
    selectLandingByRouteName("registration-volunteer")
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  const [isRegistrationVisible, setIsRegistrationVisible] = useState(false);
  const [isProgramsVisible, setIsProgramsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMobile = useIsMobile();

  const registrationRef = useRef(null);
  const programsRef = useRef(null);
  const isFetchingRef = useRef(false);
  const loadMoreRef = useRef(null);

  // Fetch all periods (both open and closed)
  const fetchAllRegistrations = useCallback(
    debounce(async (params, retryCount = 3) => {
      const cacheKey = JSON.stringify(params);

      if (periodCache.has(cacheKey)) {
        dispatch({
          type: "periods/fetchPeriods/fulfilled",
          payload: periodCache.get(cacheKey),
        });
        isFetchingRef.current = false;
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const result = await dispatch(fetchPeriods(params)).unwrap();

        periodCache.set(cacheKey, result);
        isFetchingRef.current = false;
        setIsLoading(false);
      } catch (err) {
        if (retryCount > 0) {
          setTimeout(() => fetchAllRegistrations(params, retryCount - 1), 1000);
        } else {
          setError(err.message || "Failed to load registrations");
          isFetchingRef.current = false;
          setIsLoading(false);
        }
      }
    }, 500),
    [dispatch]
  );

  // Initial fetch and scroll handling
  useEffect(() => {
    if (!isFetchingRef.current) {
      isFetchingRef.current = true;
      fetchAllRegistrations({
        page: currentPage,
        perPage: 6, // Show 6 programs for better UI
        searchQuery: "",
        fromDate: "",
        toDate: "",
        periodId: null,
      });
    }

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);

    // Intersection Observers
    const registrationObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) =>
          setIsRegistrationVisible(entry.isIntersecting)
        );
      },
      { threshold: 0.1 }
    );
    const programsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setIsProgramsVisible(entry.isIntersecting));
      },
      { threshold: 0.1 }
    );

    if (registrationRef.current)
      registrationObserver.observe(registrationRef.current);
    if (programsRef.current) programsObserver.observe(programsRef.current);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      registrationObserver.disconnect();
      programsObserver.disconnect();
    };
  }, [currentPage, fetchAllRegistrations]);

  // Load more functionality
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          currentPage < totalPages &&
          !isFetchingRef.current &&
          !isLoading
        ) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [currentPage, totalPages, isLoading]);

  // Sort periods: open first, then closed
  const sortedPeriods = useMemo(() => {
    if (!periods || periods.length === 0) return [];

    const openPeriods = periods.filter(
      (period) => period.status === 1 || period.status === "1"
    );
    const closedPeriods = periods.filter(
      (period) => period.status !== 1 && period.status !== "1"
    );

    // Return open periods first, then closed periods
    return [...openPeriods, ...closedPeriods];
  }, [periods]);

  const activeCount = useMemo(() => {
    return (
      periods?.filter((period) => period.status === 1 || period.status === "1")
        .length || 0
    );
  }, [periods]);

  const handleRegisterNow = (period) => {
    navigate(`/form/period/answer/preview/${period.key}?isTop=true`);
  };

  const handleViewAllPrograms = () => {
    navigate("/events");
  };

  const isOpenPeriod = (period) => {
    return period.status === 1 || period.status === "1";
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto text-center">
          <div className="text-red-600 text-xl font-bold mb-4">
            Gagal memuat program
          </div>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            className="btn bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
            onClick={() => window.location.reload()}>
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pt-10 sm:pt-0">
      {/* Hero Section */}
      <section
        ref={registrationRef}
        className="relative bg-gradient-to-r from-orange-500 to-red-600 py-8 sm:py-12 lg:py-16">
        {/* Enhanced Background Pattern with Parallax */}
        <div
          className="absolute inset-0"
          style={{
            transform: isMobile ? "none" : `translateY(${scrollY * 0.3}px)`,
            willChange: "transform",
          }}
        />

        {/* Animated Background Elements - Mobile responsive */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-4 left-4 sm:top-10 sm:left-10 w-16 h-16 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-xl animate-pulse" />
          <div className="absolute top-20 right-4 sm:top-40 sm:right-20 w-12 h-12 sm:w-24 sm:h-24 bg-yellow-300/20 rounded-full blur-lg animate-bounce" />
          <div className="absolute bottom-8 left-1/4 w-8 h-8 sm:w-20 sm:h-20 bg-green-300/20 rounded-full blur-md animate-pulse delay-1000" />
        </div>

        {/* Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-5 sm:opacity-10 overflow-hidden"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative mt-4 sm:mt-8 z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-4 sm:space-y-6">
            <div
              className={`flex justify-center transition-all duration-1000 ${
                isRegistrationVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}>
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110">
                <DynamicLucideIcon
                  iconName={landing?.icon}
                  className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white"
                />
              </div>
            </div>

            <div
              className={`space-y-4 transition-all duration-1000 delay-300 ${
                isRegistrationVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}>
              <h1 className="text-xl sm:text-3xl lg:text-5xl font-bold text-white leading-tight">
                {landing?.title}
              </h1>
              <h1 className="text-lg sm:text-2xl lg:text-4xl font-bold italic text-yellow-300">
                {landing?.subtitle}
              </h1>
              <p className="text-sm sm:text-lg lg:text-xl text-orange-100 max-w-3xl mx-auto px-2">
                {landing?.description}
              </p>
            </div>
            <div
              className={`flex flex items-center justify-center gap-6 text-white text-sm md:text-base pt-8 transition-all duration-1000 delay-500 ${
                isRegistrationVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Users className="w-5 h-5" />
                <span className="text-xs sm:text-sm">
                  {total}+ Program Tersedia
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <FileText className="w-5 h-5" />
                <span className="text-xs sm:text-sm">Pendaftaran Online</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Features Section */}

        {/* Active Programs Section */}
        <section
          ref={programsRef}
          className={`text-center mb-12 transition-all duration-1000 ${
            isProgramsVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
            Program Volunteer Tersedia
          </h2>
          <p className="text-gray-600 text-sm sm:text-lg max-w-2xl mx-auto mb-6">
            Pilih program volunteer yang sesuai dengan minat dan kemampuan Anda
          </p>
          {activeCount > 0 && (
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              <CircleArrowRight className="w-4 h-4" />
              {activeCount} program sedang dibuka untuk pendaftaran
            </div>
          )}
        </section>

        {/* Loading State */}
        {status === "loading" && sortedPeriods.length === 0 && (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200"></div>
              <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-orange-600 absolute top-0 left-0"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Heart className="w-8 h-8 text-orange-600 animate-pulse" />
              </div>
            </div>
            <p className="text-gray-600 font-medium">
              Memuat program volunteer...
            </p>
          </div>
        )}

        {/* Programs Grid */}
        {sortedPeriods.length > 0 && (
          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 transition-all duration-1000 ${
              isProgramsVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-0 opacity-100"
            }`}>
            {sortedPeriods.map((program, index) => {
              const isOpen = isOpenPeriod(program);
              return (
                <div key={program.id} className="group">
                  <div
                    className="relative"
                    style={{ transitionDelay: `${100 + index * 150}ms` }}>
                    <div
                      className={`bg-gradient-to-br ${
                        isOpen
                          ? "from-orange-400 to-red-600"
                          : "from-gray-300 to-gray-500"
                      } rounded-2xl p-8 shadow-2xl group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200 transform hover:-translate-y-2 ${
                        !isOpen ? "opacity-75" : ""
                      }`}>
                      <div className="bg-white rounded-xl p-6 space-y-4">
                        <div className="flex items-start space-x-4">
                          {/* Icon Wrapper */}
                          <div
                            className={`w-12 h-12 rounded-xl ${
                              isOpen
                                ? "bg-gradient-to-br from-orange-100 to-orange-200"
                                : "bg-gradient-to-br from-gray-100 to-gray-200"
                            } flex items-center justify-center shadow-sm`}>
                            <Heart
                              className={`w-6 h-6 ${
                                isOpen ? "text-orange-600" : "text-gray-500"
                              } transition-transform duration-200 group-hover:scale-110`}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <h3
                              className={`font-semibold ${
                                isOpen ? "text-gray-900" : "text-gray-600"
                              } text-base`}>
                              {program.title}
                            </h3>

                            {program.description && (
                              <p
                                className={`${
                                  isOpen ? "text-gray-600" : "text-gray-500"
                                } mt-1 text-sm leading-relaxed`}>
                                {truncateText(
                                  program.description?.replace(/<[^>]*>/g, ""),
                                  120
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => isOpen && handleRegisterNow(program)}
                          disabled={!isOpen}
                          className={`w-full ${
                            isOpen
                              ? "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white cursor-pointer transform hover:scale-105"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          } px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 group`}>
                          <span>
                            {isOpen ? "Daftar Sekarang" : "Pendaftaran Ditutup"}
                          </span>
                          {isOpen ? (
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                        </button>
                        <div
                          className={`h-1 bg-gradient-to-r ${
                            isOpen
                              ? "from-orange-500 to-red-600"
                              : "from-gray-400 to-gray-500"
                          } transform scale-x-0 group-hover:scale-x-100 z-40 transition-transform duration-300`}></div>
                      </div>
                    </div>
                    {/* Floating Cards */}
                    <div
                      className={`absolute -top-4 -right-4 bg-white p-4 rounded-xl shadow-lg backdrop-blur-lg border ${
                        isOpen ? "border-green-200" : "border-red-200"
                      }`}>
                      <div className="flex items-center space-x-2">
                        {isOpen ? (
                          <>
                            <CircleArrowRight className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-green-600">
                              Dibuka
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-600" />
                            <span className="text-sm font-medium text-red-600">
                              Ditutup
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-xl shadow-lg backdrop-blur-lg">
                      <div className="flex items-center space-x-2">
                        <Calendar
                          className={`w-5 h-5 ${
                            isOpen ? "text-red-500" : "text-gray-500"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            isOpen ? "text-red-500" : "text-gray-500"
                          }`}>
                          {formatDateMonthYear(program.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No Programs State */}
        {status === "succeeded" && sortedPeriods.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 max-w-md mx-auto">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Belum Ada Program Tersedia
              </h3>
              <p className="text-gray-600 mb-4">
                Saat ini belum ada program volunteer yang tersedia. Pantau terus
                untuk update terbaru!
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors duration-300">
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* Load More Trigger */}
        <div ref={loadMoreRef} className="h-10" />

        {/* Loading More State */}
        {isLoading && sortedPeriods.length > 0 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-300 border-t-orange-600"></div>
              <span className="text-gray-600 font-medium">
                Memuat program lainnya...
              </span>
            </div>
          </div>
        )}

        {/* View All Programs Button */}
        <div className="text-center mt-16">
          <button
            onClick={handleViewAllPrograms}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-4 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2 mx-auto">
            <span>Lihat Semua Program</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
