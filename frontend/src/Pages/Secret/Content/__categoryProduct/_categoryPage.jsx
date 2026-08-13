import { debounce } from "lodash";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CircularLoader } from "../../../../Components/_CircularLoader";
import { formatDate } from "../../../../Context/__formatDate";
import useIsMobile from "../../../../Context/__useIsMobile";
import { truncateText } from "../../../../Context/__useTruncate";
import {
  handleDelete,
  handleDeleteData,
  handleEditData,
} from "./__actions/__categoryAction"; // Import the actions
import { CategoryProductModal } from "./__app/_categoryPreviewModal";
import CategoryProductPreviewPage from "./__app/_categoryPreviewPage";
import { BadgeCategoryProducts } from "./__badgeCategory";
import CategoryProductList from "./__components/_categoryList";
import CategoryProductTable from "./__components/_categoryTable";
import { fetchCategoryProducts } from "../../../../features/product/categoryProductSlice";

export const CategoryProductPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const datas = useSelector((state) => state.categoryProducts.categoryProducts);
  const total = useSelector((state) => state.categoryProducts.total);
  const status = useSelector((state) => state.categoryProducts.status);
  const page = useSelector((state) => state.categoryProducts.page);
  const totalPages = useSelector((state) => state.categoryProducts.totalPages);
  const totalVisible = useSelector(
    (state) => state.categoryProducts.totalVisible
  );
  const totalHidden = useSelector(
    (state) => state.categoryProducts.totalHidden
  );

  const [selectedData, setSelectedData] = useState(null);
  const [currentPage, setCurrentPage] = useState(page || 1);
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [selectedDatas, setSelectedDatas] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFetchingRef = useRef(false);

  const isMobile = useIsMobile(); // Use the custom hook

  useEffect(() => {
    dispatch(fetchCategoryProducts({ page: currentPage, perPage: 10 }))
      .unwrap()
      .catch((error) => console.error("Failed to fetch datas:", error));
  }, [dispatch, currentPage]);

  const handleLoadMore = useCallback(() => {
    if (currentPage < totalPages && !isFetchingRef.current && !isLoadingMore) {
      setIsLoadingMore(true);
      setCurrentPage((prevPage) => prevPage + 1);
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
    if (status === "succeeded" && isLoadingMore) {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    } else if (status === "failed") {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [status, isLoadingMore]);

  const handlePreviewData = (data) => {
    setSelectedData(data);
    if (!isMobile) {
      const modal = document.getElementById(`modal-${data.id}`);
      if (modal) {
        modal.showModal();
      }
    } else {
      navigate(`/category/product/preview/${data.key}`);
    }
  };

  const sortedDatas = useMemo(() => {
    let sortableDatas = [...datas];
    if (sortConfig.key) {
      sortableDatas.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableDatas;
  }, [datas, sortConfig]);

  const requestSort = (key) => {
    setSortConfig((prevSortConfig) => ({
      key,
      direction:
        prevSortConfig.key === key && prevSortConfig.direction === "desc"
          ? "asc"
          : "desc",
    }));
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

  return (
    <div className="min-h-[90vh]">
      <div
        className="fixed bottom-20 md:bottom-10 z-50 right-4 md:right-10 cursor-pointer"
        onClick={() => navigate("/category/product/create")}>
        <div className="rounded-full hover:brightness-110 scale-150 active:scale-125 duration-300 bg-base-300 p-1.5 flex justify-center items-center">
          <span className="material-symbols-outlined">add</span>
        </div>
      </div>
      <BadgeCategoryProducts
        totalVisible={totalVisible}
        totalHidden={totalHidden}
        badgeData={total}
      />
      <>
        {!isMobile ? (
          <CategoryProductTable
            datas={uniqueDatas}
            status={status}
            sortConfig={sortConfig}
            requestSort={requestSort}
            handlePreviewData={handlePreviewData}
            formatDate={formatDate}
            truncateTitle={truncateTitle}
            selectedDatas={selectedDatas}
            setSelectedDatas={setSelectedDatas}
            handleEditData={(data) => handleEditData(navigate, data)}
            handleDeleteData={(dataId) => handleDeleteData(dispatch, dataId)} // Pass dispatch to action
            handleDelete={() =>
              handleDelete(dispatch, selectedDatas, setSelectedDatas)
            }
          />
        ) : (
          <CategoryProductList
            datas={uniqueDatas}
            status={status}
            sortConfig={sortConfig}
            requestSort={requestSort}
            handlePreviewData={handlePreviewData}
            formatDate={formatDate}
            truncateTitle={truncateTitle}
            selectedDatas={selectedDatas}
            setSelectedDatas={setSelectedDatas}
            handleEditData={(data) => handleEditData(navigate, data)}
            handleDeleteData={(dataId) => handleDeleteData(dispatch, dataId)}
            handleDelete={() =>
              handleDelete(dispatch, selectedDatas, setSelectedDatas)
            }
          />
        )}
        {isLoadingMore || (status === "loading" && <CircularLoader />)}
      </>
      {selectedData && (
        <>
          {!isMobile ? (
            <CategoryProductModal
              selectedData={selectedData}
              onClose={() => {
                setSelectedData(null);
                document.body.style.overflow = "auto";
              }}
            />
          ) : (
            <CategoryProductPreviewPage data={selectedData} />
          )}
        </>
      )}
    </div>
  );
};
