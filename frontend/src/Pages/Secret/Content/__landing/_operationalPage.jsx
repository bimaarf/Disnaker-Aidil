import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOperational,
  updateOperational,
} from "../../../../features/LandingPages/operationalSlice";
import { toast } from "react-toastify";
import { CircularProgress } from "@mui/material";
import { Clock, FileText, Save, Calendar } from "lucide-react";

export const OperationalPage = () => {
  const dispatch = useDispatch();
  const { hours, note, status } = useSelector((state) => state.operational);
  const theme = useSelector((state) => state.themes.localTheme);

  const [formData, setFormData] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchOperational());
    }
  }, [dispatch, status]);

  useEffect(() => {
    if (hours.length > 0) {
      setFormData(hours);
    } else {
      // fallback default untuk 7 hari
      setFormData(
        ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"].map(
          (day) => ({
            day,
            open_time: "",
            close_time: "",
            is_closed: false,
          })
        )
      );
    }

    if (note) setNoteText(note);
  }, [hours, note]);

  const handleTimeChange = (index, key, value) => {
    setFormData((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  };

  const handleToggleClosed = (index) => {
    setFormData((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const is_closed = !item.is_closed;
        return {
          ...item,
          is_closed,
          open_time: is_closed ? null : item.open_time ?? "",
          close_time: is_closed ? null : item.close_time ?? "",
        };
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const defaultOpen = "07:00";
      const defaultClose = "16:00";

      const normalizeTime = (val) => {
        if (!val || typeof val !== "string") return null;
        const match = val.match(/^(\d{2}:\d{2})/);
        return match ? match[1] : null;
      };

      const hoursPayloadFromForm = formData.map((item) => {
        const isClosed = item.is_closed;
        const open = normalizeTime(item.open_time);
        const close = normalizeTime(item.close_time);

        return {
          day: item.day,
          is_closed: isClosed,
          open_time: isClosed ? null : open || defaultOpen,
          close_time: isClosed ? null : close || defaultClose,
        };
      });

      const payload = {
        hours: hoursPayloadFromForm,
        note: noteText,
      };

      await dispatch(updateOperational(payload)).unwrap();
      toast.success("Jam operasional berhasil diperbarui");
    } catch (err) {
      toast.error("Gagal memperbarui jam operasional");
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getThemeClasses = () => {
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
  };

  const themeClasses = getThemeClasses();

  return (
    <div className={`min-h-screen ${themeClasses.container} p-1 md:p-6`}>
      {/* Header */}
      <div
        className={`${themeClasses.header} backdrop-blur-xl border-b border-base-300/50 rounded-t-2xl mb-6`}>
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-start md:items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1
                  className={`text-xl md:text-3xl font-bold ${themeClasses.text}`}>
                  Jam Operasional
                </h1>
                <p className={`text-sm ${themeClasses.muted} mt-1`}>
                  Atur jam operasional layanan.
                </p>
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
                <CircularProgress size={16} />
                <span className="text-sm font-medium text-blue-700">
                  Memperbarui...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Weekly Schedule Section */}
          <div
            className={`${themeClasses.card} rounded-2xl border border-base-300/50 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300`}>
            <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                  Jadwal Mingguan
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {formData.map((item, index) => (
                  <div
                    key={item.day}
                    className={`
                      ${
                        themeClasses.card
                      } rounded-2xl border border-base-300/50 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300
                      ${item.is_closed ? "opacity-75" : ""}
                    `}>
                    <div
                      className={`h-1 bg-gradient-to-r ${
                        item.is_closed
                          ? "from-gray-400 to-gray-500"
                          : "from-blue-500 to-blue-600"
                      }`}></div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              item.is_closed ? "bg-gray-400" : "bg-green-500"
                            }`}></div>
                          <h4
                            className={`text-lg font-semibold capitalize ${themeClasses.text}`}>
                            {item.day}
                          </h4>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.is_closed}
                            onChange={() => handleToggleClosed(index)}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                          <span
                            className={`ml-3 text-sm font-medium ${themeClasses.text}`}>
                            {item.is_closed ? "Tutup" : "Buka"}
                          </span>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            className={`block text-sm font-medium ${themeClasses.muted} mb-2`}>
                            Jam Buka
                          </label>
                          <input
                            type="time"
                            disabled={item.is_closed}
                            value={item.open_time || ""}
                            onChange={(e) =>
                              handleTimeChange(
                                index,
                                "open_time",
                                e.target.value
                              )
                            }
                            className={`w-full px-4 py-3 rounded-xl ${
                              themeClasses.input
                            } transition-all duration-200 ${
                              item.is_closed
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          />
                        </div>
                        <div>
                          <label
                            className={`block text-sm font-medium ${themeClasses.muted} mb-2`}>
                            Jam Tutup
                          </label>
                          <input
                            type="time"
                            disabled={item.is_closed}
                            value={item.close_time || ""}
                            onChange={(e) =>
                              handleTimeChange(
                                index,
                                "close_time",
                                e.target.value
                              )
                            }
                            className={`w-full px-4 py-3 rounded-xl ${
                              themeClasses.input
                            } transition-all duration-200 ${
                              item.is_closed
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div
            className={`${themeClasses.card} rounded-2xl border border-base-300/50 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300`}>
            <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-600"></div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                  Catatan Layanan
                </h3>
              </div>
              <div className="space-y-2">
                <label
                  className={`block text-sm font-medium ${themeClasses.muted}`}>
                  Catatan Khusus
                </label>
                <div className="relative">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className={`w-full min-h-[120px] px-4 py-3 rounded-xl ${themeClasses.input} transition-all duration-200 resize-none placeholder:text-base-content/50`}
                    placeholder="Tambahkan catatan khusus seperti: Selama periode (Pendaftaran)., layanan diperpanjang hingga jam 20:00 atau informasi penting lainnya..."
                    maxLength={500}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-base-content/40 font-medium">
                    {noteText.length}/500
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={loading}
              className={`
                relative px-8 py-4 rounded-2xl text-base font-semibold
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
              <span>{loading ? "Menyimpan..." : "Simpan Perubahan"}</span>
              <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-all duration-700"></div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
