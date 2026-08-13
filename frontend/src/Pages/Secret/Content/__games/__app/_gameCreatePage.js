import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import TopBarProgress from "react-topbar-progress-indicator";
import { createGame } from "../../../../../features/games/gameSlice";
import { fetchAllCategories } from "../../../../../features/categories/categoriesSlice";

const GameCreatePage = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true); // true for visible, false for hidden
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const categories = useSelector(
    (state) => state.categories.allCategories || []
  );
  const [category, setCategory] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((state) => state.games);
  useEffect(() => {
    const getCategories = async () => {
      setLoading(true);
      try {
        await dispatch(fetchAllCategories()).unwrap();
      } catch (error) {
        console.error("Failed to fetch categories data:", error);
      } finally {
        setLoading(false);
      }
    };
    getCategories();
  }, [dispatch]);
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("Selected file type:", file.type); // Log the file type
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImage(null);
      setImagePreview("");
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("status", status ? "1" : "0");
    formData.append("category_id", category);

    if (image) {
      formData.append("image", image);
    }

    console.log(
      "FormData entries before dispatch:",
      Array.from(formData.entries())
    ); // Log FormData

    try {
      await dispatch(createGame(formData)).unwrap();
      navigate("/games/create");
      toast.success("Game created successfully!");
    } catch (err) {
      toast.error("Validation error occurred. Please check the fields.");
    } finally {
      setLoading(false);
    }
  };

  const toolbarOptions = [
    ["bold", "italic", "underline", "strike"],
    ["blockquote", "code-block"],
    ["link", "image", "video", "formula"],
    [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
    [{ script: "sub" }, { script: "super" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ direction: "rtl" }],
    [{ size: ["small", false, "large", "huge"] }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ color: [] }, { background: [] }],
    [{ font: [] }],
    [{ align: [] }],
    ["clean"],
  ];

  const modules = {
    toolbar: toolbarOptions,
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "indent",
    "align",
    "link",
    "image",
    "blockquote",
    "code-block",
    "script",
    "direction",
    "size",
    "color",
    "background",
    "font",
  ];
  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
  };

  const renderErrorMessages = (error) => {
    if (typeof error === "object" && error !== null) {
      return Object.keys(error).map((key) => {
        const messages = error[key];
        if (Array.isArray(messages)) {
          return messages.map((message, index) => (
            <div key={index} className="error-message">
              {message}
            </div>
          ));
        }
        return null; // In case messages is not an array
      });
    }
    return null; // In case error is not an object
  };

  return (
    <>
      {loading && <TopBarProgress />}
      <div className="bg-gradient-to-br from-transparent via-black to-black min-h-screen overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-control">
            <label className="label text-pretty">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`input input-bordered w-full ${
                error?.title ? "border-red-500" : ""
              }`}
              required
            />
            {error?.title && (
              <div className="text-red-500">{error.title.join(", ")}</div>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            {categories &&
              categories.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    id={`categories-${item.id}`}
                    type="radio"
                    name="role"
                    value={item.id}
                    onChange={handleCategoryChange}
                    className="radio radio-primary"
                  />
                  <label
                    className="label cursor-pointer"
                    htmlFor={`categories-${item.id}`}>
                    {item.name}
                  </label>
                </div>
              ))}
          </div>
          <div className="form-control">
            <label className="label text-pretty">Description</label>
            <ReactQuill
              value={description}
              onChange={setDescription}
              modules={modules}
              formats={formats}
              theme="snow"
              className={`react-quill ${
                error?.description ? "border-red-500" : ""
              }`}
            />
            {error?.description && (
              <div className="text-red-500">{error.description.join(", ")}</div>
            )}
          </div>
          <div className="form-control">
            <label className="label text-pretty">Visibility</label>
            <label className="swap">
              <input
                type="checkbox"
                checked={status}
                onChange={() => setStatus(!status)}
              />
              <div className="swap-on">Online</div>
              <div className="swap-off">Offline</div>
            </label>
            {error?.status && (
              <div className="text-red-500">{error.status.join(", ")}</div>
            )}
          </div>
          <div className="form-control">
            <label className="label text-pretty">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="file-input file-input-bordered w-full"
            />
            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-xs max-h-64 object-cover"
                />
              </div>
            )}
          </div>
          {renderErrorMessages()}
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}>
            {loading ? "Creating..." : "Create Game"}
          </button>
        </form>
      </div>
    </>
  );
};

export default GameCreatePage;
