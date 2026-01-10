// Authentication Context Provider

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { router } from "expo-router";
import type { User, LoginRequest, RegisterRequest } from "@/types/api";
import {
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  fetchCurrentUser,
} from "@/lib/auth";
import { getAccessToken, getStoredUser, clearAuthData } from "@/lib/storage";

// ============================================================================
// Types
// ============================================================================

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        // Try to get stored user first for faster UI
        const storedUser = await getStoredUser();
        if (storedUser) {
          setUser(storedUser);
        }

        // Then refresh from server
        try {
          const freshUser = await fetchCurrentUser();
          setUser(freshUser);
        } catch (error) {
          // Token might be invalid, clear auth
          console.error("Failed to fetch user:", error);
          await clearAuthData();
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const loggedInUser = await authLogin(credentials);
      setUser(loggedInUser);
      router.replace("/(tabs)");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      const newUser = await authRegister(data);
      setUser(newUser);
      router.replace("/(tabs)");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authLogout();
      setUser(null);
      router.replace("/(auth)/login");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await fetchCurrentUser();
      setUser(freshUser);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthProvider;
