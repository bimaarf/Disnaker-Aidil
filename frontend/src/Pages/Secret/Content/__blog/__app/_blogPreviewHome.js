import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Helmet } from "react-helmet";
import {
  ArrowLeft,
  Calendar,
  User,
  Eye,
  Share2,
  FileText,
  Home,
  Tag,
  Building2,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { fetchBlog } from "../../../../../features/blog/blogSlice";
import { CircularLoader } from "../../../../../Components/_CircularLoader";
import "../../../../../index.css";
import useScrollRestoration from "../../../../../Components/_scrollRestoration";
import useIsMobile from "../../../../../Context/__useIsMobile";
import { RecentBlogSidebar } from "./__RecentBlogSidebar";

const BlogPreviewHome = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const publicBlogs = useSelector((state) => state.blogs.publicBlogs);
  const heroRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const isMobile = useIsMobile();
  const [isHeroVisible, setIsHeroVisible] = useState(false);

  useScrollRestoration();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          sessionStorage.setItem("blogScrollPosition", window.scrollY);
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

    const heroObserver = createObserver(setIsHeroVisible, heroRef.current);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      heroObserver.disconnect();
    };
  }, []);

  const primaryImageIndex = useMemo(() => {
    if (!data?.images?.length) return 0;
    const primaryIndex = data.images.findIndex((img) => img.is_primary === 1);
    return primaryIndex !== -1 ? primaryIndex : 0;
  }, [data?.images]);

  useEffect(() => {
    if (data?.images?.length) {
      setSelectedImageIndex(primaryImageIndex);
    }
  }, [data?.images, primaryImageIndex]);

  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        setLoading(true);

        const cachedBlog = publicBlogs.find((blog) => blog.key === key);
        if (cachedBlog?.status) {
          setData(cachedBlog);
          setLoading(false);
          return;
        }

        const result = await dispatch(fetchBlog({ key })).unwrap();
        const blogData = result.data || result;
        setData(blogData);
        setLoading(false);
      } catch (err) {
        const errorMessage =
          err?.message?.includes("404") || err?.message?.includes("not found")
            ? "Blog tidak ditemukan atau tidak dapat diakses."
            : "Gagal memuat data blog.";

        toast.error(errorMessage);
        setLoading(false);
        navigate("/blogs");
      }
    };

    if (key) {
      fetchBlogData();
    }
  }, [key, dispatch, publicBlogs, navigate]);

  const handleImageSelect = useCallback((index) => {
    setSelectedImageIndex(index);
  }, []);

  const handlePrevImage = useCallback(() => {
    setSelectedImageIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextImage = useCallback(() => {
    if (!data?.images?.length) return;
    const length = data.images.length;
    setSelectedImageIndex((prev) => Math.min(length - 1, prev + 1));
  }, [data?.images?.length]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: data?.name,
          text:
            data?.description?.replace(/<[^>]*>/g, "").substring(0, 200) +
            "...",
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link berhasil disalin!");
    }
  }, [data]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "Tanggal tidak tersedia";

    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Tanggal tidak valid";
    }
  }, []);

  const getImageUrl = useCallback((image) => {
    return image
      ? image.image_data
      : "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=400&fit=crop";
  }, []);

  // SEO Meta Data
  const seoData = useMemo(() => {
    if (!data) return null;

    const stripHtml = (html) => {
      return html?.replace(/<[^>]*>/g, "") || "";
    };

    const primaryImage = data.images?.find((img) => img.is_primary === 1);
    const imageUrl = primaryImage
      ? getImageUrl(primaryImage)
      : "https://psb.yz-course.com/sotrage/uploads/logo/images/logo.png";

    const description = stripHtml(data.description).substring(0, 160);
    const categories = data.categories?.map((cat) => cat.name).join(", ") || "";
    const currentUrl = window.location.href;
    const siteName = "Dinas Ketenagakerjaan";
    const fullSiteName = "Portal Berita & Artikel Dinas Ketenagakerjaan";

    // Schema.org structured data untuk artikel
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: data.name,
      description: description,
      image: imageUrl,
      datePublished: data.created_at,
      dateModified: data.updated_at || data.created_at,
      author: {
        "@type": "Person",
        name: data.author?.name || "Tim Dinas Ketenagakerjaan",
      },
      publisher: {
        "@type": "Organization",
        name: siteName,
        logo: {
          "@type": "ImageObject",
          url: "https://psb.yz-course.com/sotrage/uploads/logo/images/logo.png",
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": currentUrl,
      },
    };

    // Breadcrumb schema
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://yz-course.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Informasi & Artikel",
          item: "https://yz-course.com/blogs",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: data.name,
          item: currentUrl,
        },
      ],
    };

    return {
      title: `${data.name} | ${fullSiteName}`,
      description:
        description || `Baca artikel ${data.name} di ${fullSiteName}`,
      imageUrl,
      url: currentUrl,
      siteName,
      fullSiteName,
      author: data.author?.name || "Tim Dinas Ketenagakerjaan",
      publishedDate: data.created_at,
      modifiedDate: data.updated_at || data.created_at,
      categories,
      type: "article",
      articleSchema,
      breadcrumbSchema,
    };
  }, [data, getImageUrl]);

  if (loading) {
    return <CircularLoader />;
  }

  if (!data) {
    return (
      <>
        <Helmet>
          <title>
            Blog Tidak Ditemukan | Portal Berita & Artikel Dinas Ketenagakerjaan
          </title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md w-full">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-[#1F1F1F] rounded-xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#1F1F1F] mb-3">
              Blog tidak ditemukan
            </h2>
            <p className="text-gray-600 mb-6">
              Mohon maaf, konten yang Anda cari tidak tersedia.
            </p>
            <button
              onClick={() => navigate("/blogs")}
              className="bg-gradient-to-r from-gray-700 to-[#1F1F1F] hover:from-gray-700 hover:to-[#1F1F1F] text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[99%] active:scale-[98%] w-full">
              Kembali ke Informasi & Artikel
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen relative bg-gray-50/50">
      {/* SEO Meta Tags */}
      {seoData && (
        <Helmet>
          {/* Basic Meta Tags */}
          <html lang="id" data-theme="black" />
          <title>{seoData.title}</title>
          <meta name="description" content={seoData.description} />
          <meta name="author" content={seoData.author} />
          <meta name="keywords" content={seoData.categories} />
          <meta name="language" content="Indonesian" />
          <meta name="revisit-after" content="7 days" />
          <link rel="canonical" href={seoData.url} />

          {/* Alternative languages */}
          <link rel="alternate" hrefLang="id" href={seoData.url} />
          <link rel="alternate" hrefLang="x-default" href={seoData.url} />

          {/* Open Graph Meta Tags */}
          <meta property="og:type" content={seoData.type} />
          <meta property="og:site_name" content={seoData.siteName} />
          <meta property="og:title" content={seoData.title} />
          <meta property="og:description" content={seoData.description} />
          <meta property="og:image" content={seoData.imageUrl} />
          <meta property="og:image:secure_url" content={seoData.imageUrl} />
          <meta property="og:image:type" content="image/jpeg" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content={data.name} />
          <meta property="og:url" content={seoData.url} />
          <meta property="og:locale" content="id_ID" />
          <meta property="og:locale:alternate" content="en_US" />
          <meta
            property="article:published_time"
            content={seoData.publishedDate}
          />
          <meta
            property="article:modified_time"
            content={seoData.modifiedDate}
          />
          <meta property="article:author" content={seoData.author} />
          <meta property="article:section" content="Informasi & Artikel" />
          {data.categories?.map((category) => (
            <meta
              key={category.id}
              property="article:tag"
              content={category.name}
            />
          ))}

          {/* Twitter Card Meta Tags */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@YzCourse" />
          <meta name="twitter:creator" content="@YzCourse" />
          <meta name="twitter:title" content={seoData.title} />
          <meta name="twitter:description" content={seoData.description} />
          <meta name="twitter:image" content={seoData.imageUrl} />
          <meta name="twitter:image:alt" content={data.name} />

          {/* Additional SEO Tags */}
          <meta
            name="robots"
            content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
          />
          <meta name="googlebot" content="index, follow" />

          {/* Mobile App Meta */}
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content="default"
          />
          <meta
            name="apple-mobile-web-app-title"
            content="Dinas Ketenagakerjaan"
          />
          <meta name="theme-color" content="#000000" />

          {/* Schema.org Structured Data - Article */}
          <script type="application/ld+json">
            {JSON.stringify(seoData.articleSchema)}
          </script>

          {/* Breadcrumb Schema */}
          <script type="application/ld+json">
            {JSON.stringify(seoData.breadcrumbSchema)}
          </script>
        </Helmet>
      )}

      {/* Header Bar - Fixed at top with highest z-index */}
      {/* Top Information Bar */}
      <div className="text-white py-2.5 print:hidden bg-gradient-to-r from-[#1F1F1F] via-[#1F1F1F] to-[#1F1F1F] shadow-lg z-[1000] relative">
        <div className="max-w-screen-xl mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-white">
              <Building2 className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">
                Portal Berita & Artikel Dinas Ketenagakerjaan
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">
                {formatDate(new Date().toISOString())}
              </span>
              <span className="sm:hidden">
                {new Date().toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar - overlays hero */}
      <nav
        className={`left-0 right-0 z-[1100] print:hidden transition-all duration-500 ${
          scrolled
            ? "fixed top-0 bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200"
            : "top-[42px] bg-transparent absolute"
        }`}>
        <div className="max-w-screen-xl mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Menu */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 group ${
                  scrolled
                    ? "text-gray-700 hover:text-gray-600 hover:bg-gray-50"
                    : "text-white hover:text-cyan-300 hover:bg-black/10"
                }`}>
                <Home className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="font-semibold hidden sm:inline">Beranda</span>
              </button>

              <div
                className={`w-px h-6 ${
                  scrolled ? "bg-gray-300" : "bg-white/30"
                }`}></div>

              <button
                onClick={() => navigate("/blogs")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 group ${
                  scrolled
                    ? "text-gray-700 hover:text-gray-600 hover:bg-gray-50"
                    : "text-white hover:text-cyan-300 hover:bg-black/10"
                }`}>
                <FileText className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="font-semibold hidden lg:inline">
                  Informasi & Artikel
                </span>
                <span className="font-semibold lg:hidden">Artikel</span>
              </button>
            </div>

            {/* Right Button */}
            <button
              onClick={() => navigate("/blogs")}
              className={`inline-flex items-center gap-2 px-4 py-2  backdrop-blur-md text-xs font-bold rounded-full uppercase tracking-wider border hover:scale-[99%] active:scale-[98%] duration-200 ${
                scrolled
                  ? "hover:bg-black/5 bg-transparent text-black border-gray-200 "
                  : "hover:bg-white/5 bg-black/10 text-white border-white/30 shadow-lg"
              }`}>
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative h-[50vh] overflow-hidden bg-gradient-to-br from-[#1F1F1F] via-[#1F1F1F] to-[#1F1F1F] text-white"
        style={{ zIndex: 1 }}>
        {/* Background Image */}
        <div
          className={`absolute inset-0 top-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 ease-out ${
            isHeroVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
          style={{
            backgroundImage: `url('${
              getImageUrl(data.images?.find((img) => img.is_primary === 1)) ||
              "https://via.placeholder.com/1920x1080?text=No+Image"
            }')`,
            opacity: 0.8,
            transform: isMobile ? "none" : `translateY(${scrollY * 0.3}px)`,
            willChange: "transform",
            zIndex: 0,
          }}></div>
        {/* Deep Overlay Gradient */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/75"
          style={{ zIndex: 1 }}></div>
        {/* Subtle Vignette for Depth */}
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.7)_70%,rgba(0,0,0,1)_100%)]"
          style={{ zIndex: 2 }}></div>
        {/* Decorative bottom gradient line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{ zIndex: 3 }}></div>
        {/* Content */}
        <div className="relative z-[4] flex flex-col justify-center items-start h-full max-w-screen-xl mx-auto px-4 lg:px-8">
          {/* Badge */}
          <div className="mb-5">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-black/10 backdrop-blur-md text-white text-xs font-bold rounded-full uppercase tracking-wider border border-white/30 shadow-lg">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">
                Informasi & Artikel Resmi Pemerintah
              </span>
              <span className="sm:hidden">Informasi & Artikel Resmi</span>
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6 leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">
            {data.name}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-2 bg-black/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-md">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium text-sm truncate max-w-[150px]">
                {data.author?.name || "Tim Dinas Ketenagakerjaan"}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-black/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-md">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm whitespace-nowrap">
                {formatDate(data.created_at)}
              </span>
            </div>
          </div>

          {/* Categories */}
          {data.categories?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.categories.map((category) => (
                <span
                  key={category.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/10 backdrop-blur-md text-white text-xs font-semibold rounded-xl border border-white/30 shadow-md">
                  <Tag className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate max-w-[120px]">
                    {category.name}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <div className="grid max-w-screen-xl grid-cols-1 sm:grid-cols-12 items-start sm:gap-6 mx-auto">
        <div className="sm:col-span-10 col-span-1">
          <div
            className="relative px-0 sm:px-4 lg:px-8 sm:pb-6 lg:pb-12"
            style={{ zIndex: 2 }}>
            {/* Breadcrumb */}
            <div className="sm:my-6 print-hidden">
              <div className="flex items-center gap-2 text-white bg-gradient-to-r from-[#1F1F1F] via-[#1F1F1F] to-[#1F1F1F] backdrop-blur-sm px-4 py-3 sm:rounded shadow-sm overflow-x-auto ">
                <Home
                  onClick={() => navigate("/")}
                  className="w-4 h-4 flex-shrink-0 text-white hover:text-warning"
                />
                <ChevronRight className="w-4 h-4 flex-shrink-0 text-white hover:text-warning" />
                <span
                  className="hover:text-primary cursor-pointer transition-colors whitespace-nowrap text-white hover:text-warning"
                  onClick={() => navigate("/blogs")}>
                  Informasi & Artikel
                </span>
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
                <span className="text-white font-medium truncate">
                  {data.name}
                </span>
              </div>
            </div>

            {/* Article Card */}
            <article className="rounded -mt-1 shadow-sm backdrop-blur-sm overflow-hidden relative">
              {/* Image Gallery */}
              {data.images?.length > 0 && (
                <div className="relative">
                  <div className="relative overflow-hidden group">
                    <div
                      className="flex transition-transform duration-700 ease-out"
                      style={{
                        transform: `translateX(-${selectedImageIndex * 100}%)`,
                      }}>
                      {data.images.map((image, index) => (
                        <img
                          key={image.id}
                          src={getImageUrl(image)}
                          alt={`${data.name} - Gambar ${index + 1}`}
                          className="min-w-full h-64 sm:h-96 lg:h-[500px] object-cover flex-shrink-0"
                          onError={(e) => {
                            e.target.src =
                              "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop";
                          }}
                        />
                      ))}
                    </div>

                    {/* Navigation Buttons */}
                    {data.images?.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          disabled={selectedImageIndex === 0}
                          className={`absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black/95 backdrop-blur-md hover:bg-black text-white rounded-full p-2 sm:p-3 transition-all duration-300 shadow-lg ${
                            selectedImageIndex === 0
                              ? "opacity-0 cursor-not-allowed pointer-events-none"
                              : "opacity-70 sm:opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
                          }`}
                          style={{ zIndex: 30 }}>
                          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        <button
                          onClick={handleNextImage}
                          disabled={
                            selectedImageIndex === data.images.length - 1
                          }
                          className={`absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black/95 backdrop-blur-md hover:bg-black text-white rounded-full p-2 sm:p-3 transition-all duration-300 shadow-lg ${
                            selectedImageIndex === data.images.length - 1
                              ? "opacity-0 cursor-not-allowed pointer-events-none"
                              : "opacity-70 sm:opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
                          }`}
                          style={{ zIndex: 30 }}>
                          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    <div
                      className={`absolute ${
                        isMobile ? "top-0" : "bottom-0"
                      } left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6`}
                      style={{ zIndex: 20 }}>
                      {data.categories?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {data.categories.map((category) => (
                            <span
                              key={category.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/10 backdrop-blur-md text-white text-xs font-semibold rounded-xl border border-white/30 shadow-md">
                              <Tag className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate max-w-[120px]">
                                {category.name}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Thumbnail Gallery */}
                    {data.images?.length > 1 && (
                      <div
                        className="absolute px-4 bottom-0 right-0 p-2 rounded-tl-xl max-w-full sm:max-w-3xl overflow-x-scroll"
                        style={{ zIndex: 20 }}>
                        <div className="w-full">
                          <div className="flex justify-start gap-2 sm:gap-8 overflow-x-auto scrollbar-hide">
                            {data.images.map((image, index) => {
                              const isSelected = selectedImageIndex === index;
                              return (
                                <button
                                  key={image.id}
                                  onClick={() => handleImageSelect(index)}
                                  className={`relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded overflow-hidden transition-all duration-300
                ${
                  isSelected
                    ? "border border-cyan-600 shadow-lg"
                    : "border border-transparent hover:border-cyan-700 shadow-lg"
                }`}>
                                  <img
                                    src={getImageUrl(image)}
                                    alt={`Thumbnail ${index + 1}`}
                                    className="w-full h-full object-cover rounded"
                                    onError={(e) => {
                                      e.target.src =
                                        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=100&h=100&fit=crop";
                                    }}
                                  />

                                  {isSelected && (
                                    <div
                                      className="absolute inset-0 bg-black/20 flex items-center justify-center"
                                      style={{ zIndex: 10 }}>
                                      <div className="w-8 h-8 bg-black/30 rounded-full flex items-center justify-center shadow-lg">
                                        <Eye className="w-2 h-2 text-white/80" />
                                      </div>
                                    </div>
                                  )}

                                  <div
                                    className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg transition-all
                  ${
                    isSelected
                      ? "bg-black text-white scale-110"
                      : "bg-black/80 text-gray-300"
                  }`}
                                    style={{ zIndex: 10 }}>
                                    {index + 1}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Content Section */}
              <div className="p-6 sm:p-10 lg:p-12 bg-white">
                <div className="border-l-4 border-gray-600 pl-6 mb-8 bg-gradient-to-r from-gray-50 to-transparent py-4 rounded-r-xl">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#1F1F1F] mb-2">
                    Deskripsi Informasi
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Informasi lengkap mengenai program dan kegiatan
                  </p>
                </div>

                <div
                  className="prose prose-gray max-w-none prose-lg"
                  dangerouslySetInnerHTML={{ __html: data.description }}
                />
              </div>

              {/* Action Buttons */}
              <div className="px-6 sm:px-10 lg:px-12 pb-8 bg-white print-hidden">
                <div className="flex flex-wrap gap-3 pt-6 border-t-2 border-gray-200">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-gray-600 hover:from-emerald-600 hover:to-gray-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[99%] active:scale-[98%] font-semibold">
                    <Share2 className="w-4 h-4" />
                    <span>Bagikan</span>
                  </button>
                </div>
              </div>

              {/* Author Info */}
              <div className="bg-white rounded shadow-sm backdrop-blur-sm overflow-hidden relative p-4 sm:p-8">
                <div className="flex items-start gap-4 sm:gap-6">
                  {data.author?.avatar ? (
                    <img
                      src={data.author.avatar}
                      alt={`${data.author.name}'s avatar`}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-xl border-2 border-white ring-2 ring-gray-200 flex-shrink-0"
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face";
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-700 to-[#1F1F1F] rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-xl border-2 border-white ring-2 ring-gray-200">
                      {data.author?.name?.charAt(0) || "T"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#1F1F1F] text-lg sm:text-xl mb-1 truncate">
                      {data.author?.name || "Tim Dinas Ketenagakerjaan"}
                    </h3>
                    <p className="text-gray-600 font-semibold text-sm mb-2">
                      Informasi Coordinator
                    </p>
                    <p className="text-gray-600 text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        Dipublikasikan pada {formatDate(data.created_at)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {/* Contact Section */}
          </div>
        </div>
        <div className="sm:col-span-2 col-span-1">
          <div className="w-full max-w-screen-sm min-w sm:min-w-96 px-4">
            <RecentBlogSidebar />
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @media print {
          .print-hidden {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .prose {
          color: #334155;
          line-height: 1.8;
        }
        
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          font-weight: 700;
          color: #1e293b;
          margin-top: 1.5em;
          margin-bottom: 0.75em;
          line-height: 1.3;
        }

        .prose h1 {
          font-size: 1.875em;
          padding-bottom: 0.5rem;
          border-bottom: 3px solid #d5f3ff;
        }

        .prose h2 {
          font-size: 1.5em;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #d5f3ff;
        }
        
        .prose h3 {
          font-size: 1.25em;
          color: #0a0e27;
        }

        .prose h4 {
          font-size: 1.125em;
          color: #0d9488;
        }
        
        .prose p {
          margin-bottom: 1em;
          text-align: justify;
          color: #475569;
        }
        
        .prose ul, .prose ol {
          margin: 1em 0;
          padding-left: 1.5em;
        }
        
        .prose li {
          margin: 0.5em 0;
          color: #475569;
          line-height: 1.75;
        }
        
        .prose ul li::marker {
          color: #0a0e27;
        }

        .prose ol li::marker {
          color: #0a0e27;
          font-weight: 700;
        }

        .prose strong {
          color: #1e293b;
          font-weight: 700;
        }

        .prose em {
          color: #64748b;
        }

        .prose a {
          color: #0a0e27;
          text-decoration: underline;
          font-weight: 500;
          transition: color 0.2s;
        }

        .prose a:hover {
          color: #1F1F1F;
        }

        .prose img {
          border-radius: 0.75rem;
          margin: 1.5em auto;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          border: 2px solid #e2e8f0;
          max-width: 100%;
          height: auto;
        }

        .prose blockquote {
          border-left: 4px solid #0a0e27;
          padding-left: 1rem;
          margin: 1.5em 0;
          font-style: italic;
          color: #475569;
          background: linear-gradient(to right, #f5fffa, #ffffff);
          padding: 1rem;
          border-radius: 0.5rem;
        }

        .prose blockquote p {
          margin: 0;
        }

        .prose code {
          background: #f5fffa;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.875em;
          color: #0a0e27;
          font-weight: 500;
          border: 1px solid #d5f3ff;
        }

        .prose pre {
          background: #1e293b;
          color: #f1f5f9;
          padding: 1rem;
          border-radius: 0.75rem;
          overflow-x: auto;
          margin: 1.5em 0;
        }

        .prose pre code {
          background: transparent;
          color: inherit;
          padding: 0;
          border: none;
        }

        .prose table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-radius: 0.5rem;
          overflow: hidden;
          font-size: 0.875em;
        }

        .prose table th {
          color: white;
          padding: 0.75rem;
          text-align: left;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.75em;
          letter-spacing: 0.05em;
        }

        .prose table td {
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          background: white;
        }

        .prose table tbody tr:nth-child(even) {
          background: #f5fffa;
        }

        .prose table tbody tr:hover {
          background: #e8f3ff;
        }

        .prose hr {
          border: none;
          border-top: 2px solid #e2e8f0;
          margin: 2em 0;
        }

        .prose figure {
          margin: 1.5em 0;
        }

        .prose figcaption {
          text-align: center;
          color: #64748b;
          font-size: 0.875em;
          margin-top: 0.5rem;
          font-style: italic;
        }

        @media (max-width: 640px) {
          .prose {
            font-size: 0.9375rem;
          }

          .prose h1 {
            font-size: 1.625em;
          }

          .prose h2 {
            font-size: 1.375em;
          }

          .prose h3 {
            font-size: 1.25em;
          }

          .prose h4 {
            font-size: 1.125em;
          }

          .prose table {
            font-size: 0.8125em;
            display: block;
            overflow-x: auto;
          }

          .prose table th,
          .prose table td {
            padding: 0.5rem;
          }

          .prose img {
            border-radius: 0.5rem;
          }
        }

        html {
          scroll-behavior: smooth;
        }

        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 5px;
        }


        @media (max-width: 768px) {
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
        }
      `}</style>
    </div>
  );
};

export default BlogPreviewHome;
