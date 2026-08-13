import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  ChevronRight,
  Eye,
  Filter,
  School,
  Search,
  Star,
  Tag,
  TrendingUp,
  Users,
} from "lucide-react";
import React, {
  useEffect,
  useLayoutEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  memo,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchPublicProducts,
  setPublicProductPage,
} from "../features/product/productSlice";

// Get active promotions
const getActivePromotions = (product) => {
  return (
    product?.promotions?.filter(
      (promo) =>
        (promo.status === 1 || promo.status === "1") &&
        promo.discount_percentage > 0 &&
        (!promo.expired || new Date(promo.expired) > new Date())
    ) || []
  );
};

// Calculate discounted price
const calculatePrice = (product) => {
  const activePromotions = getActivePromotions(product);
  const originalPrice = parseFloat(product?.price || 0);

  const isBonusProduct = activePromotions.some(
    (promo) => parseFloat(promo.discount_percentage) === 100
  );

  if (isBonusProduct) {
    return {
      originalPrice,
      discountedPrice: 0,
      totalDiscount: 100,
      isBonusProduct: true,
      activePromotions,
    };
  }

  const totalDiscount = activePromotions.reduce(
    (acc, promo) => acc + parseFloat(promo.discount_percentage),
    0
  );

  const discountedPrice = originalPrice * (1 - totalDiscount / 100);

  return {
    originalPrice,
    discountedPrice,
    totalDiscount,
    isBonusProduct: false,
    activePromotions,
  };
};

// Format price
const formatPrice = (price) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
};

