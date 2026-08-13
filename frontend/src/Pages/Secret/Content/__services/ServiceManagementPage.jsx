import * as LucideIcons from "lucide-react";
import {
  ChevronDown,
  Edit,
  HelpCircle,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import useIsMobile from "../../../../Context/__useIsMobile";
import {
  clearServiceCache,
  deleteService,
  fetchServices,
} from "../../../../features/newNaker/serviceSlice";
import CreateService from "./CreateService";
import EditService from "./EditService";

const DynamicLucideIcon = ({
  iconName,
  size = 20,
  className = "text-base-content",
  color,
}) => {
  const IconComponent = LucideIcons[iconName];
  return IconComponent ? (
    <IconComponent
      size={size}
      className={className}
      style={color ? { color } : {}}
    />
  ) : (
    <HelpCircle
      size={size}
      className={className}
      style={color ? { color } : {}}
    />
  );
};

const ServiceListItem = ({
  service,
  handleDelete,
  handleEdit,
  toggleExpand,
  expandedServices,
  formatDate,
  selectedServices,
  handleCheckboxChange,
  isSelect,
  activeSwipeId,
  setActiveSwipeId,
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const [isVerticalScroll, setIsVerticalScroll] = useState(false);
  const isMobile = window.innerWidth < 768;
  const expanded = expandedServices.has(service.id);
  const hasValidColor =
    service.color &&
    typeof service.color === "string" &&
    service.color.startsWith("#");

  const handleTouchStart = (e) => {
    if (!isMobile) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
    setIsVerticalScroll(false);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !isMobile) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = Math.abs(startX.current - currentX);
    const diffY = Math.abs(startY.current - currentY);

    if (!isVerticalScroll && diffY > diffX) {
      setIsVerticalScroll(true);
      return;
    }
    if (isVerticalScroll) return;

    e.preventDefault();
    const swipeDiff = startX.current - currentX;

    // Allow swiping left (negative) to close and right (positive) to open
    if (swipeDiff >= -100 && swipeDiff <= 100) {
      setSwipeOffset(Math.max(0, swipeDiff));
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile || isVerticalScroll) {
      setIsDragging(false);
      return;
    }
    setIsDragging(false);

    // Swipe right to close (negative offset from open position)
    if (activeSwipeId === service.id && swipeOffset < 40) {
      setActiveSwipeId(null);
      setSwipeOffset(0);
    }
    // Swipe left to open
    else if (swipeOffset > 40) {
      setActiveSwipeId(service.id);
      setSwipeOffset(100);
    }
    // Default close
    else {
      setActiveSwipeId(null);
      setSwipeOffset(0);
    }
  };

  useEffect(() => {
    if (activeSwipeId !== service.id) {
      setSwipeOffset(0);
    } else if (activeSwipeId === service.id) {
      setSwipeOffset(100);
    }
  }, [activeSwipeId, service.id]);

  const linkText = service.link?.includes("bit.ly")
    ? "Visit Link"
    : "Open Link";

  return (
    <div className="relative overflow-hidden rounded-lg border border-base-300/30 bg-base-100 dark:bg-base-200 shadow-sm hover:shadow-md transition-shadow">
      {isMobile && (
        <div
          className={`absolute right-0 top-0 h-full w-24 bg-error flex items-center justify-center text-error-content font-medium transition-all duration-200 ease-out ${
            activeSwipeId === service.id
              ? "opacity-100 z-10"
              : "opacity-0 -z-10"
          }`}
          onClick={() => {
            handleDelete(service.id);
            setActiveSwipeId(null);
          }}>
          <Trash2 size={20} />
        </div>
      )}

      <div
        className={`bg-base-100 dark:bg-base-200 transition-transform ease-out touch-pan-y ${
          isDragging ? "duration-0" : "duration-200"
        } ${
          activeSwipeId === service.id && isMobile
            ? "transform -translate-x-24"
            : ""
        }`}
        style={
          isMobile && isDragging && !isVerticalScroll
            ? { transform: `translateX(-${swipeOffset}px)` }
            : {}
        }
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}>
        <div className="flex items-start justify-between p-4 gap-3">
          <div
            onClick={() => {
              if (!isSelect) {
                handleEdit(service);
              } else {
                document.getElementById(`select-${service.id}`).click();
              }
            }}
            className="flex w-full items-start gap-3 cursor-pointer min-w-0">
            {service.icon && (
              <div
                className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-md flex items-center justify-center"
                style={
                  hasValidColor
                    ? {
                        background: `linear-gradient(135deg, ${service.color}, ${service.color}dd)`,
                      }
                    : {}
                }>
                <DynamicLucideIcon
                  iconName={service.icon}
                  size={20}
                  className="text-white"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base leading-tight mb-1">
                {service.title}
              </h4>
              {service.description && (
                <p className="text-sm text-base-content/70 mb-2 line-clamp-2">
                  {service.description}
                </p>
              )}
              {service.sub_items && service.sub_items.length > 0 && (
                <div
                  className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-base-200 dark:bg-base-300 text-base-content rounded-md text-xs font-medium cursor-pointer hover:bg-base-300 dark:hover:bg-base-200 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(service.id);
                  }}>
                  <DynamicLucideIcon
                    iconName={expanded ? "ChevronUp" : "ChevronDown"}
                    size={14}
                    className="text-base-content/60"
                  />
                  <span>{service.sub_items.length} Sub Items</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-xs text-base-content/60 mt-2.5">
                {service.link && (
                  <a
                    href={service.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary hover:link-primary font-medium">
                    {linkText}
                  </a>
                )}
                <span>{formatDate(service.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <label id={`select-${service.id}`}>
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={selectedServices.includes(service.id)}
                onChange={() => handleCheckboxChange(service.id)}
              />
            </label>

            {!isMobile && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(service);
                  }}
                  className="btn btn-ghost btn-sm btn-square"
                  title="Edit">
                  <Edit size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(service.id);
                  }}
                  className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10"
                  title="Delete">
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {service.sub_items && service.sub_items.length > 0 && expanded && (
          <div className="border-t border-base-300/30 bg-base-200 dark:bg-base-300 overflow-hidden">
            <div className="p-4 animate-in slide-in-from-top-4 fade-in duration-300">
              <h4 className="font-semibold text-sm text-base-content mb-3 flex items-center gap-2">
                <ChevronDown size={16} className="text-base-content/60" />
                Sub Items ({service.sub_items.length})
              </h4>
              <div className="space-y-2">
                {service.sub_items.map((subItem, index) => {
                  const subLinkText = subItem.link?.includes("bit.ly")
                    ? "Visit Link"
                    : "Open Link";
                  return (
                    <div
                      key={subItem.id || index}
                      className="bg-base-100 dark:bg-base-200 border border-base-300/30 rounded-lg p-3 hover:border-primary/30 transition-all duration-200 animate-in fade-in slide-in-from-left-2"
                      style={{ animationDelay: `${index * 50}ms` }}>
                      <div className="flex items-start gap-3">
                        {subItem.icon && (
                          <div
                            className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center"
                            style={
                              hasValidColor
                                ? {
                                    background: `linear-gradient(135deg, ${service.color}, ${service.color}dd)`,
                                  }
                                : {}
                            }>
                            <DynamicLucideIcon
                              iconName={subItem.icon}
                              size={16}
                              className="text-white"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm text-base-content mb-0.5">
                            {subItem.title}
                          </h5>
                          {subItem.description && (
                            <p className="text-xs text-base-content/70 mb-1.5 line-clamp-2">
                              {subItem.description}
                            </p>
                          )}
                          {subItem.link && (
                            <a
                              href={subItem.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link link-primary text-xs font-medium inline-flex items-center gap-1 hover:gap-1.5 transition-all">
                              {subLinkText}
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ServiceList = ({
  services,
  status,
  handleDelete,
  handleEdit,
  toggleExpand,
  expandedServices,
  formatDate,
  sortConfig,
  requestSort,
  selectedServices,
  setSelectedServices,
  handleBulkDelete,
}) => {
  const [isSelect, setIsSelect] = useState(false);
  const [activeSwipeId, setActiveSwipeId] = useState(null);

  const handleCheckboxChange = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
    setIsSelect(true);
  };

  const handleSelectAll = (event) => {
    setSelectedServices(event.target.checked ? services.map((s) => s.id) : []);
    setIsSelect(event.target.checked);
  };

  const handleCancelSelection = () => {
    setIsSelect(false);
    setSelectedServices([]);
    setActiveSwipeId(null);
  };

  useEffect(() => {
    if (selectedServices.length === 0) setIsSelect(false);
  }, [selectedServices.length]);

  const getSortIcon = (field) => {
    if (sortConfig.key === field) {
      return sortConfig.direction === "desc" ? "↓" : "↑";
    }
    return "↕";
  };

  const sortedServices = useMemo(() => {
    return [...services].sort((a, b) => {
      let aVal = a[sortConfig.key] || "";
      let bVal = b[sortConfig.key] || "";
      if (sortConfig.key === "sub_items") {
        aVal = a.sub_items?.length || 0;
        bVal = b.sub_items?.length || 0;
      }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [services, sortConfig]);

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 pb-3">
        <div
          className={`${
            isSelect
              ? "bg-primary/10 border-primary/30"
              : "bg-base-200/80 dark:bg-base-300/80 border-base-300/30"
          } flex border rounded-lg p-3 justify-between items-center transition-all duration-300 backdrop-blur-sm shadow-sm`}>
          {!isSelect ? (
            <>
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => requestSort("title")}
                  className="btn btn-ghost btn-sm gap-1.5 flex-shrink-0">
                  <span className="text-xs font-medium">Title</span>
                  <span className="text-xs opacity-60">
                    {getSortIcon("title")}
                  </span>
                </button>
                <button
                  onClick={() => requestSort("sub_items")}
                  className="btn btn-ghost btn-sm gap-1.5 flex-shrink-0">
                  <span className="text-xs font-medium">Sub Items</span>
                  <span className="text-xs opacity-60">
                    {getSortIcon("sub_items")}
                  </span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  onChange={handleSelectAll}
                  checked={
                    selectedServices.length === sortedServices.length &&
                    sortedServices.length > 0
                  }
                />
              </div>
            </>
          ) : (
            <div className="flex justify-between items-center w-full">
              <button
                onClick={handleCancelSelection}
                className="btn btn-ghost btn-sm gap-1.5">
                <X size={16} />
                Cancel
              </button>
              <div className="bg-primary/20 px-3 py-1.5 rounded-full">
                <span className="text-sm font-semibold text-primary">
                  {selectedServices.length} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSelectAll({ target: { checked: true } })}
                  className="btn btn-ghost btn-sm">
                  Select All
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="btn btn-error btn-sm gap-1.5">
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {sortedServices.length === 0 && status !== "loading" ? (
          <div className="text-center py-20 bg-base-100 dark:bg-base-200 rounded-lg border border-base-300/30">
            <div className="w-16 h-16 mx-auto mb-4 bg-base-200 dark:bg-base-300 rounded-full flex items-center justify-center">
              <Plus size={32} className="text-base-content/40" />
            </div>
            <h3 className="text-xl font-semibold text-base-content mb-2">
              No services yet
            </h3>
            <p className="text-base-content/60 mb-6 max-w-sm mx-auto">
              Get started by creating your first service
            </p>
            <button className="btn btn-primary gap-2">
              <Plus size={20} />
              Create First Service
            </button>
          </div>
        ) : (
          sortedServices.map((service) => (
            <ServiceListItem
              key={service.id}
              service={service}
              handleDelete={handleDelete}
              handleEdit={handleEdit}
              toggleExpand={toggleExpand}
              expandedServices={expandedServices}
              formatDate={formatDate}
              selectedServices={selectedServices}
              handleCheckboxChange={handleCheckboxChange}
              isSelect={isSelect}
              activeSwipeId={activeSwipeId}
              setActiveSwipeId={setActiveSwipeId}
            />
          ))
        )}
      </div>
    </div>
  );
};

const ServicesTable = ({
  services,
  handleDelete,
  handleEdit,
  toggleExpand,
  expandedServices,
  formatDate,
  selectedServices,
  setSelectedServices,
  sortConfig,
  requestSort,
}) => {
  const handleCheckboxChange = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSelectAll = (event) => {
    setSelectedServices(event.target.checked ? services.map((s) => s.id) : []);
  };

  const getSortIcon = (field) => {
    if (sortConfig.key === field) {
      return sortConfig.direction === "desc" ? " ↓" : " ↑";
    }
    return " ↕";
  };

  const sortedServices = useMemo(() => {
    return [...services].sort((a, b) => {
      let aVal = a[sortConfig.key] || "";
      let bVal = b[sortConfig.key] || "";
      if (sortConfig.key === "sub_items") {
        aVal = a.sub_items?.length || 0;
        bVal = b.sub_items?.length || 0;
      }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [services, sortConfig]);

  return (
    <div className="overflow-x-auto rounded-lg border border-base-300/30 bg-base-100 dark:bg-base-100 shadow-sm">
      <table className="table table-zebra w-full">
        <thead className="bg-base-200 dark:bg-base-300">
          <tr>
            <th className="bg-base-200 dark:bg-base-300 sticky left-0 z-10">
              <div className="flex items-center gap-3">
                <label>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    onChange={handleSelectAll}
                    checked={
                      selectedServices.length === sortedServices.length &&
                      sortedServices.length > 0
                    }
                  />
                </label>
                <button
                  onClick={() => requestSort("title")}
                  className="btn btn-ghost btn-sm gap-1">
                  <span className="font-semibold">Title</span>
                  <span className="text-xs">{getSortIcon("title")}</span>
                </button>
              </div>
            </th>
            <th>
              <button
                onClick={() => requestSort("description")}
                className="btn btn-ghost btn-sm gap-1">
                <span className="font-semibold">Description</span>
                <span className="text-xs">{getSortIcon("description")}</span>
              </button>
            </th>
            <th>
              <button
                onClick={() => requestSort("sub_items")}
                className="btn btn-ghost btn-sm gap-1">
                <span className="font-semibold">Sub Items</span>
                <span className="text-xs">{getSortIcon("sub_items")}</span>
              </button>
            </th>
            <th>
              <button
                onClick={() => requestSort("created_at")}
                className="btn btn-ghost btn-sm gap-1">
                <span className="font-semibold">Date</span>
                <span className="text-xs">{getSortIcon("created_at")}</span>
              </button>
            </th>
            <th className="font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedServices.map((service) => {
            const hasValidColor =
              service.color &&
              typeof service.color === "string" &&
              service.color.startsWith("#");
            return (
              <React.Fragment key={service.id}>
                <tr className="hover:bg-base-200 dark:hover:bg-base-300 transition-colors">
                  <td>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={selectedServices.includes(service.id)}
                        onChange={() => handleCheckboxChange(service.id)}
                      />
                      {service.icon && (
                        <div
                          className="w-8 h-8 rounded-md flex items-center justify-center"
                          style={
                            hasValidColor
                              ? {
                                  background: `linear-gradient(135deg, ${service.color}, ${service.color}dd)`,
                                }
                              : {}
                          }>
                          <DynamicLucideIcon
                            iconName={service.icon}
                            size={18}
                            className="text-white"
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-sm">
                          {service.title}
                        </div>
                        {service.link && (
                          <a
                            href={service.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link link-primary text-xs">
                            View Link
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="max-w-xs">
                    <p className="text-sm line-clamp-2">
                      {service.description}
                    </p>
                  </td>
                  <td>
                    {service.sub_items && service.sub_items.length > 0 ? (
                      <button
                        onClick={() => toggleExpand(service.id)}
                        className="badge badge-ghost cursor-pointer hover:bg-primary/10 transition-colors flex items-center gap-1"
                        title="Toggle Sub Items">
                        <DynamicLucideIcon
                          iconName={
                            expandedServices.has(service.id)
                              ? "ChevronUp"
                              : "ChevronDown"
                          }
                          size={12}
                          className="text-base-content/60"
                        />
                        {service.sub_items.length}
                      </button>
                    ) : (
                      <span className="badge badge-ghost">0</span>
                    )}
                  </td>
                  <td className="text-sm">{formatDate(service.created_at)}</td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(service)}
                        className="btn btn-ghost btn-sm btn-square"
                        title="Edit">
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10"
                        title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
                {service.sub_items &&
                  service.sub_items.length > 0 &&
                  expandedServices.has(service.id) && (
                    <tr>
                      <td
                        colSpan={5}
                        className="bg-base-200 dark:bg-base-300 p-0 overflow-hidden">
                        <div className="p-4 animate-in slide-in-from-top-4 fade-in duration-300">
                          <div className="space-y-2 ml-8">
                            <h4 className="font-semibold text-sm text-base-content mb-3">
                              Sub Items ({service.sub_items.length})
                            </h4>
                            <div className="grid gap-2">
                              {service.sub_items.map((subItem, index) => (
                                <div
                                  key={subItem.id || index}
                                  className="flex items-start gap-3 p-3 bg-base-100 dark:bg-base-200 rounded-lg border border-base-300/30 animate-in fade-in slide-in-from-left-2"
                                  style={{ animationDelay: `${index * 50}ms` }}>
                                  {subItem.icon && (
                                    <div
                                      className="w-6 h-6 rounded flex items-center justify-center"
                                      style={
                                        hasValidColor
                                          ? {
                                              background: `linear-gradient(135deg, ${service.color}, ${service.color}dd)`,
                                            }
                                          : {}
                                      }>
                                      <DynamicLucideIcon
                                        iconName={subItem.icon}
                                        size={14}
                                        className="text-white"
                                      />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">
                                      {subItem.title}
                                    </div>
                                    {subItem.description && (
                                      <div className="text-xs text-base-content/70 mt-0.5">
                                        {subItem.description}
                                      </div>
                                    )}
                                    {subItem.link && (
                                      <a
                                        href={subItem.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link link-primary text-xs mt-1 inline-flex items-center gap-1 hover:gap-1.5 transition-all">
                                        Open Link
                                        <svg
                                          className="w-3 h-3"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24">
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                          />
                                        </svg>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const ServiceManagementPage = () => {
  const dispatch = useDispatch();
  const { services, status, error } = useSelector((state) => state.services);
  const isMobile = useIsMobile();

  const [showCreate, setShowCreate] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [expandedServices, setExpandedServices] = useState(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "title",
    direction: "asc",
  });

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchServices());
    }
  }, [status, dispatch]);

  const handleDelete = async (serviceId) => {
    const result = await dispatch(deleteService(serviceId));
    if (deleteService.fulfilled.match(result)) {
      setDeleteConfirm(null);
      dispatch(clearServiceCache());
    }
  };

  const handleBulkDelete = async () => {
    for (const id of selectedServices) {
      await handleDelete(id);
    }
    setSelectedServices([]);
  };

  const handleRefresh = () => {
    dispatch(clearServiceCache());
    dispatch(fetchServices());
  };

  const toggleExpand = (serviceId) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId);
    } else {
      newExpanded.add(serviceId);
    }
    setExpandedServices(newExpanded);
  };

  const requestSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (status === "loading" && services.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="text-base-content/60 mt-4">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto">
        <div className="bg-base-100 dark:bg-base-200 rounded-2xl shadow-sm p-4 sm:p-6 mb-6 border border-base-300/30">
          <div className="flex gap-2 items-start md:items-center justify-between">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <LucideIcons.Settings className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 items-center gap-2 md:gap-4">
              <div>
                <h1 className={`text-xl font-bold text-base-content`}>
                  Services Management
                </h1>
                <p className={`text-[12px] sm:text-sm text-base-content/60`}>
                  Manage your services and sub-items
                  <span className="ml-2 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[10px] sm:text-xs font-medium">
                    {services.length}{" "}
                    {services.length === 1 ? "Service" : "Services"}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-center justify-end sm:mt-0 mt-3">
            <button
              onClick={handleRefresh}
              disabled={status === "loading"}
              className="btn btn-ghost btn-sm gap-2 disabled:opacity-50">
              <RefreshCw
                size={16}
                className={status === "loading" ? "animate-spin" : ""}
              />
              Refresh
            </button>
            {selectedServices.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="btn btn-error btn-sm gap-2">
                <Trash2 size={16} />
                Delete ({selectedServices.length})
              </button>
            )}
            <button
              onClick={() => setShowCreate(true)}
              className="btn btn-primary btn-sm gap-2">
              <Plus size={18} />
              Create Service
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error mb-6 shadow-sm">
            <div className="flex items-start gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current flex-shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-bold">Error occurred</h3>
                <div className="text-sm">
                  {typeof error === "string" ? error : JSON.stringify(error)}
                </div>
              </div>
            </div>
          </div>
        )}

        {!isMobile ? (
          <ServicesTable
            services={services}
            status={status}
            handleDelete={(id) => setDeleteConfirm(id)}
            handleEdit={(service) => setEditingService(service)}
            toggleExpand={toggleExpand}
            expandedServices={expandedServices}
            formatDate={formatDate}
            selectedServices={selectedServices}
            setSelectedServices={setSelectedServices}
            sortConfig={sortConfig}
            requestSort={requestSort}
          />
        ) : (
          <ServiceList
            services={services}
            status={status}
            handleDelete={(id) => setDeleteConfirm(id)}
            handleEdit={(service) => setEditingService(service)}
            toggleExpand={toggleExpand}
            expandedServices={expandedServices}
            formatDate={formatDate}
            sortConfig={sortConfig}
            requestSort={requestSort}
            selectedServices={selectedServices}
            setSelectedServices={setSelectedServices}
            handleBulkDelete={handleBulkDelete}
          />
        )}

        {deleteConfirm && (
          <div className="modal modal-open">
            <div className="modal-box max-w-md">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trash2 className="text-error" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-base-content mb-1">
                    Confirm Delete
                  </h3>
                  <p className="text-sm text-base-content/70">
                    Are you sure you want to delete this service? This action
                    cannot be undone and will also delete all associated sub
                    items.
                  </p>
                </div>
              </div>
              <div className="modal-action">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn btn-ghost btn-sm">
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="btn btn-error btn-sm gap-2">
                  <Trash2 size={16} />
                  Delete Service
                </button>
              </div>
            </div>
            <div
              className="modal-backdrop bg-black/50"
              onClick={() => setDeleteConfirm(null)}></div>
          </div>
        )}

        {showCreate && (
          <CreateService
            onClose={() => setShowCreate(false)}
            onSuccess={handleRefresh}
          />
        )}

        {editingService && (
          <EditService
            service={editingService}
            onClose={() => setEditingService(null)}
            onSuccess={handleRefresh}
          />
        )}
      </div>
    </div>
  );
};

export default ServiceManagementPage;
