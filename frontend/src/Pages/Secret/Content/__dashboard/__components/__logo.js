import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  fetchLogos,
  uploadLogo,
} from "../../../../../features/LandingPages/logoSlice";
import { selectUser } from "../../../../../features/authentication/AuthSlice";

export const Logo = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const logos = useSelector((state) => state.logos.logos);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [bgPreviewUrl, setBgPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  // State untuk app_title dan app_body
  const [appTitle, setAppTitle] = useState("");
  const [appBody, setAppBody] = useState("");
  const [isSavingText, setIsSavingText] = useState(false);

  // ReactQuill modules configuration
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ["link"],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "color",
    "background",
    "align",
    "link",
    "image",
  ];

  // Fetch logo data on mount
  useEffect(() => {
    const getLogo = async () => {
      try {
        await dispatch(fetchLogos()).unwrap();
      } catch (error) {
        console.error("Failed to fetch logo data:", error);
      }
    };
    getLogo();
  }, [dispatch]);

  // Update local state when logos data changes
  useEffect(() => {
    if (logos) {
      setAppTitle(logos.app_title || "");
      setAppBody(logos.app_body || "");
    }
  }, [logos]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (bgPreviewUrl) URL.revokeObjectURL(bgPreviewUrl);
    };
  }, [previewUrl, bgPreviewUrl]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      handleUpload(file, "logo");
    } else {
      setPreviewUrl(null);
    }
  };

  const handleBgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setBgPreviewUrl(preview);
      handleUpload(file, "background");
    } else {
      setBgPreviewUrl(null);
    }
  };

  const handleUpload = async (imageFile, type) => {
    setLoading(true);

    try {
      if (imageFile) {
        const formData = new FormData();
        if (type === "logo") {
          formData.append("image", imageFile);
        } else {
          formData.append("background_header", imageFile);
        }
        await dispatch(uploadLogo(formData)).unwrap();
        toast.success(
          `${
            type === "logo" ? "Logo" : "Background header"
          } updated successfully.`
        );
        await dispatch(fetchLogos()).unwrap();
      }
    } catch (error) {
      toast.error(
        `Failed to update ${type === "logo" ? "logo" : "background header"}.`
      );
      console.error("Upload error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveText = async () => {
    setIsSavingText(true);

    try {
      const formData = new FormData();
      formData.append("app_title", appTitle);
      formData.append("app_body", appBody);

      await dispatch(uploadLogo(formData)).unwrap();
      toast.success("Application text updated successfully.");
      await dispatch(fetchLogos()).unwrap();
    } catch (error) {
      toast.error("Failed to update application text.");
      console.error("Save text error:", error);
    } finally {
      setIsSavingText(false);
    }
  };

  const renderLogoImage = () => {
    if (loading && previewUrl) {
      return (
        <div className="avatar placeholder">
          <div className="bg-neutral text-neutral-content rounded-full w-20 h-20 animate-pulse">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        </div>
      );
    }

    if (previewUrl) {
      return (
        <div className="avatar">
          <div className="ring-primary ring-offset-base-100 w-20 h-20 rounded-full ring ring-offset-2 shadow-lg">
            <img
              src={previewUrl}
              alt="Preview Logo"
              className="object-cover rounded-full"
            />
          </div>
        </div>
      );
    }

    if (logos?.image) {
      return (
        <div className="avatar">
          <div className="ring-primary ring-offset-base-100 w-20 h-20 rounded-full ring ring-offset-2 shadow-lg">
            <img
              src={logos.image}
              alt="Current Logo"
              className="object-cover rounded-full"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="avatar placeholder">
        <div className="bg-gradient-to-br from-base-300 to-base-200 text-base-content rounded-full w-20 h-20 border-2 border-dashed border-base-300">
          <span className="material-symbols-outlined text-2xl opacity-60">
            image
          </span>
        </div>
      </div>
    );
  };

  const renderBackgroundPreview = () => {
    if (loading && bgPreviewUrl) {
      return (
        <div className="w-full h-32 bg-neutral animate-pulse rounded-lg flex items-center justify-center">
          <span className="loading loading-spinner loading-md"></span>
        </div>
      );
    }

    if (bgPreviewUrl) {
      return (
        <div className="w-full h-32 rounded-lg overflow-hidden ring ring-primary ring-offset-2">
          <img
            src={bgPreviewUrl}
            alt="Preview Background"
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    if (logos?.background_header) {
      return (
        <div className="w-full h-32 rounded-lg overflow-hidden ring ring-primary ring-offset-2">
          <img
            src={logos.background_header}
            alt="Current Background"
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    return (
      <div className="w-full h-32 bg-gradient-to-br from-base-300 to-base-200 rounded-lg border-2 border-dashed border-base-300 flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl opacity-60">
          wallpaper
        </span>
      </div>
    );
  };

  const canEdit =
    user?.role === "super admin" || user?.role === "administrator";

  return (
    <div className="space-y-6">
      <div className="divider divider-primary">Logo Applications</div>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Logo Card */}
        <div className="card bg-base-100 dark:bg-base-200 shadow-md backdrop-blur-sm border border-base-200">
          <div className="card-body p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-shrink-0">{renderLogoImage()}</div>

              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-bold text-base-content mb-2">
                  Website Logo
                </h3>
                <p className="text-base-content/70 text-sm mb-4">
                  {logos?.image
                    ? "Current logo is displayed above"
                    : "No logo uploaded yet"}
                </p>

                {canEdit && (
                  <div className="flex justify-center sm:justify-start">
                    <label className="btn btn-primary btn-sm gap-2 cursor-pointer hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-base">
                        upload
                      </span>
                      {logos?.image ? "Update Logo" : "Upload Logo"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Background Header Card */}
        <div className="card bg-base-100 dark:bg-base-200 shadow-md backdrop-blur-sm border border-base-200">
          <div className="card-body p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-base-content mb-2">
                  Header Background
                </h3>
                <p className="text-base-content/70 text-sm mb-4">
                  {logos?.background_header
                    ? "Current background header is displayed below"
                    : "No background header uploaded yet"}
                </p>
              </div>

              {renderBackgroundPreview()}

              {canEdit && (
                <div className="flex justify-center sm:justify-start">
                  <label className="btn btn-primary btn-sm gap-2 cursor-pointer hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-base">
                      upload
                    </span>
                    {logos?.background_header
                      ? "Update Background"
                      : "Upload Background"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBgChange}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                </div>
              )}

              {loading && bgPreviewUrl && (
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="loading loading-spinner loading-xs"></span>
                  <span className="text-xs text-base-content/60">
                    Uploading background...
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Application Title & Body Card */}
        <div className="card bg-base-100 dark:bg-base-200 shadow-md backdrop-blur-sm border border-base-200">
          <div className="card-body p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-base-content mb-2">
                  Application Content
                </h3>
                <p className="text-base-content/70 text-sm mb-4">
                  Manage your application title and description
                </p>
              </div>

              {/* App Title Input */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Application Title
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Enter application title..."
                  className="input input-bordered w-full"
                  value={appTitle}
                  onChange={(e) => setAppTitle(e.target.value)}
                  disabled={!canEdit}
                />
              </div>

              {/* App Body ReactQuill */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Application Description
                  </span>
                </label>
                <div className="border-2 border-base-300 dark:border-base-600 rounded-xl overflow-hidden hover:border-primary transition-colors duration-200">
                  <ReactQuill
                    value={appBody}
                    onChange={setAppBody}
                    className="react-quill custom-quill bg-base-100"
                    modules={modules}
                    formats={formats}
                    placeholder="Enter application description..."
                    readOnly={!canEdit}
                    theme="snow"
                  />
                </div>
              </div>

              {/* Save Button */}
              {canEdit && (
                <div className="flex justify-end gap-2">
                  <button
                    className="btn btn-primary btn-sm gap-2"
                    onClick={handleSaveText}
                    disabled={isSavingText}>
                    {isSavingText ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">
                          save
                        </span>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Card */}
        {(appTitle || appBody) && (
          <div className="card bg-base-100 dark:bg-base-200 shadow-md backdrop-blur-sm border border-base-200">
            <div className="card-body p-6">
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-base-content">
                  Content Preview
                </h3>
                {appTitle && (
                  <div>
                    <h4 className="text-lg font-semibold text-primary">
                      {appTitle}
                    </h4>
                  </div>
                )}
                {appBody && (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: appBody }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Guidelines */}
        {user?.role === "super admin" && (
          <>
            <div className="divider divider-start text-xs opacity-50">
              Guidelines
            </div>
            <div className="bg-base-200/50 rounded-lg p-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Logo:</h4>
                  <ul className="text-xs text-base-content/60 space-y-1">
                    <li>• Size: 256x256px or larger</li>
                    <li>• Format: JPG, PNG, SVG, WebP</li>
                    <li>• Square images recommended</li>
                    <li>• Max size: 2MB</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Background Header:
                  </h4>
                  <ul className="text-xs text-base-content/60 space-y-1">
                    <li>• Size: 1920x400px recommended</li>
                    <li>• Format: JPG, PNG, WebP</li>
                    <li>• Wide landscape format</li>
                    <li>• Max size: 5MB</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold text-sm mb-2">Content Text:</h4>
                <ul className="text-xs text-base-content/60 space-y-1">
                  <li>• Title: Keep it concise and descriptive</li>
                  <li>
                    • Body: Use rich text formatting for better presentation
                  </li>
                  <li>• Preview shows how content will appear</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
