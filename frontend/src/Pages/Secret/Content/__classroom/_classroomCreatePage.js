// pages/ClassRoomCreatePage.jsx - Optimized Version
import React, { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClassroomForm } from "../../../../features/classroom/classroomHook";
import ReactQuill from "react-quill";

export const ClassRoomCreatePage = () => {
  const navigate = useNavigate();
  // const quillRef = useRef(null);

  // Menggunakan enhanced hook dengan optimistic updates
  const { handleCreateWithNavigation, isCreating, error, validationErrors } =
    useClassroomForm();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    status: "active",
  });
  const [description, setDescription] = useState("");

  // State untuk mengontrol mode create
  const [createMode, setCreateMode] = useState("optimistic");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Remove code from formData if empty, as backend will auto-generate
    const submitData = { ...formData, description: description || null };
    if (!submitData.code) {
      delete submitData.code;
    }

    try {
      await handleCreateWithNavigation(submitData, navigate, {
        optimistic: createMode === "optimistic",
        successMessage: "Kelas berhasil dibuat!",
        redirectPath: "/classrooms",
        redirectToFirst: true,
      });

      // Navigation akan ditangani oleh handleCreateWithNavigation
    } catch (error) {
      console.error("Create error:", error);
      // Error sudah ditangani oleh hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "code-block"],
          ["link", "image"],
          ["link", "image"],
          ["clean"],
        ],
      },
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );
  const handleDescriptionChange = useCallback((content) => {
    setDescription(content);
  }, []);
  const quillFormats = useMemo(
    () => [
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "list",
      "bullet",
      "blockquote",
      "code-block",
      "link",
    ],
    []
  );

  const isLoading = isCreating || isSubmitting;

  return (
    <div className="min-h-[90vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 bg-base-100 dark:bg-base-200 p-6 rounded-2xl shadow-sm border border-base-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-base-content">
                Tambah Kelas Baru
              </h1>
              <p className="mt-1 text-sm text-base-content/40">
                Buat kelas baru untuk mengelola guru dan siswa. Kode kelas akan
                dihasilkan otomatis jika tidak diisi.
              </p>
            </div>
            <Link
              to="/classrooms"
              className="mt-4 sm:mt-0 px-4 py-2 bg-base-100 dark:bg-base-300 border border-base-300 text-base-content/80 rounded-xl hover:bg-base-200/50 transition-colors duration-200">
              Kembali
            </Link>
          </div>
        </div>

        {/* Create Mode Selection (Development/Debug) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-6 bg-base-100 dark:bg-base-200 p-4 rounded-xl border border-base-200">
            <h3 className="text-sm font-semibold text-base-content mb-2">
              Mode Create (Development Only)
            </h3>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="createMode"
                  value="optimistic"
                  checked={createMode === "optimistic"}
                  onChange={(e) => setCreateMode(e.target.value)}
                  className={`mr-2 radio ${
                    createMode === "optimistic" && "radio-primary"
                  }`}
                />
                <span className="text-sm text-base-content/80">
                  Optimistic (Update UI langsung)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="createMode"
                  value="standard"
                  checked={createMode === "standard"}
                  onChange={(e) => setCreateMode(e.target.value)}
                  className={`mr-2 radio ${
                    createMode === "standard" && "radio-primary"
                  }`}
                />
                <span className="text-sm text-base-content/80">
                  Standard (Tunggu server response)
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-base-100 dark:bg-base-200 rounded-2xl shadow-sm border border-base-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-base-content/80 mb-2">
                Nama Kelas *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                  validationErrors?.name ? "border-error" : "border-base-300"
                }`}
                placeholder="Masukkan nama kelas"
                required
                disabled={isLoading}
              />
              {validationErrors?.name && (
                <p className="mt-2 text-sm text-error">
                  {validationErrors.name[0]}
                </p>
              )}
            </div>

            {/* Code Field */}
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-semibold text-base-content/80 mb-2">
                Kode Kelas (Opsional)
              </label>
              <input
                type="text"
                name="code"
                id="code"
                value={formData.code}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                  validationErrors?.code ? "border-error" : "border-base-300"
                }`}
                placeholder="Masukkan kode kelas atau biarkan kosong untuk otomatis"
                disabled={isLoading}
              />
              {validationErrors?.code && (
                <p className="mt-2 text-sm text-error">
                  {validationErrors.code[0]}
                </p>
              )}
            </div>

            {/* Description Field */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-base-content/80 mb-2">
                Deskripsi
              </label>
              <div
                className={`custom-quill ${
                  validationErrors?.description ? "error" : ""
                }`}>
                <ReactQuill
                  // ref={quillRef}
                  value={description}
                  onChange={handleDescriptionChange}
                  theme="snow"
                  placeholder="Tulis deskripsi kelas..."
                  modules={quillModules}
                  formats={quillFormats}
                  style={{
                    backgroundColor: "transparent",
                  }}
                />
              </div>
              {/* <textarea
                name="description"
                id="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                  validationErrors?.description
                    ? "border-error"
                    : "border-base-300"
                }`}
                placeholder="Masukkan deskripsi kelas (opsional)"
                disabled={isLoading}
              /> */}
              {validationErrors?.description && (
                <p className="mt-2 text-sm text-error">
                  {validationErrors.description[0]}
                </p>
              )}
            </div>

            {/* Status Field */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-semibold text-base-content/80 mb-2">
                Status
              </label>
              <select
                name="status"
                id="status"
                value={formData.status}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                  validationErrors?.status ? "border-error" : "border-base-300"
                }`}
                disabled={isLoading}>
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
              </select>
              {validationErrors?.status && (
                <p className="mt-2 text-sm text-error">
                  {validationErrors.status[0]}
                </p>
              )}
            </div>

            {/* General Error */}
            {error && (
              <div className="p-4 bg-error/10 border border-error/20 rounded-xl">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-4">
              <Link
                to="/classrooms"
                className="px-6 py-3 bg-base-100 dark:bg-base-300 border border-base-300 text-base-content/80 rounded-xl hover:bg-base-200/50 transition-colors duration-200">
                Batal
              </Link>

              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-3 bg-gradient-to-r from-primary to-blue-700 text-white rounded-xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isLoading ? "disabled:transform-none" : ""
                }`}>
                {isLoading ? (
                  <span className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {createMode === "optimistic"
                      ? "Menyimpan..."
                      : "Membuat..."}
                  </span>
                ) : (
                  "Buat Kelas"
                )}
              </button>
            </div>

            {/* Info about create mode */}
            {createMode === "optimistic" && (
              <div className="text-xs text-base-content/60 text-center">
                💡 Mode optimistic: UI akan diupdate langsung tanpa menunggu
                server
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClassRoomCreatePage;