// Memoized ProductCard Component
const ProductCard = memo(({ product, viewMode, logo, onProductClick }) => {
  const primaryImage = useMemo(
    () =>
      product?.images?.find((image) => image.is_primary === 1) ||
      product?.images?.[0],
    [product?.images]
  );

  const priceInfo = useMemo(() => calculatePrice(product), [product]);

  return (
    <article
      onClick={() => onProductClick(product)}
      className={`group cursor-pointer bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-[1.02] border border-white/20 overflow-hidden ${
        viewMode === "list" ? "flex flex-row" : ""
      }`}>
      {/* Image Section */}
      <div
        className={`relative overflow-hidden ${
          viewMode === "list" ? "w-80 flex-shrink-0" : "h-48"
        }`}>
        {primaryImage ? (
          <img
            src={`${process.env.REACT_APP_API}${primaryImage.image_data}`}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100">
            <BookOpen className="w-12 h-12 text-blue-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        {logo && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-gradient-to-r from-blue-800/10 to-violet-800/10 px-3 py-1.5 rounded-full">
            <img
              src={`${process.env.REACT_APP_API}logo/images/${logo.image}`}
              alt="Yz-Course"
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="text-white text-xs font-semibold hidden sm:block drop-shadow-sm">
              Yz-Course
            </span>
          </div>
        )}
        {product.views > 500 && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
            <TrendingUp className="w-3 h-3" />
            <span className="hidden sm:inline">Trending</span>
          </div>
        )}
        {priceInfo.activePromotions.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg animate-pulse">
            <Tag className="w-3 h-3" />-{priceInfo.totalDiscount}% OFF
          </div>
        )}
      </div>
      {/* Content Section */}
      <div className="p-6 flex-1">
        <div className="flex flex-wrap gap-2 mb-4">
          {product.categories?.slice(0, 2).map((category) => (
            <span
              key={category.id}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-100/80 px-3 py-1.5 rounded-full border border-blue-200/50 transition-colors duration-300 hover:bg-blue-200/80 hover:scale-105">
              <Tag className="w-3 h-3" />
              {category?.name || "Uncategorized"}
            </span>
          ))}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300 leading-tight hover:underline">
          {product.name}
        </h3>
        {priceInfo.activePromotions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {priceInfo.activePromotions.slice(0, 1).map((promo) => (
              <span
                key={promo.id}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-100/80 px-3 py-1.5 rounded-full border border-red-200/50 hover:scale-105 transition-transform">
                <Tag className="w-3 h-3" />
                {promo.title}
              </span>
            ))}
            {priceInfo.activePromotions.length > 1 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100/80 px-3 py-1.5 rounded-full border border-gray-200/50 hover:scale-105 transition-transform">
                +{priceInfo.activePromotions.length - 1} more
              </span>
            )}
          </div>
        )}
        {product.price > 0 && (
          <div className="mb-4">
            {priceInfo.totalDiscount > 0 ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm line-through">
                    {formatPrice(priceInfo.originalPrice)}
                  </span>
                  <span className="text-lg font-bold text-blue-600 animate-pulse">
                    {priceInfo.discountedPrice === 0
                      ? "Gratis"
                      : formatPrice(priceInfo.discountedPrice)}
                  </span>
                </div>
                <div className="text-xs text-green-600">
                  Hemat:{" "}
                  {formatPrice(
                    priceInfo.originalPrice - priceInfo.discountedPrice
                  )}
                </div>
              </div>
            ) : (
              <span className="text-lg font-bold text-blue-600">
                {formatPrice(priceInfo.originalPrice)}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(product.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <Eye className="w-4 h-4" />
              <span>{product.views || 0} views</span>
            </div>
          </div>
          {product.featured && (
            <div className="flex items-center gap-1 text-yellow-600 hover:scale-110 transition-transform">
              <Star className="w-4 h-4 fill-current" />
              <span className="hidden sm:inline">Featured</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <button className="group/btn flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-all duration-300 hover:gap-3 hover:scale-105">
            <span>Baca Selengkapnya</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
          </button>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {product.likes > 0 && (
              <div className="flex items-center gap-1 hover:text-yellow-500 transition-colors">
                <Star className="w-3 h-3" />
                <span>{product.likes}</span>
              </div>
            )}
            {product.comments > 0 && (
              <div className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                <Users className="w-3 h-3" />
                <span>{product.comments}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});
ProductCard.displayName = "ProductCard";

// Enhanced Product Component
export const Product = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { publicProducts, publicStatus, error, publicTotal, publicPage } =
    useSelector((state) => state.products);
  const logo = useSelector((state) => state.logos?.logos);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [isHeroVisible, setIsHeroVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    if (publicStatus === "idle") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [publicStatus]);
  const heroRef = useRef(null);

  // Fetch products
  useEffect(() => {
    dispatch(
      fetchPublicProducts({
        page: publicPage,
        perPage: 12,
        searchQuery: "",
        fromDate: "",
        toDate: "",
      })
    );
  }, [dispatch, publicPage]);

  // Restore scroll position
  useLayoutEffect(() => {
    const savedScrollPosition = sessionStorage.getItem("productScrollPosition");
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

  // Save scroll position and handle parallax
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      sessionStorage.setItem("productScrollPosition", window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);

    // Hero Intersection Observer
    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setIsHeroVisible(entry.isIntersecting));
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) heroObserver.observe(heroRef.current);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      heroObserver.disconnect();
    };
  }, []);

  // Memoized categories
  const categories = useMemo(
    () => [
      "all",
      ...new Set(
        publicProducts.flatMap(
          (product) => product.categories?.map((cat) => cat.name) || []
        )
      ),
    ],
    [publicProducts]
  );

  // Memoized filtered products
  const filteredProducts = useMemo(() => {
    let filtered = publicProducts;
    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory !== "all") {
      filtered = filtered.filter((product) =>
        product.categories?.some(
          (cat) => cat.name?.toLowerCase() === selectedCategory.toLowerCase()
        )
      );
    }
    return filtered;
  }, [publicProducts, searchQuery, selectedCategory]);

  // Memoized event handlers
  const loadMore = useCallback(() => {
    const nextPage = publicPage + 1;
    dispatch(setPublicProductPage(nextPage));
  }, [dispatch, publicPage]);

  const handleProductClick = useCallback(
    (product) => {
      sessionStorage.setItem("productScrollPosition", window.scrollY);
      navigate(`/product/${product.key}?isTop=true`, { state: { product } });
    },
    [navigate]
  );

  const hasMore = publicProducts.length < publicTotal;

  const quickStats = [
    {
      icon: <Users className="w-6 h-6" />,
      number: "1,250+",
      label: "Siswa Aktif",
      color: "text-blue-600",
    },
    {
      icon: <Award className="w-6 h-6" />,
      number: "25+",
      label: "Tahun Berpengalaman",
      color: "text-green-600",
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      number: "50+",
      label: "Program Unggulan",
      color: "text-purple-600",
    },
    {
      icon: <Star className="w-6 h-6" />,
      number: "A",
      label: "Akreditasi",
      color: "text-yellow-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-800 py-16 md:py-20 lg:py-24">
        {/* Enhanced Background Pattern with Parallax */}
        <div
          className="absolute inset-0"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}></div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 sm:top-20 left-4 sm:left-10 w-20 sm:w-32 h-20 sm:h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-32 sm:top-40 right-4 sm:right-20 w-16 sm:w-24 h-16 sm:h-24 bg-yellow-300/20 rounded-full blur-lg animate-bounce"></div>
          <div className="absolute bottom-16 sm:bottom-20 left-1/4 w-12 sm:w-20 h-12 sm:h-20 bg-purple-300/20 rounded-full blur-md animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 right-1/4 w-10 sm:w-16 h-10 sm:h-16 bg-blue-300/10 rounded-full blur-md animate-pulse delay-500"></div>

          {/* Additional mobile-optimized floating elements */}
          <div className="absolute top-1/3 left-1/2 w-8 h-8 bg-pink-300/15 rounded-full blur-sm animate-ping delay-700"></div>
          <div className="absolute bottom-1/3 right-1/3 w-6 h-6 bg-green-300/15 rounded-full blur-sm animate-ping delay-300"></div>
        </div>

        {/* Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-10 sm:opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        <div className="relative mt-10 z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div
              className={`flex justify-center transition-all duration-1000 ${
                isHeroVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}>
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110">
                <School className="w-12 h-12 text-white" />
              </div>
            </div>
            <div
              className={`space-y-4 transition-all duration-1000 delay-300 ${
                isHeroVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}>
              <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                Informasi dan Kursus
              </h1>
              <h1 className="text-2xl md:text-4xl font-bold italic text-yellow-300">
                Solusi Terbaik untuk Pendidikan Berkualitas
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
                Tim Yz-Course siap membantu Anda dengan informasi lengkap
                tentang pendaftaran dan program kami.
              </p>
            </div>
            <div
              className={`grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 transition-all duration-1000 delay-500 ${
                isHeroVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}>
              {quickStats.map((stat, index) => (
                <div
                  key={index}
                  className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 group cursor-default"
                  style={{ transitionDelay: `${700 + index * 150}ms` }}>
                  <div
                    className={`flex justify-center mb-2 ${stat.color} group-hover:scale-110 transition-all duration-300`}>
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {stat.number}
                  </div>
                  <div className="text-blue-100 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <div className="py-8 lg:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search and Filter Section */}
        <section className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari kursus, berita, atau topik..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 text-gray-700 bg-gray-50/50 rounded-2xl border border-gray-200/50 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 placeholder-gray-400"
                />
              </div>
              <div className="relative w-full lg:w-auto">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full lg:w-auto pl-12 pr-10 py-3.5 rounded-2xl border border-gray-200/50 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-gray-700 transition-all duration-300 appearance-none outline-none bg-gray-50/50 min-w-[220px] cursor-pointer">
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "all" ? "Semua Kategori" : category}
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="flex bg-gray-100/80 rounded-2xl p-1.5 border border-gray-200/50">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-5 py-2.5 rounded-xl transition-all duration-300 text-sm font-semibold ${
                    viewMode === "grid"
                      ? "bg-white shadow-lg text-blue-600 scale-105"
                      : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                  }`}>
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-5 py-2.5 rounded-xl transition-all duration-300 text-sm font-semibold ${
                    viewMode === "list"
                      ? "bg-white shadow-lg text-blue-600 scale-105"
                      : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                  }`}>
                  List
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {searchQuery || selectedCategory !== "all"
                ? `Hasil Pencarian (${filteredProducts.length})`
                : `Semua Kursus (${publicProducts.length})`}
            </h2>
            {publicTotal > 0 && (
              <span className="text-gray-500 text-sm bg-gray-100 px-3 py-1.5 rounded-full">
                Menampilkan {publicProducts.length} dari {publicTotal} kursus
              </span>
            )}
          </div>
        </section>
        {/* Loading State */}
        {publicStatus === "loading" && publicProducts.length === 0 && (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200"></div>
              <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-600 absolute top-0 left-0"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <BookOpen className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
            </div>
            <p className="text-gray-600 font-medium">Memuat kursus...</p>
          </div>
        )}
        {/* Error State */}
        {publicStatus === "failed" && (
          <div className="text-center py-20">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
              <div className="text-red-600 text-xl font-bold mb-4">
                Gagal memuat kursus
              </div>
              <p className="text-red-500">{error}</p>
            </div>
          </div>
        )}
        {/* Product Grid/List */}
        {filteredProducts.length > 0 && (
          <section
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode={viewMode}
                logo={logo}
                onProductClick={handleProductClick}
              />
            ))}
          </section>
        )}
        {/* Empty State */}
        {filteredProducts.length === 0 && publicStatus !== "loading" && (
          <div className="text-center py-20">
            <div className="bg-gray-50/50 backdrop-blur-sm rounded-3xl border border-gray-200/50 p-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Tidak ada kursus ditemukan
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || selectedCategory !== "all"
                  ? "Coba ubah kata kunci pencarian atau filter kategori"
                  : "Belum ada kursus yang dipublikasikan"}
              </p>
              {(searchQuery || selectedCategory !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                  Reset Filter
                </button>
              )}
            </div>
          </div>
        )}
        {/* Load More Button */}
        {hasMore &&
          filteredProducts.length > 0 &&
          publicStatus !== "loading" && (
            <div className="text-center mt-12">
              <button
                onClick={loadMore}
                disabled={publicStatus === "loading"}
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3 mx-auto">
                {publicStatus === "loading" ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Memuat...</span>
                  </>
                ) : (
                  <>
                    <span>Muat Lebih Banyak</span>
                    <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </button>
              <div className="mt-4 max-w-md mx-auto">
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-500 ease-out"
                    style={{
                      width: `${(publicProducts.length / publicTotal) * 100}%`,
                    }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {publicProducts.length} dari {publicTotal} kursus dimuat
                </p>
              </div>
            </div>
          )}
        {/* Featured Products Section */}
        {publicProducts.some((product) => product.featured) && (
          <section className="mt-16 pt-12 border-t border-gray-200/50">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center group hover:scale-110 transition-all duration-300">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Kursus Unggulan
                </h2>
                <p className="text-gray-600">Kursus terpilih dan terpopuler</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicProducts
                .filter((product) => product.featured)
                .slice(0, 3)
                .map((product) => (
                  <ProductCard
                    key={`featured-${product.id}`}
                    product={product}
                    viewMode="grid"
                    logo={logo}
                    onProductClick={handleProductClick}
                  />
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
