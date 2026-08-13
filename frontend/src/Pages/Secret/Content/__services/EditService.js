import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateService,
  resetServiceStatus,
  createSubItem,
  updateSubItem,
  deleteSubItem,
} from "../../../../features/newNaker/serviceSlice";
import { Plus, X, Trash2, Edit, Save, ChevronDown } from "lucide-react";
import * as LucideIcons from "lucide-react";

const DynamicLucideIcon = ({
  iconName,
  size = 20,
  className = "text-base-content",
  color,
}) => {
  const IconComponent = LucideIcons[iconName];
  return IconComponent ? (
    <IconComponent
      size={size}
      className={className}
      style={color ? { color } : {}}
    />
  ) : (
    <span className={className} style={color ? { color } : {}}>
      {iconName || "?"}
    </span>
  );
};

const EditService = ({ service, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.services);

  const [formData, setFormData] = useState({
    title: service?.title || "",
    description: service?.description || "",
    icon: service?.icon || "",
    color: service?.color || "",
    link: service?.link || "",
    sub_items: service?.sub_items || [],
  });

  const [newSubItemForm, setNewSubItemForm] = useState({
    title: "",
    description: "",
    icon: "",
    link: "",
  });

  const [editingSubItem, setEditingSubItem] = useState(null);
  const [editSubItemForm, setEditSubItemForm] = useState({
    title: "",
    description: "",
    icon: "",
    link: "",
  });

  useEffect(() => {
    if (service) {
      setFormData({
        title: service.title || "",
        description: service.description || "",
        icon: service.icon || "",
        color: service.color || "",
        link: service.link || "",
        sub_items: service.sub_items || [],
      });
    }
  }, [service]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNewSubItemChange = (e) => {
    const { name, value } = e.target;
    setNewSubItemForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSubItemChange = (e) => {
    const { name, value } = e.target;
    setEditSubItemForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddNewSubItem = async () => {
    if (newSubItemForm.title.trim()) {
      const result = await dispatch(
        createSubItem({
          serviceId: service.id,
          subItemData: newSubItemForm,
        })
      );

      if (createSubItem.fulfilled.match(result)) {
        setNewSubItemForm({
          title: "",
          description: "",
          icon: "",
          link: "",
        });
        setFormData((prev) => ({
          ...prev,
          sub_items: [...prev.sub_items, result.payload.subItem],
        }));
      }
    }
  };

  const startEditSubItem = (subItem) => {
    setEditingSubItem(subItem.id);
    setEditSubItemForm({
      title: subItem.title || "",
      description: subItem.description || "",
      icon: subItem.icon || "",
      link: subItem.link || "",
    });
  };

  const handleUpdateSubItem = async (subItemId) => {
    const result = await dispatch(
      updateSubItem({
        serviceId: service.id,
        subItemId: subItemId,
        subItemData: editSubItemForm,
      })
    );

    if (updateSubItem.fulfilled.match(result)) {
      setEditingSubItem(null);
      setFormData((prev) => ({
        ...prev,
        sub_items: prev.sub_items.map((item) =>
          item.id === subItemId ? { ...item, ...editSubItemForm } : item
        ),
      }));
    }
  };

  const handleDeleteSubItem = async (subItemId) => {
    if (!window.confirm("Are you sure you want to delete this sub item?")) {
      return;
    }

    const result = await dispatch(
      deleteSubItem({
        serviceId: service.id,
        subItemId: subItemId,
      })
    );

    if (deleteSubItem.fulfilled.match(result)) {
      setFormData((prev) => ({
        ...prev,
        sub_items: prev.sub_items.filter((item) => item.id !== subItemId),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const serviceMainData = {
      title: formData.title,
      description: formData.description,
      icon: formData.icon,
      color: formData.color,
      link: formData.link,
    };

    const result = await dispatch(
      updateService({
        id: service.id,
        serviceData: serviceMainData,
      })
    );

    if (updateService.fulfilled.match(result)) {
      if (onSuccess) onSuccess();
      if (onClose) onClose();
      dispatch(resetServiceStatus());
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-6xl max-h-[90vh] bg-base-100 dark:bg-base-200 overflow-hidden p-0 animate-in zoom-in-95 fade-in duration-200">
        <div className="sticky top-0 bg-base-200 dark:bg-base-300 border-b border-base-300 px-6 py-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Edit size={20} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold text-base-content">
              Edit Service
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle hover:bg-base-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-1 bg-primary rounded-full"></div>
                <h3 className="text-base font-semibold text-base-content">
                  Service Information
                </h3>
              </div>

              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-medium text-sm">
                    Title <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter service title"
                  className="input input-bordered w-full bg-base-200 dark:bg-base-300/50 focus:bg-base-100 focus:border-primary transition-all"
                />
              </div>

              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-medium text-sm">
                    Description
                  </span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Enter service description"
                  className="outline-none text-sm px-4 py-2 w-full bg-base-200 dark:bg-base-300/50 focus:bg-base-100 focus:border-primary dark:focus:border-parimary transition-all resize-none rounded-lg border border-base-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-baseline">
                <div className="form-control">
                  <div className="flex items-center gap-2">
                    <label className={`block text-sm font-medium`}>Icon</label>
                    <span className="text-[12px] text-error">{`*copy Component Name  di : `}</span>
                    <span
                      onClick={() => window.open("https://lucide.dev/icons/")}
                      className="text-[12px] text-blue-600 italic hover:underline cursor-pointer">{`https://lucide.dev/icons/`}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="icon"
                      value={formData.icon}
                      onChange={handleInputChange}
                      placeholder="Phone"
                      className="input input-bordered w-full bg-base-200 dark:bg-base-300/50 focus:bg-base-100 focus:border-primary transition-all"
                    />
                    {formData.icon && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <DynamicLucideIcon
                          iconName={formData.icon}
                          size={18}
                          color={formData.color}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-control">
                  <label className="label pb-1">
                    <span className="label-text font-medium text-sm">
                      Color
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      placeholder="#3B82F6"
                      className="input input-bordered w-full bg-base-200 dark:bg-base-300/50 focus:bg-base-100 focus:border-primary transition-all"
                    />
                    <input
                      type="color"
                      value={formData.color || "#3B82F6"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          color: e.target.value,
                        }))
                      }
                      className="w-12 h-12 cursor-pointer border-2 border-base-300 rounded-lg hover:border-primary transition-colors"
                      style={{ padding: "2px" }}
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label pb-1">
                    <span className="label-text font-medium text-sm">Link</span>
                  </label>
                  <input
                    type="url"
                    name="link"
                    value={formData.link}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    className="input input-bordered w-full bg-base-200 dark:bg-base-300/50 focus:bg-base-100 focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="divider"></div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-primary rounded-full"></div>
                  <h3 className="text-base font-semibold text-base-content">
                    Sub Items Management
                  </h3>
                </div>
                <span className="badge badge-primary badge-sm">
                  {formData.sub_items.length} items
                </span>
              </div>

              <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg border border-primary/20 space-y-3">
                <div className="flex items-center gap-2">
                  <Plus size={16} className="text-primary" />
                  <p className="text-sm text-base-content font-semibold">
                    Add New Sub Item
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="title"
                    value={newSubItemForm.title}
                    onChange={handleNewSubItemChange}
                    placeholder="Sub item title *"
                    className="input input-sm input-bordered bg-base-100 dark:bg-base-200 focus:border-primary transition-all"
                  />
                  <input
                    type="text"
                    name="icon"
                    value={newSubItemForm.icon}
                    onChange={handleNewSubItemChange}
                    placeholder="Icon (e.g., Info)"
                    className="input input-sm input-bordered bg-base-100 dark:bg-base-200 focus:border-primary transition-all"
                  />
                </div>
                <textarea
                  name="description"
                  value={newSubItemForm.description}
                  onChange={handleNewSubItemChange}
                  rows={2}
                  placeholder="Sub item description"
                  className="outline-none text-sm px-4 py-2 w-full bg-base-200 dark:bg-base-200 focus:bg-base-100 focus:border-primary dark:focus:border-parimary transition-all resize-none rounded-lg border border-base-300"
                />
                <div className="flex gap-3">
                  <input
                    type="url"
                    name="link"
                    value={newSubItemForm.link}
                    onChange={handleNewSubItemChange}
                    placeholder="https://example.com"
                    className="input input-sm input-bordered flex-1 bg-base-100 dark:bg-base-200 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewSubItem}
                    disabled={!newSubItemForm.title.trim()}
                    className="btn btn-success btn-sm gap-2">
                    <Plus size={16} />
                    Add
                  </button>
                </div>
              </div>

              {formData.sub_items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-base-content/60 font-medium flex items-center gap-2">
                    <ChevronDown size={14} />
                    Existing Sub Items ({formData.sub_items.length})
                  </p>
                  <div className="space-y-2">
                    {formData.sub_items.map((item, index) => (
                      <div
                        key={item.id}
                        className="bg-base-100 dark:bg-base-200 border border-base-300 rounded-lg p-4 hover:border-primary/30 transition-all duration-200 animate-in fade-in slide-in-from-left-2"
                        style={{ animationDelay: `${index * 30}ms` }}>
                        {editingSubItem === item.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="text"
                                name="title"
                                value={editSubItemForm.title}
                                onChange={handleEditSubItemChange}
                                placeholder="Title"
                                className="input input-sm input-bordered bg-base-200 dark:bg-base-300/50 focus:bg-base-100 focus:border-primary transition-all"
                              />
                              <input
                                type="text"
                                name="icon"
                                value={editSubItemForm.icon}
                                onChange={handleEditSubItemChange}
                                placeholder="Icon"
                                className="input input-sm input-bordered bg-base-200 dark:bg-base-300/50 focus:bg-base-100 focus:border-primary transition-all"
                              />
                            </div>
                            <textarea
                              name="description"
                              value={editSubItemForm.description}
                              onChange={handleEditSubItemChange}
                              rows={2}
                              placeholder="Description"
                              className="outline-none text-sm px-4 py-2 w-full bg-base-200 dark:bg-base-300/50 focus:bg-base-100 focus:border-primary dark:focus:border-parimary transition-all resize-none rounded-lg border border-base-300"
                            />
                            <input
                              type="url"
                              name="link"
                              value={editSubItemForm.link}
                              onChange={handleEditSubItemChange}
                              placeholder="https://example.com"
                              className="input input-sm input-bordered w-full bg-base-200 dark:bg-base-300/50 focus:bg-base-100 focus:border-primary transition-all"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateSubItem(item.id)}
                                className="btn btn-primary btn-sm gap-2">
                                <Save size={16} />
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingSubItem(null)}
                                className="btn btn-ghost btn-sm">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0 w-9 h-9 bg-base-200 dark:bg-base-300 rounded-lg flex items-center justify-center">
                                <DynamicLucideIcon
                                  iconName={item.icon}
                                  size={18}
                                  color={formData.color}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm text-base-content mb-0.5">
                                  {item.title}
                                </h4>
                                {item.description && (
                                  <p className="text-xs text-base-content/70 mb-1.5 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                                {item.link && (
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="link link-primary text-xs font-medium inline-flex items-center gap-1 hover:gap-1.5 transition-all">
                                    View Link
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                      />
                                    </svg>
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => startEditSubItem(item)}
                                className="btn btn-ghost btn-sm btn-square text-primary hover:bg-primary/10"
                                title="Edit">
                                <Edit size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubItem(item.id)}
                                className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10"
                                title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="alert alert-error shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current flex-shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="font-bold text-sm">Error occurred</h3>
                    <div className="text-xs">
                      {typeof error === "string"
                        ? error
                        : JSON.stringify(error)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-base-100 dark:bg-base-200 border-t border-base-300 px-6 py-4 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === "loading"}
              className="btn btn-primary btn-sm gap-2">
              {status === "loading" ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Updating...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Update Service
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <div
        className="modal-backdrop bg-black/50 backdrop-blur-sm"
        onClick={onClose}></div>
    </div>
  );
};

export default EditService;
