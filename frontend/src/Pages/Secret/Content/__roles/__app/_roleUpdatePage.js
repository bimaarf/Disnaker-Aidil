import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchRole, updateRole } from "../../../../../features/roles/roleSlice";

const RoleUpdatePage = () => {
  const { params } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [name, setName] = useState("");
  const [display_name, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const dataProps = location.state?.dataProps;

  useEffect(() => {
    if (dataProps) {
      setName(dataProps.name || "");
      setDisplayName(dataProps.display_name || "");
      setDescription(dataProps.description || ""); // Pastikan ini sesuai dengan data
    }
    window.scrollTo(0, 0);
  }, [dataProps]);

  useEffect(() => {
    if (params) {
      // Fetch data based on params if dataProps is not available
      const fetchData = async () => {
        setLoading(true);
        try {
          await dispatch(fetchRole(params)).unwrap();
        } catch (error) {
          console.error("Failed to fetch role data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [dispatch, params, dataProps]);

  useEffect(() => {
    if (!location.state?.dataProps && !params) {
      navigate("/roles");
    }
  }, [location.state, params, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("display_name", display_name);
    formData.append("description", description); // Sending role.name here

    setLoading(true);
    try {
      await dispatch(updateRole({ params, roleData: formData })).unwrap();
      toast.success("Role updated successfully!");
      if (dataProps) {
        navigate(-1);
      } else {
        navigate("/roles");
      }
    } catch (error) {
      toast.error("Failed to update the role.");
      console.error("Failed to update the role:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-gradient-to-br from-transparent via-black to-black min-h-screen overflow-hidden">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label">Name</label>
          <input
            type="text"
            disabled
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered"
            required
          />
        </div>
        <div className="form-control">
          <label className="label">Display Name</label>
          <input
            type="text"
            value={display_name}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input input-bordered"
            required
          />
        </div>
        <div className="form-control">
          <label className="label">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input input-bordered"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Updating..." : "Update Role"}
        </button>
      </form>
    </div>
  );
};

export default RoleUpdatePage;
