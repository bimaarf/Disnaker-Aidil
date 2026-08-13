import {
  ArrowRight,
  Award,
  Calendar,
  ChevronRight,
  Eye,
  Filter,
  Heart,
  Search,
  Tag,
  TreePine,
  TrendingUp,
} from "lucide-react";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchPublicBlogs } from "../features/blog/blogSlice";
import { HeroSection } from "./Components/HeroSection";

// Utility functions
const truncateText = (text, limit) => {
  if (!text) return "";
  const words = text.split(" ");
  return words.length > limit ? words.slice(0, limit).join(" ") + "..." : text;
};

const stripHtml = (html) => {
  if (!html) return "";
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
};

// Horizontal Blog Card Component
const HorizontalBlogCard = memo(({ blog, onBlogClick, logo }) => {
  const primaryImage = useMemo(
    () =>
      blog?.images?.find((image) => image.is_primary === 1) ||
      blog?.images?.[0],
    [blog?.images]
  );

  const imageSrc = primaryImage ? primaryImage.image_data : null;

  return (
    <article
      onClick={() => onBlogClick(blog)}
      className="group relative overflow-hidden cursor-pointer rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 h-80">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={blog.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.target.src = logo?.background_header;
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
          <TreePine className="w-16 h-16 text-white opacity-40" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

      {logo && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
          <img
            src={logo.image}
            alt="Logo"
            className="w-5 h-5 rounded-full object-cover"
          />
          <span className="text-gray-800 text-xs font-semibold">Disnaker</span>
        </div>
      )}

      {(blog.views > 500 || blog.featured) && (
        <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
          <TrendingUp className="w-3 h-3" />
          {blog.featured ? "Unggulan" : "Trending"}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-6 text-white space-y-3">
        {blog.categories && blog.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {blog.categories.slice(0, 2).map((category) => (
              <span
                key={category.id}
                className="inline-flex items-center gap-1 text-xs font-medium text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <Tag className="w-3 h-3" />
                {category.name}
              </span>
            ))}
          </div>
        )}

        <h3 className="text-xl font-bold leading-tight line-clamp-2">
          {blog.name}
        </h3>

        <p className="text-sm text-gray-200 line-clamp-2">
          {truncateText(stripHtml(blog.description), 15)}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-white/20">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(blog.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              })}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {blog.views || 0}
            </div>
          </div>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </article>
  );
});
HorizontalBlogCard.displayName = "HorizontalBlogCard";

// Regular Blog Card Component
const BlogCard = memo(({ blog, onBlogClick }) => {
  const primaryImage = useMemo(
    () =>
      blog?.images?.find((image) => image.is_primary === 1) ||
      blog?.images?.[0],
    [blog?.images]
  );

  return (
    <article
      onClick={() => onBlogClick(blog)}
      className="group cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden h-full flex flex-col">
      <div className="relative overflow-hidden h-48">
        {primaryImage ? (
          <img
            src={primaryImage.image_data}
            alt={blog.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              e.target.src =
                "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
            <Heart className="w-12 h-12 text-blue-300" />
          </div>
        )}

        {(blog.views > 500 || blog.featured) && (
          <div className="absolute top-3 right-3 bg-orange-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {blog.featured ? "Unggulan" : "Trending"}
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex flex-wrap gap-2 mb-3">
          {blog.categories?.slice(0, 2).map((category, index) => (
            <span
              key={category.id || index}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              <Tag className="w-3 h-3" />
              {category?.name || "Informasi"}
            </span>
          ))}
          {blog.categories && blog.categories.length > 2 && (
            <span className="text-xs text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full font-medium">
              +{blog.categories.length - 2}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {blog.name}
        </h3>

        <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-1">
          {truncateText(stripHtml(blog.description), 15)}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(blog.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              })}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {blog.views || 0}
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </article>
  );
});
BlogCard.displayName = "BlogCard";

export const Blog = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    publicBlogs,
    publicStatus: status,
    publicError: error,
    publicTotal,
    publicPage: currentPage,
    publicTotalPages: totalPages,
  } = useSelector((state) => state.blogs);

  const logo = useSelector((state) => state.logos?.logos);

  const [searchQuery, setSearchQuery] = useState(() => {
    return sessionStorage.getItem("blogSearchQuery") || "";
  });
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return sessionStorage.getItem("blogSelectedCategory") || "all";
  });
  const [viewMode, setViewMode] = useState(() => {
    return sessionStorage.getItem("blogViewMode") || "card";
  });
  const [isBlogsVisible, setIsBlogsVisible] = useState(false);
  const [searchParams] = useState({
    query: "",
    fromDate: "",
    toDate: "",
  });

  const blogsRef = useRef(null);
  const isFetchingRef = useRef(false);
  const observerRef = useRef(null);
  const loadMoreTriggerRef = useRef(null);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    sessionStorage.setItem("blogSearchQuery", searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem("blogSelectedCategory", selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    sessionStorage.setItem("blogViewMode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }

    const hasCachedData = publicBlogs && publicBlogs.length > 0;

    if (hasCachedData) {
      hasInitializedRef.current = true;
      return;
    }

    if (status === "idle" && !hasCachedData) {
      console.log("🔄 Initial fetch - no cached data found");
      hasInitializedRef.current = true;
      isFetchingRef.current = false;

      dispatch(
        fetchPublicBlogs({
          page: 1,
          perPage: 10,
          searchQuery: searchParams.query,
          fromDate: searchParams.fromDate,
          toDate: searchParams.toDate,
          loadMore: false,
        })
      );
    }
  }, [dispatch, status, publicBlogs, searchParams]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (currentPage >= totalPages || status === "loading") {
      return;
    }

    const options = {
      root: null,
      rootMargin: "200px",
      threshold: 0.1,
    };

    const handleIntersection = (entries) => {
      const [entry] = entries;

      if (
        entry.isIntersecting &&
        !isFetchingRef.current &&
        currentPage < totalPages &&
        status !== "loading"
      ) {
        console.log(
          `📥 Load more triggered - Page ${currentPage + 1}/${totalPages}`
        );
        isFetchingRef.current = true;

        dispatch(
          fetchPublicBlogs({
            page: currentPage + 1,
            perPage: 10,
            searchQuery: searchParams.query,
            fromDate: searchParams.fromDate,
            toDate: searchParams.toDate,
            loadMore: true,
          })
        );
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersection, options);

    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [
    dispatch,
    currentPage,
    totalPages,
    status,
    searchParams.query,
    searchParams.fromDate,
    searchParams.toDate,
  ]);

  // Reset isFetching ketika status berubah
  useEffect(() => {
    if (status === "succeeded" || status === "failed") {
      isFetchingRef.current = false;
    }
  }, [status]);

  // Restore scroll posisi ketika data blogs sudah tersedia
  const isRestoringScrollRef = useRef(false);

  // Hooks & refs
  const rafRef = useRef(null);
  const STORAGE_KEY = "blogScrollPosition";

  // 1) Restore dengan aman setelah publicBlogs siap
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved || publicBlogs.length === 0) return;

      const pos = parseInt(saved, 10);
      if (Number.isNaN(pos)) return;

      isRestoringScrollRef.current = true;

      // Gunakan "auto" bukan "instant"
      window.scrollTo({ top: pos, behavior: "auto" });

      // Lepaskan flag pada frame berikutnya
      requestAnimationFrame(() => {
        isRestoringScrollRef.current = false;
        console.log("[scroll] restored to", pos);
      });
    } catch (err) {
      console.warn("[scroll] restore failed:", err);
    }
  }, [publicBlogs.length]); // trigger ketika jumlah publicBlogs berubah

  // 2) Save on scroll (raf throttle) + juga save on visibilitychange & beforeunload
  useEffect(() => {
    let ticking = false;

    const savePos = (y) => {
      try {
        sessionStorage.setItem(STORAGE_KEY, String(y));
      } catch (err) {
        console.warn("[scroll] save failed:", err);
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      // throttle via requestAnimationFrame
      rafRef.current = requestAnimationFrame(() => {
        // jika sedang restore, skip saving (opsional)
        if (!isRestoringScrollRef.current) {
          // gunakan pageYOffset (lebih luas kompatibilitas)
          const y = window.pageYOffset ?? window.scrollY ?? 0;
          savePos(y);
        }
        ticking = false;
      });
    };

    const onVisibility = () => {
      // save when tab hidden
      const y = window.pageYOffset ?? window.scrollY ?? 0;
      savePos(y);
      console.log("[scroll] saved on visibilitychange:", y);
    };

    const onBeforeUnload = () => {
      const y = window.pageYOffset ?? window.scrollY ?? 0;
      savePos(y);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // 3) IntersectionObserver tetap seperti semula (opsional)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsBlogsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    if (blogsRef.current) observer.observe(blogsRef.current);

    return () => observer.disconnect();
  }, []);

  const categories = useMemo(
    () => [
      "all",
      ...new Set(
        publicBlogs.flatMap(
          (blog) => blog.categories?.map((cat) => cat.name) || []
        )
      ),
    ],
    [publicBlogs]
  );

  const filteredBlogs = useMemo(() => {
    let filtered = publicBlogs;
    if (searchQuery) {
      filtered = filtered.filter(
        (blog) =>
          blog.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stripHtml(blog.description)
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory !== "all") {
      filtered = filtered.filter((blog) =>
        blog.categories?.some(
          (cat) => cat.name?.toLowerCase() === selectedCategory.toLowerCase()
        )
      );
    }
    return filtered;
  }, [publicBlogs, searchQuery, selectedCategory]);

  const handleBlogClick = useCallback(
    (blog) => {
      sessionStorage.setItem("blogScrollPosition", window.scrollY.toString());
      navigate(`/blog/${blog.key}?isTop=true`, { state: { blog } });
    },
    [navigate]
  );

  const hasMore = currentPage < totalPages;

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection landingProps="blog-page" />

      {/* Main Content Section */}
      <section ref={blogsRef} className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search & Filter Card */}
          <div
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 transition-all duration-1000 ease-out ${
              isBlogsVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-0 opacity-100"
            }`}>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari artikel atau program..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full landing-input pl-12 pr-4 py-3 text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              {/* Category Dropdown */}
              <div className="relative lg:w-64">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm text-gray-900 outline-none bg-gray-50 cursor-pointer appearance-none">
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "all" ? "Semua Kategori" : category}
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("card")}
                  className={`px-6 py-2.5 rounded-md transition-all text-sm font-medium ${
                    viewMode === "card"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}>
                  Card
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-6 py-2.5 rounded-md transition-all text-sm font-medium ${
                    viewMode === "grid"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}>
                  Grid
                </button>
              </div>
            </div>

            {/* Results Header */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {searchQuery || selectedCategory !== "all"
                  ? `Hasil Pencarian (${filteredBlogs.length})`
                  : `Semua Artikel (${publicBlogs.length})`}
              </h2>
              {publicTotal > 0 && (
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
                  {publicBlogs.length} dari {publicTotal}
                </span>
              )}
            </div>
          </div>

          {/* Loading State - Only show when no data exists */}
          {status === "loading" && publicBlogs.length === 0 && (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600 font-medium">Memuat program...</p>
            </div>
          )}

          {/* Error State */}
          {status === "failed" && (
            <div className="text-center py-20">
              <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto">
                <div className="text-red-600 text-xl font-bold mb-4">
                  Gagal memuat program
                </div>
                <p className="text-red-500">{error}</p>
              </div>
            </div>
          )}

          {/* Blog Cards Grid */}
          {filteredBlogs.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBlogs.map((blog, index) => {
                const Card =
                  viewMode === "card" ? HorizontalBlogCard : BlogCard;
                return (
                  <div
                    key={blog.id}
                    className={`transition-all duration-500 ${
                      isBlogsVisible
                        ? "translate-y-0 opacity-100"
                        : "translate-y-0 opacity-100"
                    }`}
                    style={{
                      transitionDelay: `${(index % 6) * 100 + 200}ms`,
                    }}>
                    <Card
                      blog={blog}
                      onBlogClick={handleBlogClick}
                      logo={viewMode === "card" ? logo : null}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {filteredBlogs.length === 0 && status !== "loading" && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tidak ada artikel ditemukan
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                {searchQuery || selectedCategory !== "all"
                  ? "Coba ubah kata kunci pencarian atau filter kategori"
                  : "Artikel akan segera hadir. Pantau terus website kami!"}
              </p>
              {(searchQuery || selectedCategory !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                  Reset Filter
                </button>
              )}
            </div>
          )}

          {/* Load More Trigger */}
          {hasMore && (
            <div
              ref={loadMoreTriggerRef}
              className="py-8 flex items-center justify-center">
              {status === "loading" ? (
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="font-medium">Memuat lebih banyak...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-gray-500">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-blue-600 animate-pulse" />
                  </div>
                  <span className="font-medium">
                    Scroll untuk melihat lebih banyak
                  </span>
                </div>
              )}
            </div>
          )}

          {/* End of List */}
          {!hasMore && publicBlogs.length > 0 && (
            <div className="py-8 flex items-center justify-center">
              <div className="flex items-center gap-3 text-gray-500">
                <Award className="w-5 h-5" />
                <span className="font-medium">
                  {publicBlogs.length === publicTotal
                    ? "Semua artikel telah dimuat"
                    : "Tidak ada artikel lagi"}
                </span>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {publicTotal > 0 && (
            <div className="mt-8 max-w-md mx-auto">
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-500"
                  style={{
                    width: `${(publicBlogs.length / publicTotal) * 100}%`,
                  }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {publicBlogs.length} dari {publicTotal} artikel dimuat
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Articles Section */}
      {publicBlogs.some((blog) => blog.featured) && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <div className="inline-block px-4 py-1.5 bg-orange-100 rounded-lg mb-3">
                <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
                  Unggulan
                </span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Artikel Pilihan
              </h2>
              <p className="text-gray-600">
                Artikel dan program dengan dampak terbesar
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicBlogs
                .filter((blog) => blog.featured)
                .slice(0, 6)
                .map((blog) => (
                  <BlogCard
                    key={`featured-${blog.id}`}
                    blog={blog}
                    onBlogClick={handleBlogClick}
                  />
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Custom Styles */}
      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};
