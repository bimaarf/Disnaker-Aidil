import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CircularLoader } from "../../../../../Components/_CircularLoader";
import { fetchAllRoles } from "../../../../../features/roles/roleSlice";
import { createUser } from "../../../../../features/users/userSlice";

const UserCreatePage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(true);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const roles = useSelector((state) => state.roles.allRoles || []);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { error } = useSelector((state) => state.users);
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
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("passwordConfirm", passwordConfirm);
    formData.append("status", status ? "1" : "0");
    formData.append("role_id", role);

    if (image) {
      formData.append("image", image);
    }

    try {
      await dispatch(createUser(formData)).unwrap();
      toast.success("User created successfully!");
      navigate("/users");
    } catch (err) {
      const validationErrors = err?.response?.data?.errors || {};

      toast.error(`Validation error: ${validationErrors}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (event) => {
    setRole(event.target.value);
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
            <label className="label text-white">Username</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`input input-bordered w-full ${
                error?.name ? "border-red-500" : ""
              }`}
              required
            />
            {error?.name && (
              <div className="text-red-500">{error.name.join(", ")}</div>
            )}
          </div>
          <div className="form-control">
            <label className="label text-white">Email Address</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`input input-bordered w-full ${
                error?.email ? "border-red-500" : ""
              }`}
              required
            />
            {error?.email && (
              <div className="text-red-500">{error.email.join(", ")}</div>
            )}
          </div>
          <div className="form-control">
            <label className="label text-white">Password</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`input input-bordered w-full ${
                error?.password ? "border-red-500" : ""
              }`}
              required
              placeholder="*****"
            />
            {error?.password && (
              <div className="text-red-500">{error.password.join(", ")}</div>
            )}
          </div>
          <div className="form-control">
            <label className="label text-white">Password Confirm</label>
            <input
              type="text"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className={`input input-bordered w-full ${
                error?.passwordConfirm ? "border-red-500" : ""
              }`}
              required
              placeholder="*****"
            />
            {error?.passwordConfirm && (
              <div className="text-red-500">
                {error.passwordConfirm.join(", ")}
              </div>
            )}
          </div>
          <div className="form-control">
            <label className="label text-white">Status</label>
            <label className="swap">
              <input
                type="checkbox"
                checked={status}
                onChange={() => setStatus((prevStatus) => !prevStatus)}
              />
              <div className="swap-on">Active</div>
              <div className="swap-off">Suspend</div>
            </label>
          </div>
          <div className="flex flex-wrap gap-4">
            {roles &&
              roles.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    id={`roles-${item.id}`}
                    type="radio"
                    name="role"
                    value={item.name}
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
            <label className="label text-white">Image</label>
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
            {loading ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>
    </>
  );
};

export default UserCreatePage;
