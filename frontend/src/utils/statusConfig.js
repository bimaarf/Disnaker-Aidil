import React from "react";
import { Database, AlertCircle, CheckCircle, XCircle } from "lucide-react";

export const STATUS_CONFIG = {
  Total_Submissions: {
    label: "Total Submissions",
    icon: <Database className="size-4 sm:size-5" />,
    color: "bg-gradient-to-r from-blue-600 to-indigo-600",
    textColor: "text-blue-600 dark:text-blue-400",
    bgColor:
      "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20",
  },
  Belum_Diverifikasi: {
    label: "Belum_Diverifikasi",
    icon: <AlertCircle className="size-4 sm:size-5" />,
    color: "bg-gradient-to-r from-gray-400 to-gray-600",
    textColor: "text-gray-600 dark:text-gray-400",
    bgColor:
      "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-900/20",
  },
  Belum_Ditentukan: {
    label: "Belum_Ditentukan",
    icon: <AlertCircle className="size-4 sm:size-5" />,
    color: "bg-gradient-to-r from-gray-400 to-gray-600",
    textColor: "text-gray-600 dark:text-gray-400",
    bgColor:
      "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-900/20",
  },
  Berkas_Diterima: {
    label: "Berkas_Diterima",
    icon: <CheckCircle className="size-4 sm:size-5" />,
    color: "bg-gradient-to-r from-orange-500 to-amber-600",
    textColor: "text-orange-600 dark:text-orange-400",
    bgColor:
      "bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20",
  },
  Berkas_Dikembalikan: {
    label: "Berkas_Dikembalikan",
    icon: <XCircle className="size-4 sm:size-5" />,
    color: "bg-gradient-to-r from-orange-500 to-amber-600",
    textColor: "text-orange-600 dark:text-orange-400",
    bgColor:
      "bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20",
  },
  Lulus: {
    label: "Lulus",
    icon: <CheckCircle className="size-4 sm:size-5" />,
    color: "bg-gradient-to-br from-green-400 to-emerald-600",
    textColor: "text-green-600 dark:text-green-400",
    bgColor:
      "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
  },
  Tidak_Lulus: {
    label: "Tida_Lulus",
    icon: <XCircle className="size-4 sm:size-5" />,
    color: "bg-gradient-to-br from-red-500 to-rose-600",
    textColor: "text-red-600 dark:text-red-400",
    bgColor:
      "bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-900/20",
  },
};

export const formatNumber = (value) =>
  value != null ? value.toLocaleString("id-ID") : "N/A";
