import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  SortAsc,
  SortDesc,
  RefreshCw,
  FileText,
  Video,
  Link,
  BookOpen,
  Sword,
  Calendar,
  Eye,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

// Filter constants
const MATERIAL_TYPES = [
  { value: "", label: "Semua Tipe", icon: null },
  { value: "document", label: "Dokumen", icon: FileText },
  { value: "video", label: "Video", icon: Video },
  { value: "link", label: "Link", icon: Link },
  { value: "assignment", label: "Tugas", icon: BookOpen },
  { value: "quiz", label: "Kuis", icon: Sword },
];

const SORT_OPTIONS = [
  { value: "created_at", label: "Tanggal Dibuat", icon: Calendar },
  { value: "title", label: "Judul", icon: FileText },
  { value: "view_count", label: "Jumlah Dilihat", icon: Eye },
  { value: "download_count", label: "Jumlah Diunduh", icon: Download },
  { value: "updated_at", label: "Terakhir Diupdate", icon: Clock },
];

const SORT_ORDERS = [
  { value: "desc", label: "Terbaru", icon: SortDesc },
  { value: "asc", label: "Terlama", icon: SortAsc },
];

const PER_PAGE_OPTIONS = [
  { value: 5, label: "5 per halaman" },
  { value: 10, label: "10 per halaman" },
  { value: 25, label: "25 per halaman" },
  { value: 50, label: "50 per halaman" },
];

