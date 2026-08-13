import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CircularLoader } from "../../../../../Components/_CircularLoader";

const CategoryProductPreviewPage = () => {
  const { key } = useParams(); // Accessing 'key' parameter from URL
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`api/product/category/${key}`);
        setData(response.data.data);
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    if (window.innerWidth >= 1024) {
      document.body.style.overflow = "hidden";
    }
    fetchData();
  }, [key]);
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
  };
  const handleEditData = (data) => {
    navigate(`/product/category/update/${data.key}`, {
      state: { key: data.key, dataProps: data },
    });
  };
  return (
    <div className="md:flex justify-center md:h-screen items-center">
      {loading && <CircularLoader />}
      <div
        className="fixed bottom-20 md:bottom-10 z-50 right-4 md:right-10 cursor-pointer"
        onClick={() => handleEditData(data)}>
        <div className="rounded-full hover:brightness-110 scale-150 active:scale-125 duration-300 bg-base-300 p-1.5 flex justify-center items-center">
          <span className="material-symbols-outlined">edit</span>
        </div>
      </div>
      {data && data?.image ? (
        <div className="md:w-2/3 mb-4 flex justify-center">
          <img
            src={`${process.env.REACT_APP_API}${data?.image}`}
            alt={data.name}
            className="w-full md:h-screen object-contain"
          />
        </div>
      ) : (
        <div className="md:w-2/3 mb-4 flex justify-center">
          <div className="bg-neutral text-neutral-content w-full h-96 place-content-center text-center rounded-full">
            <span className="material-symbols-outlined">
              add_photo_alternate
            </span>
            <p>Image does not exist</p>
          </div>
        </div>
      )}
      <div className="md:w-1/3 border-t md:border-t-transparent md:border-l p-2 border-base-300 md:h-screen overflow-y-auto space-y-2">
        <div className="flex justify-start items-start gap-2">
          <span className="select-none material-symbols-outlined">sell</span>
          <h1 className="font-bold">{data?.name}</h1>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-xs text-base-300">
            {formatDate(data?.created_at)}
          </div>
        </div>
      </div>
      {/* Add more details about the data as needed */}
    </div>
  );
};

export default CategoryProductPreviewPage;
