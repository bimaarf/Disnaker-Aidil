import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchBlogs } from "../../features/enggang/blogSlice";
import { useNavigate } from "react-router-dom";
import { truncateText } from "../../Context/__useTruncate";

export const BlogGrid = () => {
  const dispatch = useDispatch();
  const { blogs, status, error, total } = useSelector((state) => state.blogs);
  const logo = useSelector((state) => state.logos.logos);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchBlogs({ page, perPage: 10 }));
  }, [dispatch, page]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    dispatch(fetchBlogs({ page: nextPage, perPage: 10 }));
  };

  const hasMore = blogs.length < total;

  return (
    <div className="py-12 md:py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Latest Posts</h1>
        <div className="w-12 h-1 bg-indigo-600 mt-2 rounded-full"></div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {blogs.map((blog) => {
          const primaryImage =
            blog?.images?.find((image) => image.is_primary === 1) ||
            blog?.images?.[0];

          return (
            <div
              key={blog.id}
              onClick={() => navigate(`/blog/${blog.key}`, { state: { blog } })}
              className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              {/* Image Section */}
              <div className="relative h-48 overflow-hidden">
                {primaryImage ? (
                  <img
                    src={`${process.env.REACT_APP_API}${primaryImage.image_data}`}
                    alt={blog.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
                {/* Logo Overlay */}
                <div className="absolute top-2 left-2 flex items-center gap-2 bg-indigo-800/80 px-2 py-1 rounded-full">
                  <img
                    src={`${process.env.REACT_APP_API}logo/images/${logo?.image}`}
                    alt="MAN 1 Ketapang Logo"
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="text-white text-xs font-medium hidden sm:block">
                    MAN 1 Ketapang
                  </span>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-4">
                {/* Categories */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {blog.categories?.map((category) => (
                    <span
                      key={category.id}
                      className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                      {category?.name || "Uncategorized"}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {blog.name}
                </h2>

                {/* Description */}
                <div
                  className="text-sm text-gray-600 line-clamp-2 prose"
                  dangerouslySetInnerHTML={{
                    __html: truncateText(blog?.description, 50),
                  }}
                />

                {/* Meta Info */}
                <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
                  <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    <i className="fa-solid fa-eye"></i>
                    <span>{blog.views || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading/Error States */}
      {status === "loading" && (
        <div className="flex justify-center mt-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600"></div>
        </div>
      )}

      {status === "failed" && (
        <div className="text-red-500 text-center mt-8">Error: {error}</div>
      )}

      {/* Load More Button */}
      {status !== "loading" && hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default BlogGrid;
