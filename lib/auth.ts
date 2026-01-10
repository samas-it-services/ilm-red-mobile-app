// Authentication utilities

import api from "./api";
import {
  setAccessToken,
  setRefreshToken,
  setStoredUser,
  clearAuthData,
  getAccessToken,
} from "./storage";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
} from "@/types/api";

// ============================================================================
// Auth API Functions
// ============================================================================

/**
 * Login user with email and password
 */
export const login = async (credentials: LoginRequest): Promise<User> => {
  const response = await api.post<AuthResponse>("/auth/login", credentials);
  const { access_token, refresh_token } = response.data;

  // Store tokens
  await setAccessToken(access_token);
  await setRefreshToken(refresh_token);

  // Fetch and store user profile
  const user = await fetchCurrentUser();
  return user;
};

/**
 * Register new user
 */
export const register = async (data: RegisterRequest): Promise<User> => {
  const response = await api.post<AuthResponse>("/auth/register", data);
  const { access_token, refresh_token } = response.data;

  // Store tokens
  await setAccessToken(access_token);
  await setRefreshToken(refresh_token);

  // Fetch and store user profile
  const user = await fetchCurrentUser();
  return user;
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  try {
    // Call logout endpoint to invalidate refresh token
    await api.post("/auth/logout");
  } catch (error) {
    // Ignore errors - we'll clear local data anyway
    console.error("Logout API error:", error);
  } finally {
    // Always clear local auth data
    await clearAuthData();
  }
};

/**
 * Fetch current user profile
 */
export const fetchCurrentUser = async (): Promise<User> => {
  const response = await api.get<User>("/users/me");
  const user = response.data;

  // Store user data
  await setStoredUser(user);

  return user;
};

/**
 * Update current user profile
 */
export const updateProfile = async (
  data: Partial<Pick<User, "display_name" | "bio" | "preferences">>
): Promise<User> => {
  const response = await api.patch<User>("/users/me", data);
  const user = response.data;

  // Update stored user
  await setStoredUser(user);

  return user;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAccessToken();
  return !!token;
};
