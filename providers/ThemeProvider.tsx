// Theme Context Provider

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";
import { Colors, ColorScheme, ThemeColors } from "@/constants/colors";

// ============================================================================
// Types
// ============================================================================

type ThemePreference = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ColorScheme;
  themePreference: ThemePreference;
  colors: ThemeColors;
  isDark: boolean;
  setThemePreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
}

// ============================================================================
// Context
// ============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "ilm_red_theme_preference";

// ============================================================================
// Provider
// ============================================================================

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useSystemColorScheme();
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const saved = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
      if (saved && ["light", "dark", "system"].includes(saved)) {
        setThemePreferenceState(saved as ThemePreference);
      }
    } catch (error) {
      console.error("Error loading theme preference:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setThemePreference = async (preference: ThemePreference) => {
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, preference);
      setThemePreferenceState(preference);
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  const toggleTheme = () => {
    const newPreference =
      themePreference === "system"
        ? systemColorScheme === "dark"
          ? "light"
          : "dark"
        : themePreference === "dark"
          ? "light"
          : "dark";
    setThemePreference(newPreference);
  };

  // Determine actual theme based on preference and system
  const resolvedTheme: ColorScheme =
    themePreference === "system"
      ? systemColorScheme === "dark"
        ? "dark"
        : "light"
      : themePreference;

  const isDark = resolvedTheme === "dark";
  const colors = Colors[resolvedTheme];

  const value: ThemeContextType = {
    theme: resolvedTheme,
    themePreference,
    colors,
    isDark,
    setThemePreference,
    toggleTheme,
  };

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default ThemeProvider;
