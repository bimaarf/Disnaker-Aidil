// src/helpers/statusHelper.js
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

// Helper untuk status dokumen
export const getDocumentStatus = (is_approve) => {
  // Status berkas sudah ada
  if (is_approve === true) {
    return {
      text: "Berkas Diterima",
      color: "bg-success text-white",
      icon: CheckCircle,
      bgGradient: "from-success/10 to-success/10",
      borderColor: "border-success dark:border-success",
    };
  }

  if (is_approve === false) {
    return {
      text: "Berkas Dikembalikan",
      color: "bg-error text-white",
      icon: XCircle,
      bgGradient: "from-error/10 to-error/10",
      borderColor: "border-error dark:border-error",
    };
  }

  // Default fallback
  return {
    text: "Belum Diverifikasi",
    color: "bg-warning text-white",
    icon: Clock,
    bgGradient: "from-warning/10 to-warning/10",
    borderColor: "border-warning dark:border-warning",
  };
};
// Helper untuk status kelulusan
export const getSelectionStatus = (
  status,
  selection_type,
  is_published,
  userRole = "user"
) => {
  const roles = Array.isArray(userRole) ? userRole : [userRole];

  // SUPER ADMIN bisa selalu lihat hasil, tidak tergantung publish
  if (roles.includes("super admin")) {
    if (status === true) {
      return {
        text: "Lulus",
        color: "bg-success text-white",
        icon: CheckCircle,
        bgGradient: "from-success/10 to-success/10",
        borderColor: "border-success dark:border-success",
      };
    }
    if (status === false) {
      return {
        text: "Tidak Lulus",
        color: "bg-error text-white",
        icon: XCircle,
        bgGradient: "from-error/10 to-error/10",
        borderColor: "border-error dark:border-error",
      };
    }
  }

  // USER biasa -> menunggu hasil jika belum publish
  if (roles.includes("user") && !is_published && selection_type !== null) {
    return {
      text: "Menunggu Hasil",
      color: "bg-primary text-white",
      icon: Clock,
      bgGradient: "from-primary/10 to-primary/10",
      borderColor: "border-primary dark:border-primary",
    };
  }

  // Jika periode sudah publish, tampilkan hasil final
  if (is_published) {
    if (status === true) {
      return {
        text: "Lulus",
        color: "bg-success text-white",
        icon: CheckCircle,
        bgGradient: "from-success/10 to-success/10",
        borderColor: "border-success dark:border-success",
      };
    }
    if (status === false) {
      return {
        text: "Tidak Lulus",
        color: "bg-error text-white",
        icon: XCircle,
        bgGradient: "from-error/10 to-error/10",
        borderColor: "border-error dark:border-error",
      };
    }
  }

  // Default fallback
  return {
    text: "Belum Ditentukan",
    color: "bg-base-300 dark:bg-base-300 text-base-content/60",
    icon: AlertCircle,
    bgGradient: "from-base-300/30 to-base-300/30",
    borderColor: "border-base-300 dark:border-base-300",
  };
};

// const documentStatus = getDocumentStatus(result?.is_approve);

// const selectionStatus = getSelectionStatus(
//   result?.status,
//   result?.selection_type,
//   period?.is_published
// );
