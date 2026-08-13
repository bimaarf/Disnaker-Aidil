import { CircularProgress } from "@mui/material";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { formatDate } from "../../../../Context/__formatDate";
import useIsMobile from "../../../../Context/__useIsMobile";
import {
  truncateText,
  truncateTextWords,
} from "../../../../Context/__useTruncate";
import {
  fetchLandings,
  createLanding,
  updateLanding,
  deleteLanding,
} from "../../../../features/LandingPages/landingsSlice";
import { fetchAllRoutes } from "../../../../features/LandingPages/routesSlice";
import * as LucideIcons from "lucide-react";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { toast } from "react-toastify";
import { debounce } from "lodash";
import {
  FileText,
  MapPin,
  Link,
  Save,
  Database,
  Plus,
  Edit,
  Trash2,
  Search as SearchIcon,
  Route,
} from "lucide-react";

// Memoized InputField component (from BodyPage style)
const InputField = React.memo(
  ({
    icon: Icon,
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    themeClasses,
    disabled = false,
    tooltipId,
    tooltipContent,
  }) => {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className={`block text-sm font-medium ${themeClasses.muted}`}>
            {label}
          </label>
          {label === "Icon" && (
            <>
              <span className="text-[12px] text-error">{`*copy component name  di `}</span>
              <span
                onClick={() => window.open("https://lucide.dev/icons/")}
                className="text-[12px] text-blue-600 italic hover:underline cursor-pointer">{`https://lucide.dev/icons/`}</span>
            </>
          )}
        </div>

        <div className="relative">
          <input
            type={type}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`w-full px-4 py-3 bg-base-200 dark:bg-base-300 border border-base-300 focus:border-primary rounded-xl ${
              themeClasses.input
            } transition-all duration-200 placeholder:text-base-content/50 ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            placeholder={placeholder}
            data-tooltip-id={tooltipId}
            data-tooltip-content={tooltipContent}
          />
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <Icon className="w-5 h-5 text-blue-500" />
          </div>
        </div>
      </div>
    );
  }
);
InputField.displayName = "InputField";

// Memoized TextAreaField component
const TextAreaField = React.memo(
  ({ label, value, onChange, placeholder, themeClasses }) => (
    <div className="space-y-2">
      <label className={`block text-sm font-medium ${themeClasses.muted}`}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 bg-base-200 dark:bg-base-300 border border-base-300 focus:border-primary rounded-xl ${themeClasses.input} transition-all duration-200 placeholder:text-base-content/50 min-h-[200px]`}
        placeholder={placeholder}
      />
    </div>
  )
);
TextAreaField.displayName = "TextAreaField";

// Memoized ContentSection component (from BodyPage)
const ContentSection = React.memo(
  ({ icon: Icon, title, children, gradient }) => {
    const themeClasses = useSelector((state) =>
      state.themes.localTheme === "wireframe"
        ? {
            card: "bg-base-100",
            text: "text-base-content",
          }
        : {
            card: "bg-base-100 dark:bg-base-200",
            text: "text-base-content",
          }
    );

    return (
      <div
        className={`${themeClasses.card} rounded-2xl h-fit border border-base-300/50 overflow-hidden shadow-sm transition-all duration-300`}>
        <div className={`h-1 bg-gradient-to-r ${gradient}`}></div>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient.replace(
                "to-r",
                "to-br"
              )} flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
              {title}
            </h3>
          </div>
          {children}
        </div>
      </div>
    );
  }
);
ContentSection.displayName = "ContentSection";

