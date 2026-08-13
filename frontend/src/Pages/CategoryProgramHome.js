import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import { TreePine, Leaf, Users, Heart, Globe, Shield } from "lucide-react";
import { fetchCategoryEvents } from "../features/event/categoryEventSlice";

// ------------------ Color Variants ------------------
const ColorVariants = {
  blue: {
    accent: "border-blue-200 hover:border-blue-400",
    icon: "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600",
    hover: "hover:shadow-blue-100",
  },
  green: {
    accent: "border-green-200 hover:border-green-400",
    icon: "bg-gradient-to-br from-green-100 to-green-200 text-green-600",
    hover: "hover:shadow-green-100",
  },
  orange: {
    accent: "border-orange-200 hover:border-orange-400",
    icon: "bg-gradient-to-br from-orange-100 to-orange-200 text-orange-600",
    hover: "hover:shadow-orange-100",
  },
  purple: {
    accent: "border-purple-200 hover:border-purple-400",
    icon: "bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600",
    hover: "hover:shadow-purple-100",
  },
  pink: {
    accent: "border-pink-200 hover:border-pink-400",
    icon: "bg-gradient-to-br from-pink-100 to-pink-200 text-pink-600",
    hover: "hover:shadow-pink-100",
  },
  indigo: {
    accent: "border-indigo-200 hover:border-indigo-400",
    icon: "bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-600",
    hover: "hover:shadow-indigo-100",
  },
};
const colorKeys = Object.keys(ColorVariants);

// ------------------ Helper Icons ------------------
const DynamicLucideIcon = ({ iconName, className }) => {
  const IconComponent = LucideIcons[iconName];
  return IconComponent ? (
    <IconComponent className={className} />
  ) : (
    <TreePine className={className} />
  );
};

const getFallbackIcon = (index) => {
  const icons = [TreePine, Leaf, Users, Heart, Globe, Shield];
  return icons[index % icons.length];
};

// ------------------ Component ------------------
const CategoryProgramsHome = React.forwardRef(
  ({ isFeaturesVisibleProps }, ref) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // --- NEW: local state for mount animation ---
    const [mountedVisible, setMountedVisible] = useState(false);

    // Jalankan animasi sekali saat mount **jika props tidak diberikan**
    useEffect(() => {
      if (isFeaturesVisibleProps === undefined) {
        const t = setTimeout(() => setMountedVisible(true), 50); // sedikit delay agar transition jalan
        return () => clearTimeout(t);
      }
    }, [isFeaturesVisibleProps]);

    const truncateText = (text, limit) => {
      if (!text) return "";
      const words = text.split(" ");
      return words.length > limit
        ? words.slice(0, limit).join(" ") + "..."
        : text;
    };
    const stripHtml = (html) => {
      if (!html) return "";
      const temp = document.createElement("div");
      temp.innerHTML = html;
      return temp.textContent || temp.innerText || "";
    };

    // Redux state
    const categoryEvents = useSelector(
      (state) => state.categoryEvents.categoryEvents
    );
    const status = useSelector((state) => state.categoryEvents.status);
    const error = useSelector((state) => state.categoryEvents.error);

    useEffect(() => {
      if (status === "idle") {
        dispatch(fetchCategoryEvents({ page: 1, perPage: 6 }))
          .unwrap()
          .catch((err) =>
            console.error("Failed to fetch category events:", err)
          );
      }
    }, [dispatch, status]);

    const programs = useMemo(() => {
      return categoryEvents.slice(0, 6).map((category, index) => {
        const colorKey = colorKeys[index % colorKeys.length];
        const FallbackIcon = getFallbackIcon(index);
        return {
          id: category.id,
          title: category.name,
          description: category.description || "-",
          icon: category.icon || FallbackIcon.name,
          color: colorKey,
          key: category.key,
        };
      });
    }, [categoryEvents]);

    const handleProgramClick = (program) =>
      navigate(`/events/category/${program.key}?isTop=true`, {
        state: { category: program },
      });

    // ------------------ UI States ------------------
    if (status === "loading" && categoryEvents.length === 0) {
      return (
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Program Unggulan Kami
            </h2>
            <p className="text-sm sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Berbagai program yang kami jalankan untuk melestarikan alam
              Kalimantan dan meningkatkan kesejahteraan masyarakat
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="p-8 bg-white rounded-2xl border-2 border-gray-200 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-2xl mb-6"></div>
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/5"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (status === "failed") {
      return (
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto">
              <div className="text-red-600 text-lg font-bold mb-4">
                Gagal memuat program
              </div>
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          </div>
        </div>
      );
    }

    if (programs.length === 0) {
      return (
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Program Unggulan Kami
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Program akan segera hadir. Pantau terus website kami!
            </p>
          </div>
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <TreePine className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Belum ada program tersedia
            </h3>
          </div>
        </div>
      );
    }

    // ------------------ Render Programs ------------------
    const isVisible =
      isFeaturesVisibleProps !== undefined
        ? isFeaturesVisibleProps
        : mountedVisible;

    return (
      <div ref={ref} className="container mx-auto px-4 py-6 sm:py-16">
        <div
          className={`transition-all duration-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Program Unggulan Kami
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Berbagai program yang kami jalankan untuk melestarikan alam
              Kalimantan dan meningkatkan kesejahteraan masyarakat
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programs.map((program, index) => {
              const colorClass = ColorVariants[program.color];
              return (
                <div
                  key={program.id}
                  onClick={() => handleProgramClick(program)}
                  className={`p-8 bg-white rounded-2xl border-2 ${
                    colorClass.accent
                  } ${
                    colorClass.hover
                  } hover:shadow-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-2 group ${
                    isVisible
                      ? "translate-y-0 opacity-100"
                      : "translate-y-8 opacity-0"
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}>
                  <div
                    className={`flex justify-center w-fit mx-auto p-4 ${colorClass.icon} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {typeof program.icon === "string" ? (
                      <DynamicLucideIcon
                        iconName={program.icon}
                        className="w-8 h-8"
                      />
                    ) : (
                      <program.icon className="w-8 h-8" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-center text-gray-900 mb-4 group-hover:text-gray-700 transition-colors duration-300">
                    {program.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors text-center duration-300">
                    {truncateText(stripHtml(program.description), 6)}
                  </p>
                  <div className="mt-6 flex items-center text-gray-400 group-hover:text-gray-600 transition-colors duration-300">
                    <span className="text-sm font-medium">
                      Pelajari lebih lanjut
                    </span>
                    <svg
                      className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>

          {categoryEvents.length > 6 && (
            <div className="text-center mt-12">
              <button
                onClick={() => navigate("/events?isTop=true")}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                <span>Lihat Semua Program</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

CategoryProgramsHome.displayName = "CategoryProgramsHome";
export default CategoryProgramsHome;
