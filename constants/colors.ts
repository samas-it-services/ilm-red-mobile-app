// ILM Red Brand Colors
// Matching ilm-red-unbound website branding

export const Colors = {
  light: {
    primary: "#2563EB", // Blue-600
    background: "#FFFFFF",
    foreground: "#111111",
    secondary: "#E0E7EF",
    accent: "#60A5FA", // Blue-400
    card: "#F8FAFC", // Slate-50
    border: "#E2E8F0", // Slate-200
    muted: "#64748B", // Slate-500
    mutedForeground: "#64748B",
    destructive: "#EF4444", // Red-500
    success: "#22C55E", // Green-500
    warning: "#F59E0B", // Amber-500
    buttonBg: "#2563EB",
    buttonText: "#FFFFFF",
    tagBg: "#E0E7EF",
    tagText: "#2563EB",
    inputBg: "#FFFFFF",
    inputBorder: "#E2E8F0",
  },
  dark: {
    primary: "#EF4444", // Red-500
    background: "#0F172A", // Slate-950
    foreground: "#F8FAFC", // Slate-50
    secondary: "#1E293B", // Slate-800
    accent: "#2563EB", // Blue-600
    card: "#1E293B", // Slate-800
    border: "#334155", // Slate-700
    muted: "#94A3B8", // Slate-400
    mutedForeground: "#94A3B8",
    destructive: "#EF4444", // Red-500
    success: "#22C55E", // Green-500
    warning: "#F59E0B", // Amber-500
    buttonBg: "#2563EB",
    buttonText: "#FFFFFF",
    tagBg: "#334155",
    tagText: "#EF4444",
    inputBg: "#1E293B",
    inputBorder: "#334155",
  },
};

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = (typeof Colors)["light"];
