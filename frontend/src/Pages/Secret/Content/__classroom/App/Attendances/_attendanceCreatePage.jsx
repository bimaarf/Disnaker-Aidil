import React, { useState, useCallback, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useAttendance from "../../../../../../features/classroom/attendanceHook";
import { toast } from "react-toastify";
import ReactQuill from "react-quill";

const AttendanceCreatePage = () => {
  const navigate = useNavigate();
  const { code } = useParams();

  const { addMeeting, isCreating, error, validationErrors } =
    useAttendance(code);

  const [formData, setFormData] = useState({
    title: "",
    meeting_date: "",
    start_time: "",
    end_time: "",
    type: "regular",
    location: "",
    is_mandatory: true,
    agenda: "",
    materials_covered: "",
    homework_assigned: "",
    notes: "",
  });

  const [description, setDescription] = useState("");
  const [createMode, setCreateMode] = useState("optimistic");

  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "code-block"],
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

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const handleDescriptionChange = useCallback((content) => {
    setDescription(content);
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      // Basic validation
      if (!formData.title.trim()) {
        toast.error("Judul pertemuan harus diisi");
        return;
      }

      if (!formData.meeting_date) {
        toast.error("Tanggal pertemuan harus diisi");
        return;
      }

      if (!formData.type) {
        toast.error("Tipe pertemuan harus dipilih");
        return;
      }

      // Validate time if both are provided
      if (formData.start_time && formData.end_time) {
        if (formData.start_time >= formData.end_time) {
          toast.error("Waktu selesai harus setelah waktu mulai");
          return;
        }
      }

      const submitData = {
        ...formData,
        is_mandatory: formData.is_mandatory ? 1 : 0 || null,
        description: description || null,
      };

      try {
        const result = await addMeeting(submitData, {
          optimistic: createMode === "optimistic",
        });

        if (result.success) {
          navigate(`/classrooms/${code}/attendance`, {
            state: {
              newlyCreated: true,
              meetingId: result.data?.id,
              fromCreate: true,
            },
          });
        }
      } catch (error) {
        console.error("Create meeting error:", error);
      }
    },
    [formData, description, addMeeting, createMode, navigate, code]
  );

  const isLoading = isCreating;

  return (
    <div className="min-h-[90vh] bg-base-200/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 bg-base-100 dark:bg-base-200 p-6 rounded-3xl shadow-sm border border-base-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-base-content">
                Buat Pertemuan Baru
              </h1>
              <p className="mt-1 text-sm text-base-content/40">
                Buat pertemuan baru untuk kelas {code}. Kehadiran siswa akan
                otomatis dibuat.
              </p>
            </div>
            <Link
              to={`/classrooms/${code}/attendance`}
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
                  className="mr-2"
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
                  className="mr-2"
                />
                <span className="text-sm text-base-content/80">
                  Standard (Tunggu server response)
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-base-100 dark:bg-base-200 rounded-3xl shadow-sm border border-base-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label
                  htmlFor="title"
                  className="block text-sm font-semibold text-base-content/80 mb-2">
                  Judul Pertemuan *
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                    validationErrors?.title ? "border-error" : "border-base-300"
                  }`}
                  placeholder="Masukkan judul pertemuan"
                  required
                  disabled={isLoading}
                />
                {validationErrors?.title && (
                  <p className="mt-2 text-sm text-error">
                    {validationErrors.title[0]}
                  </p>
                )}
              </div>

              {/* Date */}
              <div>
                <label
                  htmlFor="meeting_date"
                  className="block text-sm font-semibold text-base-content/80 mb-2">
                  Tanggal Pertemuan *
                </label>
                <input
                  type="date"
                  name="meeting_date"
                  id="meeting_date"
                  value={formData.meeting_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                    validationErrors?.meeting_date
                      ? "border-error"
                      : "border-base-300"
                  }`}
                  required
                  disabled={isLoading}
                />
                {validationErrors?.meeting_date && (
                  <p className="mt-2 text-sm text-error">
                    {validationErrors.meeting_date[0]}
                  </p>
                )}
              </div>

              {/* Type */}
              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-semibold text-base-content/80 mb-2">
                  Tipe Pertemuan *
                </label>
                <select
                  name="type"
                  id="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                    validationErrors?.type ? "border-error" : "border-base-300"
                  }`}
                  required
                  disabled={isLoading}>
                  <option value="regular">Regular</option>
                </select>
                {validationErrors?.type && (
                  <p className="mt-2 text-sm text-error">
                    {validationErrors.type[0]}
                  </p>
                )}
              </div>

              {/* Start Time */}
              <div>
                <label
                  htmlFor="start_time"
                  className="block text-sm font-semibold text-base-content/80 mb-2">
                  Waktu Mulai
                </label>
                <input
                  type="time"
                  name="start_time"
                  id="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                    validationErrors?.start_time
                      ? "border-error"
                      : "border-base-300"
                  }`}
                  disabled={isLoading}
                />
                {validationErrors?.start_time && (
                  <p className="mt-2 text-sm text-error">
                    {validationErrors.start_time[0]}
                  </p>
                )}
              </div>

              {/* End Time */}
              <div>
                <label
                  htmlFor="end_time"
                  className="block text-sm font-semibold text-base-content/80 mb-2">
                  Waktu Selesai
                </label>
                <input
                  type="time"
                  name="end_time"
                  id="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                    validationErrors?.end_time
                      ? "border-error"
                      : "border-base-300"
                  }`}
                  disabled={isLoading}
                />
                {validationErrors?.end_time && (
                  <p className="mt-2 text-sm text-error">
                    {validationErrors.end_time[0]}
                  </p>
                )}
              </div>

              {/* Location */}
              <div className="md:col-span-2">
                <label
                  htmlFor="location"
                  className="block text-sm font-semibold text-base-content/80 mb-2">
                  Lokasi
                </label>
                <input
                  type="text"
                  name="location"
                  id="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                    validationErrors?.location
                      ? "border-error"
                      : "border-base-300"
                  }`}
                  placeholder="Masukkan lokasi pertemuan"
                  disabled={isLoading}
                />
                {validationErrors?.location && (
                  <p className="mt-2 text-sm text-error">
                    {validationErrors.location[0]}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
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
                  value={description}
                  onChange={handleDescriptionChange}
                  theme="snow"
                  placeholder="Tulis deskripsi pertemuan..."
                  modules={quillModules}
                  formats={quillFormats}
                  style={{
                    backgroundColor: "transparent",
                  }}
                />
              </div>
              {validationErrors?.description && (
                <p className="mt-2 text-sm text-error">
                  {validationErrors.description[0]}
                </p>
              )}
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Agenda */}
              <div>
                <label
                  htmlFor="agenda"
                  className="block text-sm font-semibold text-base-content/80 mb-2">
                  Agenda
                </label>
                <textarea
                  name="agenda"
                  id="agenda"
                  value={formData.agenda}
                  onChange={handleChange}
                  rows="4"
                  className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                    validationErrors?.agenda
                      ? "border-error"
                      : "border-base-300"
                  }`}
                  placeholder="Masukkan agenda pertemuan"
                  disabled={isLoading}
                />
                {validationErrors?.agenda && (
                  <p className="mt-2 text-sm text-error">
                    {validationErrors.agenda[0]}
                  </p>
                )}
              </div>

              {/* Materials Covered */}
              <div>
                <label
                  htmlFor="materials_covered"
                  className="block text-sm font-semibold text-base-content/80 mb-2">
                  Materi yang Dibahas
                </label>
                <textarea
                  name="materials_covered"
                  id="materials_covered"
                  value={formData.materials_covered}
                  onChange={handleChange}
                  rows="4"
                  className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                    validationErrors?.materials_covered
                      ? "border-error"
                      : "border-base-300"
                  }`}
                  placeholder="Masukkan materi yang akan dibahas"
                  disabled={isLoading}
                />
                {validationErrors?.materials_covered && (
                  <p className="mt-2 text-sm text-error">
                    {validationErrors.materials_covered[0]}
                  </p>
                )}
              </div>

              {/* Homework Assigned */}
              <div>
                <label
                  htmlFor="homework_assigned"
                  className="block text-sm font-semibold text-base-content/80 mb-2">
                  Tugas yang Diberikan
                </label>
                <textarea
                  name="homework_assigned"
                  id="homework_assigned"
                  value={formData.homework_assigned}
                  onChange={handleChange}
                  rows="4"
                  className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                    validationErrors?.homework_assigned
                      ? "border-error"
                      : "border-base-300"
                  }`}
                  placeholder="Masukkan tugas yang diberikan"
                  disabled={isLoading}
                />
                {validationErrors?.homework_assigned && (
                  <p className="mt-2 text-sm text-error">
                    {validationErrors.homework_assigned[0]}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-semibold text-base-content/80 mb-2">
                  Catatan
                </label>
                <textarea
                  name="notes"
                  id="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="4"
                  className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                    validationErrors?.notes ? "border-error" : "border-base-300"
                  }`}
                  placeholder="Masukkan catatan tambahan"
                  disabled={isLoading}
                />
                {validationErrors?.notes && (
                  <p className="mt-2 text-sm text-error">
                    {validationErrors.notes[0]}
                  </p>
                )}
              </div>
            </div>

            {/* Is Mandatory */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_mandatory"
                id="is_mandatory"
                checked={formData.is_mandatory}
                onChange={handleChange}
                className="rounded border-base-300 text-primary focus:ring-primary"
                disabled={isLoading}
              />
              <label
                htmlFor="is_mandatory"
                className="ml-2 text-sm text-base-content/80">
                Pertemuan wajib dihadiri
              </label>
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
                to={`/classrooms/${code}/attendance`}
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
                      ? "Membuat..."
                      : "Menyimpan..."}
                  </span>
                ) : (
                  "Buat Pertemuan"
                )}
              </button>
            </div>

            {/* Info about create mode */}
            {createMode === "optimistic" && (
              <div className="text-xs text-base-content/60 text-center">
                Mode optimistic: UI akan diupdate langsung tanpa menunggu server
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCreatePage;
