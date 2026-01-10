/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // ILM Red Brand Colors
        primary: {
          DEFAULT: "#2563EB", // Blue-600 (light mode)
          dark: "#EF4444", // Red-500 (dark mode)
        },
        background: {
          DEFAULT: "#FFFFFF",
          dark: "#0F172A", // Slate-950
        },
        foreground: {
          DEFAULT: "#111111",
          dark: "#F8FAFC", // Slate-50
        },
        secondary: {
          DEFAULT: "#E0E7EF",
          dark: "#1E293B", // Slate-800
        },
        accent: {
          DEFAULT: "#60A5FA", // Blue-400
          dark: "#2563EB", // Blue-600
        },
        card: {
          DEFAULT: "#F8FAFC", // Slate-50
          dark: "#1E293B", // Slate-800
        },
        border: {
          DEFAULT: "#E2E8F0", // Slate-200
          dark: "#334155", // Slate-700
        },
        muted: {
          DEFAULT: "#64748B", // Slate-500
          dark: "#94A3B8", // Slate-400
        },
        destructive: {
          DEFAULT: "#EF4444", // Red-500
        },
        success: {
          DEFAULT: "#22C55E", // Green-500
        },
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
