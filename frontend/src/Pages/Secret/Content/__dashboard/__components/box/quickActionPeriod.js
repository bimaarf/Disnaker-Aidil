import React, { useEffect } from "react";
import { ArrowRight, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPeriods,
  periodCache,
} from "../../../../../../features/ppdb/periodSlice";

const QuickActionPeriod = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { total, totalVisible, totalHidden } = useSelector(
    (state) => state.periods
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = {
          page: 1,
          perPage: 10,
          searchQuery: "",
          fromDate: "",
          toDate: "",
          periodId: null,
        };
        const cacheKey = JSON.stringify(params);
        const cached = periodCache.get(cacheKey);

        if (!cached) {
          const result = await dispatch(fetchPeriods(params)).unwrap();
          periodCache.set(cacheKey, result);
        }
      } catch (error) {
        process.env.NODE_ENV === "development" && console.log(error);
      }
    };

    fetchData();
  }, [dispatch]);

  const stats = [
    {
      label: "Total",
      value: Number(total) || 0,
      icon: "📊",
      color: "bg-primary/10",
      textColor: "text-primary",
      bgColor: "bg-primary/10 border-primary/10",
    },
    {
      label: "Dibuka",
      value: Number(totalVisible) || 0,
      icon: "🟢",
      color: "bg-success/10",
      textColor: "text-success",
      bgColor: "bg-success/10 border-success/10",
    },
    {
      label: "Ditutup",
      value: Number(totalHidden) || 0,
      icon: "🔴",
      color: "bg-error/10",
      textColor: "text-error",
      bgColor: "bg-error/10 border-error/10",
    },
  ];

  return (
    <>
      <div className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-base-200 dark:to-base-300 rounded-2xl shadow-sm backdrop-blur-sm transition-colors duration-200 border border-gray-200/50 dark:border-base-300/50">
        <div className="relative p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Header Section */}
          <div className="flex gap-4 sm:gap-6 items-start">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-sm backdrop-blur-sm flex items-center justify-center">
                <div className="text-white text-xl sm:text-2xl font-bold">
                  📝
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-400 rounded-full border-2 border-white dark:border-base-200 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
            <div className="flex-1 space-y-2 sm:space-y-3">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-base-content mb-1">
                  {Number(totalVisible)} Pendaftaran Tersedia
                </h3>
                <div className="flex items-center gap-2">
                  <div className="px-2 gap-1 flex items-center sm:px-3 py-1 bg-primary/10 text-primary text-xs sm:text-sm font-medium rounded-full border border-primary/10">
                    <Database className="size-4" />
                    <span>Portal Pendaftaran Volunteer</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className={`${stat.bgColor} rounded-xl p-2 sm:p-3 border transition-colors duration-150`}>
                    <div className="text-center space-y-1">
                      <div className="text-base sm:text-lg">{stat.icon}</div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {stat.label}
                      </p>
                      <p
                        className={`text-base sm:text-lg font-bold ${stat.textColor}`}>
                        {stat.value.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate("/form/period")}
            aria-label="Open modal to add new label to question form"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl py-3 sm:py-4 px-6 transition-colors duration-200 shadow-sm backdrop-blur-sm hover:shadow-xl">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <ArrowRight className="w-6 h-6 p-1 animate-bounceArrow bg-white/20 text-lg sm:text-xl rounded-lg flex items-center justify-center" />
              <span className="font-semibold text-sm sm:text-lg">
                Daftar Sekarang
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Render modal via portal only when open */}
    </>
  );
};

export default QuickActionPeriod;
