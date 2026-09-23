// Authentication Context Provider
//
// The session lives in Supabase Auth (lib/supabase.ts), the same accounts as ilm.red. Who the
// member is comes from api.ilm.red (GET /v1/me + /v1/me/entitlements). Screens keep using
// useAuth(): user, isAuthenticated, logout, refreshUser, updateUser, plus the two sign-in actions.

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { router } from "expo-router";
import type { User } from "@/types/api";
import { supabase } from "@/lib/supabase";
import {
  signInWithGoogle as authGoogle,
  signInWithApple as authApple,
  signOut as authSignOut,
  fetchCurrentUser,
} from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      setUser(await fetchCurrentUser());
    } catch (error) {
      // Signed in to Supabase but the API refused the token (expired, account removed): start over.
      console.error("Failed to load the signed-in member:", error);
      await supabase.auth.signOut();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) await loadUser();
      if (alive) setIsLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) setUser(null);
      else if (event === "SIGNED_IN") void loadUser();
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [loadUser]);

  const run = useCallback(async (signIn: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await signIn();
      await loadUser();
      router.replace("/(tabs)");
    } finally {
      setIsLoading(false);
    }
  }, [loadUser]);

  const signInWithGoogle = useCallback(() => run(authGoogle), [run]);
  const signInWithApple = useCallback(() => run(authApple), [run]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authSignOut();
      setUser(null);
      router.replace("/(auth)/welcome");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setUser(await fetchCurrentUser());
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  }, []);

  const updateUser = useCallback((updated: User) => setUser(updated), []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signInWithGoogle,
    signInWithApple,
    logout,
    refreshUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthProvider;
