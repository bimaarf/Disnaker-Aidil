import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Calendar,
  User,
  Eye,
  Heart,
  Share2,
  Bookmark,
  Home,
  FileText,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Star,
  Play,
} from "lucide-react";
import { fetchEvent } from "../../../../../features/event/eventSlice";
import { CircularLoader } from "../../../../../Components/_CircularLoader";

import "../../../../../index.css";
import useScrollRestoration from "../../../../../Components/_scrollRestoration";

const EventPreviewHome = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const publicEvents = useSelector((state) => state.events.publicEvents);
  useScrollRestoration()
  // const { search } = useLocation();

  // useEffect(() => {
  //   const params = new URLSearchParams(search);
  //   if (params.get("isTop") === "true") {
  //     window.scrollTo({ top: 0, behavior: "smooth" });
  //   }
  // }, [search]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageExpanded, setImageExpanded] = useState(false);

  // Memoized computed values
  const selectedImage = useMemo(() => {
    if (!data?.images?.length) return null;
    return data.images[selectedImageIndex] || data.images[0];
  }, [data?.images, selectedImageIndex]);

  const primaryImageIndex = useMemo(() => {
    if (!data?.images?.length) return 0;
    const primaryIndex = data.images.findIndex((img) => img.is_primary === 1);
    return primaryIndex !== -1 ? primaryIndex : 0;
  }, [data?.images]);

  // Initialize selected image to primary image
  useEffect(() => {
    if (data?.images?.length && primaryImageIndex !== selectedImageIndex) {
      setSelectedImageIndex(primaryImageIndex);
    }
  }, [data?.images, primaryImageIndex]);

  // Fetch event data
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);

        // Check cache first
        const cachedEvent = publicEvents.find((event) => event.key === key);
        if (cachedEvent?.status) {
          setData(cachedEvent);
          setLoading(false);
          return;
        }

        // Fetch from API
        const eventData = await dispatch(fetchEvent({ key })).unwrap();
        setData(eventData);
        setLoading(false);
      } catch (err) {
        const errorMessage =
          err?.message?.includes("404") || err?.message?.includes("not found")
            ? "Event tidak ditemukan atau tidak dapat diakses."
            : "Gagal memuat data event.";

        toast.error(errorMessage);
        setLoading(false);
        navigate("/events?isTop=true");
      }
    };

    if (key) {
      fetchEventData();
    }
  }, [key, dispatch, publicEvents, navigate]);
  const handleCategoryClick = (category) => {
    // Navigate ke halaman detail kategori atau category
    // return null;
    navigate(`/events/category/${category.key}?isTop=true`, {
      state: { category: category },
    });
  };
  // Event handlers
  const handleImageSelect = useCallback((index) => {
    setSelectedImageIndex(index);
  }, []);

  const handlePrevImage = useCallback(() => {
    if (!data?.images?.length) return;
    setSelectedImageIndex((prev) =>
      prev === 0 ? data.images.length - 1 : prev - 1
    );
  }, [data?.images?.length]);

  const handleNextImage = useCallback(() => {
    if (!data?.images?.length) return;
    setSelectedImageIndex((prev) =>
      prev === data.images.length - 1 ? 0 : prev + 1
    );
  }, [data?.images?.length]);

  const toggleImageSize = useCallback(() => {
    setImageExpanded((prev) => !prev);
  }, []);

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

  // Utility functions
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
      ? `${process.env.REACT_APP_API}${image.image_data}`
      : "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=400&fit=crop";
  }, []);

  if (loading) {
    return <CircularLoader />;
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="text-center p-8 bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            Event tidak ditemukan
          </h2>
          <button
            onClick={() => navigate("/events?isTop=true")}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg text-white px-8 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105">
            Kembali ke Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate("/")}
                className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors">
                <Home className="w-5 h-5" />
                <span className="font-medium hidden sm:inline">Home</span>
              </button>
              <span className="text-gray-300">•</span>
              <button
                onClick={() => navigate("/events?isTop=true")}
                className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors">
                <FileText className="w-5 h-5" />
                <span className="font-medium hidden sm:inline">Events</span>
              </button>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Kembali</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Majoo-style design */}
      <section className="relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-200/50 rounded-full backdrop-blur-sm">
                <Star className="w-4 h-4 text-orange-600 mr-2" />
                <span className="text-orange-700 font-medium text-sm">
                  Featured Event
                </span>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  <span className="bg-gradient-to-r from-orange-600 via-red-600 to-yellow-600 bg-clip-text text-transparent">
                    {data.name}
                  </span>
                </h1>
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-500" />
                  <span className="font-medium">
                    {data.author?.name || "Tim Enggang Foundation"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  <span className="font-medium">
                    {formatDate(data.created_at)}
                  </span>
                </div>
                {data.views > 0 && (
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-orange-500" />
                    <span className="font-medium">{data.views} views</span>
                  </div>
                )}
              </div>

              {/* Description Preview */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <p className="text-gray-700 leading-relaxed text-lg">
                  {data.description?.replace(/<[^>]*>/g, "").substring(0, 200) +
                    "..."}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <button className="flex items-center gap-3 bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Play className="w-5 h-5" />
                  Lihat Detail
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-3 bg-white/80 backdrop-blur-sm text-orange-700 px-8 py-4 rounded-2xl font-semibold border border-orange-200 hover:bg-white transition-all duration-300 hover:shadow-lg">
                  <Share2 className="w-5 h-5" />
                  Bagikan
                </button>
              </div>
            </div>

            {/* Right Content - Image Gallery */}
            <div className="relative">
              {/* Main Image */}
              {selectedImage && (
                <div className="relative group">
                  <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                    <img
                      src={getImageUrl(selectedImage)}
                      alt={data.name}
                      className={`w-full object-cover transition-all duration-500 ${
                        imageExpanded ? "h-96" : "h-80"
                      }`}
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=400&fit=crop";
                      }}
                    />

                    {/* Overlay Controls */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {/* Image Controls */}
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button
                          onClick={toggleImageSize}
                          className="bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white rounded-full p-3 transition-all duration-200 hover:scale-110">
                          {imageExpanded ? (
                            <ZoomOut className="w-5 h-5" />
                          ) : (
                            <ZoomIn className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {/* Navigation */}
                      {data.images?.length > 1 && (
                        <>
                          <button
                            onClick={handlePrevImage}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white rounded-full p-3 transition-all duration-300 hover:scale-110">
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleNextImage}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white rounded-full p-3 transition-all duration-300 hover:scale-110">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}

                      {/* Counter */}
                      {data.images?.length > 1 && (
                        <div className="absolute bottom-4 left-4 bg-black/30 backdrop-blur-sm text-white px-4 py-2 rounded-full font-medium">
                          {selectedImageIndex + 1} / {data.images.length}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Floating Elements */}
                  {data.views > 0 && (
                    <div className="absolute -bottom-6 -right-6 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl p-4 shadow-xl backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        <div>
                          <div className="font-bold text-lg">{data.views}</div>
                          <div className="text-sm opacity-90">Views</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="absolute -top-6 -left-6 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-2xl p-4 shadow-xl backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      <div>
                        <div className="font-bold text-sm">
                          {formatDate(data.created_at)}
                        </div>
                        <div className="text-sm opacity-90">Published</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Thumbnail Gallery */}
              {data.images?.length > 1 && (
                <div className="flex gap-3 mt-4 py-4 justify-center overflow-x-auto">
                  {data.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => handleImageSelect(index)}
                      className={`relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden transition-all duration-300 ${
                        selectedImageIndex === index
                          ? "ring-4 ring-orange-500 ring-offset-2 scale-110 shadow-lg"
                          : "hover:scale-105 opacity-70 hover:opacity-100 border-2 border-gray-200/50"
                      }`}>
                      <img
                        src={getImageUrl(image)}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=80&h=80&fit=crop";
                        }}
                      />
                      {selectedImageIndex === index && (
                        <div className="absolute inset-0 flex items-center justify-center bg-orange-600/20">
                          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-md">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="relative py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Categories */}
          {data.categories?.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-12 justify-center">
              {data.categories.map((category) => (
                <span
                  onClick={() => handleCategoryClick(category)}
                  key={category.id}
                  className="inline-flex items-center cursor-pointer px-6 py-3 rounded-full bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 font-medium border border-orange-200/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                  {category.name}
                </span>
              ))}
            </div>
          )}

          {/* Main Content */}
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
            <section className="relative py-20">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 force-light">
                <div
                  className="prose prose-lg max-w-none quill-content"
                  dangerouslySetInnerHTML={{ __html: data.description }}
                />
              </div>
            </section>

            {/* Author Section */}
            <div className="bg-gradient-to-r from-orange-50/80 to-red-50/80 backdrop-blur-sm border-t border-white/30 p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                {/* Author Info */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {data.author?.avatar ? (
                      <img
                        src={`${process.env.REACT_APP_API}user/images/${data.author.avatar}`}
                        alt={`${data.author.name}'s avatar`}
                        className="w-16 h-16 rounded-2xl object-cover shadow-lg ring-4 ring-white/80"
                        onError={(e) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face";
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {data.author?.name?.charAt(0) || "T"}
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {data.author?.name || "Tim Enggang Foundation"}
                    </h3>
                    <p className="text-orange-600 font-medium mb-1">
                      {data.author?.role || "Program Coordinator"}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Dipublikasikan {formatDate(data.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-6 py-3 bg-white/80 hover:bg-white rounded-xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 group">
                    <Share2 className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-gray-700">Share</span>
                  </button>

                  <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                    <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Like</span>
                  </button>

                  <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                    <Bookmark className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Save</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-red-600 to-yellow-600"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-xl animate-blob"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Tertarik dengan event ini?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Jangan lewatkan kesempatan untuk mengikuti event menarik ini
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-3 bg-white text-orange-600 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <Share2 className="w-5 h-5" />
              Bagikan Event
            </button>
            <button
              onClick={() => navigate("/events?isTop=true")}
              className="flex items-center justify-center gap-3 bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-bold text-lg border border-white/30 hover:bg-white/30 transition-all duration-300">
              <Calendar className="w-5 h-5" />
              Event Lainnya
            </button>
          </div>
        </div>
      </section>

      {/* Floating Heart Button */}
      {/* <div className="fixed bottom-4 right-3 z-40">
        <button className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 animate-bounce">
          <Heart className="w-6 h-6" />
        </button>
      </div> */}

      {/* Custom Styles */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .prose {
          color: inherit;
        }
        
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          margin-top: 2em;
          margin-bottom: 1em;
          background: linear-gradient(135deg, #ea580c, #dc2626);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .prose p {
          margin-bottom: 1.5em;
          line-height: 1.8;
        }
        
        .prose img {
          border-radius: 1rem;
          margin: 2em 0;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .prose ul, .prose ol {
          margin: 1.5em 0;
          padding-left: 2em;
        }
        
        .prose li {
          margin: 0.75em 0;
          position: relative;
        }
        
        .prose li::marker {
          color: #ea580c;
        }
        
        @media (max-width: 640px) {
          .prose {
            font-size: 0.9rem;
          }
          
          .prose h1 { font-size: 1.75rem; }
          .prose h2 { font-size: 1.5rem; }
          .prose h3 { font-size: 1.25rem; }
        }
      `}</style>
    </div>
  );
};

export default EventPreviewHome;