// Custom dropdown component
const Dropdown = ({
  trigger,
  children,
  isOpen,
  onToggle,
  className = "",
  position = "left",
}) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onToggle(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onToggle]);

  const positionClasses = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 transform -translate-x-1/2",
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div onClick={() => onToggle(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute top-full mt-2 w-64 bg-base-100 border border-base-300 rounded-xl shadow-xl z-10 ${positionClasses[position]}`}>
          <div className="p-2 max-h-80 overflow-y-auto">{children}</div>
        </div>
      )}
    </div>
  );
};

// Search input component
const SearchInput = ({
  value,
  onChange,
  onClear,
  placeholder = "Cari materi...",
}) => {
  return (
    <div className="relative flex-1 max-w-md">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
        <Search className="w-4 h-4 text-base-content/40" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3 bg-base-100 border border-base-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-base-content placeholder:text-base-content/40"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-base-200 rounded-full transition-colors"
          aria-label="Hapus pencarian">
          <X className="w-4 h-4 text-base-content/60" />
        </button>
      )}
    </div>
  );
};

// Filter badge component
const FilterBadge = ({ label, value, onRemove, icon: Icon }) => {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/20">
      {Icon && <Icon className="w-3 h-3" />}
      <span className="text-sm font-medium">
        {label}: {value}
      </span>
      <button
        onClick={onRemove}
        className="p-0.5 hover:bg-primary/20 rounded-full transition-colors"
        aria-label={`Hapus filter ${label}`}>
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

// Status indicator component
const StatusIndicator = ({ status, isCached, className = "" }) => {
  if (status === "loading") {
    return (
      <div className={`flex items-center gap-2 text-warning ${className}`}>
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm">Memuat...</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={`flex items-center gap-2 text-error ${className}`}>
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Error</span>
      </div>
    );
  }

  if (isCached) {
    return (
      <div className={`flex items-center gap-2 text-success ${className}`}>
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm">Cache</span>
      </div>
    );
  }

  return null;
};

// Main MaterialFilters component
const MaterialFilters = ({
  fetchMaterialsData,
  filters,
  clearFilters,
  isCached,
  status,
}) => {
  // Local state for UI
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);

  // Debounced search
  const searchTimeoutRef = useRef(null);

  // Update local search when filters change
  useEffect(() => {
    setSearchValue(filters.search || "");
  }, [filters.search]);

  // Debounced search handler
  const handleSearchChange = useCallback(
    (value) => {
      setSearchValue(value);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        fetchMaterialsData({ search: value });
      }, 500);
    },
    [fetchMaterialsData]
  );

  // Clear search
  const handleSearchClear = useCallback(() => {
    setSearchValue("");
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    fetchMaterialsData({ search: "" });
  }, [fetchMaterialsData]);

  // Filter handlers
  const handleTypeChange = useCallback(
    (type) => {
      fetchMaterialsData({ type });
      setIsFilterOpen(false);
    },
    [fetchMaterialsData]
  );

  const handleSortChange = useCallback(
    (sortBy, sortOrder) => {
      fetchMaterialsData({ sort_by: sortBy, sort_order: sortOrder });
      setIsSortOpen(false);
    },
    [fetchMaterialsData]
  );

  const handlePerPageChange = useCallback(
    (perPage) => {
      fetchMaterialsData({ per_page: perPage });
      setIsPerPageOpen(false);
    },
    [fetchMaterialsData]
  );

  const handleRefresh = useCallback(() => {
    fetchMaterialsData(filters, { forceRefresh: true });
  }, [fetchMaterialsData, filters]);

  const handleClearFilters = useCallback(() => {
    setSearchValue("");
    clearFilters();
  }, [clearFilters]);

  // Get active filters count
  const activeFiltersCount = [filters.search, filters.type].filter(
    Boolean
  ).length;

  // Get current sort option
  const currentSortOption = SORT_OPTIONS.find(
    (option) => option.value === filters.sort_by
  );
  const currentSortOrder = SORT_ORDERS.find(
    (order) => order.value === filters.sort_order
  );

  // Get current type option
  const currentTypeOption = MATERIAL_TYPES.find(
    (type) => type.value === filters.type
  );

  // Get current per page option
  const currentPerPageOption = PER_PAGE_OPTIONS.find(
    (option) => option.value === filters.per_page
  );

  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <div className="bg-base-100 dark:bg-base-200 p-4 rounded-xl border border-base-300 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          {/* Search */}
          <SearchInput
            value={searchValue}
            onChange={handleSearchChange}
            onClear={handleSearchClear}
            placeholder="Cari materi berdasarkan judul atau deskripsi..."
          />

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Type Filter */}
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 px-4 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg transition-colors border border-base-300">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {currentTypeOption?.label || "Tipe"}
                  </span>
                  {filters.type && (
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  )}
                  <ChevronDown className="w-4 h-4" />
                </button>
              }
              isOpen={isFilterOpen}
              onToggle={setIsFilterOpen}>
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-semibold text-base-content/60 uppercase tracking-wide">
                  Tipe Materi
                </div>
                {MATERIAL_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isActive = filters.type === type.value;

                  return (
                    <button
                      key={type.value}
                      onClick={() => handleTypeChange(type.value)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary text-primary-content"
                          : "hover:bg-base-200 text-base-content"
                      }`}>
                      {Icon && <Icon className="w-4 h-4" />}
                      <span className="text-sm">{type.label}</span>
                      {isActive && <CheckCircle className="w-4 h-4 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </Dropdown>

            {/* Sort */}
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 px-4 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg transition-colors border border-base-300">
                  {currentSortOrder?.icon && (
                    <currentSortOrder.icon className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {currentSortOption?.label || "Urutkan"}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              }
              isOpen={isSortOpen}
              onToggle={setIsSortOpen}>
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-semibold text-base-content/60 uppercase tracking-wide">
                  Urutkan Berdasarkan
                </div>
                {SORT_OPTIONS.map((sortOption) => (
                  <div key={sortOption.value} className="space-y-1">
                    {SORT_ORDERS.map((orderOption) => {
                      const SortIcon = sortOption.icon;
                      const OrderIcon = orderOption.icon;
                      const isActive =
                        filters.sort_by === sortOption.value &&
                        filters.sort_order === orderOption.value;

                      return (
                        <button
                          key={`${sortOption.value}-${orderOption.value}`}
                          onClick={() =>
                            handleSortChange(
                              sortOption.value,
                              orderOption.value
                            )
                          }
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                            isActive
                              ? "bg-primary text-primary-content"
                              : "hover:bg-base-200 text-base-content"
                          }`}>
                          {SortIcon && <SortIcon className="w-4 h-4" />}
                          <span className="text-sm flex-1">
                            {sortOption.label}
                          </span>
                          {OrderIcon && <OrderIcon className="w-4 h-4" />}
                          {isActive && <CheckCircle className="w-4 h-4" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </Dropdown>

            {/* Per Page */}
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 px-4 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg transition-colors border border-base-300">
                  <span className="text-sm font-medium">
                    {currentPerPageOption?.label ||
                      `${filters.per_page} per halaman`}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              }
              isOpen={isPerPageOpen}
              onToggle={setIsPerPageOpen}>
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-semibold text-base-content/60 uppercase tracking-wide">
                  Tampilkan Per Halaman
                </div>
                {PER_PAGE_OPTIONS.map((option) => {
                  const isActive = filters.per_page === option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() => handlePerPageChange(option.value)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary text-primary-content"
                          : "hover:bg-base-200 text-base-content"
                      }`}>
                      <span className="text-sm">{option.label}</span>
                      {isActive && <CheckCircle className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </Dropdown>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg transition-colors border border-base-300"
              aria-label="Refresh data">
              <RefreshCw
                className={`w-4 h-4 ${
                  status === "loading" ? "animate-spin" : ""
                }`}
              />
              <span className="text-sm font-medium">Refresh</span>
            </button>

            {/* Status Indicator */}
            <StatusIndicator status={status} isCached={isCached} />
          </div>
        </div>
      </div>

      {/* Active Filters & Clear All */}
      {activeFiltersCount > 0 && (
        <div className="bg-base-50 p-4 rounded-xl border border-base-200">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="text-sm font-medium text-base-content/70">
              Filter Aktif ({activeFiltersCount}):
            </span>

            {/* Search Filter Badge */}
            {filters.search && (
              <FilterBadge
                label="Pencarian"
                value={filters.search}
                onRemove={() => {
                  setSearchValue("");
                  fetchMaterialsData({ search: "" });
                }}
                icon={Search}
              />
            )}

            {/* Type Filter Badge */}
            {filters.type && (
              <FilterBadge
                label="Tipe"
                value={currentTypeOption?.label}
                onRemove={() => handleTypeChange("")}
                icon={currentTypeOption?.icon}
              />
            )}
          </div>

          {/* Clear All Button */}
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-base-200 hover:bg-base-300 text-base-content rounded-lg transition-colors">
            <X className="w-3 h-3" />
            <span>Hapus Semua Filter</span>
          </button>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-base-content/60">
        <div>
          {status === "loading" ? (
            <span>Memuat materi...</span>
          ) : (
            <span>
              {/* Results summary will be handled by pagination info in main component */}
            </span>
          )}
        </div>

        {isCached && (
          <div className="flex items-center gap-1 text-success">
            <CheckCircle className="w-3 h-3" />
            <span className="text-xs">Data dari cache</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialFilters;
