/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],

  darkMode: ["class", '[data-theme="black"]'],

  theme: {
    extend: {
      animation: {
        shimmer: "shimmer 2s infinite",
        fadeZoomIn: "fadeZoomIn 0.3s ease-out forwards",
        bounceArrow: "bounceArrow 1s infinite ease-in-out",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        fadeZoomIn: {
          "0%": { opacity: 0, transform: "scale(0.95)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        bounceArrow: {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(4px)" },
        },
      },
    },
  },

  daisyui: {
    themes: [
      {
        wireframe: {
          primary: "#1E66E5",
          "primary-content": "#FFFFFF",

          secondary: "#184CCB",
          "secondary-content": "#FFFFFF",

          accent: "#D9267A",
          "accent-content": "#FFFFFF",

          neutral: "#4B5563",
          "neutral-content": "#FFFFFF",

          "base-100": "#FFFFFF",
          "base-200": "#F9FAFB",
          "base-300": "#E5E7EB",
          "base-content": "#111827",

          info: "#3084D8",
          success: "#0A8F63",
          warning: "#C97A06",
          error: "#C62828",
        },
      },
      {
        black: {
          primary: "#1E66E5",
          "primary-content": "#FFFFFF",

          secondary: "#184CCB",
          "secondary-content": "#FFFFFF",

          accent: "#D9267A",
          "accent-content": "#FFFFFF",

          neutral: "#E5E7EB",
          "neutral-content": "#FFFFFF",

          "base-100": "#0A0A0A",
          "base-200": "#111113",
          "base-300": "#1A1A1D",
          "base-content": "#FFFFFF",

          // dibikin pekat juga supaya match tema wireframe
          info: "#3084D8",
          success: "#0A8F63",
          warning: "#C97A06",
          error: "#C62828",
        },
      },
    ],
  },

  // HAPUS SAFELIST! Biarkan Tailwind scan content saja
  plugins: [require("daisyui")],
};
