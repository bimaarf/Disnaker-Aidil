import {
  AlertCircle,
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle,
  ChevronDown,
  Download,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  School,
  Search,
  User,
  Users,
  XCircle,
  X,
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
import { formatDate } from "../Context/__formatDate";
import { fetchAnswerGroupPublic } from "../features/ppdb/answerSlice";
import { fetchAllPeriods, setFilters } from "../features/ppdb/periodSlice";
import {
  selectPublicRespondents,
  selectPublicStatus,
  selectAllPeriods,
  selectPeriodFilters,
  selectPeriodStatus,
} from "../features/ppdb/selectors";
import debounce from "lodash.debounce";

const ResultPPDB = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isPublic = true; // Public-facing page
  // Redux selectors
  const respondents = useSelector(selectPublicRespondents);
  const allPeriods = useSelector(selectAllPeriods);
  const filters = useSelector(selectPeriodFilters);
  const answersStatus = useSelector(selectPublicStatus);
  const periodsStatus = useSelector(selectPeriodStatus);
  const publicStatusTotals = useSelector(
    (state) => state.answers.publicStatusTotals
  );
  const publicPage = useSelector((state) => state.answers.publicPage);
  const publicTotalPages = useSelector(
    (state) => state.answers.publicTotalPages
  );
  // Local state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showPeriodList, setShowPeriodList] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const dropdownRef = useRef(null);
  const [dropdownPage, setDropdownPage] = useState(1);
  const [hasMoreDropdown, setHasMoreDropdown] = useState(true);
  const tableRef = useRef(null); // Reference to the table container for scroll restoration

  const handleLoadMore = useCallback(() => {
    if (publicPage >= publicTotalPages || answersStatus === "loading") return;

    dispatch(
      fetchAnswerGroupPublic({
        page: publicPage + 1,
        perPage: 10,
        periodId: filters.selectedPeriodId,
        isPublic,
        searchQuery: searchTerm,
        fromCache: true, // Use cache if available
      })
    );
  }, [
    dispatch,
    filters.selectedPeriodId,
    isPublic,
    searchTerm,
    publicPage,
    publicTotalPages,
    answersStatus,
  ]);

  // Fetch initial data or specific page
  const fetchData = useCallback(
    async (page = 1, restoreScroll = false) => {
      try {
        setError(null);
        setIsSearchLoading(true);
        await dispatch(fetchAllPeriods()).unwrap();
        const result = await dispatch(
          fetchAnswerGroupPublic({
            page,
            perPage: 10,
            periodId: filters.selectedPeriodId,
            isPublic,
            searchQuery: searchTerm,
            fromCache: true, // Use cache if available
          })
        ).unwrap();
        dispatch({
          type: "answers/updateStatusTotals",
          payload: result.status_totals,
        });
        dispatch({
          type: "answers/recalculateStatusTotalsLocal",
        });
        setLastUpdated(new Date());

        // Restore scroll position after data is loaded
        if (restoreScroll) {
          const savedScrollPosition = sessionStorage.getItem("scrollPosition");
          if (savedScrollPosition && tableRef.current) {
            window.scrollTo(0, parseFloat(savedScrollPosition));
          }
        }
      } catch (err) {
        if (err !== "Request aborted") {
          setError(err.message || "Failed to load public data");
        }
      } finally {
        setIsSearchLoading(false);
      }
    },
    [dispatch, filters.selectedPeriodId, isPublic, searchTerm]
  );

  // Debounced fetchData for search
  const debouncedFetchData = useMemo(
    () =>
      debounce((page, restoreScroll) => fetchData(page, restoreScroll), 500),
    [fetchData]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedFetchData.cancel();
    };
  }, [debouncedFetchData]);

  // Fetch periods for dropdown
  const fetchDropdownPeriods = useCallback(
    async (page) => {
      try {
        const result = await dispatch(
          fetchAllPeriods({ page, perPage: 10 })
        ).unwrap();
        setHasMoreDropdown(result.page < result.totalPages);
      } catch (err) {
        setError(err.message || "Failed to load periods");
      }
    },
    [dispatch]
  );

  // Initial load and auto-reload
  useEffect(() => {
    const savedPage = sessionStorage.getItem("currentPage");
    const savedPeriodId = sessionStorage.getItem("periodId");
    const savedSearchTerm = sessionStorage.getItem("searchTerm");
    const savedFilterStatus = sessionStorage.getItem("filterStatus");

    if (
      savedPage &&
      savedPeriodId === filters.selectedPeriodId &&
      savedSearchTerm === searchTerm &&
      savedFilterStatus === filterStatus
    ) {
      // Load all pages up to savedPage
      const targetPage = parseInt(savedPage, 10);
      const loadPages = async () => {
        for (let page = 1; page <= targetPage; page++) {
          await dispatch(
            fetchAnswerGroupPublic({
              page,
              perPage: 10,
              periodId: filters.selectedPeriodId,
              isPublic,
              searchQuery: searchTerm,
              fromCache: true, // Use cache if available
            })
          ).unwrap();
        }
        // Restore scroll position after all data is loaded
        const savedScrollPosition = sessionStorage.getItem("scrollPosition");
        if (savedScrollPosition && tableRef.current) {
          window.scrollTo(0, parseFloat(savedScrollPosition));
        }
      };
      loadPages();
    } else {
      fetchData(1);
    }

    const interval = setInterval(() => fetchData(1), 30000);
    return () => clearInterval(interval);
  }, [
    fetchData,
    dispatch,
    filters.selectedPeriodId,
    isPublic,
    searchTerm,
    filterStatus,
  ]);

  // Load more periods for dropdown
  useEffect(() => {
    if (dropdownPage > 1) {
      fetchDropdownPeriods(dropdownPage);
    }
  }, [dropdownPage, fetchDropdownPeriods]);

  // Infinite scroll for dropdown
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreDropdown &&
          periodsStatus !== "loading"
        ) {
          setDropdownPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );
    if (dropdownRef.current) {
      observer.observe(dropdownRef.current);
    }
    return () => {
      if (dropdownRef.current) {
        observer.unobserve(dropdownRef.current);
      }
    };
  }, [hasMoreDropdown, periodsStatus]);

  // Map status labels from publicStatusTotals to filter options
  const statusOptions = useMemo(() => {
    const options = [{ value: "all", label: "Semua Status" }];
    if (publicStatusTotals) {
      Object.keys(publicStatusTotals).forEach((key) => {
        if (publicStatusTotals[key] > 0) {
          options.push({ value: key, label: key.replace(/_/g, " ") });
        }
      });
    }
    return options;
  }, [publicStatusTotals]);

  // Group respondents by period
  const groupedByPeriod = useMemo(() => {
    if (!respondents || respondents.length === 0) return {};
    const grouped = respondents.reduce((acc, respondent) => {
      const periodId = respondent.period?.id || "unknown";
      const periodTitle = respondent.period?.title || "Unknown Period";
      const periodStatus = respondent.period?.status || false;
      const periodStartDate = respondent.period?.start_date || null;
      const periodEndDate = respondent.period?.end_date || null;
      if (!acc[periodId]) {
        acc[periodId] = {
          id: periodId,
          title: periodTitle,
          status: periodStatus,
          start_date: periodStartDate,
          end_date: periodEndDate,
          respondents: [],
          stats: {
            total: 0,
            passed: 0,
            failed: 0,
            pending: 0,
          },
        };
      }
      acc[periodId].respondents.push(respondent);
      acc[periodId].stats.total++;
      const status = respondent.validation_status?.label || "Belum_Ditentukan";
      if (status === "Lulus") acc[periodId].stats.passed++;
      else if (status === "Tidak_Lulus") acc[periodId].stats.failed++;
      else acc[periodId].stats.pending++;
      return acc;
    }, {});
    return grouped;
  }, [respondents]);

  // Filter respondents based on search and status
  const filteredRespondents = useMemo(() => {
    const activePeriodData = groupedByPeriod[filters.selectedPeriodId];
    if (!activePeriodData) return [];
    let filtered = activePeriodData.respondents;
    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.submission_id
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus !== "all") {
      filtered = filtered.filter(
        (student) =>
          (student.validation_status?.label || "Belum_Ditentukan") ===
          filterStatus
      );
    }
    return filtered;
  }, [groupedByPeriod, filters.selectedPeriodId, searchTerm, filterStatus]);

  // Handle period selection
  const handlePeriodChange = (periodId) => {
    dispatch(setFilters({ selectedPeriodId: periodId }));
    setShowPeriodList(false);
    // Clear cache when period changes
    sessionStorage.removeItem("currentPage");
    sessionStorage.removeItem("scrollPosition");
    sessionStorage.removeItem("periodId");
    sessionStorage.removeItem("searchTerm");
    sessionStorage.removeItem("filterStatus");
    fetchData(1);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    // Clear cache when search term changes
    sessionStorage.removeItem("currentPage");
    sessionStorage.removeItem("scrollPosition");
    debouncedFetchData(1);
  };

  const handleViewDetail = (student) => {
    // Save scroll position and current state
    sessionStorage.setItem("scrollPosition", window.scrollY);
    sessionStorage.setItem("currentPage", publicPage);
    sessionStorage.setItem("periodId", filters.selectedPeriodId || "");
    sessionStorage.setItem("searchTerm", searchTerm);
    sessionStorage.setItem("filterStatus", filterStatus);

    setSelectedStudent(student);
    navigate(`/form/respondent/preview/${student.key}`, {
      state: { key: student.key, dataProps: student },
    });
  };

  const handleBackToList = () => {
    setSelectedStudent(null);
    navigate(-1);
  };

  const handleDownloadSurat = (student) => {
    alert(
      `Fitur download surat pengumuman untuk ${student.user_name} akan segera tersedia!`
    );
  };

  // Loading state
  if (answersStatus === "loading" && periodsStatus === "loading") {
    return (
      <div className="min-h-screen  flex items-center justify-center p-4">
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl md:rounded-3xl p-8 md:p-12 shadow-xl border border-white/20 max-w-sm w-full">
          <div className="relative mb-6 md:mb-8">
            <div className="animate-spin rounded-full h-16 w-16 md:h-20 md:w-20 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-blue-100/20 animate-pulse"></div>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
            Memuat Data
          </h3>
          <p className="text-base md:text-lg text-gray-600">
            Sedang mengambil data hasil PPDB...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl md:rounded-3xl p-8 md:p-12 shadow-2xl max-w-md w-full border border-red-100">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 md:mb-6">
            <XCircle className="w-8 h-8 md:w-10 md:h-10 text-red-600" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 md:mb-4">
            Oops!
          </h2>
          <p className="text-gray-600 mb-6 md:mb-8 leading-relaxed">{error}</p>
          <button
            onClick={() => {
              sessionStorage.removeItem("currentPage");
              sessionStorage.removeItem("scrollPosition");
              sessionStorage.removeItem("periodId");
              sessionStorage.removeItem("searchTerm");
              sessionStorage.removeItem("filterStatus");
              fetchData(1);
            }}
            className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/25">
            <RefreshCw className="w-4 h-4 md:w-5 md:h-5 inline mr-2" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // Detail view
  if (selectedStudent) {
    const statusColor = selectedStudent.validation_status?.color || "gray";
    const statusLabel =
      selectedStudent.validation_status?.label || "Belum_Ditentukan";
    const statusIcon = selectedStudent.validation_status?.icon || "clock";
    return (
      <div className="min-h-screen ">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <button
            onClick={handleBackToList}
            className="inline-flex items-center gap-2 md:gap-3 mb-6 md:mb-8 px-4 md:px-6 py-2 md:py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl group">
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold text-sm md:text-base">
              Kembali ke Daftar
            </span>
          </button>

          <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            <div
              className={`bg-gradient-to-r from-${statusColor}-500 to-${statusColor}-700 text-white p-6 md:p-12 text-center relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 md:w-40 md:h-40 bg-white/10 rounded-full -mr-16 md:-mr-20 -mt-16 md:-mt-20"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full -ml-12 md:-ml-16 -mb-12 md:-mb-16"></div>
              <div className="absolute top-1/2 left-1/2 w-48 h-48 md:w-64 md:h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>

              <div className="relative z-10">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <svg
                    className="w-8 h-8 md:w-12 md:h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={
                        statusIcon === "check_circle"
                          ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          : statusIcon === "x_circle"
                          ? "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                          : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      }
                    />
                  </svg>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-4">
                  {statusLabel}
                </h1>
                <p className="text-lg md:text-2xl opacity-90 font-light">
                  Pengumuman Penerimaan Siswa Baru
                </p>
              </div>
            </div>

            <div className="p-6 md:p-12">
              <div className="flex flex-col lg:flex-row gap-6 md:gap-12 mb-8 md:mb-12">
                <div className="flex-shrink-0 text-center lg:text-left">
                  <div className="w-24 h-24 md:w-40 md:h-40 rounded-2xl md:rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto lg:mx-0 border-4 md:border-8 border-white shadow-xl">
                    <User className="w-12 h-12 md:w-20 md:h-20 text-gray-500" />
                  </div>
                </div>

                <div className="flex-1 text-center lg:text-left space-y-4 md:space-y-6">
                  <div>
                    <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2 md:mb-3">
                      {selectedStudent.user_name || "N/A"}
                    </h2>
                    <div className="flex items-center justify-center lg:justify-start gap-2 md:gap-3 text-base md:text-lg text-gray-600 mb-3 md:mb-4">
                      <FileText className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="text-sm md:text-base">
                        Submission ID: {selectedStudent.submission_id || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-${statusColor}-100 to-${statusColor}-200 border border-${statusColor}-200 rounded-xl md:rounded-2xl font-semibold text-${statusColor}-600`}>
                    <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-sm md:text-base">
                      Periode: {selectedStudent.period?.title || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-6 md:space-y-8">
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-100 flex items-center justify-center">
                        <Award className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
                      </div>
                      Informasi Akademik
                    </h3>

                    {statusLabel !== "Belum_Ditentukan" && (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl md:rounded-3xl p-6 md:p-8 border border-gray-200">
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                          <span className="text-gray-600 font-medium text-sm md:text-base">
                            Nilai Total
                          </span>
                          <span className="text-2xl md:text-4xl font-bold text-gray-800">
                            {selectedStudent.result?.value || 0}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mb-4 md:mb-6">
                          <span className="text-gray-600 font-medium text-sm md:text-base">
                            Nilai Minimum
                          </span>
                          <span className="text-lg md:text-2xl font-semibold text-gray-700">
                            {selectedStudent.result?.minimum_value || 300}
                          </span>
                        </div>

                        <div className="relative">
                          <div className="w-full bg-gray-200 rounded-full h-3 md:h-4 overflow-hidden">
                            <div
                              className={`h-3 md:h-4 rounded-full transition-all duration-1000 bg-gradient-to-r from-${statusColor}-500 to-${statusColor}-600`}
                              style={{
                                width: `${
                                  Math.min(
                                    (selectedStudent.result?.value /
                                      selectedStudent.result?.minimum_value) *
                                      100,
                                    100
                                  ) || 0
                                }%`,
                              }}></div>
                          </div>
                          <div className="text-center mt-2 md:mt-3 text-xs md:text-sm text-gray-600">
                            {Math.round(
                              Math.min(
                                (selectedStudent.result?.value /
                                  selectedStudent.result?.minimum_value) *
                                  100,
                                100
                              ) || 0
                            )}
                            % dari nilai minimum
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 md:space-y-4">
                      <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-blue-50 rounded-xl md:rounded-2xl border border-blue-100">
                        <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                        <div>
                          <span className="text-gray-600 font-medium block text-sm md:text-base">
                            Tanggal Pendaftaran
                          </span>
                          <span className="font-bold text-gray-800 text-sm md:text-base">
                            {formatDate(
                              selectedStudent.created_at ||
                                selectedStudent.answers?.[0]?.created_at ||
                                "N/A"
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-green-50 rounded-xl md:rounded-2xl border border-green-100">
                        <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                        <div>
                          <span className="text-gray-600 font-medium block text-sm md:text-base">
                            Tanggal Pengumuman
                          </span>
                          <span className="font-bold text-gray-800 text-sm md:text-base">
                            {selectedStudent.result?.announcement_date
                              ? formatDate(
                                  selectedStudent.result.announcement_date
                                )
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 md:space-y-8">
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-purple-100 flex items-center justify-center">
                        <User className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
                      </div>
                      Informasi Kontak
                    </h3>

                    <div className="space-y-3 md:space-y-4">
                      <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-200">
                        <MapPin className="w-5 h-5 md:w-6 md:h-6 text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <span className="text-gray-600 font-medium block mb-1 text-sm md:text-base">
                            Alamat
                          </span>
                          <span className="font-semibold text-gray-800 leading-relaxed text-sm md:text-base">
                            {selectedStudent.user_address || "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-200">
                        <Phone className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
                        <div>
                          <span className="text-gray-600 font-medium block text-sm md:text-base">
                            No. Telepon
                          </span>
                          <span className="font-semibold text-gray-800 text-sm md:text-base">
                            {selectedStudent.user_phone_number || "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-200">
                        <Mail className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
                        <div>
                          <span className="text-gray-600 font-medium block text-sm md:text-base">
                            Email
                          </span>
                          <span className="font-semibold text-gray-800 text-sm md:text-base">
                            {selectedStudent.user_email || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {statusLabel === "Lulus" && (
                <div className="mt-8 md:mt-12 pt-8 md:pt-12 border-t border-gray-200">
                  <div className="text-center">
                    <button
                      onClick={() => handleDownloadSurat(selectedStudent)}
                      className="inline-flex items-center gap-3 md:gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 md:px-12 py-4 md:py-6 rounded-2xl md:rounded-3xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105">
                      <Download className="w-5 h-5 md:w-6 md:h-6" />
                      <span className="text-base md:text-lg">
                        Download Surat Penerimaan
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main view with period selection
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header Section */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-3 md:gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl md:rounded-3xl mb-6 md:mb-8 shadow-lg">
            <School className="w-5 h-5 md:w-6 md:h-6" />
            <span className="font-bold text-base md:text-lg">
              Hasil Penerimaan
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-4 md:mb-6 leading-tight">
            Status Kelulusan Siswa
          </h1>

          <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto mb-8 md:mb-12 leading-relaxed">
            Pengumuman hasil penerimaan siswa baru tahun ajaran
            {allPeriods.length > 0 ? ` ${allPeriods[0].title}` : " 2024/2025"}
          </p>

          {/* Controls Section */}
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-8 max-w-5xl mx-auto border border-gray-100">
            <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between md:gap-6">
              {/* Period Selection */}
              <div className="flex-1 w-full">
                <button
                  onClick={() => setShowPeriodList(!showPeriodList)}
                  className="w-full inline-flex items-center justify-between gap-3 md:gap-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 text-gray-700 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-105 md:min-w-80">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="font-semibold text-sm md:text-base">
                      {filters.selectedPeriodId
                        ? allPeriods.find(
                            (p) => p.id === filters.selectedPeriodId
                          )?.title || "Pilih Periode"
                        : "Pilih Periode"}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 md:w-5 md:h-5 transition-transform ${
                      showPeriodList ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                  <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari siswa atau ID..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full md:w-64 pl-10 md:pl-12 pr-8 md:pr-10 py-3 md:py-4 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm md:text-base"
                  />
                  {isSearchLoading && (
                    <div className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                  )}
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 md:px-4 py-3 md:py-4 bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-semibold text-gray-700 text-sm md:text-base">
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => {
                  // Clear cache when refreshing
                  sessionStorage.removeItem("currentPage");
                  sessionStorage.removeItem("scrollPosition");
                  sessionStorage.removeItem("periodId");
                  sessionStorage.removeItem("searchTerm");
                  sessionStorage.removeItem("filterStatus");
                  fetchData(1);
                }}
                disabled={answersStatus === "loading"}
                className="inline-flex items-center justify-center gap-2 md:gap-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-105 w-full sm:w-auto">
                <RefreshCw
                  className={`w-4 h-4 md:w-5 md:h-5 ${
                    answersStatus === "loading" ? "animate-spin" : ""
                  }`}
                />
                <span className="sm:hidden">Refresh</span>
              </button>
            </div>

            {lastUpdated && (
              <div className="mt-3 md:mt-4 text-center text-xs md:text-sm text-gray-600">
                Last updated: {formatDate(lastUpdated)}
              </div>
            )}
          </div>

          {/* Period List Modal */}
          {showPeriodList && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
                <div className="p-6 md:p-8 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                      Pilih Periode Seleksi
                    </h3>
                    <button
                      onClick={() => setShowPeriodList(false)}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                      <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto max-h-[60vh]">
                  <div className="grid gap-3 md:gap-4">
                    {allPeriods.map((period) => (
                      <button
                        key={period.id}
                        onClick={() => handlePeriodChange(period.id)}
                        className={`p-4 md:p-6 rounded-xl md:rounded-2xl border-2 text-left transition-all duration-300 hover:scale-[1.02] ${
                          filters.selectedPeriodId === period.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                        }`}>
                        <div className="flex items-center justify-between mb-2 md:mb-3">
                          <h4 className="font-semibold text-base md:text-lg text-gray-800">
                            {period.title}
                          </h4>
                          <div
                            className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
                              period.status
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                            {period.status ? "Dibuka" : "Ditutup"}
                          </div>
                        </div>
                      </button>
                    ))}

                    {hasMoreDropdown && (
                      <div
                        ref={dropdownRef}
                        className="p-3 md:p-4 text-center text-gray-500">
                        {periodsStatus === "loading" ? (
                          <div className="animate-spin rounded-full h-5 w-5 md:h-6 md:w-6 border-2 border-blue-500 border-t-transparent mx-auto"></div>
                        ) : (
                          <span className="text-sm md:text-base">
                            Scroll untuk memuat lebih banyak...
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        {filters.selectedPeriodId && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
            {[
              {
                title: "Total Siswa",
                value:
                  (publicStatusTotals.Lulus || 0) +
                  (publicStatusTotals.Tidak_Lulus || 0) +
                  (publicStatusTotals.Belum_Diverifikasi || 0) +
                  (publicStatusTotals.Berkas_Diterima || 0) +
                  (publicStatusTotals.Berkas_Dikembalikan || 0),
                icon: Users,
                color: "blue",
                bgColor: "from-blue-500 to-blue-600",
              },
              {
                title: "Lulus",
                value: publicStatusTotals.Lulus || 0,
                icon: CheckCircle,
                color: "green",
                bgColor: "from-green-500 to-green-600",
              },
              {
                title: "Tidak Lulus",
                value: publicStatusTotals.Tidak_Lulus || 0,
                icon: XCircle,
                color: "red",
                bgColor: "from-red-500 to-red-600",
              },
              {
                title: "Pending",
                value:
                  (publicStatusTotals.Belum_Diverifikasi || 0) +
                  (publicStatusTotals.Belum_Ditentukan || 0),
                icon: AlertCircle,
                color: "yellow",
                bgColor: "from-yellow-500 to-yellow-600",
              },
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className={`bg-gradient-to-r ${stat.bgColor} p-4 md:p-6`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-xs md:text-sm font-medium mb-1 md:mb-2">
                        {stat.title}
                      </p>
                      <p className="text-white text-2xl md:text-4xl font-bold">
                        {stat.value}
                      </p>
                    </div>
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center">
                      <stat.icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Table */}
        {filters.selectedPeriodId ? (
          filteredRespondents.length > 0 ? (
            <div
              className="bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border border-gray-100"
              ref={tableRef}>
              <div className="p-6 md:p-8 border-b border-gray-200">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                  Daftar Hasil Seleksi
                </h2>
                <p className="text-gray-600 text-sm md:text-base">
                  Menampilkan {filteredRespondents.length} dari{" "}
                  {groupedByPeriod[filters.selectedPeriodId]?.stats.total || 0}{" "}
                  siswa
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 md:px-8 py-4 md:py-6 text-left text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Siswa
                      </th>
                      <th className="px-4 md:px-8 py-4 md:py-6 text-left text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Submission ID
                      </th>
                      <th className="px-4 md:px-8 py-4 md:py-6 text-left text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 md:px-8 py-4 md:py-6 text-left text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Nilai
                      </th>
                      <th className="px-4 md:px-8 py-4 md:py-6 text-left text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-4 md:px-8 py-4 md:py-6 text-center text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {filteredRespondents.map((student, index) => {
                      const statusColor =
                        student.validation_status?.color || "gray";
                      const statusLabel =
                        student.validation_status?.label || "Belum_Ditentukan";
                      return (
                        <tr
                          key={student.key || index}
                          className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-4 md:px-8 py-4 md:py-6">
                            <div className="flex items-center gap-3 md:gap-4">
                              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
                              </div>
                              <div>
                                <div className="font-bold text-gray-800 text-sm md:text-lg">
                                  {student.user_name || "N/A"}
                                </div>
                                <div className="text-xs md:text-sm text-gray-600">
                                  {student.user_email || "N/A"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 md:px-8 py-4 md:py-6">
                            <div className="font-mono text-xs md:text-sm text-gray-800 px-2 md:px-3 py-1 md:py-2 bg-gray-100 rounded-lg inline-block">
                              {student.submission_id || "N/A"}
                            </div>
                          </td>

                          <td className="px-4 md:px-8 py-4 md:py-6">
                            <div
                              className={`inline-flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-medium bg-${statusColor}-100 text-${statusColor}-700 border border-${statusColor}-200`}>
                              {statusLabel === "Lulus" && (
                                <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                              )}
                              {statusLabel === "Tidak_Lulus" && (
                                <XCircle className="w-3 h-3 md:w-4 md:h-4" />
                              )}
                              {[
                                "Belum_Diverifikasi",
                                "Belum_Ditentukan",
                                "Berkas_Diterima",
                                "Berkas_Dikembalikan",
                              ].includes(statusLabel) && (
                                <AlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                              )}
                              <span className="truncate">
                                {statusLabel.replace(/_/g, " ")}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 md:px-8 py-4 md:py-6">
                            <div className="text-base md:text-lg font-bold text-gray-800">
                              {student.result?.value || "N/A"}
                            </div>
                            <div className="text-xs md:text-sm text-gray-600">
                              Min: {student.result?.minimum_value || 300}
                            </div>
                          </td>

                          <td className="px-4 md:px-8 py-4 md:py-6">
                            <div className="text-xs md:text-sm text-gray-600">
                              {formatDate(
                                student.created_at ||
                                  student.answers?.[0]?.created_at ||
                                  "N/A"
                              )}
                            </div>
                          </td>

                          <td className="px-4 md:px-8 py-4 md:py-6 text-center">
                            <button
                              onClick={() => handleViewDetail(student)}
                              className="inline-flex items-center gap-1 md:gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-blue-500/25 text-xs md:text-sm">
                              <FileText className="w-3 h-3 md:w-4 md:h-4" />
                              <span className="hidden sm:inline">Detail</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {publicPage < publicTotalPages && (
                  <div className="p-6 md:p-8 text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={answersStatus === "loading"}
                      className={`inline-flex items-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-105 text-sm md:text-base ${
                        answersStatus === "loading"
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}>
                      {answersStatus === "loading" ? (
                        <>
                          <RefreshCw className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                          Memuat...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 md:w-5 md:h-5" />
                          Muat Lebih Banyak
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl p-8 md:p-16 text-center border border-gray-100">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6 md:mb-8">
                <Search className="w-10 h-10 md:w-12 md:h-12 text-gray-400" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4">
                Tidak Ada Data
              </h3>
              <p className="text-gray-600 mb-6 md:mb-8 max-w-md mx-auto text-sm md:text-base">
                {searchTerm || filterStatus !== "all"
                  ? "Tidak ada siswa yang sesuai dengan filter pencarian Anda."
                  : "Belum ada data siswa untuk periode yang dipilih."}
              </p>
              {(searchTerm || filterStatus !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("all");
                    // Clear cache when resetting filters
                    sessionStorage.removeItem("currentPage");
                    sessionStorage.removeItem("scrollPosition");
                    sessionStorage.removeItem("periodId");
                    sessionStorage.removeItem("searchTerm");
                    sessionStorage.removeItem("filterStatus");
                    fetchData(1);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-105 text-sm md:text-base">
                  Reset Filter
                </button>
              )}
            </div>
          )
        ) : (
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl p-8 md:p-16 text-center border border-gray-100">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6 md:mb-8">
              <Calendar className="w-10 h-10 md:w-12 md:h-12 text-blue-600" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4">
              Pilih Periode Seleksi
            </h3>
            <p className="text-gray-600 mb-6 md:mb-8 max-w-md mx-auto text-sm md:text-base">
              Silakan pilih periode seleksi untuk melihat hasil penerimaan siswa
              baru.
            </p>
            <button
              onClick={() => setShowPeriodList(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-105 text-sm md:text-base">
              Pilih Periode
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultPPDB;
