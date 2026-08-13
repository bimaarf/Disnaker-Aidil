import React, { useEffect, useState } from "react";
import "react-phone-input-2/lib/style.css";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { updateSingleUser } from "../../../../features/authentication/AuthSlice";
import { fetchAllRoles } from "../../../../features/roles/roleSlice";
import { updateUser } from "../../../../features/users/userSlice";
import PhoneNumberInput from "../../Components/phoneNumberInput";
import {
  User,
  Mail,
  Phone,
  Shield,
  Save,
  Upload,
  CheckCircle2,
  UserCheck,
  UserX,
  Crown,
  Settings,
  ImageIcon,
  AlertCircle,
  Loader2,
} from "lucide-react";

const AccountSetting = ({ user, currentUser }) => {
  const dispatch = useDispatch();
  const roles = useSelector((state) => state.roles.allRoles || []);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || "");
  const [status, setStatus] = useState(Boolean(user?.status));
  const [role, setRole] = useState(user?.roles || "");
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const getRoles = async () => {
      setRolesLoading(true);
      try {
        await dispatch(fetchAllRoles()).unwrap();
      } catch (error) {
        toast.error("Failed to fetch roles data.");
        console.error("Failed to fetch roles data:", error);
      } finally {
        setRolesLoading(false);
      }
    };

    if (!roles.length) {
      getRoles();
    }
  }, [dispatch, roles.length]);

  const handleUpdate = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone_number", phoneNumber);
    formData.append("status", status ? "1" : "0");
    formData.append("role_id", role);

    setLoading(true);
    try {
      const updatedUser = await dispatch(
        updateUser({ id: user?.id, userData: formData })
      ).unwrap();

      if (updatedUser.current) {
        dispatch(updateSingleUser(updatedUser));
      }

      toast.success("User updated successfully!");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update the user."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);
      handleAvatarUpdate(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleAvatarUpdate = async (imageFile) => {
    setAvatarLoading(true);

    if (!imageFile) {
      toast.error("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const updatedUser = await dispatch(
        updateUser({ id: user?.id, userData: formData })
      ).unwrap();
      if (updatedUser.current) {
        dispatch(updateSingleUser(updatedUser));
      }

      toast.success("Avatar updated successfully.");
    } catch (error) {
      toast.error("Failed to update avatar.");
      setPreviewUrl(null);
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleStatusChange = () => {
    setStatus((prevStatus) => !prevStatus);
  };

  const getRoleIcon = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case "admin":
        return <Crown className="w-5 h-5" />;
      case "user":
        return <User className="w-5 h-5" />;
      case "moderator":
        return <Shield className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const getRoleColor = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case "admin":
        return "from-red-500 to-orange-500";
      case "user":
        return "from-blue-500 to-indigo-500";
      case "moderator":
        return "from-purple-500 to-pink-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  return (
    <div className="space-y-2 max-w-screen-lg">
      {/* Profile Picture Section */}
      <div className="bg-base-100 dark:bg-base-200 shadow-sm rounded-3xl p-3 sm:p-6 border border-base-200/50 backdrop-blur-sm">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-16 h-16 bg-success/10 rounded-3xl flex items-center justify-center shadow-sm">
            <ImageIcon className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-base-content">
              Profile Picture
            </h3>
            <p className="text-[12px] sm:text-base text-base-content/70 mt-1">
              Update your profile avatar (Max 5MB)
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="relative group">
            {avatarLoading ? (
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl bg-base-200/50 dark:bg-base-300 flex items-center justify-center animate-pulse">
                  <div className="w-10 h-10 bg-base-300/30 rounded-full animate-spin border-3 border-base-200/50 border-t-base-200/50"></div>
                </div>
              </div>
            ) : previewUrl ? (
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-500 to-teal-600 p-1 shadow-xl">
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-base-100">
                    <img
                      src={previewUrl}
                      alt="Preview avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-3 border-base-100 flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              </div>
            ) : user?.avatar && user?.avatar !== "default.jpg" ? (
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-500 to-teal-600 p-1 shadow-xl">
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-base-100">
                    <img
                      src={user?.avatar}
                      alt="User avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-3 border-base-100 flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-indigo-500 via-teal-500 to-pink-500 flex items-center justify-center shadow-xl">
                  <span className="text-4xl font-bold text-white">
                    {user?.username?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1">
            <div className="text-center sm:text-start">
              <h4 className="font-bold text-base-content text-xl">
                {user?.name}
              </h4>
              <p className="text-base-content/70 sm:text-md text-sm">
                {user?.email}
              </p>
            </div>

            <label className="cursor-pointer block">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={avatarLoading}
              />
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform active:scale-[98%] hover:scale-[99%] transition-all shadow-sm hover:shadow-xl disabled:opacity-50 sm:text-md text-sm">
                <Upload className="w-5 h-5" />
                {avatarLoading ? "Uploading..." : "Update Avatar"}
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <form onSubmit={handleUpdate} className="space-y-2">
        {/* Personal Information */}
        <div className="bg-base-100 dark:bg-base-200 shadow-sm rounded-3xl p-3 sm:p-6 border border-base-200/50 backdrop-blur-sm">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/10 rounded-3xl flex items-center justify-center shadow-sm">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-base-content">
                Personal Information
              </h3>
              <p className="text-[12px] sm:text-base text-base-content/70 mt-1 whitespace-normal">
                Update your personal details and contact information
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Username */}
            <div className="space-y-3">
              <label className="text-[12px] sm:text-base font-medium text-base-content flex items-center gap-2">
                <User className="w-5 h-5" />
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl focus:bg-base-100 dark:focus:bg-base-100 bg-base-200/50 dark:bg-base-300 border border-base-300 focus:border-blue-500 focus:outline-none text-base"
                  placeholder="Your Name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-3">
              <label className="text-[12px] sm:text-base font-medium text-base-content flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl focus:bg-base-100 dark:focus:bg-base-100 bg-base-200/50 dark:bg-base-300 border border-base-300 focus:border-blue-500 focus:outline-none text-base"
                  placeholder="example@gmail.com"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-3 lg:col-span-2">
              <label className="text-[12px] sm:text-base font-medium text-base-content flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Phone Number
              </label>
              <div className="relative">
                <PhoneNumberInput
                  initialValue={phoneNumber}
                  onChange={(formattedPhone) => setPhoneNumber(formattedPhone)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status & Role */}
        <div className="bg-base-100 dark:bg-base-200 shadow-sm rounded-3xl p-3 sm:p-6 border border-base-200/50 backdrop-blur-sm">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-16 h-16 bg-primary/10 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-sm">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-base-content">
                Account Settings
              </h3>
              <p className="text-[12px] sm:text-base text-base-content/70 mt-1">
                Manage account status and permissions
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <label className="text-[12px] sm:text-base font-medium text-base-content">
                Account Status
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleStatusChange}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-medium transition-all duration-200 transform active:scale-[98%] hover:scale-[99%] transition-all shadow-sm ${
                    status
                      ? "bg-success/5 text-success hover:bg-success/10"
                      : "bg-base-300/30 dark:base-300 border-2 border-base-200/50"
                  }`}>
                  {status ? (
                    <>
                      <UserCheck className="w-5 h-5" />
                      <span className="sm:text-md text-sm">Active</span>
                    </>
                  ) : (
                    <>
                      <UserX className="w-5 h-5" />
                      <span className="sm:text-md text-sm">Suspended</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-base-content/60">
                Click to toggle between active and suspended status
              </p>
            </div>

            {/* Role */}
            {currentUser.role !== "user" && (
              <div className="space-y-2">
                <label className="text-[12px] sm:text-base font-medium text-base-content">
                  User Role
                </label>
                {rolesLoading ? (
                  <div className="flex items-center gap-3 p-4 bg-base-200/50 rounded-2xl">
                    <Loader2 className="w-5 h-5 animate-spin text-base-content/50" />
                    <span className="text-base-content/70">
                      Loading roles...
                    </span>
                  </div>
                ) : roles.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {roles.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setRole(item.name)}
                        className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-medium transition-all duration-200 transform active:scale-[98%] hover:scale-[99%] transition-all shadow-sm sm:text-md text-sm ${
                          role === item.name
                            ? `bg-gradient-to-r ${getRoleColor(
                                item.name
                              )} text-white shadow-xl scale-105`
                            : "bg-base-200 text-base-content hover:bg-base-300 hover:shadow-md"
                        }`}>
                        {getRoleIcon(item.name)}
                        {item.display_name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-orange-100 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400 rounded-2xl border border-orange-200 dark:border-orange-800/40">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-base">No roles available</span>
                  </div>
                )}
                <p className="text-sm text-base-content/60">
                  Select the appropriate role for this user account
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform active:scale-[98%] hover:scale-[99%] transition-all shadow-sm hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none sm:text-md text-sm">
            {loading ? (
              <>
                <div className="w-6 h-6 border-2 border-base-200/50 border-t-base-200/50 rounded-full animate-spin"></div>
                Updating...
              </>
            ) : (
              <>
                <Save className="w-6 h-6" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccountSetting;
