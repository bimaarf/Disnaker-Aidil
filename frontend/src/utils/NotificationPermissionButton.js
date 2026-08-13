import React, { useState, useEffect } from "react";

const NotificationPermissionButton = () => {
  const [permission, setPermission] = useState(Notification.permission);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Update permission status when component mounts
    setPermission(Notification.permission);
  }, []);

  const requestNotificationPermission = async () => {
    setIsLoading(true);

    try {
      // Check browser support
      if (!("Notification" in window)) {
        alert(
          "Browser kamu tidak mendukung notifikasi push. Gunakan Chrome, Firefox, atau Safari versi terbaru."
        );
        setIsLoading(false);
        return;
      }

      // If already granted, show test notification
      if (Notification.permission === "granted") {
        showTestNotification();
        setIsLoading(false);
        return;
      }

      // Request permission (must be triggered by user gesture for mobile)
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        showTestNotification();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else if (result === "denied") {
        alert(
          "Notifikasi ditolak. Untuk mengaktifkan notifikasi:\n\n" +
            "📱 Android Chrome:\n" +
            "• Buka Settings > Site Settings > Notifications\n" +
            "• Atau tap ikon 🔒 di address bar\n\n" +
            "📱 iOS Safari (iOS 16.4+):\n" +
            "• Buka Settings > Safari > Notifications\n" +
            "• Atau tap aA di address bar > Website Settings\n\n" +
            "💻 Desktop:\n" +
            "• Klik ikon 🔒 di address bar\n" +
            "• Pilih 'Allow' untuk Notifications"
        );
      } else {
        // User dismissed the prompt
        alert(
          "Kamu perlu memberikan izin untuk menerima notifikasi. Silakan coba lagi."
        );
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      alert(
        "Terjadi kesalahan saat meminta izin notifikasi. Silakan refresh halaman dan coba lagi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const showTestNotification = () => {
    try {
      const notification = new Notification(
        "🔔 Notifikasi Berhasil Diaktifkan!",
        {
          body: "Kamu akan menerima pemberitahuan untuk update terbaru dari sistem.",
          icon: "https://psb.yz-course.com/api/logo/images/logo.png", // Sesuaikan dengan icon website Anda
          badge: "https://psb.yz-course.com/api/logo/images/logo.png",
          tag: "test-notification",
          requireInteraction: false,
          silent: false,
          // Vibration pattern untuk mobile (200ms on, 100ms off, 200ms on)
          vibrate: [200, 100, 200],
          // Actions untuk mobile browsers yang support
          actions: [
            {
              action: "view",
              title: "Lihat",
              icon: "https://psb.yz-course.com/api/logo/images/logo.png",
            },
          ],
        }
      );

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
      };

      // Handle notification actions
      notification.onshow = () => {
        console.log("Notification shown successfully");
      };

      notification.onerror = (error) => {
        console.error("Notification error:", error);
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    } catch (error) {
      console.error("Error showing test notification:", error);
      alert(
        "Gagal menampilkan notifikasi percobaan. Pastikan browser mendukung notifikasi."
      );
    }
  };

  const getButtonText = () => {
    if (isLoading) return "Meminta Izin...";

    switch (permission) {
      case "granted":
        return "✅ Notifikasi Aktif";
      case "denied":
        return "❌ Notifikasi Diblokir";
      default:
        return "🔔 Aktifkan Notifikasi";
    }
  };

  const getButtonClass = () => {
    const baseClass =
      "relative p-3 px-6 rounded-xl font-medium transition-all duration-200 min-h-[48px] flex items-center justify-center text-sm touch-manipulation";

    // Remove tap highlight color for better mobile experience
    const mobileStyles = {
      WebkitTapHighlightColor: "transparent",
      userSelect: "none",
    };

    switch (permission) {
      case "granted":
        return {
          className: `${baseClass} bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow-md`,
          style: mobileStyles,
        };
      case "denied":
        return {
          className: `${baseClass} bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-md`,
          style: mobileStyles,
        };
      default:
        return {
          className: `${baseClass} bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95`,
          style: mobileStyles,
        };
    }
  };

  const buttonConfig = getButtonClass();

  return (
    <div className="relative inline-block">
      <button
        className={buttonConfig.className}
        style={buttonConfig.style}
        onClick={requestNotificationPermission}
        disabled={isLoading}>
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute left-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          </div>
        )}

        {/* Button text */}
        <span className={isLoading ? "ml-2" : ""}>{getButtonText()}</span>

        {/* Success indicator */}
        {showSuccess && (
          <div className="absolute -top-1 -right-1 bg-green-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs animate-bounce">
            ✓
          </div>
        )}
      </button>

      {/* Status help text */}
      <div className="mt-2 text-xs text-gray-600 text-center max-w-xs">
        {permission === "default" &&
          "Tekan untuk mengaktifkan notifikasi browser"}
        {permission === "granted" &&
          "Notifikasi aktif - tekan untuk tes notifikasi"}
        {permission === "denied" &&
          "Notifikasi diblokir - aktifkan melalui pengaturan browser"}
      </div>

      {/* Browser compatibility warning */}
      {!("Notification" in window) && (
        <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded-lg text-xs text-yellow-800">
          ⚠️ Browser tidak mendukung notifikasi. Gunakan Chrome, Firefox, atau
          Safari versi terbaru.
        </div>
      )}
    </div>
  );
};

export default NotificationPermissionButton;
