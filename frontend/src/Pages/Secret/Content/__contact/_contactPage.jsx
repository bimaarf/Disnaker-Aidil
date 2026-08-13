import { CircularProgress } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  createContact,
  fetchContacts,
} from "../../../../features/LandingPages/contactSlice";
import {
  Phone,
  Mail,
  MessageCircle,
  Instagram,
  Send,
  Save,
} from "lucide-react";

export const ContactPage = () => {
  const dispatch = useDispatch();
  const { contacts, status } = useSelector((state) => state.contacts);
  const theme = useSelector((state) => state.themes.localTheme);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [telegram, setTelegram] = useState("");
  const [instagram, setInstagram] = useState("");

  useEffect(() => {
    const getContacts = async () => {
      try {
        await dispatch(fetchContacts()).unwrap();
      } catch (error) {
        console.error("Failed to fetch contacts data:", error);
      }
    };

    status === "idle" && getContacts();
  }, [dispatch, status]);

  useEffect(() => {
    if (contacts) {
      setEmail(contacts.email || "");
      setWhatsapp(contacts.whatsapp || "");
      setTelegram(contacts.telegram || "");
      setInstagram(contacts.instagram || "");
    }
  }, [contacts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("whatsapp", whatsapp);
      formData.append("telegram", telegram);
      formData.append("instagram", instagram);
      await dispatch(createContact(formData));
      toast.success("Contact updated successfully.");
    } catch (error) {
      toast.error("Failed to update contact.");
      console.error("Contact update error:", error);
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
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1
                  className={`text-xl md:text-3xl font-bold ${themeClasses.text}`}>
                  Contact Information
                </h1>
                <p className={`text-sm ${themeClasses.muted} mt-1`}>
                  Kelola informasi kontak untuk halaman landing page
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
        <form
          onSubmit={handleSubmit}
          className="gap-2 md:gap-6 grid grid-cols-1 sm:grid-cols-2">
          {/* Email Section */}
          <div
            className={`${themeClasses.card} rounded-2xl border border-base-300/50 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300`}>
            <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                  Email Address
                </h3>
              </div>
              <div className="space-y-2">
                <label
                  className={`block text-sm font-medium ${themeClasses.muted}`}>
                  Alamat Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl ${themeClasses.input} transition-all duration-100 placeholder:text-base-content/50`}
                    placeholder="contoh@email.com"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp Section */}
          <div
            className={`${themeClasses.card} rounded-2xl border border-base-300/50 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300`}>
            <div className="h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                  WhatsApp Number
                </h3>
              </div>
              <div className="space-y-2">
                <label
                  className={`block text-sm font-medium ${themeClasses.muted}`}>
                  Nomor WhatsApp
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl ${themeClasses.input} transition-all duration-100 placeholder:text-base-content/50`}
                    placeholder="628123456789"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instagram Section */}
          <div
            className={`${themeClasses.card} rounded-2xl border border-base-300/50 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300`}>
            <div className="h-1 bg-gradient-to-r from-pink-500 to-purple-600"></div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                  Instagram Username
                </h3>
              </div>
              <div className="space-y-2">
                <label
                  className={`block text-sm font-medium ${themeClasses.muted}`}>
                  Username Instagram
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl ${themeClasses.input} transition-all duration-100 placeholder:text-base-content/50`}
                    placeholder="@username"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <Instagram className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Telegram Section */}
          <div
            className={`${themeClasses.card} rounded-2xl border border-base-300/50 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300`}>
            <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                  Telegram Username
                </h3>
              </div>
              <div className="space-y-2">
                <label
                  className={`block text-sm font-medium ${themeClasses.muted}`}>
                  Username Telegram
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl ${themeClasses.input} transition-all duration-100 placeholder:text-base-content/50`}
                    placeholder="@username"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <Send className="w-5 h-5 text-blue-500" />
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
