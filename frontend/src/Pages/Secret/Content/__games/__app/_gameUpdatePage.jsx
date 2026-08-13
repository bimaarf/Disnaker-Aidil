import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  fetchGame as fetch,
  updateGame,
} from "../../../../../features/games/gameSlice";
import useIsMobile from "../../../../../Context/__useIsMobile";
import { fetchAllCategories } from "../../../../../features/categories/categoriesSlice";

const GameUpdatePage = () => {
  const { key } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const dataProps = location.state?.dataProps;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("0");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const categories = useSelector(
    (state) => state.categories.allCategories || []
  );

  const [category, setCategory] = useState("");
  const isMobile = useIsMobile();
  useEffect(() => {
    if (dataProps) {
      setTitle(dataProps.title);
      setDescription(dataProps.description);
      setCategory(dataProps.category_id);
      setStatus(dataProps.status ? "1" : "0");
    } else if (key) {
      // Fetch game data if not provided through location state
      const fetchData = async () => {
        setLoading(true);
        try {
          const gameData = await dispatch(fetch(key)).unwrap();
          setTitle(gameData.title || "");
          setDescription(gameData.description || "");
          setCategory(category.id || "");
          setStatus(gameData.status ? "1" : "0");
        } catch (error) {
          console.error("Failed to fetch game data:", error);
          toast.error("Failed to fetch game data.");
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    } else {
      // Redirect to games page if no game data available
      dataProps ? (isMobile ? navigate(-2) : navigate(-1)) : navigate("/games");
    }
  }, [dispatch, key, dataProps, navigate]);

  useEffect(() => {
    const getRoles = async () => {
      setLoading(true);
      try {
        await dispatch(fetchAllCategories()).unwrap();
      } catch (error) {
        console.error("Failed to fetch categories data:", error);
      } finally {
        setLoading(false);
      }
    };
    getRoles();
  }, [dispatch]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("status", status);
    formData.append("category_id", category);
    if (image) {
      formData.append("image", image);
    }

    setLoading(true);
    try {
      await dispatch(updateGame({ key, gameData: formData })).unwrap();
      toast.success("Game updated successfully!");
      dataProps ? navigate(-1) : navigate("/games");
    } catch (error) {
      toast.error("Failed to update the game.");
      console.error("Failed to update the game:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (event) => {
    if (event.target.files.length > 0) {
      setImage(event.target.files[0]);
    }
  };

  const handleStatusChange = () => {
    setStatus(status === "1" ? "0" : "1"); // Toggle between "1" and "0"
  };

  const toolbarOptions = [
    ["bold", "italic", "underline", "strike"],
    ["blockquote", "code-block"],
    ["link", "image", "video", "formula"],
    [{ list: "ordered" }, { list: "bullet" }],
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

  return (
    <div className="bg-gradient-to-br from-transparent via-black to-black min-h-screen overflow-status">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Title</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input input-bordered"
            required
          />
        </div>
        <div className="flex flex-wrap gap-4">
          {categories &&
            categories.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <input
                  id={`categories-${item.id}`}
                  type="radio"
                  name="categories"
                  value={item.id}
                  checked={category === item.id.toString()}
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
          <label className="label">
            <span className="label-text">Description</span>
          </label>
          <ReactQuill
            value={description}
            onChange={(value) => setDescription(value)}
            className="react-quill"
            modules={modules}
            formats={formats}
          />
        </div>
        <div className="form-control">
          <label className="label text-white">Visibility</label>
          <label className="swap">
            <input
              type="checkbox"
              checked={status === "1"}
              onChange={handleStatusChange}
              className="hidden"
            />
            <div className="swap-on">Online</div>
            <div className="swap-off">Offline</div>
          </label>
        </div>
        <div className="form-control">
          <label className="label text-white">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="file-input file-input-bordered w-full"
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}>
          {loading ? "Updating..." : "Update"}
        </button>
      </form>
    </div>
  );
};

export default GameUpdatePage;
