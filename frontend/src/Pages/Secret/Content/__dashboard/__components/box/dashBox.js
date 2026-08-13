import {
  AlertCircle,
  BadgeAlert,
  CheckCircle,
  Wifi,
  WifiOff,
  Zap,
  MessageCircle,
} from "lucide-react";
import { useWhatsappSocket } from "../../../../../../utils/SocketWhatsappContext";
import React from "react";
import useIsMobile from "../../../../../../Context/__useIsMobile";

export const DashBox = () => {
  const {
    status: whatsappStatus,
    hasQrCode,
    reconnect,
    socket,
  } = useWhatsappSocket();

  const isSocketConnected = socket?.connected || false;
  const isMobile = useIsMobile();
  const handleSupportClick = () => {
    if (window.LiveChatWidget) {
      window.LiveChatWidget.call("maximize");
    } else {
      console.warn("LiveChatWidget not available");
    }
  };

  const getSystemStatusInfo = () => {
    if (!isSocketConnected) {
      return {
        text: "Socket Terputus",
        color: "text-error",
        bgColor: "bg-error/10",
        progressColor: "from-error to-error",
        icon: WifiOff,
        percentage: 0,
        description: "Tidak dapat terhubung ke server",
        dotColor: "bg-error",
        priority: "socket",
      };
    }

    switch (whatsappStatus) {
      case "ready":
        return {
          text: "Sistem Online",
          color: "text-success",
          bgColor: "bg-success/10",
          progressColor: "from-success to-success",
          icon: CheckCircle,
          percentage: 100,
          description: "Socket & WhatsApp terhubung",
          dotColor: "bg-success",
          priority: "ready",
        };
      case "connected":
        return {
          text: "Socket Terhubung",
          color: "text-primary",
          bgColor: "bg-primary/10",
          progressColor: "from-primary to-info",
          icon: Wifi,
          percentage: 75,
          description: "Socket OK, WhatsApp loading",
          dotColor: "bg-primary",
          priority: "socket-only",
        };
      case "authenticated":
        return {
          text: "WhatsApp Autentikasi",
          color: "text-info",
          bgColor: "bg-info/10",
          progressColor: "from-info to-info",
          icon: CheckCircle,
          percentage: 90,
          description: "Socket OK, WhatsApp hampir siap",
          dotColor: "bg-info",
          priority: "whatsapp-auth",
        };
      case "qr-pending":
        return {
          text: "Scan QR WhatsApp",
          color: "text-warning",
          bgColor: "bg-warning/10",
          progressColor: "from-warning to-warning",
          icon: AlertCircle,
          percentage: 50,
          description: "Socket OK, butuh scan QR",
          dotColor: "bg-warning animate-pulse",
          priority: "qr-needed",
        };
      case "disconnected":
      case "auth_failure":
      case "error":
        return {
          text: "WhatsApp Offline",
          color: "text-warning",
          bgColor: "bg-warning/10",
          progressColor: "from-warning to-error",
          icon: AlertCircle,
          percentage: 30,
          description: "Socket OK, WhatsApp bermasalah",
          dotColor: "bg-warning",
          priority: "whatsapp-error",
        };
      default:
        return {
          text: "Socket Terhubung",
          color: "text-neutral",
          bgColor: "bg-neutral/10",
          progressColor: "from-neutral to-neutral",
          icon: Wifi,
          percentage: 40,
          description: "Socket OK, WhatsApp memuat",
          dotColor: "bg-neutral animate-pulse",
          priority: "loading",
        };
    }
  };

  const statusInfo = getSystemStatusInfo();

  const handleStatusClick = () => {
    if (!isSocketConnected) {
      reconnect();
      return;
    }

    if (
      whatsappStatus === "disconnected" ||
      whatsappStatus === "error" ||
      whatsappStatus === "auth_failure"
    ) {
      reconnect();
    }
  };

  return (
    <div className="space-y-2 sm:space-y-6 mt-2 sm:mt-4">
      {/* Header Section */}
      {!isMobile && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-3">
            <BadgeAlert className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Help Center
            </span>
          </div>
          <p className="text-base-content/60 text-sm">
            Akses bantuan dan pantau status sistem
          </p>
        </div>
      )}

      {/* Main Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4">
        {/* Live Chat Support Card */}
        <div className="lg:col-span-2 group relative cursor-pointer">
          <div className="relative bg-base-100 backdrop-blur-sm dark:bg-base-200 rounded-3xl overflow-hidden border border-base-300 transition-all duration-300 hover:border-primary/40 hover:shadow-sm hover:-translate-y-1">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative p-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl blur-md opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                  <div className="relative bg-gradient-to-br from-primary to-secondary p-4 rounded-2xl shadow-sm transition-all duration-300 group-hover:scale-105">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-base-content mb-2 group-hover:text-primary transition-colors duration-300">
                    Butuh Bantuan?
                  </h3>
                  <p className="text-sm text-base-content/60 mb-4">
                    Tim support kami siap membantu Anda 24/7
                  </p>

                  <button
                    onClick={handleSupportClick}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-warning to-warning hover:from-warning/90 hover:to-warning/90 text-white text-sm font-semibold rounded-xl transition-all duration-300 hover:scale-[99%] active:scale-[98%] shadow-sm">
                    <Zap className="w-4 h-4" />
                    Hubungi LiveChat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Status Card */}
        <div
          className={`group relative ${
            !isSocketConnected ||
            whatsappStatus === "disconnected" ||
            whatsappStatus === "error" ||
            whatsappStatus === "auth_failure"
              ? "cursor-pointer"
              : ""
          }`}
          onClick={handleStatusClick}>
          <div
            className={`relative bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-3xl overflow-hidden border border-base-300 transition-all duration-300 ${
              !isSocketConnected ||
              whatsappStatus === "disconnected" ||
              whatsappStatus === "error" ||
              whatsappStatus === "auth_failure"
                ? "hover:border-base-content/20 hover:shadow-sm hover:-translate-y-1"
                : ""
            }`}>
            {/* Background Gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${statusInfo.progressColor} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
            />

            <div className="relative p-6">
              {/* Status Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-2.5 h-2.5 ${statusInfo.dotColor} rounded-full`}
                />
                <span
                  className={`text-sm font-semibold ${statusInfo.color} flex-1`}>
                  {statusInfo.text}
                </span>
                <statusInfo.icon className={`w-4 h-4 ${statusInfo.color}`} />
              </div>

              {/* Description */}
              <p className={`text-xs ${statusInfo.color}/80 mb-4`}>
                {statusInfo.description}
              </p>

              {/* Progress Bar */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-base-content/60">Status Sistem</span>
                  <span className={`font-semibold ${statusInfo.color}`}>
                    {statusInfo.percentage}%
                  </span>
                </div>
                <div
                  className={`w-full ${statusInfo.bgColor} rounded-full h-2 overflow-hidden`}>
                  <div
                    className={`h-2 bg-gradient-to-r ${statusInfo.progressColor} rounded-full transition-all duration-1000`}
                    style={{ width: `${statusInfo.percentage}%` }}
                  />
                </div>
              </div>

              {/* Detailed Status */}
              <div className="space-y-2 pt-3 border-t border-base-300">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-base-content/60">Socket:</span>
                  <span
                    className={`font-medium ${
                      isSocketConnected ? "text-success" : "text-error"
                    }`}>
                    {isSocketConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-base-content/60">WhatsApp:</span>
                  <span
                    className={`font-medium ${
                      whatsappStatus === "ready"
                        ? "text-success"
                        : whatsappStatus === "qr-pending"
                        ? "text-warning"
                        : whatsappStatus === "connected" ||
                          whatsappStatus === "authenticated"
                        ? "text-info"
                        : "text-error"
                    }`}>
                    {whatsappStatus === "ready"
                      ? "Ready"
                      : whatsappStatus === "qr-pending"
                      ? "QR Pending"
                      : whatsappStatus === "connected"
                      ? "Loading"
                      : whatsappStatus === "authenticated"
                      ? "Auth OK"
                      : "Error"}
                  </span>
                </div>
              </div>

              {/* Action Hints */}
              {(!isSocketConnected ||
                whatsappStatus === "disconnected" ||
                whatsappStatus === "error" ||
                whatsappStatus === "auth_failure") && (
                <div className="mt-3 pt-3 border-t border-base-300">
                  <p className="text-xs text-base-content/60 text-center">
                    Klik untuk reconnect
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Alert */}
      {hasQrCode && (
        <div className="relative bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-2xl overflow-hidden border border-warning/30">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-warning/10" />

          <div className="relative p-4 flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-warning mb-1">
                QR Code WhatsApp tersedia
              </p>
              <p className="text-xs text-base-content/60">
                Scan QR code untuk menghubungkan WhatsApp dengan sistem
                notifikasi
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
