import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CircularLoader } from "../../../../../Components/_CircularLoader";
import { createRole } from "../../../../../features/roles/roleSlice";

const RoleCreatePage = () => {
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { error } = useSelector((state) => state.roles);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("display_name", displayName);
    formData.append("description", description);

    try {
      await dispatch(createRole(formData)).unwrap();
      toast.success("Role created successfully!");
      navigate("/roles");
    } catch (err) {
      const validationErrors = err?.response?.data?.errors || {};
      const errorMessages = Object.keys(validationErrors)
        .map((key) => `${key}: ${validationErrors[key].join(", ")}`)
        .join(", ");
      toast.error(`Validation error: ${errorMessages}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <CircularLoader />}
      <div className="bg-gradient-to-br from-transparent via-black to-black min-h-screen overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-control">
            <label className="label text-white">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`input input-bordered w-full ${
                error?.name ? "border-red-500" : ""
              }`}
              required
            />
          </div>
          <div className="form-control">
            <label className="label text-white">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={`input input-bordered w-full ${
                error?.display_name ? "border-red-500" : ""
              }`}
              required
            />
          </div>
          <div className="form-control">
            <label className="label text-white">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`input input-bordered w-full ${
                error?.description ? "border-red-500" : ""
              }`}
              placeholder="(optional)"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}>
            {loading ? "Creating..." : "Create Role"}
          </button>
        </form>
      </div>
    </>
  );
};

export default RoleCreatePage;
