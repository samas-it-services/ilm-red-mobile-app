// Error handling utilities for crash protection

import { Alert } from "react-native";

// ============================================================================
// Types
// ============================================================================

export interface ApiErrorDetail {
  code: string;
  message: string;
  requestId?: string;
  timestamp?: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

// ============================================================================
// Error Parsing
// ============================================================================

/**
 * Safely extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return "An unknown error occurred";
  }

  // Already a string
  if (typeof error === "string") {
    return error;
  }

  // Standard Error object
  if (error instanceof Error) {
    return error.message;
  }

  // API error response format
  if (typeof error === "object" && "error" in error) {
    const apiError = error as ApiErrorResponse;
    return apiError.error?.message || "An error occurred";
  }

  // Object with message property
  if (typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }

  // Fallback
  return "An unexpected error occurred";
}

/**
 * Extract error code from API error
 */
export function getErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  if ("error" in error) {
    const apiError = error as ApiErrorResponse;
    return apiError.error?.code || null;
  }

  if ("code" in error) {
    return String((error as { code: unknown }).code);
  }

  return null;
}

// ============================================================================
// Error Display
// ============================================================================

/**
 * Show error alert to user
 */
export function showErrorAlert(
  title: string,
  error: unknown,
  onDismiss?: () => void
): void {
  const message = getErrorMessage(error);
  Alert.alert(title, message, [{ text: "OK", onPress: onDismiss }]);
}

/**
 * Show confirmation alert with error details
 */
export function showErrorAlertWithRetry(
  title: string,
  error: unknown,
  onRetry: () => void,
  onCancel?: () => void
): void {
  const message = getErrorMessage(error);
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel", onPress: onCancel },
    { text: "Retry", onPress: onRetry },
  ]);
}

// ============================================================================
// Safe Async Operations
// ============================================================================

/**
 * Wrap an async function with error handling
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  onError?: (error: unknown) => void
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    if (__DEV__) {
      console.error("safeAsync caught error:", error);
    }
    onError?.(error);
    return null;
  }
}

/**
 * Wrap an async function and return result with error
 */
export async function safeAsyncWithError<T>(
  fn: () => Promise<T>
): Promise<{ data: T | null; error: unknown | null }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    if (__DEV__) {
      console.error("safeAsyncWithError caught error:", error);
    }
    return { data: null, error };
  }
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Safely access nested object properties
 */
export function safeGet<T>(
  obj: unknown,
  path: string,
  defaultValue: T
): T {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    if (typeof current !== "object") {
      return defaultValue;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return (current as T) ?? defaultValue;
}

/**
 * Check if value is a non-empty array
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Safely map over an array
 */
export function safeMap<T, R>(
  array: T[] | null | undefined,
  fn: (item: T, index: number) => R
): R[] {
  if (!Array.isArray(array)) {
    return [];
  }
  return array.map(fn);
}

/**
 * Safely filter an array
 */
export function safeFilter<T>(
  array: T[] | null | undefined,
  fn: (item: T, index: number) => boolean
): T[] {
  if (!Array.isArray(array)) {
    return [];
  }
  return array.filter(fn);
}

// ============================================================================
// Network Error Helpers
// ============================================================================

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("connection") ||
    message.includes("fetch failed")
  );
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  const code = getErrorCode(error);
  if (code === "UNAUTHORIZED" || code === "TOKEN_EXPIRED") {
    return true;
  }

  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("unauthorized") ||
    message.includes("not authenticated") ||
    message.includes("token expired")
  );
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  const code = getErrorCode(error);
  return code === "RATE_LIMIT_EXCEEDED";
}

export default {
  getErrorMessage,
  getErrorCode,
  showErrorAlert,
  showErrorAlertWithRetry,
  safeAsync,
  safeAsyncWithError,
  safeGet,
  isNonEmptyArray,
  safeMap,
  safeFilter,
  isNetworkError,
  isAuthError,
  isRateLimitError,
};
