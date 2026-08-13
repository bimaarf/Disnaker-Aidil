import React from "react"; // wajib kalau pakai JSX
import * as LucideIcons from "lucide-react";

export const DynamicLucideIcon = ({ iconName, className }) => {
  const IconComponent = LucideIcons[iconName];
  if (IconComponent) {
    return <IconComponent className={className} />;
  }
  return <LucideIcons.InfoIcon className={className} />;
};
