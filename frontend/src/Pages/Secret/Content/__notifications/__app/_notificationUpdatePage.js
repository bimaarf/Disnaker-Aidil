import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchAllRoles } from "../../../../../features/roles/roleSlice";
import {
  fetchNotification,
  updateNotification,
} from "../../../../../features/notifications/notificationSlice";

const NotificationUpdatePage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const roles = useSelector((state) => state.roles.allRoles || []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("0");
  const [role, setRole] = useState(""); // Control role with state
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const dataProps = location.state?.dataProps;

  useEffect(() => {
    if (dataProps) {
      setName(dataProps.name || "");
      setEmail(dataProps.email || "");
      setStatus(dataProps.status ? "1" : "0");
      setRole(dataProps.roles || ""); // Pastikan ini sesuai dengan data
    }
    window.scrollTo(0, 0);
  }, [dataProps]);

  useEffect(() => {
    const getRoles = async () => {
      setLoading(true);
      try {
        await dispatch(fetchAllRoles()).unwrap();
      } catch (error) {
        console.error("Failed to fetch roles data:", error);
      } finally {
        setLoading(false);
      }
    };
    getRoles();
  }, [dispatch]);

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        setLoading(true);
        try {
          await dispatch(fetchNotification(id)).unwrap();
        } catch (error) {
          console.error("Failed to fetch notification data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [dispatch, id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("status", status);
    formData.append("role_id", role); // Sending role.name here

    if (image) {
      formData.append("image", image);
    }

    setLoading(true);
    try {
      await dispatch(
        updateNotification({ id, notificationData: formData })
      ).unwrap();
      toast.success("Notification updated successfully!");
      if (dataProps) {
        navigate(-1);
      } else {
        navigate("/notifications");
      }
    } catch (error) {
      toast.error("Failed to update the notification.");
      console.error("Failed to update the notification:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (event) => {
    setImage(event.target.files[0]);
  };

  const handleStatusChange = () => {
    setStatus((prevStatus) => (prevStatus === "1" ? "0" : "1"));
  };

  const handleRoleChange = (event) => {
    setRole(event.target.value); // Store the name of the role
  };

  return (
    <div className="bg-gradient-to-br from-transparent via-black to-black min-h-screen overflow-hidden">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label">Notificationname</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered"
            required
          />
        </div>
        <div className="form-control">
          <label className="label">Email</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input input-bordered"
            required
          />
        </div>
        <div className="form-control">
          <label className="label">Status</label>
          <label className="swap">
            <input
              type="checkbox"
              checked={status === "1"}
              onChange={handleStatusChange}
            />
            <div className="swap-on">Active</div>
            <div className="swap-off">Suspend</div>
          </label>
        </div>
        <div className="flex flex-wrap gap-4">
          {roles.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <input
                id={`roles-${item.id}`}
                type="radio"
                name="role"
                value={item.name}
                checked={role === item.name}
                onChange={handleRoleChange}
                className="radio radio-primary"
              />
              <label
                className="label cursor-pointer"
                htmlFor={`roles-${item.id}`}>
                {item.display_name}
              </label>
            </div>
          ))}
        </div>

        <div className="form-control">
          <label className="label">Avatar</label>
          <input
            type="file"
            onChange={handleImageChange}
            className="input input-bordered"
            accept="image/*"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Updating..." : "Update Notification"}
        </button>
      </form>
    </div>
  );
};

export default NotificationUpdatePage;
