import React, { memo, useEffect, useState } from "react";

const BannerList = ({
  banners,
  sortConfig,
  requestSort,
  handlePreviewData,
  handleDeleteData,
  formatDate,
  handleDelete,
  selectedDatas,
  setSelectedDatas,
  status,
}) => {
  const [isSelect, setIsSelect] = useState(false);

  const handleCheckboxChange = (dataId) => {
    setSelectedDatas((prevSelected) =>
      prevSelected.includes(dataId)
        ? prevSelected.filter((id) => id !== dataId)
        : [...prevSelected, dataId]
    );
    setIsSelect(true);
  };

  const handleSelectAllChange = (blog) => {
    setSelectedDatas(
      blog.target.checked ? banners.map((data) => data.id) : []
    );
    setIsSelect(true);
  };

  const toggleSelectAll = () => {
    if (selectedDatas.length === banners.length) {
      setSelectedDatas([]);
    } else {
      setSelectedDatas(banners.map((data) => data.id));
    }
    setIsSelect(true);
  };

  useEffect(() => {
    const handleKeyDown = (blog) => {
      if (blog.key === "Escape") {
        setIsSelect(false);
        setSelectedDatas([]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [setSelectedDatas]);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return (
        <svg
          className="w-4 h-4 text-base-content/60"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }

    return sortConfig.direction === "desc" ? (
      <svg
        className="w-4 h-4 text-primary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 text-primary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    );
  };

  return (
    <div className="rounded-3xl overflow-hidden bg-base-100 dark:bg-base-200 shadow-xl border border-base-300/30">
      <div className="sticky top-0 z-20 bg-base-100 dark:bg-base-200 border-b-2 border-base-300/30 backdrop-blur-xl">
        <div
          className={`transition-all duration-300 ${
            isSelect ? "bg-primary/10" : ""
          }`}>
          {!isSelect ? (
            <div className="hidden md:grid grid-cols-4 gap-4 p-5 text-sm font-bold text-base-content/60">
              <button
                onClick={() => requestSort("key")}
                className="flex items-center gap-2 hover:text-primary transition-colors duration-200">
                <span>Title</span>
                {getSortIcon("key")}
              </button>
              <button
                onClick={() => requestSort("status")}
                className="flex items-center gap-2 hover:text-primary transition-colors duration-200">
                <span>Status</span>
                {getSortIcon("status")}
              </button>
              <button
                onClick={() => requestSort("created_at")}
                className="flex items-center gap-2 hover:text-primary transition-colors duration-200">
                <span>Date</span>
                {getSortIcon("created_at")}
              </button>
              <div className="flex justify-end">
                <label className="cursor-pointer">
                  <input
                    id="select-all"
                    type="checkbox"
                    className="w-5 h-5 checkbox-info rounded-lg border-2 border-base-300/30 checked:bg-primary transition-all duration-200"
                    onChange={handleSelectAllChange}
                    checked={
                      selectedDatas.length === banners.length &&
                      banners.length > 0
                    }
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between p-5 gap-4">
              <button
                onClick={() => {
                  setIsSelect(false);
                  setSelectedDatas([]);
                }}
                className="px-5 py-2.5 bg-base-200 hover:bg-base-300 text-base-content font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 active:scale-95">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Cancel
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 justify-center">
                <div className="px-4 py-2 bg-primary/20 rounded-xl border border-primary/30">
                  <span className="text-sm font-bold text-primary">
                    {selectedDatas.length} of {banners.length} selected
                  </span>
                </div>

                <button
                  onClick={handleDelete}
                  className="px-6 py-2.5 bg-error hover:bg-error/90 text-error-content font-bold rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg shadow-error/30 active:scale-95">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete Selected
                </button>
              </div>

              <button
                onClick={toggleSelectAll}
                className="px-5 py-2.5 bg-base-200 hover:bg-base-300 text-base-content font-semibold rounded-xl transition-all duration-300 active:scale-95">
                {selectedDatas.length === banners.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {banners.length === 0 && status === "succeeded" ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary rounded-full blur-3xl opacity-20"></div>
              <div className="relative w-24 h-24 bg-base-200 rounded-3xl flex items-center justify-center shadow-2xl">
                <svg
                  className="w-12 h-12 text-base-content/60"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-base-content mb-2">
              No banners found
            </h3>
            <p className="text-base-content/60 max-w-sm">
              Upload your first banner to get started and make your content
              shine
            </p>
          </div>
        ) : (
          banners.map((data) => {
            if (!data) return null;
            const linkedBlogTitle = data.blog ? data.blog.name : null;
            return (
              <BannerGridItem
                key={data.id}
                data={data}
                isSelect={isSelect}
                selectedDatas={selectedDatas}
                handleCheckboxChange={handleCheckboxChange}
                handleDeleteData={handleDeleteData}
                handlePreviewData={handlePreviewData}
                formatDate={formatDate}
                linkedBlogTitle={linkedBlogTitle}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

const BannerGridItem = ({
  data,
  isSelect,
  selectedDatas,
  handleCheckboxChange,
  handleDeleteData,
  handlePreviewData,
  linkedBlogTitle,
  formatDate,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isSelected = selectedDatas.includes(data.id);

  return (
    <div
      className="group relative aspect-video rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-base-300/30 hover:border-primary/50 hover:scale-[1.02] cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (isSelect) {
          handleCheckboxChange(data.id);
        } else {
          handlePreviewData(data);
        }
      }}>
      {data.image_data ? (
        <img
          src={data.image_data}
          alt={data.key}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-base-200">
          <svg
            className="w-16 h-16 text-base-content/60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Linked blog badge if any, always visible */}
      {linkedBlogTitle && (
        <div className="absolute top-1 left-1 flex items-center gap-1 px-2 py-1 bg-warning/90 rounded-xl">
          <svg
            className="w-3 h-3 text-white flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span className="text-xs font-medium text-white truncate max-w-xs">
            {linkedBlogTitle ? "Linked to Blog" : ""}
          </span>
        </div>
      )}

      {/* Bottom info on hover */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <h3 className="font-bold text-base mb-1 line-clamp-1">
          {linkedBlogTitle || "-"}
        </h3>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{formatDate(data.created_at)}</span>
        </div>
      </div>

      {/* Dark overlay only in select mode */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isSelect ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Checkbox when hovered or in select mode */}
      {(isSelect || isHovered) && (
        <div className="absolute top-4 left-4 z-10">
          <label className="cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 checkbox-info rounded-lg border-2 border-base-100 checked:bg-primary transition-all duration-200"
              checked={isSelected}
              onChange={() => handleCheckboxChange(data.id)}
            />
          </label>
        </div>
      )}

      {/* Actions when hovered or in select mode */}
      {(isHovered || isSelect) && (
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePreviewData(data);
            }}
            className="p-2.5 bg-base-100/90 hover:bg-base-100 backdrop-blur-sm rounded-xl shadow-xl transition-all duration-300 hover:scale-110 active:scale-95">
            <svg
              className="w-5 h-5 text-base-content"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteData(data.id);
            }}
            className="p-2.5 bg-error hover:bg-error/90 text-error-content rounded-xl shadow-xl shadow-error/50 transition-all duration-300 hover:scale-110 active:scale-95">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
export default memo(BannerList);
