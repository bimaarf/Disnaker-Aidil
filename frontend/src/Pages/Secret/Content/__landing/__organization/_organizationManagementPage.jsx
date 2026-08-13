import { CircularProgress } from "@mui/material";
import { debounce } from "lodash";
import * as LucideIcons from "lucide-react";
import {
  Building2,
  Edit,
  Plus,
  Save,
  Search as SearchIcon,
  Trash2,
  Users,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import {
  createOrganization,
  deleteOrganization,
  fetchOrganizations,
  updateOrganization,
} from "../../../../../features/LandingPages/organizationSlice";
import { fetchUsers } from "../../../../../features/users/userSlice";
import useIsMobile from "../../../../../Context/__useIsMobile";

// Memoized InputField component
const InputField = React.memo(
  ({
    icon: Icon,
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    themeClasses,
    disabled = false,
    tooltipId,
    tooltipContent,
  }) => {
    return (
      <div className="space-y-2">
        <label className={`block text-sm font-medium ${themeClasses.muted}`}>
          {label}
        </label>
        <div className="relative">
          <input
            type={type}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`w-full px-4 py-3 rounded-xl ${
              themeClasses.input
            } transition-all duration-200 placeholder:text-base-content/50 ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            placeholder={placeholder}
            data-tooltip-id={tooltipId}
            data-tooltip-content={tooltipContent}
          />
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <Icon className="w-5 h-5 text-blue-500" />
          </div>
        </div>
      </div>
    );
  }
);
InputField.displayName = "InputField";

// Memoized SelectField component
const SelectField = React.memo(
  ({
    label,
    value,
    onChange,
    options,
    themeClasses,
    placeholder,
    required = false,
  }) => (
    <div className="space-y-2">
      <label className={`block text-sm font-medium ${themeClasses.muted}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 rounded-xl ${themeClasses.input} transition-all duration-200`}>
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
);
SelectField.displayName = "SelectField";

// Memoized ContentSection component
const ContentSection = React.memo(
  ({ icon: Icon, title, children, gradient }) => {
    const themeClasses = useSelector((state) =>
      state.themes.localTheme === "wireframe"
        ? {
            card: "bg-base-100",
            text: "text-base-content",
          }
        : {
            card: "bg-base-100 dark:bg-base-200",
            text: "text-base-content",
          }
    );

    return (
      <div
        className={`${themeClasses.card} rounded-2xl h-fit border border-base-300/50 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300`}>
        <div className={`h-1 bg-gradient-to-r ${gradient}`}></div>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient.replace(
                "to-r",
                "to-br"
              )} flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
              {title}
            </h3>
          </div>
          {children}
        </div>
      </div>
    );
  }
);
ContentSection.displayName = "ContentSection";

// Main Component
const OrganizationManagementPage = () => {
  const dispatch = useDispatch();
  const { organizations, status, error } = useSelector(
    (state) => state.organizations
  );
  const users = useSelector((state) => state.users.users || []);
  const theme = useSelector((state) => state.themes.localTheme);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDatas, setSelectedDatas] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFetchingRef = useRef(false);
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [searchRef, setSearchRef] = useState("");
  const [loading, setLoading] = useState(false);

  const getThemeClasses = useCallback(() => {
    if (theme === "wireframe") {
      return {
        container: "bg-base-300/25",
        card: "bg-base-100",
        header: "bg-base-100/90",
        input:
          "bg-base-100 border-base-300 focus:border-blue-500 text-base-content",
        button: "bg-blue-600 hover:bg-blue-700 text-white",
        text: "text-base-content",
        muted: "text-base-content/60",
      };
    } else {
      return {
        container: "bg-base-300/25 dark:bg-base-100",
        card: "bg-base-100 dark:bg-base-200",
        header: "bg-base-100/90 dark:bg-base-200/90",
        input:
          "bg-base-100 dark:bg-base-300 border-base-300 dark:border-base-600 focus:border-blue-500 dark:focus:border-blue-400 text-base-content",
        button:
          "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white",
        text: "text-base-content",
        muted: "text-base-content/60 dark:text-base-content/70",
      };
    }
  }, [theme]);

  const themeClasses = useMemo(() => getThemeClasses(), [getThemeClasses]);

  const debouncedSearch = useMemo(
    () =>
      debounce((val) => {
        setSearchRef(val);
        setCurrentPage(1);
        console.log(searchRef);
        
      }, 500),
    []
  );

  // Fetch organizations
  useEffect(() => {
    if (status === "idle" && !isFetchingRef.current) {
      isFetchingRef.current = true;
      setLoading(true);
      dispatch(fetchOrganizations())
        .unwrap()
        .catch((error) => {
          console.error("Failed to fetch organizations:", error);
          toast.error("Failed to fetch organizations.");
        })
        .finally(() => {
          isFetchingRef.current = false;
          setLoading(false);
        });
    }
  }, [dispatch, status]);

  const handleLoadMore = useCallback(() => {
    if (!isFetchingRef.current && !isLoadingMore) {
      setIsLoadingMore(true);
      setCurrentPage((prev) => prev + 1);
    }
  }, [isLoadingMore]);

  const handleScroll = useCallback(
    debounce(() => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 500
      ) {
        handleLoadMore();
      }
    }, 300),
    [handleLoadMore]
  );

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const sortedDatas = useMemo(() => [...organizations], [organizations]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("create");
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    user_id: "",
    parent_id: "",
    order: 1,
  });
  const [formErrors, setFormErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearch, setUserSearch] = useState("");

  const debouncedUserSearch = useCallback(
    debounce((val) => {
      dispatch(fetchUsers({ page: currentPage, perPage: 10, search: val }));
    }, 500),
    [dispatch]
  );

  useEffect(() => {
    if (showModal) {
      debouncedUserSearch(userSearch);
    }
  }, [userSearch, showModal, debouncedUserSearch]);

  const openModal = (type, org = null) => {
    setModalType(type);
    setSelectedOrg(org);
    setShowModal(true);
    setFormErrors({});
    setSelectedUser(null);
    setUserSearch("");

    if (type === "create") {
      setFormData({
        name: "",
        user_id: "",
        parent_id: "",
        order: 1,
      });
    } else if (type === "edit" && org) {
      setFormData({
        name: org.name || "",
        user_id: org.user_id ? String(org.user_id) : "",
        parent_id: org.parent_id ? String(org.parent_id) : "",
        order: org.order || 1,
      });
      setSelectedUser(users.find((u) => u.id === org.user_id) || null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrg(null);
    setFormData({
      name: "",
      user_id: "",
      parent_id: "",
      order: 1,
    });
    setFormErrors({});
    setSelectedUser(null);
    setUserSearch("");
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) errors.name = "Nama jabatan harus diisi!";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const cleanData = {
      name: formData.name.trim(),
      user_id: formData.user_id ? parseInt(formData.user_id) : null,
      parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
      order: parseInt(formData.order) || 1,
    };

    try {
      if (modalType === "create") {
        await dispatch(createOrganization(cleanData)).unwrap();
        toast.success("Organization created successfully.");
      } else {
        await dispatch(
          updateOrganization({
            id: selectedOrg.id,
            organizationData: cleanData,
          })
        ).unwrap();
        toast.success("Organization updated successfully.");
      }
      closeModal();
      dispatch(fetchOrganizations());
    } catch (error) {
      toast.error("Failed to submit organization.");
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (org) => {
    setOrgToDelete(org);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    setLoading(true);
    if (orgToDelete) {
      try {
        await dispatch(deleteOrganization(orgToDelete.id)).unwrap();
        toast.success("Organization deleted successfully.");
        setShowDeleteConfirm(false);
        setOrgToDelete(null);
        dispatch(fetchOrganizations());
      } catch (error) {
        toast.error("Failed to delete organization.");
        console.error("Error deleting organization:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkDelete = async () => {
    setLoading(true);
    try {
      for (const id of selectedDatas) {
        await dispatch(deleteOrganization(id)).unwrap();
      }
      toast.success("Selected organizations deleted successfully.");
      setSelectedDatas([]);
      dispatch(fetchOrganizations());
    } catch (error) {
      toast.error("Failed to bulk delete organizations.");
      console.error("Error bulk deleting:", error);
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (err) => {
    if (!err) return null;
    if (typeof err === "string") return err;
    if (err.message) return err.message;
    return JSON.stringify(err);
  };

  // Flat orgs for parent select
  const flatOrgs = useMemo(() => {
    const getFlat = (orgs, level = 0, result = []) => {
      orgs.forEach((org) => {
        result.push({
          value: String(org.id),
          label: "—".repeat(level) + " " + org.name,
        });
        if (org.children) getFlat(org.children, level + 1, result);
      });
      return result;
    };
    return getFlat(organizations);
  }, [organizations]);

  // Filtered users are now the fetched users
  const filteredUsers = users;

  return (
    <div className={`min-h-screen p-1 md:p-6`}>
      {/* Header */}
      <div
        className={`${themeClasses.header} backdrop-blur-xl border-b border-base-300/50 rounded-t-2xl mb-6`}>
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-start md:items-center justify-between">
            <div className="flex items-start gap-2 md:gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1
                  className={`text-xl md:text-3xl font-bold ${themeClasses.text}`}>
                  Organization Management
                </h1>
                <p className={`text-sm ${themeClasses.muted} mt-1`}>
                  Kelola struktur organisasi Anda
                </p>
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
                <CircularProgress size={16} />
                <span className="text-sm font-medium text-blue-700">
                  Memproses...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full space-y-6">
        {/* Controls Section */}
        <ContentSection
          icon={SearchIcon}
          title="Filters & Actions"
          gradient="from-purple-500 to-purple-600">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              icon={SearchIcon}
              label="Search Organizations"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                debouncedSearch(e.target.value);
              }}
              placeholder="Search organizations..."
              themeClasses={themeClasses}
              disabled={true}
              tooltipId="devTooltip"
              tooltipContent="Masih dalam pengembangan"
            />
            <div className="flex items-end">
              <button
                onClick={() => openModal("create")}
                className={`
                  relative w-full px-8 py-3 rounded-xl text-base font-semibold
                  ${themeClasses.button}
                  shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30
                  transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                  flex items-center gap-3 justify-center
                  border border-blue-500/20
                `}>
                <Plus className="w-5 h-5" />
                <span>Tambah Jabatan</span>
              </button>
            </div>
          </div>
          <Tooltip id="devTooltip" place="top" />
        </ContentSection>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <LucideIcons.AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span className="text-red-800 dark:text-red-200">
              {getErrorMessage(error)}
            </span>
          </div>
        )}

        {/* Organizations Tree */}
        <ContentSection
          icon={Building2}
          title="Struktur Organisasi"
          gradient="from-blue-500 to-blue-600">
          {!isMobile ? (
            <OrganizationsTable
              organizations={sortedDatas}
              selectedDatas={selectedDatas}
              setSelectedDatas={setSelectedDatas}
              handleEditData={openModal.bind(null, "edit")}
              handleDeleteData={confirmDelete}
              handleBulkDelete={handleBulkDelete}
              LucideIcons={LucideIcons}
              themeClasses={themeClasses}
              loading={loading || isLoadingMore}
            />
          ) : (
            <OrganizationsList
              organizations={sortedDatas}
              selectedDatas={selectedDatas}
              setSelectedDatas={setSelectedDatas}
              handleEditData={openModal.bind(null, "edit")}
              handleDeleteData={confirmDelete}
              handleBulkDelete={handleBulkDelete}
              LucideIcons={LucideIcons}
              themeClasses={themeClasses}
              loading={loading || isLoadingMore}
            />
          )}
        </ContentSection>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div
            className={`w-full max-w-2xl m-4 rounded-2xl ${themeClasses.card} shadow-2xl`}>
            <div className="p-6 border-b border-base-300/50">
              <h3 className={`text-2xl font-bold ${themeClasses.text}`}>
                {modalType === "create" ? "Tambah Jabatan" : "Edit Jabatan"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  icon={Building2}
                  label="Nama Jabatan *"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Masukkan nama jabatan"
                  themeClasses={themeClasses}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
                <SelectField
                  label="Parent Jabatan"
                  value={formData.parent_id}
                  onChange={(e) =>
                    setFormData({ ...formData, parent_id: e.target.value })
                  }
                  options={flatOrgs.filter(
                    (opt) => opt.value !== (selectedOrg?.id || "")
                  )}
                  placeholder="-- Pilih Parent (Opsional) --"
                  themeClasses={themeClasses}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    className={`block text-sm font-medium ${themeClasses.muted} mb-2`}>
                    Pilih User
                  </label>
                  <div className="space-y-2">
                    <InputField
                      icon={SearchIcon}
                      label=""
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Cari nama, email, atau phone"
                      themeClasses={themeClasses}
                    />
                    <div className="max-h-40 overflow-y-auto border border-base-300 rounded-xl">
                      {filteredUsers.length === 0 ? (
                        <p className="p-4 text-center text-sm text-base-content/60">
                          No users found
                        </p>
                      ) : (
                        filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => {
                              setFormData({
                                ...formData,
                                user_id: String(user.id),
                              });
                              setSelectedUser(user);
                            }}
                            className={`p-3 hover:bg-base-200 cursor-pointer transition-colors ${
                              selectedUser?.id === user.id
                                ? "bg-blue-100 dark:bg-blue-900/30"
                                : ""
                            }`}>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-base-content/60">
                              {user.email}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    {selectedUser && (
                      <p className={`text-sm ${themeClasses.muted} mt-2`}>
                        Selected: {selectedUser.name} ({selectedUser.email})
                      </p>
                    )}
                  </div>
                </div>
                <InputField
                  icon={LucideIcons.ListOrdered}
                  label="Urutan"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order: parseInt(e.target.value) || 1,
                    })
                  }
                  type="number"
                  placeholder="Enter order..."
                  themeClasses={themeClasses}
                />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  className={`px-8 py-3 rounded-xl border border-base-300 hover:bg-base-200 ${themeClasses.text} transition-all duration-200`}
                  onClick={closeModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`
                    relative px-8 py-3 rounded-xl text-base font-semibold
                    ${themeClasses.button}
                    shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30
                    transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    flex items-center gap-3 min-w-[180px] justify-center
                    border border-blue-500/20
                  `}>
                  {loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span>
                    {loading
                      ? "Saving..."
                      : modalType === "create"
                      ? "Create"
                      : "Update"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`w-full max-w-md m-4 rounded-2xl ${themeClasses.card} shadow-2xl`}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <LucideIcons.AlertCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                  Confirm Delete
                </h3>
              </div>
              <p className={`text-sm ${themeClasses.muted} mb-6`}>
                {`Yakin ingin menghapus "${orgToDelete?.name}"? This action cannot be undone.`}
              </p>
              <div className="flex justify-end gap-4">
                <button
                  className={`px-8 py-3 rounded-xl border border-base-300 hover:bg-base-200 ${themeClasses.text} transition-all duration-200`}
                  onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
                <button
                  disabled={loading}
                  className={`
                    relative px-8 py-3 rounded-xl text-base font-semibold bg-red-600 hover:bg-red-700 text-white
                    shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30
                    transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    flex items-center gap-3 min-w-[180px] justify-center
                    border border-red-500/20
                  `}
                  onClick={handleDelete}>
                  {loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                  <span>{loading ? "Deleting..." : "Delete"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Organizations Table Component
const OrganizationsTable = ({
  organizations,
  selectedDatas,
  setSelectedDatas,
  handleEditData,
  handleDeleteData,
  handleBulkDelete,
  loading,
}) => {
  const handleCheckboxChange = (id) => {
    setSelectedDatas((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((key) => key !== id)
        : [...prevSelected, id]
    );
  };

  const handleSelectAll = (event) => {
    const allIds = [];
    const collectIds = (orgs) => {
      orgs.forEach((org) => {
        allIds.push(org.id);
        if (org.children) collectIds(org.children);
      });
    };
    collectIds(organizations);
    setSelectedDatas(event.target.checked ? allIds : []);
  };

  const renderTreeRows = (orgs, level = 0) => {
    return orgs.map((org) => [
      <tr
        key={org.id}
        className="cursor-pointer hover:bg-base-100 duration-500 ease-in-out">
        <td className="title-cell">
          <div className="flex items-center gap-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="checkbox checkbox-sm rounded-full"
                checked={selectedDatas.includes(org.id)}
                onChange={() => handleCheckboxChange(org.id)}
              />
            </label>
            <div className="ml-4" style={{ paddingLeft: `${level * 20}px` }}>
              <div className="font-bold">{org.name}</div>
              <div className="text-sm opacity-50">
                Level: {org.level} | Order: {org.order}
              </div>
            </div>
          </div>
        </td>
        <td>{org.user_id ? `User ID: ${org.user_id}` : "-"}</td>
        <td>
          <div className="flex items-baseline justify-start gap-2">
            <button
              onClick={() => handleEditData(org)}
              className="btn btn-ghost btn-sm bg-base-200/50 font-medium rounded text-pretty">
              Edit
            </button>
            <button
              onClick={() => handleDeleteData(org)}
              className="btn btn-ghost btn-sm bg-base-200/50 font-medium rounded text-pretty">
              Delete
            </button>
          </div>
        </td>
      </tr>,
      ...(org.children ? renderTreeRows(org.children, level + 1) : []),
    ]);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-base-300">
      <table className="table table-zebra w-full">
        <thead className="bg-base-200">
          <tr>
            <th className="bg-base-200 sticky left-0 z-10">
              <div className="flex items-center gap-3">
                <label>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm rounded-full"
                    onChange={handleSelectAll}
                    checked={
                      selectedDatas.length > 0 &&
                      selectedDatas.length ===
                        organizations.reduce(
                          (acc, org) => acc + (org.children?.length || 1),
                          0
                        )
                    }
                  />
                </label>
                {selectedDatas.length > 0 ? (
                  <div
                    onClick={handleBulkDelete}
                    className="cursor-pointer text-error flex items-center gap-4 h-6 px-2 duration-200 hover:bg-base-200 w-full">
                    <Trash2 className="w-4 h-4" />
                    <span>
                      {selectedDatas.length > 0 && `(${selectedDatas.length})`}
                    </span>
                    <p>Delete</p>
                  </div>
                ) : (
                  <div className="flex items-center">Name</div>
                )}
              </div>
            </th>
            <th>
              <div className="flex items-center">User</div>
            </th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>{renderTreeRows(organizations)}</tbody>
      </table>
      {loading && (
        <div className="flex justify-center mt-4">
          <span className="loading loading-spinner"></span>
        </div>
      )}
    </div>
  );
};

// Organizations Mobile List Component
const OrganizationsList = ({
  organizations,
  selectedDatas,
  setSelectedDatas,
  handleEditData,
  handleDeleteData,
  handleBulkDelete,
  LucideIcons,
  themeClasses,
  loading,
}) => {
  const toggleSelect = (id) => {
    if (selectedDatas.includes(id)) {
      setSelectedDatas(selectedDatas.filter((s) => s !== id));
    } else {
      setSelectedDatas([...selectedDatas, id]);
    }
  };

  const renderTreeList = (orgs, level = 0) => {
    return orgs.flatMap((org) => {
      const isSelected = selectedDatas.includes(org.id);
      return [
        <div
          key={org.id}
          className={`rounded-xl border border-base-300/50 overflow-hidden shadow-lg transition-all duration-300 ${
            isSelected ? "ring-2 ring-blue-500" : ""
          }`}
          style={{ marginLeft: `${level * 16}px` }}>
          <div className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 flex-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(org.id)}
                  className="checkbox checkbox-sm rounded-full"
                />
                <div>
                  <h3 className={`font-semibold ${themeClasses.text}`}>
                    {org.name}
                  </h3>
                  <p className={`text-sm ${themeClasses.muted}`}>
                    Level: {org.level} | Order: {org.order}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                  onClick={() => handleEditData(org)}>
                  <Edit size={16} className="text-blue-500" />
                </button>
                <button
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all"
                  onClick={() => handleDeleteData(org)}>
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            </div>
            <div className="mb-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 gap-1">
                <Users size={12} />
                {org.user_id ? `User ID: ${org.user_id}` : "No User"}
              </span>
            </div>
          </div>
        </div>,
        ...(org.children ? renderTreeList(org.children, level + 1) : []),
      ];
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <CircularProgress size={40} />
        <p className={`mt-4 text-sm ${themeClasses.muted}`}>
          Loading organizations...
        </p>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <LucideIcons.Search className="w-16 h-16 text-base-content/30 mb-4" />
        <h3 className={`text-lg font-medium ${themeClasses.muted} mb-2`}>
          No organizations found
        </h3>
        <p className={`text-sm ${themeClasses.muted}`}>Try adding a new one</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className={`text-sm ${themeClasses.muted}`}>
          Total: {organizations.length}
        </span>
        {selectedDatas.length > 0 && (
          <button
            className={`
              relative px-6 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white
              shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30
              transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
              flex items-center gap-2
              border border-red-500/20
            `}
            onClick={handleBulkDelete}>
            <Trash2 className="w-4 h-4" />
            Delete Selected ({selectedDatas.length})
          </button>
        )}
      </div>
      <div className="space-y-4">{renderTreeList(organizations)}</div>
    </div>
  );
};

export default OrganizationManagementPage;
