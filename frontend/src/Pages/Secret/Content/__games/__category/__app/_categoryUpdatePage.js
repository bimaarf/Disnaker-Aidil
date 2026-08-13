import React, { useEffect, useState } from "react";
import "react-quill/dist/quill.snow.css";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  fetchCategory as fetch,
  updateCategory,
} from "../../../../../../features/categories/categoriesSlice";

const CategoryUpdatePage = () => {
  const { key } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // const { error } = useSelector((state) => state.categories);

  const [name, setName] = useState("");

  const [loading, setLoading] = useState(false);

  const dataProps = location.state?.dataProps;
  useEffect(() => {
    if (dataProps) {
      setName(dataProps.name || "");
    }

    window.scrollTo(0, 0);
  }, [dataProps]);

  useEffect(() => {
    if (key) {
      // Fetch data based on key if dataProps is not available
      const fetchData = async () => {
        setLoading(true);
        try {
          await dispatch(fetch(key)).unwrap();
        } catch (error) {
          console.error("Failed to fetch category data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [dispatch, key, dataProps]);

  useEffect(() => {
    if (!location.state?.dataProps && !key) {
      navigate("/games/categories");
    }
  }, [location.state, key, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("name", name);

    setLoading(true);
    try {
      await dispatch(updateCategory({ key, categoryData: formData })).unwrap();
      toast.success("Category updated successfully!");
      if (dataProps) {
        navigate(-1);
      } else {
        navigate("/categories");
      }
    } catch (error) {
      toast.error("Failed to update the category.");
      console.error("Failed to update the category:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-gradient-to-br from-transparent via-black to-black min-h-screen overflow-hidden">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Title</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered"
            required
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

export default CategoryUpdatePage;
