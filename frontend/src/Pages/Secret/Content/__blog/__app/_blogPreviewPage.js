import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Edit,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  Calendar,
  Tag,
  FileText,
  AlertCircle,
} from "lucide-react";
import { fetchBlog } from "../../../../../features/blog/blogSlice";
import { CircularLoader } from "../../../../../Components/_CircularLoader";

const BlogPreviewPage = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const blogs = useSelector((state) => state.blogs.blogs);
  const status = useSelector((state) => state.blogs.status);
  const user = useSelector((state) => state.auth.user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    console.log("BlogPreviewPage: key from useParams:", key);
    console.log("BlogPreviewPage: blogs in state:", blogs);

    const fetchBlogData = async () => {
      // Validate key
      if (!key || key === "undefined" || key.trim() === "") {
        console.error("Invalid blog key:", key);
        toast.error("Invalid blog URL. Please select a valid blog.");
        navigate("/blogs");
        setLoading(false);
        return;
      }

      try {
        // Check cache for blog
        const cachedBlog = blogs.find((blog) => blog.key === key);
        if (cachedBlog) {
          console.log("Using cached blog:", cachedBlog);
          setData(cachedBlog);
          const primaryImage =
            cachedBlog?.images?.find(
              (image) => image.is_primary === 1 || image.is_primary === "1"
            ) || cachedBlog?.images?.[0];
          setSelectedImage(primaryImage);
          setLoading(false);
          return;
        }

        // Fetch blog without isPublic for admin panel
        const blogData = await dispatch(fetchBlog({ key })).unwrap();
        console.log("Fetched blog data:", blogData);
        setData(blogData);
        const primaryImage =
          blogData?.images?.find(
            (image) => image.is_primary === 1 || image.is_primary === "1"
          ) || blogData?.images?.[0];
        setSelectedImage(primaryImage);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching blog:", err);
        const errorMessage =
          err?.message?.includes("404") || err?.message?.includes("not found")
            ? "Blog not found or not accessible."
            : "Failed to load blog data.";
        toast.error(errorMessage);
        navigate("/blogs");
        setLoading(false);
      }
    };

    fetchBlogData();
  }, [key, dispatch, blogs, navigate]);

  const handleImageSelect = (image) => {
    setSelectedImage(image);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Invalid Date"
      : date.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };

  const handleEditData = (data) => {
    navigate(`/blog/update/${data.key}`, {
      state: { key: data.key, dataProps: data },
    });
  };

  if (loading && status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100 dark:bg-base-200">
        <CircularLoader />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header Navigation */}
      <div className="navbar bg-base-100 dark:bg-base-200 max-w-7xl mx-auto rounded shadow-sm backdrop-blur-sm">
        <div className="navbar-start">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
        <div className="navbar-center">
          <span className="text-sm font-medium text-base-content/60">
            Blog Preview
          </span>
        </div>
        <div className="navbar-end">
          <button
            onClick={() => handleEditData(data)}
            className="btn btn-primary btn-sm gap-2"
            disabled={!user?.role === 'super admin'}>
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-7xl bg-base-100 dark:bg-base-200 mt-3 rounded-xl shadow-sm backdrop-blur-sm">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Image Gallery Section */}
          <div className="space-y-4 lg:col-span-2">
            {/* Main Image */}
            <div className="aspect-video lg:aspect-square bg-base-200 rounded-2xl overflow-hidden shadow-sm border border-base-300">
              {selectedImage ? (
                <img
                  src={`${selectedImage.image_data}`}
                  alt={data?.name || "Blog image"}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-base-content/40">
                  <ImageIcon className="w-16 h-16 mb-3" />
                  <p className="text-sm font-medium">No image available</p>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {data?.images && data.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {data.images.map((image) => (
                  <div
                    key={image.id}
                    onClick={() => handleImageSelect(image)}
                    className={`aspect-square bg-base-200 rounded-lg cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-primary ring-2 ${
                      selectedImage?.image_data === image.image_data
                        ? "ring-primary"
                        : "ring-base-300"
                    }`}>
                    <img
                      src={`${image.image_data}`}
                      alt={`Thumbnail ${image.id}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Blog Info Section */}
          <div className="space-y-6 lg:col-span-3">
            {/* Status & Meta */}
            <div className="space-y-3">
              {/* Status Badge */}
              <div className="flex items-center gap-3 flex-wrap">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                    data.status
                      ? "bg-success/10 text-success border border-success/20"
                      : "bg-warning/10 text-warning border border-warning/20"
                  }`}>
                  {data.status ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  <span>{data.status ? "Published" : "Draft"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-base-content/60">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Created {formatDate(data?.created_at)}</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-base-content leading-tight">
                {data?.name || "Untitled Blog Post"}
              </h1>

              {/* Meta Stats */}
              {/* <div className="flex items-center gap-4 text-sm text-base-content/60">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-lg bg-info/10 flex items-center justify-center">
                    <Eye className="w-3.5 h-3.5 text-info" />
                  </div>
                  <span className="font-medium">{data?.views || 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-lg bg-error/10 flex items-center justify-center">
                    <Heart className="w-3.5 h-3.5 text-error" />
                  </div>
                  <span className="font-medium">{data?.likes || 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Share2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="font-medium">{data?.shares || 0}</span>
                </div>
              </div> */}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleEditData(data)}
                className="flex-1 btn btn-primary gap-2"
                disabled={!user?.role === 'super admin'}>
                <Edit className="w-4 h-4" />
                <span>Edit Post</span>
              </button>
              {/* <button className="btn btn-outline gap-2">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button className="btn btn-outline btn-square">
                <Heart className="w-4 h-4" />
              </button> */}
            </div>

            {/* Details Section */}
            <div className="bg-primary/5 dark:bg-base-300 rounded-xl border border-primary/10 dark:border-base-300 p-5 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>Details</span>
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-base-content/60 text-xs">Status:</span>
                  <p className="font-semibold text-base-content mt-1">
                    {data.status ? "Published" : "Draft"}
                  </p>
                </div>
                <div>
                  <span className="text-base-content/60 text-xs">Created:</span>
                  <p className="font-semibold text-base-content mt-1">
                    {formatDate(data?.created_at)}
                  </p>
                </div>
                <div>
                  <span className="text-base-content/60 text-xs">
                    Category:
                  </span>
                  <p className="font-semibold text-base-content mt-1">
                    {data?.categories?.[0]?.name || "Uncategorized"}
                  </p>
                </div>
                <div>
                  <span className="text-base-content/60 text-xs">Type:</span>
                  <p className="font-semibold text-base-content mt-1">
                    Article
                  </p>
                </div>
              </div>
            </div>

            {/* Tags Section */}
            {data?.categories && data.categories.length > 0 && (
              <div className="bg-primary/5 dark:bg-base-300 rounded-xl border border-primary/10 dark:border-base-300 p-5 space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  <span>Tags</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.categories.map((category) => (
                    <span
                      key={category.id}
                      className="badge badge-primary badge-lg px-3 py-3 gap-1.5">
                      <Tag className="w-3 h-3" />
                      <span>{category.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="mt-8 lg:mt-12">
          <div className="bg-base-200 dark:bg-base-300 rounded-xl border border-base-300 p-6 lg:p-8 space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span>Content</span>
            </h3>

            {data?.description ? (
              <div
                className="prose prose-sm sm:prose-base max-w-none text-base-content/80 leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>h1]:text-2xl [&>h2]:text-xl [&>h3]:text-lg [&>h4]:text-base [&>h5]:text-sm [&>h6]:text-xs [&>p]:mb-4 [&>ul]:mb-4 [&>ol]:mb-4 [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&>a]:text-primary [&>a]:underline"
                dangerouslySetInnerHTML={{ __html: data.description }}
              />
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-base-200 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-neutral" />
                </div>
                <p className="text-base-content/60 font-semibold mb-1">
                  No content available
                </p>
                <p className="text-sm text-base-content/40">
                  {`This blog post doesn't have any content yet`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPreviewPage;