// Main Component
const LandingManagementPage = () => {
  const dispatch = useDispatch();
  const landings = useSelector((state) => state.landings.landings || []);
  const total = useSelector((state) => state.landings.total || 0);
  const status = useSelector((state) => state.landings.status);
  const totalPages = useSelector((state) => state.landings.totalPages || 1);
  const error = useSelector((state) => state.landings.error);
  const allRoutes = useSelector((state) => state.routes.allRoutes || []);
  // const statusAllRoutes = useSelector((state) => state.routes.allRoutes.status);
  const theme = useSelector((state) => state.themes.localTheme);
  const [manualSortSnapshot, setManualSortSnapshot] = useState([]);
  const [isManualSortFrozen, setIsManualSortFrozen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedDatas, setSelectedDatas] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFetchingRef = useRef(false);
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [searchRef, setSearchRef] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const getThemeClasses = useCallback(() => {
    if (theme === "wireframe") {
      return {
        container: "bg-base-300/25",
        card: "bg-base-100",
        header: "bg-base-100/90",
        input:
          "bg-base-100 border-base-300 focus:border-blue-500 text-base-content",
        button: "bg-blue-600 hover:bg-blue-700 text-white",
        text: "text-base-content",
        muted: "text-base-content/60",
      };
    } else {
      return {
        container: "bg-base-300/25 dark:bg-base-100",
        card: "bg-base-100 dark:bg-base-200",
        header: "bg-base-100/90 dark:bg-base-200/90",
        input:
          "bg-base-100 dark:bg-base-300 border-base-300 dark:border-base-600 focus:border-blue-500 dark:focus:border-blue-400 text-base-content",
        button:
          "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white",
        text: "text-base-content",
        muted: "text-base-content/60 dark:text-base-content/70",
      };
    }
  }, [theme]);

  const themeClasses = useMemo(() => getThemeClasses(), [getThemeClasses]);

  const debouncedSearch = useMemo(
    () =>
      debounce((val) => {
        setSearchRef(val);
        setCurrentPage(1);
      }, 500),
    []
  );

  // Initial fetch
  useEffect(() => {
    if (status === "idle" && !isFetchingRef.current) {
      isFetchingRef.current = true;
      setLoading(true);
      dispatch(
        fetchLandings({
          page: 1,
          perPage: 10,
          search: "",
          route_id: null,
          sortKey: "created_at",
          sortDirection: "desc",
        })
      )
        .unwrap()
        .catch((error) => {
          console.error("Failed to fetch landings:", error);
          toast.error("Failed to fetch landings.");
        })
        .finally(() => {
          isFetchingRef.current = false;
          setLoading(false);
        });
    }
  }, [dispatch, status]);

  // Fetch on params change
  useEffect(() => {
    if (status !== "idle" && !isFetchingRef.current) {
      isFetchingRef.current = true;
      setLoading(true);
      dispatch(
        fetchLandings({
          page: currentPage,
          perPage: 10,
          search: searchRef,
          route_id: routeFilter || null,
          sortKey,
          sortDirection,
        })
      )
        .unwrap()
        .catch((error) => {
          console.error("Failed to fetch landings:", error);
          toast.error("Failed to fetch landings.");
        })
        .finally(() => {
          setIsLoadingMore(false);
          isFetchingRef.current = false;
          setLoading(false);
        });
    }
  }, [dispatch, currentPage, searchRef, routeFilter, sortKey, sortDirection]);

  useEffect(() => {
    dispatch(fetchAllRoutes());
  }, [dispatch]);

  const handleLoadMore = useCallback(() => {
    if (currentPage < totalPages && !isFetchingRef.current && !isLoadingMore) {
      setIsLoadingMore(true);
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages, isLoadingMore]);

  const handleScroll = useCallback(
    debounce(() => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 500
      ) {
        handleLoadMore();
      }
    }, 300),
    [handleLoadMore]
  );

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (isManualSortFrozen && landings.length > manualSortSnapshot.length) {
      const newItems = landings.filter(
        (item) => !manualSortSnapshot.find((s) => s.id === item.id)
      );
      setManualSortSnapshot((prev) => [...prev, ...newItems]);
    }
  }, [landings, isManualSortFrozen, manualSortSnapshot.length]);

  const sortedDatas = useMemo(() => {
    if (isManualSortFrozen) return manualSortSnapshot;
    return [...landings];
  }, [landings, isManualSortFrozen, manualSortSnapshot]);

  const requestSort = (key) => {
    const newDirection =
      sortKey === key && sortDirection === "desc" ? "asc" : "desc";
    setSortKey(key);
    setSortDirection(newDirection);

    const snapshot = [...landings];
    snapshot.sort((a, b) => {
      if (a[key] < b[key]) return newDirection === "asc" ? -1 : 1;
      if (a[key] > b[key]) return newDirection === "asc" ? 1 : -1;
      return 0;
    });

    setManualSortSnapshot(snapshot);
    setIsManualSortFrozen(true);
  };

  const uniqueDatas = useMemo(() => {
    const seen = {};
    return sortedDatas.filter((data) => {
      if (seen[data.id]) {
        return false;
      }
      seen[data.id] = true;
      return true;
    });
  }, [sortedDatas]);

  const truncateTitle = truncateText;

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("create");
  const [selectedLanding, setSelectedLanding] = useState(null);
  const [formData, setFormData] = useState({
    route_id: "",
    title: "",
    subtitle: "",
    icon: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [landingToDelete, setLandingToDelete] = useState(null);

  const openModal = (type, landing = null) => {
    setModalType(type);
    setSelectedLanding(landing);
    setShowModal(true);
    setFormErrors({});

    if (type === "create") {
      setFormData({
        route_id: routeFilter || "",
        title: "",
        subtitle: "",
        icon: "",
        description: "",
      });
    } else if (type === "edit" && landing) {
      setFormData({
        route_id: landing.route_id.toString(),
        title: landing.title,
        subtitle: landing.subtitle || "",
        icon: landing.icon || "",
        description: landing.description || "",
      });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLanding(null);
    setFormData({
      route_id: "",
      title: "",
      subtitle: "",
      icon: "",
      description: "",
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.route_id) errors.route_id = "Route is required";
    if (!formData.title.trim()) errors.title = "Title is required";

    const currentId = modalType === "create" ? null : selectedLanding.id;
    const existing = landings.find(
      (l) => l.route_id == formData.route_id && l.id !== currentId
    );
    if (existing) errors.route_id = "This route already has a landing page";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      if (modalType === "create") {
        await dispatch(createLanding(formData)).unwrap();
        toast.success("Landing created successfully.");
      } else {
        await dispatch(
          updateLanding({
            id: selectedLanding.id,
            landingData: formData,
          })
        ).unwrap();
        toast.success("Landing updated successfully.");
      }
      closeModal();
      setCurrentPage(1);
    } catch (error) {
      toast.error("Failed to submit landing.");
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (landing) => {
    setLandingToDelete(landing);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    setLoading(true);
    if (landingToDelete) {
      try {
        await dispatch(deleteLanding(landingToDelete.id)).unwrap();
        toast.success("Landing deleted successfully.");
        setShowDeleteConfirm(false);
        setLandingToDelete(null);
        setCurrentPage(1);
      } catch (error) {
        toast.error("Failed to delete landing.");
        console.error("Error deleting landing:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkDelete = async () => {
    setLoading(true);
    try {
      for (const id of selectedDatas) {
        await dispatch(deleteLanding(id)).unwrap();
      }
      toast.success("Selected landings deleted successfully.");
      setSelectedDatas([]);
      setCurrentPage(1);
    } catch (error) {
      toast.error("Failed to bulk delete landings.");
      console.error("Error bulk deleting:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRouteName = (routeId) => {
    const route = allRoutes.find((r) => r.id === routeId);
    return route ? route.route_name : "Unknown Route";
  };

  const getErrorMessage = (err) => {
    if (!err) return null;
    if (typeof err === "string") return err;
    if (err.message) return err.message;
    return JSON.stringify(err);
  };

  return (
    <div className={`min-h-screen`}>
      {/* Header (adapted from BodyPage) */}
      <div
        className={`bg-base-100 dark:bg-base-200 shadow-sm border border-base-300/50 rounded-xl mb-6`}>
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-start md:items-center justify-between">
            <div className="flex items-start md:items-center gap-2 md:gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${themeClasses.text}`}>
                  Landing Pages Management
                </h1>
                <p className={`text-sm ${themeClasses.muted} mt-1`}>
                  Kelola halaman landing dan rute website Anda
                </p>
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
                <CircularProgress size={16} />
                <span className="text-sm font-medium text-blue-700">
                  Memproses...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full space-y-6">
        {/* Controls Section */}
        <ContentSection
          icon={SearchIcon}
          title="Filters & Actions"
          gradient="from-purple-500 to-purple-600">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              icon={SearchIcon}
              label="Search Landings"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                debouncedSearch(e.target.value);
              }}
              placeholder="Search landings..."
              themeClasses={themeClasses}
              disabled={true}
              tooltipId="devTooltip"
              tooltipContent="Masih dalam pengembangan"
            />
            <div className="space-y-2">
              <label
                className={`block text-sm font-medium ${themeClasses.muted}`}>
                Route Filter
              </label>
              <select
                value={routeFilter}
                onChange={(e) => {
                  setRouteFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full px-4 py-3 rounded-xl ${themeClasses.input} transition-all duration-200`}>
                <option value="">All Routes</option>
                {allRoutes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.route_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => openModal("create")}
                className={`
                  relative w-full px-8 py-3 rounded-xl text-base font-semibold
                  ${themeClasses.button}
                  shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30
                  transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                  flex items-center gap-3 justify-center
                  border border-blue-500/20
                `}>
                <Plus className="w-5 h-5" />
                <span>Add Landing</span>
              </button>
            </div>
          </div>
          <Tooltip id="devTooltip" place="top" />
        </ContentSection>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <LucideIcons.AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span className="text-red-800 dark:text-red-200">
              {getErrorMessage(error)}
            </span>
          </div>
        )}

        {/* Landings List/Table */}
        <ContentSection
          icon={FileText}
          title="Landing Pages List"
          gradient="from-blue-500 to-blue-600">
          {!isMobile ? (
            <LandingsTable
              datas={uniqueDatas}
              status={status}
              sortKey={sortKey}
              sortDirection={sortDirection}
              requestSort={requestSort}
              formatDate={formatDate}
              truncateTitle={truncateTitle}
              selectedDatas={selectedDatas}
              setSelectedDatas={setSelectedDatas}
              handleEditData={openModal.bind(null, "edit")}
              handleDeleteData={confirmDelete}
              handleBulkDelete={handleBulkDelete}
              getRouteName={getRouteName}
              LucideIcons={LucideIcons}
              themeClasses={themeClasses}
              loading={loading || isLoadingMore}
              total={total}
            />
          ) : (
            <LandingsList
              datas={uniqueDatas}
              status={status}
              formatDate={formatDate}
              truncateTitle={truncateTitle}
              selectedDatas={selectedDatas}
              setSelectedDatas={setSelectedDatas}
              handleEditData={openModal.bind(null, "edit")}
              handleDeleteData={confirmDelete}
              handleBulkDelete={handleBulkDelete}
              getRouteName={getRouteName}
              LucideIcons={LucideIcons}
              themeClasses={themeClasses}
              loading={loading || isLoadingMore}
              total={total}
            />
          )}
        </ContentSection>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div
            className={`w-full max-w-4xl m-4 rounded-2xl ${themeClasses.card} shadow-2xl`}>
            <div className="p-6 border-b border-base-300/50">
              <h3 className={`text-2xl font-bold ${themeClasses.text}`}>
                {modalType === "create" ? "Create New Landing" : "Edit Landing"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    className={`block text-sm font-medium ${themeClasses.muted} mb-2`}>
                    Route <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full px-4 py-3 rounded-xl ${themeClasses.input} transition-all duration-200`}
                    value={formData.route_id}
                    onChange={(e) =>
                      setFormData({ ...formData, route_id: e.target.value })
                    }>
                    <option value="">Select a route</option>
                    {allRoutes.map((route) => (
                      <option
                        key={route.id}
                        value={route.id}
                        disabled={landings.some(
                          (l) =>
                            l.route_id === route.id &&
                            (modalType === "create" ||
                              (modalType === "edit" &&
                                l.id !== selectedLanding?.id))
                        )}>
                        {route.route_name}
                      </option>
                    ))}
                  </select>
                  {formErrors.route_id && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.route_id}
                    </p>
                  )}
                </div>
                <InputField
                  icon={FileText}
                  label="Title *"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter title..."
                  themeClasses={themeClasses}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  icon={Link}
                  label="Subtitle"
                  value={formData.subtitle}
                  onChange={(e) =>
                    setFormData({ ...formData, subtitle: e.target.value })
                  }
                  placeholder="Enter subtitle..."
                  themeClasses={themeClasses}
                />
                <InputField
                  icon={MapPin}
                  label="Icon"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  placeholder="e.g. Home"
                  themeClasses={themeClasses}
                />
              </div>
              <TextAreaField
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter description..."
                themeClasses={themeClasses}
              />
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  className={`px-8 py-3 rounded-xl border border-base-300 hover:bg-base-200 ${themeClasses.text} transition-all duration-200`}
                  onClick={closeModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`
                    relative px-8 py-3 rounded-xl text-base font-semibold
                    ${themeClasses.button}
                    shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30
                    transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    flex items-center gap-3 min-w-[180px] justify-center
                    border border-blue-500/20
                  `}>
                  {loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span>
                    {loading
                      ? "Saving..."
                      : modalType === "create"
                      ? "Create"
                      : "Update"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`w-full max-w-md m-4 rounded-2xl ${themeClasses.card} shadow-2xl`}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <LucideIcons.AlertCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                  Confirm Delete
                </h3>
              </div>
              <p className={`text-sm ${themeClasses.muted} mb-6`}>
                {` Are you sure you want to delete "${landingToDelete?.title}"? This
                action cannot be undone.`}
              </p>
              <div className="flex justify-end gap-4">
                <button
                  className={`px-8 py-3 rounded-xl border border-base-300 hover:bg-base-200 ${themeClasses.text} transition-all duration-200`}
                  onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
                <button
                  disabled={loading}
                  className={`
                    relative px-8 py-3 rounded-xl text-base font-semibold bg-red-600 hover:bg-red-700 text-white
                    shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30
                    transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    flex items-center gap-3 min-w-[180px] justify-center
                    border border-red-500/20
                  `}
                  onClick={handleDelete}>
                  {loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                  <span>{loading ? "Deleting..." : "Delete"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Updated Table Component
const LandingsTable = ({
  datas,
  sortKey,
  sortDirection,
  requestSort,
  formatDate,
  truncateTitle,
  selectedDatas,
  setSelectedDatas,
  handleEditData,
  handleDeleteData,
  handleBulkDelete,
  getRouteName,
  LucideIcons,
  loading,
  total,
}) => {
  const handleCheckboxChange = (id) => {
    setSelectedDatas((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((key) => key !== id)
        : [...prevSelected, id]
    );
  };

  const handleSelectAll = (event) => {
    setSelectedDatas(event.target.checked ? datas.map((data) => data.id) : []);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-base-300">
      <table className="table table-zebra w-full">
        <thead className="bg-base-200">
          <tr>
            <th className="bg-base-200 sticky left-0 z-10">
              <div className="flex items-center gap-3">
                <label>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm rounded-full"
                    onChange={handleSelectAll}
                    checked={
                      selectedDatas.length === datas.length && datas.length > 0
                    }
                  />
                </label>
                {selectedDatas.length > 0 ? (
                  <div
                    onClick={handleBulkDelete}
                    className="cursor-pointer text-error flex items-center gap-4 h-6 px-2 duration-200 hover:bg-base-200 w-full">
                    <Trash2 className="w-4 h-4" />
                    <span>
                      {selectedDatas.length > 0 && `(${selectedDatas.length})`}
                    </span>
                    <p>Delete</p>
                  </div>
                ) : (
                  <div
                    onClick={() => requestSort("title")}
                    className="flex items-center">
                    Title{" "}
                    {sortKey === "title"
                      ? sortDirection === "desc"
                        ? "↓"
                        : "↑"
                      : ""}
                    - ({total})
                  </div>
                )}
              </div>
            </th>
            <th>
              <div
                onClick={() => requestSort("route_id")}
                className="flex items-center">
                Route{" "}
                {sortKey === "route_id"
                  ? sortDirection === "desc"
                    ? "↓"
                    : "↑"
                  : ""}
              </div>
            </th>
            <th>
              <div className="flex items-center">Description</div>
            </th>
            <th>
              <div
                onClick={() => requestSort("created_at")}
                className="flex items-center">
                Created{" "}
                {sortKey === "created_at"
                  ? sortDirection === "desc"
                    ? "↓"
                    : "↑"
                  : ""}
              </div>
            </th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading && datas.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center">
                <div className="flex justify-center items-center gap-2">
                  <span className="loading loading-spinner"></span>
                  Loading landings...
                </div>
              </td>
            </tr>
          ) : datas.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center">
                No landings found
              </td>
            </tr>
          ) : (
            datas.map((landing, key) => {
              const IconComponent =
                landing.icon && LucideIcons[landing.icon]
                  ? LucideIcons[landing.icon]
                  : null;

              return (
                <tr
                  key={key}
                  className="cursor-pointer hover:bg-base-100 duration-500 ease-in-out"
                  id={landing.id}>
                  <td className="title-cell">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm rounded-full"
                          checked={selectedDatas.includes(landing.id)}
                          onChange={() => handleCheckboxChange(landing.id)}
                        />
                      </label>
                      <div className="avatar placeholder">
                        <div className="bg-orange-500 text-white h-12 w-12 rounded-full">
                          {IconComponent ? (
                            <IconComponent className="w-6 h-6" />
                          ) : (
                            <span className="text-xs">N/A</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold">
                          {truncateTextWords(landing.title, 2)}
                        </div>
                        <div className="text-sm opacity-50">
                          {truncateTextWords(landing.subtitle || "", 2)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1 items-center">
                      <Route className="w-5 h-5" />
                      <p className="capitalize">
                        {getRouteName(landing.route_id)}
                      </p>
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1 items-center">
                      <FileText className="w-5 h-5" />
                      <p>{truncateTitle(landing.description || "-", 100)}</p>
                    </div>
                  </td>
                  <td>{formatDate(landing.created_at)}</td>
                  <td>
                    <div className="flex items-baseline justify-start gap-2">
                      <button
                        onClick={() => handleEditData(landing)}
                        className="btn btn-ghost btn-sm bg-base-200/50 font-medium rounded text-pretty">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteData(landing)}
                        className="btn btn-ghost btn-sm bg-base-200/50 font-medium rounded text-pretty">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {loading && (
        <div className="flex justify-center mt-4">
          <span className="loading loading-spinner"></span>
        </div>
      )}
    </div>
  );
};

// Updated Mobile List Component with themeClasses
const LandingsList = ({
  datas,
  status,
  formatDate,
  selectedDatas,
  setSelectedDatas,
  handleEditData,
  handleDeleteData,
  handleBulkDelete,
  getRouteName,
  LucideIcons,
  themeClasses,
  loading,
  total,
}) => {
  const toggleSelect = (id) => {
    if (selectedDatas.includes(id)) {
      setSelectedDatas(selectedDatas.filter((s) => s !== id));
    } else {
      setSelectedDatas([...selectedDatas, id]);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <CircularProgress size={40} />
        <p className={`mt-4 text-sm ${themeClasses.muted}`}>
          Loading landings...
        </p>
      </div>
    );
  }

  if (datas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <LucideIcons.Search className="w-16 h-16 text-base-content/30 mb-4" />
        <h3 className={`text-lg font-medium ${themeClasses.muted} mb-2`}>
          No landings found
        </h3>
        <p className={`text-sm ${themeClasses.muted}`}>
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className={`text-sm ${themeClasses.muted}`}>Total: {total}</span>
        {selectedDatas.length > 0 && (
          <button
            className={`
              relative px-6 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white
              shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30
              transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
              flex items-center gap-2
              border border-red-500/20
            `}
            onClick={handleBulkDelete}>
            <Trash2 className="w-4 h-4" />
            Delete Selected ({selectedDatas.length})
          </button>
        )}
      </div>
      <div className="space-y-4">
        {datas.map((landing) => {
          const IconComponent =
            landing.icon && LucideIcons[landing.icon]
              ? LucideIcons[landing.icon]
              : null;
          const isSelected = selectedDatas.includes(landing.id);

          return (
            <div
              key={landing.id}
              className={`rounded-xl border border-base-300/50 overflow-hidden shadow-lg transition-all duration-300 ${
                isSelected ? "ring-2 ring-blue-500" : ""
              }`}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(landing.id)}
                      className="checkbox checkbox-sm rounded-full"
                    />
                    <div>
                      <h3 className={`font-semibold ${themeClasses.text}`}>
                        {landing.title}
                      </h3>
                      {landing.subtitle && (
                        <p className={`text-sm ${themeClasses.muted}`}>
                          {landing.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                      onClick={() => handleEditData(landing)}>
                      <Edit size={16} className="text-blue-500" />
                    </button>
                    <button
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all"
                      onClick={() => handleDeleteData(landing)}>
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 gap-1">
                    <Route size={12} />
                    {getRouteName(landing.route_id)}
                  </span>
                </div>
                <div className="flex items-start gap-3 mb-4">
                  <div className="avatar placeholder">
                    <div className="bg-orange-500 text-white h-12 w-12 rounded-full">
                      {IconComponent ? (
                        <IconComponent className="w-6 h-6" />
                      ) : (
                        <span className="text-xs">N/A</span>
                      )}
                    </div>
                  </div>
                  {landing.description && (
                    <p className={`text-sm ${themeClasses.muted} flex-1`}>
                      {truncateTextWords(landing.description, 2)}
                    </p>
                  )}
                </div>
                <div
                  className={`flex items-center gap-2 text-sm ${themeClasses.muted} pt-3 border-t border-base-300/50`}>
                  <LucideIcons.Calendar size={14} />
                  {formatDate(landing.created_at)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LandingManagementPage;
