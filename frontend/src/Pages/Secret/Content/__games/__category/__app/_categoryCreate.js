import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CircularLoader } from "../../../../../../Components/_CircularLoader";
import { createCategory } from "../../../../../../features/categories/categoriesSlice";

const CategoryCreatePage = () => {
  const [name, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { error } = useSelector((state) => state.categories); // Updated to state.categories

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);

    try {
      await dispatch(createCategory(formData)).unwrap();
      navigate("/games/categories");
      toast.success("Category created successfully!");
    } catch (err) {
      toast.error("Validation error occurred. Please check the fields.");
    } finally {
      setLoading(false);
    }
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
      {loading && <CircularLoader />}
      <div className="bg-gradient-to-br from-transparent via-black to-black min-h-screen overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-control">
            <label className="label text-white">Title</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setTitle(e.target.value)}
              className={`input input-bordered w-full ${
                error?.name ? "border-red-500" : ""
              }`}
              required
            />
            {error?.name && (
              <div className="text-red-500">{error.name.join(", ")}</div>
            )}
          </div>

          {renderErrorMessages()}
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}>
            {loading ? "Creating..." : "Create Category"}
          </button>
        </form>
      </div>
    </>
  );
};

export default CategoryCreatePage;
