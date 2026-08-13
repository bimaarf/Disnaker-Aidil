import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fetchEvent } from "../../../../../features/event/eventSlice";
import { CircularLoader } from "../../../../../Components/_CircularLoader";

const EventPreviewPage = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const events = useSelector((state) => state.events.events); // Use state.events.events
  const status = useSelector((state) => state.events.status);
  const user = useSelector((state) => state.auth.user); // Assuming auth state
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    console.log("EventPreviewPage: key from useParams:", key); // Debug log
    console.log("EventPreviewPage: events in state:", events); // Debug log

    const fetchEventData = async () => {
      // Validate key
      if (!key || key === "undefined" || key.trim() === "") {
        console.error("Invalid event key:", key);
        toast.error("Invalid event URL. Please select a valid event.");
        navigate("/events");
        setLoading(false);
        return;
      }

      try {
        // Check cache for event
        const cachedEvent = events.find((event) => event.key === key);
        if (cachedEvent) {
          console.log("Using cached event:", cachedEvent);
          setData(cachedEvent);
          const primaryImage =
            cachedEvent?.images?.find(
              (image) => image.is_primary === 1 || image.is_primary === "1"
            ) || cachedEvent?.images?.[0];
          setSelectedImage(primaryImage);
          setLoading(false);
          return;
        }

        // Fetch event without isPublic for admin panel
        const eventData = await dispatch(fetchEvent({ key })).unwrap();
        console.log("Fetched event data:", eventData);
        setData(eventData);
        const primaryImage =
          eventData?.images?.find(
            (image) => image.is_primary === 1 || image.is_primary === "1"
          ) || eventData?.images?.[0];
        setSelectedImage(primaryImage);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching event:", err);
        const errorMessage =
          err?.message?.includes("404") || err?.message?.includes("not found")
            ? "Event not found or not accessible."
            : "Failed to load event data.";
        toast.error(errorMessage);
        navigate("/events");
        setLoading(false);
      }
    };

    fetchEventData();
  }, [key, dispatch, events, navigate]);

  const handleImageSelect = (image) => {
    setSelectedImage(image);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
  };

  const handleEditData = (data) => {
    navigate(`/event/update/${data.key}`, {
      state: { key: data.key, dataProps: data },
    });
  };

  if (loading && status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <CircularLoader />
      </div>
    );
  }

  if (!data) {
    return null; // Prevent rendering until redirect handles error
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header Navigation */}
      <div className="navbar bg-base-100 shadow-sm border-b border-base-300 sticky top-0 z-40">
        <div className="navbar-start">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>
        </div>
        <div className="navbar-center">
          <span className="text-sm text-base-content/60">Event Preview</span>
        </div>
        <div className="navbar-end">
          <button
            onClick={() => handleEditData(data)}
            className="btn btn-primary text-white btn-sm gap-2"
            disabled={!user?.is_super_admin} // Only super admins can edit
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Edit
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery Section */}
          <div className="space-y-4 rounded-2xl">
            {/* Main Image */}
            <div className="aspect-square bg-base-200 rounded-2xl overflow-hidden shadow-sm border border-base-300">
              {selectedImage ? (
                <img
                  src={`${process.env.REACT_APP_API}${selectedImage.image_data}`}
                  alt={data?.name || "Event image"}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 rounded-2xl"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-base-content/40">
                  <span className="material-symbols-outlined text-6xl mb-2">
                    image
                  </span>
                  <p className="text-sm">No image available</p>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 gap-2">
              {data?.images?.map((image) => (
                <div
                  key={image.id}
                  onClick={() => handleImageSelect(image)}
                  className={`aspect-square bg-base-200 rounded-lg cursor-pointer hover:ring-primary ring-2 ${
                    selectedImage?.image_data === image.image_data
                      ? "ring-primary"
                      : "ring-base-300"
                  }`}>
                  <div className="w-full h-full flex items-center justify-center">
                    <img
                      src={`${process.env.REACT_APP_API}${image.image_data}`}
                      alt={`Thumbnail ${image.id}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Product Info Section */}
          <div className="space-y-6">
            {/* Title & Status */}
            <div className="space-y-3">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <div
                  className={`badge badge-${
                    data.status ? "success" : "warning"
                  } gap-2`}>
                  <span className="material-symbols-outlined text-xs">
                    {data.status ? "check_circle" : "pending"}
                  </span>
                  {data.status ? "Published" : "Draft"}
                </div>
                <span className="text-xs text-base-content/60">
                  Created {formatDate(data?.created_at)}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl lg:text-3xl font-bold text-base-content leading-tight">
                {data?.name || "Untitled Event Post"}
              </h1>

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-sm text-base-content/60">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">
                    visibility
                  </span>
                  <span>{data?.views || 0} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">
                    favorite
                  </span>
                  <span>{data?.likes || 0} likes</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">
                    share
                  </span>
                  <span>{data?.shares || 0} shares</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleEditData(data)}
                className="btn btn-primary text-white flex-1 gap-2"
                disabled={!user?.is_super_admin}>
                <span className="material-symbols-outlined">edit</span>
                Edit Post
              </button>
              <button className="btn btn-outline gap-2">
                <span className="material-symbols-outlined">share</span>
                Share
              </button>
              <button className="btn btn-outline btn-square">
                <span className="material-symbols-outlined">favorite</span>
              </button>
            </div>

            {/* Content Section */}
            <div className="space-y-4">
              {/* Additional Info */}
              <div className="space-y-4">
                <div className="border-t border-base-300 pt-6">
                  <h3 className="text-lg font-semibold mb-3">Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-base-content/60">Status:</span>
                      <p className="font-medium">
                        {data.status ? "Published" : "Draft"}
                      </p>
                    </div>
                    <div>
                      <span className="text-base-content/60">Created:</span>
                      <p className="font-medium">
                        {formatDate(data?.created_at)}
                      </p>
                    </div>
                    <div>
                      <span className="text-base-content/60">Category:</span>
                      <p className="font-medium">
                        {data?.categories?.[0]?.name || "Uncategorized"}
                      </p>
                    </div>
                    <div>
                      <span className="text-base-content/60">Type:</span>
                      <p className="font-medium">Article</p>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="border-t border-base-300 pt-6">
                  <h3 className="text-lg font-semibold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {data?.categories?.map((category) => (
                      <span key={category.id} className="badge badge-neutral">
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="mt-12 border-t border-base-300 pt-8">
          <div className="border-t border-base-300 pt-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                description
              </span>
              Content
            </h3>

            <div className="bg-base-100 rounded-xl p-4 border border-base-300">
              {data?.description ? (
                <div
                  className="prose prose-sm quill-content max-w-none text-base-content/80 leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                  dangerouslySetInnerHTML={{ __html: data.description }}
                />
              ) : (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl opacity-20 mb-2 block">
                    description
                  </span>
                  <p className="text-base-content/50">No content available</p>
                  <p className="text-sm text-base-content/30 mt-1">
                    {`This events or programs post doesn't have any content yet`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPreviewPage;
