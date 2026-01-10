// Secure Storage utilities using expo-secure-store

import * as SecureStore from "expo-secure-store";
import { AUTH_CONFIG } from "@/constants/config";
import type { User } from "@/types/api";

// ============================================================================
// Token Storage
// ============================================================================

export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(AUTH_CONFIG.ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
};

export const setAccessToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(AUTH_CONFIG.ACCESS_TOKEN_KEY, token);
  } catch (error) {
    console.error("Error setting access token:", error);
    throw error;
  }
};

export const removeAccessToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(AUTH_CONFIG.ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error("Error removing access token:", error);
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(AUTH_CONFIG.REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Error getting refresh token:", error);
    return null;
  }
};

export const setRefreshToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(AUTH_CONFIG.REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error("Error setting refresh token:", error);
    throw error;
  }
};

export const removeRefreshToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(AUTH_CONFIG.REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Error removing refresh token:", error);
  }
};

// ============================================================================
// User Storage
// ============================================================================

export const getStoredUser = async (): Promise<User | null> => {
  try {
    const userJson = await SecureStore.getItemAsync(AUTH_CONFIG.USER_KEY);
    if (!userJson) return null;
    return JSON.parse(userJson) as User;
  } catch (error) {
    console.error("Error getting stored user:", error);
    return null;
  }
};

export const setStoredUser = async (user: User): Promise<void> => {
  try {
    await SecureStore.setItemAsync(AUTH_CONFIG.USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Error setting stored user:", error);
    throw error;
  }
};

export const removeStoredUser = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(AUTH_CONFIG.USER_KEY);
  } catch (error) {
    console.error("Error removing stored user:", error);
  }
};

// ============================================================================
// Clear All Auth Data
// ============================================================================

export const clearAuthData = async (): Promise<void> => {
  await Promise.all([
    removeAccessToken(),
    removeRefreshToken(),
    removeStoredUser(),
  ]);
};

// ============================================================================
// Token Helpers
// ============================================================================

/**
 * Parse JWT token and extract expiration time
 */
export const getTokenExpiration = (token: string): number | null => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.exp ? decoded.exp * 1000 : null; // Convert to milliseconds
  } catch {
    return null;
  }
};

/**
 * Check if token is expired or about to expire
 */
export const isTokenExpired = (
  token: string,
  thresholdSeconds: number = AUTH_CONFIG.REFRESH_THRESHOLD
): boolean => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  return Date.now() >= expiration - thresholdSeconds * 1000;
};
