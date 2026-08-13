import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  fetchWhatsAppNotifications,
  createWhatsAppNotification,
  updateWhatsAppNotification,
  deleteWhatsAppNotification,
} from "../../../../features/notifications/whatsappNotificationSlice";
import { toast } from "react-toastify";

const WhatsAppNotificationPage = () => {
  const dispatch = useDispatch();
  const { notifications, status, error } = useSelector(
    (state) => state.whatsappNotification
  );

  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    label: "",
    message: "",
  });

  // ReactQuill modules configuration
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "link",
  ];

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchWhatsAppNotifications());
    }
  }, [dispatch]);

  const handleOpenDialog = (notification = null) => {
    if (notification) {
      setEditMode(true);
      setSelectedId(notification.id);
      setFormData({
        code: notification.code,
        label: notification.label,
        message: notification.message,
      });
    } else {
      setEditMode(false);
      setSelectedId(null);
      setFormData({
        code: "",
        label: "",
        message: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      code: "",
      label: "",
      message: "",
    });
    setEditMode(false);
    setSelectedId(null);
  };

  const handleOpenDeleteDialog = (id) => {
    setSelectedId(id);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMessageChange = (content) => {
    setFormData((prev) => ({
      ...prev,
      message: content,
    }));
  };

  const handleSubmit = async () => {
    if (editMode) {
      await dispatch(
        updateWhatsAppNotification({
          id: selectedId,
          notificationData: formData,
        })
      );
      toast.success("Template notifikasi berhasil diperbarui!");
    } else {
      await dispatch(createWhatsAppNotification(formData));
      toast.success("Template notifikasi berhasil dibuat!");
    }
    handleCloseDialog();
  };

  const handleDelete = async () => {
    await dispatch(deleteWhatsAppNotification(selectedId));
    toast.success("Template notifikasi berhasil dihapus!");
    handleCloseDeleteDialog();
  };

  // Helper untuk mendapatkan badge color berdasarkan code
  const getCodeColor = (code) => {
    switch (code) {
      case "selection_result":
        return "badge-primary";
      case "document_received":
        return "badge-success";
      case "document_rejected":
        return "badge-error";
      default:
        return "badge-ghost";
    }
  };

  // Extract placeholders dari message
  const extractPlaceholders = (message) => {
    const matches = message.match(/\{[^}]+\}/g);
    return matches ? [...new Set(matches)] : [];
  };

  // Convert HTML to WhatsApp preview
  const convertHtmlToWhatsAppPreview = (html) => {
    if (!html) return "";

    let text = html;

    // Bold
    text = text.replace(/<(strong|b)>(.*?)<\/(strong|b)>/gi, "*$2*");
    // Italic
    text = text.replace(/<(em|i)>(.*?)<\/(em|i)>/gi, "_$2_");
    // Strikethrough
    text = text.replace(/<(s|strike|del)>(.*?)<\/(s|strike|del)>/gi, "~$2~");
    // Heading to bold
    text = text.replace(/<h[1-6]>(.*?)<\/h[1-6]>/gi, "*$1*\n");
    // Line breaks
    text = text.replace(/<br\s*\/?>/gi, "\n");
    // Paragraphs
    text = text.replace(/<p>(.*?)<\/p>/gi, "$1\n\n");
    // Lists
    text = text.replace(/<li>(.*?)<\/li>/gi, "• $1\n");
    text = text.replace(/<\/?ul>/gi, "");
    text = text.replace(/<\/?ol>/gi, "");
    // Links
    text = text.replace(
      /<a\s+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi,
      "$2 ($1)"
    );
    // Remove remaining tags
    text = text.replace(/<[^>]+>/g, "");
    // Decode entities
    text = text.replace(/&nbsp;/g, " ");
    text = text.replace(/&amp;/g, "&");
    text = text.replace(/&lt;/g, "<");
    text = text.replace(/&gt;/g, ">");
    text = text.replace(/&quot;/g, '"');
    // Clean multiple line breaks
    text = text.replace(/\n{3,}/g, "\n\n");

    return text.trim();
  };

  return (
    <div className="bg-base-100 border rounded-xl border-base-300 min-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Template Notifikasi WhatsApp
            </h1>
            <p className="text-sm text-base-content/60 mt-1">
              Kelola template notifikasi WhatsApp
            </p>
          </div>
          <button
            onClick={() => handleOpenDialog()}
            className="btn btn-primary gap-2">
            <span className="material-symbols-outlined text-lg">add</span>
            <span className="hidden sm:inline">Tambah Template</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4">
          <div className="alert alert-error">
            <span className="material-symbols-outlined">error</span>
            <span>
              {typeof error === "object" ? JSON.stringify(error) : error}
            </span>
          </div>
        </div>
      )}

      {/* Table/List */}
      <div className="p-4">
        <div className="overflow-x-auto rounded-xl border border-base-300">
          <table className="table table-zebra w-full">
            <thead className="bg-base-200">
              <tr>
                <th className="bg-base-200">Code</th>
                <th className="bg-base-200">Label</th>
                <th className="bg-base-200">Placeholders</th>
                <th className="bg-base-200">Preview Message</th>
                <th className="bg-base-200 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {status === "loading" && !notifications.length ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="loading loading-spinner loading-md"></div>
                  </td>
                </tr>
              ) : status !== "loading" && notifications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl text-base-content/40">
                          chat_bubble_outline
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-base-content/70">
                          Belum ada template notifikasi
                        </h3>
                        <p className="text-sm text-base-content/50 mt-1">
                          Buat template pertama Anda
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                notifications.map((notification) => {
                  const placeholders = extractPlaceholders(
                    notification.message
                  );
                  return (
                    <tr
                      key={notification.id}
                      className="hover:bg-base-100 transition-colors duration-200">
                      <td>
                        <div
                          className={`badge ${getCodeColor(
                            notification.code
                          )}`}>
                          {notification.code}
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold">
                          {notification.label}
                        </div>
                      </td>
                      <td>
                        {placeholders.length > 0 ? (
                          <div className="flex gap-1 flex-wrap max-w-xs">
                            {placeholders.map((placeholder, idx) => (
                              <span
                                key={idx}
                                className="badge badge-outline badge-sm">
                                {placeholder}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-base-content/50">
                            Tidak ada placeholder
                          </span>
                        )}
                      </td>
                      <td>
                        <div
                          className="tooltip"
                          data-tip={notification.message}>
                          <p className="text-sm line-clamp-2 max-w-md">
                            {notification.message}
                          </p>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenDialog(notification)}
                            className="btn btn-ghost btn-sm hover:bg-base-200"
                            title="Edit">
                            <span className="material-symbols-outlined text-sm">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              handleOpenDeleteDialog(notification.id)
                            }
                            className="btn btn-ghost btn-sm text-error hover:bg-error/10"
                            title="Delete">
                            <span className="material-symbols-outlined text-sm">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog Form Create/Edit */}
      {openDialog && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">
                {editMode
                  ? "Edit Template Notifikasi"
                  : "Tambah Template Notifikasi"}
              </h3>
              <button
                onClick={handleCloseDialog}
                className="btn btn-ghost btn-sm btn-circle">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Code *</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="Contoh: selection_result, document_received"
                  className="input input-bordered w-full"
                />
                <label className="label">
                  <span className="label-text-alt">
                    Contoh: selection_result, document_received
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Label *</span>
                </label>
                <input
                  type="text"
                  name="label"
                  value={formData.label}
                  onChange={handleChange}
                  placeholder="Nama yang mudah diingat untuk template ini"
                  className="input input-bordered w-full"
                />
                <label className="label">
                  <span className="label-text-alt">
                    Nama yang mudah diingat untuk template ini
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Message Template *
                  </span>
                </label>
                <div className="border border-base-300 rounded-lg overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={formData.message}
                    onChange={handleMessageChange}
                    modules={modules}
                    formats={formats}
                    style={{ minHeight: "200px" }}
                    placeholder="Tulis template pesan di sini... Gunakan {placeholder} untuk data dinamis"
                  />
                </div>
                <label className="label">
                  <span className="label-text-alt">
                    Tips: Gunakan placeholder seperti {"{name}"},{" "}
                    {"{submission_id}"}, {"{status}"}, dll.
                  </span>
                </label>

                {/* WhatsApp Preview */}
                {formData.message && (
                  <div className="mt-4">
                    <label className="label">
                      <span className="label-text font-medium">
                        Preview WhatsApp Format:
                      </span>
                    </label>
                    <div className="bg-success/10 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                      {convertHtmlToWhatsAppPreview(formData.message)}
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Placeholders */}
              {formData.message &&
                extractPlaceholders(formData.message).length > 0 && (
                  <div className="alert alert-info">
                    <span className="material-symbols-outlined">info</span>
                    <div>
                      <h4 className="font-semibold">
                        Placeholders terdeteksi:
                      </h4>
                      <div className="flex gap-1 flex-wrap mt-2">
                        {extractPlaceholders(formData.message).map(
                          (placeholder, idx) => (
                            <span key={idx} className="badge badge-sm">
                              {placeholder}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
            </div>

            <div className="modal-action">
              <button onClick={handleCloseDialog} className="btn btn-ghost">
                Batal
              </button>
              <button
                onClick={handleSubmit}
                className="btn btn-primary"
                disabled={
                  !formData.code || !formData.label || !formData.message
                }>
                {editMode ? "Update" : "Simpan"}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={handleCloseDialog}></div>
        </div>
      )}

      {/* Dialog Delete Confirmation */}
      {openDeleteDialog && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Konfirmasi Hapus</h3>
            <p className="py-4">
              Apakah Anda yakin ingin menghapus template notifikasi ini?
            </p>
            <div className="modal-action">
              <button
                onClick={handleCloseDeleteDialog}
                className="btn btn-ghost">
                Batal
              </button>
              <button onClick={handleDelete} className="btn btn-error">
                Hapus
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={handleCloseDeleteDialog}></div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppNotificationPage;
