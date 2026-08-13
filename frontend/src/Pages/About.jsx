import { Heart, AlertCircle } from "lucide-react";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "../App.css";
import { fetchBody } from "../features/LandingPages/bodySlice";
import { HeroSection } from "./Components/HeroSection";

export const About = () => {
  const dispatch = useDispatch();
  const { body, status } = useSelector((state) => state.body);

  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);

  const descriptionRef = useRef(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Fetch body data
  useEffect(() => {
    const getBody = async () => {
      try {
        await dispatch(fetchBody()).unwrap();
      } catch (error) {
        console.error("Failed to fetch body data:", error);
      }
    };

    if (status === "idle") {
      getBody();
    }
  }, [dispatch, status]);

  // Restore scroll position
  useLayoutEffect(() => {
    const savedScrollPosition = sessionStorage.getItem("aboutScrollPosition");
    if (savedScrollPosition) {
      const position = parseInt(savedScrollPosition, 10);
      if (!isNaN(position)) {
        window.scrollTo({
          top: position,
          behavior: "instant",
        });
      }
    }
  }, []);

  // Scroll handler and intersection observer
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          sessionStorage.setItem("aboutScrollPosition", window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    const createObserver = (callback, element) => {
      const options = {
        threshold: 0.1,
        rootMargin: "0px",
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          callback(entry.isIntersecting);
        });
      }, options);

      if (element) {
        observer.observe(element);
      }

      return observer;
    };

    const descriptionObserver = createObserver(
      setIsDescriptionVisible,
      descriptionRef.current
    );

    return () => {
      window.removeEventListener("scroll", handleScroll);
      descriptionObserver.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Dark */}
      <HeroSection landingProps="about-page" />
      {/* Content Section - Light */}
      <section ref={descriptionRef} className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden transition-all duration-1000 ${
              isDescriptionVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-16 opacity-0"
            }`}>
            {/* Loading State */}
            {status === "loading" && (
              <div className="flex flex-col justify-center items-center py-20">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-6">
                  <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
                  <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-gray-600 font-medium text-sm sm:text-base">
                  Memuat konten...
                </p>
              </div>
            )}

            {/* Error State */}
            {status === "failed" && (
              <div className="p-6 sm:p-8 lg:p-12">
                <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 mb-1">
                        Gagal memuat konten
                      </h4>
                      <p className="text-sm text-red-700">
                        Terjadi kesalahan saat mengambil data. Silakan coba lagi
                        nanti.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success State - Content */}
            {status === "succeeded" && body?.description && (
              <div className="p-6 sm:p-8 lg:p-12">
                <div
                  className="prose prose-sm sm:prose lg:prose-lg max-w-none
                    prose-headings:text-gray-900 prose-headings:font-bold
                    prose-p:text-gray-700 prose-p:leading-relaxed
                    prose-a:text-blue-600 prose-a:font-semibold hover:prose-a:text-blue-700
                    prose-strong:text-gray-900 prose-strong:font-bold
                    prose-ul:text-gray-700 prose-ol:text-gray-700
                    prose-li:text-gray-700 prose-li:leading-relaxed
                    prose-blockquote:border-l-blue-600 prose-blockquote:text-gray-700 prose-blockquote:bg-blue-50
                    prose-code:text-blue-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                    prose-pre:bg-gray-900 prose-pre:text-gray-100
                    prose-img:rounded-xl prose-img:shadow-lg
                    prose-hr:border-gray-300
                    prose-table:text-gray-700
                    prose-th:text-gray-900 prose-th:bg-gray-100 prose-th:font-semibold
                    prose-td:border-gray-300
                    quill-content force-light"
                  dangerouslySetInnerHTML={{ __html: body.description }}
                />
              </div>
            )}

            {/* Empty State */}
            {status === "succeeded" && !body?.description && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Konten belum tersedia
                </h3>
                <p className="text-gray-600 text-sm">
                  Konten tentang kami akan segera ditambahkan
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
