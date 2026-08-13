import { Calendar, Search, TrendingUp } from "lucide-react";
import React, { memo, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchPublicBlogs } from "../features/blog/blogSlice";
import { truncateHTML } from "../Context/__useTruncate";

// // Utility functions

const stripHtml = (html) => {
  if (!html) return "";
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
};

// Recent Blog Card Component
const RecentBlogCard = memo(({ blog, onBlogClick }) => {
  const primaryImage = useMemo(
    () =>
      blog?.images?.find((image) => image.is_primary === 1) ||
      blog?.images?.[0],
    [blog?.images]
  );

  const imageSrc = primaryImage
    ? primaryImage.image_data
    : "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&h=150&fit=crop";

  return (
    <article
      onClick={() => onBlogClick(blog)}
      className="group w-full max-w-screen-sm flex gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-all duration-300 border border-transparent hover:border-gray-200">
      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-20 h-20 overflow-hidden rounded-lg">
        <img
          src={imageSrc}
          alt={blog.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&h=150&fit=crop";
          }}
        />
        {(blog.views > 500 || blog.featured) && (
          <div className="absolute top-1 right-1 bg-gradient-to-r from-[#2F2F2F] to-[#2d3166] text-white px-1.5 py-0.5 rounded text-xs font-bold">
            <TrendingUp className="w-2.5 h-2.5" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-[#2F2F2F] transition-colors leading-tight mb-1">
          {blog.name}
        </h3>
        <div
          className="max-w-none text-xs text-gray-600 prose-bold force-light-mode text-justify"
          dangerouslySetInnerHTML={{
            __html: truncateHTML(blog.description, 24),
          }}
        />

        <div className="flex items-center gap-2 text-[12px] text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(blog.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
});
RecentBlogCard.displayName = "RecentBlogCard";

// Main Recent Blog Component
export const RecentBlogSidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { publicBlogs, publicStatus: status } = useSelector(
    (state) => state.blogs
  );

  const [searchQuery, setSearchQuery] = useState("");

  // Fetch blogs on mount
  useEffect(() => {
    if (status === "idle") {
      dispatch(
        fetchPublicBlogs({
          page: 1,
          perPage: 10,
          searchQuery: "",
          fromDate: "",
          toDate: "",
        })
      );
    }
  }, [dispatch, status]);

  // Filter and limit blogs
  const recentBlogs = useMemo(() => {
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
    return filtered.slice(0, 5);
  }, [publicBlogs, searchQuery]);

  // Handle blog click
  const handleBlogClick = (blog) => {
    navigate(`/blog/${blog.key}?isTop=true`, { state: { blog } });
  };

  return (
    <>
      <div className="my-6 print-hidden">
        <div className="flex items-center gap-2 text-sm text-white bg-gradient-to-r from-[#1F1F1F] via-[#2F2F2F] to-[#1F1F1F] backdrop-blur-sm px-4 py-3 rounded shadow-sm overflow-x-auto ">
          <span
            className="hover:text-primary cursor-pointer transition-colors whitespace-nowrap text-white hover:text-primary"
            onClick={() => navigate("/blogs")}>
            Artikel Terbaru
          </span>
        </div>
      </div>
      <div className="bg-white rounded shadow-sm backdrop-blur-sm overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari berita..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm text-gray-700 bg-gray-50 rounded border border-gray-300 focus:border-[#2F2F2F] outline-none transition-all landing-input"
            />
          </div>
        </div>

        {/* Blog List */}
        <div className="divide-y divide-gray-100">
          {status === "loading" && (
            <div className="flex justify-center items-center py-8">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 border-3 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-3 border-[#2F2F2F] border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          )}

          {status === "succeeded" && recentBlogs.length > 0 && (
            <>
              {recentBlogs.slice(0, 5).map((blog) => (
                <RecentBlogCard
                  key={blog.id}
                  blog={blog}
                  onBlogClick={handleBlogClick}
                />
              ))}
            </>
          )}

          {status === "succeeded" && recentBlogs.length === 0 && (
            <div className="text-center py-8 px-4">
              <p className="text-sm text-gray-500">
                {searchQuery
                  ? "Tidak ada berita ditemukan"
                  : "Belum ada berita terbaru"}
              </p>
            </div>
          )}

          {status === "failed" && (
            <div className="text-center py-8 px-4">
              <p className="text-sm text-red-500">Gagal memuat berita</p>
            </div>
          )}
        </div>

        {/* View All Button */}
        {recentBlogs.length > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => navigate("/blogs")}
              className="w-full text-center text-sm font-semibold text-[#2F2F2F] hover:text-[#2d3166] transition-colors py-2">
              Lihat Semua Berita →
            </button>
          </div>
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
    </>
  );
};
