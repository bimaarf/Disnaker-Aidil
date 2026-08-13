import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ImagesBg from "../components/Images/slide-1.jpg";
import { CircularLoader } from "../../Components/_CircularLoader";
import { fetchProgram } from "../../features/enggang/programSlice";

const ProgramPreviewHome = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState(location.state?.program || null);
  const [loading, setLoading] = useState(!data);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      if (!key) return;

      try {
        const programData = await dispatch(fetchProgram(key)).unwrap();
        setData(programData);
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    if (!data) {
      fetchData();
    }
  }, [key, dispatch, data]);

  return (
    <>
      {loading && <CircularLoader />}
      <div className="min-h-screen bg-gray-100 text-gray-900">
        {/* Hero Section */}
        <div
          className="relative h-96 bg-cover bg-center"
          style={{ backgroundImage: `url(${ImagesBg})` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-3xl font-bold text-white drop-shadow-md">
              {data?.title || "Loading..."}
            </h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative -mt-32 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6">
              {/* Breadcrumbs */}
              <nav className="text-sm text-indigo-600 mb-4">
                <ul className="flex space-x-2">
                  <li>
                    <button
                      onClick={() => navigate("/")}
                      className="hover:underline">
                      Home
                    </button>
                  </li>
                  <li>/</li>
                  <li>
                    <button className="hover:underline">Documents</button>
                  </li>
                  <li>/</li>
                  <li className="text-gray-500">{data?.title || "Program"}</li>
                </ul>
              </nav>

              {/* Content Layout */}
              <div className="md:flex gap-6">
                {/* Image Section */}
                <div className="md:w-1/3">
                  {data?.image ? (
                    <img
                      src={`${process.env.REACT_APP_API}${data?.image}`}
                      alt={data?.title || "Program Image"}
                      className="w-full h-64 md:h-80 object-cover rounded-lg shadow-md transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-64 md:h-80 flex items-center justify-center bg-gray-200 rounded-lg">
                      <div className="text-center">
                        <span className="material-symbols-outlined text-5xl text-gray-400">
                          add_photo_alternate
                        </span>
                        <p className="mt-2 text-gray-500">No image available</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description Section */}
                <div className="md:w-2/3">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    {data?.title || "Loading..."}
                  </h1>
                  <div
                    className="prose prose-lg text-gray-700 mb-6"
                    dangerouslySetInnerHTML={{
                      __html:
                        data?.description || "<p>Loading description...</p>",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProgramPreviewHome;
