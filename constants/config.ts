// API and App Configuration

// Default to localhost for development
// Will be overridden by environment variables in production
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export const API_VERSION = "v1";

export const API_URL = `${API_BASE_URL}/${API_VERSION}`;

// Auth configuration
export const AUTH_CONFIG = {
  // Token storage keys
  ACCESS_TOKEN_KEY: "ilm_red_access_token",
  REFRESH_TOKEN_KEY: "ilm_red_refresh_token",
  USER_KEY: "ilm_red_user",

  // Token refresh threshold (in seconds)
  // Refresh token 60 seconds before expiry
  REFRESH_THRESHOLD: 60,
};

// App configuration
export const APP_CONFIG = {
  // App name
  APP_NAME: "ILM Red",

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // File upload limits
  MAX_FILE_SIZE_MB: 500,
  ALLOWED_FILE_TYPES: ["application/pdf", "application/epub+zip", "text/plain"],
  ALLOWED_EXTENSIONS: [".pdf", ".epub", ".txt"],

  // Image dimensions
  BOOK_COVER_WIDTH: 200,
  BOOK_COVER_HEIGHT: 300,

  // Cache duration (in milliseconds)
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  STALE_DURATION: 10 * 60 * 1000, // 10 minutes
};

// Feature flags
export const FEATURES = {
  ENABLE_AI_CHAT: true, // Enable AI chat
  ENABLE_OFFLINE_MODE: false, // Enable when offline sync is implemented
  ENABLE_PUSH_NOTIFICATIONS: false, // Enable when push is configured
};

// Pages configuration
export const PAGES_CONFIG = {
  // Stale times
  STALE_TIME_PAGES_LIST: 5 * 60 * 1000, // 5 minutes
  STALE_TIME_PAGE_DETAIL: 2 * 60 * 1000, // 2 minutes

  // Prefetching
  PAGE_PREFETCH_COUNT: 2, // Prefetch next 2 pages
  PAGE_PREFETCH_THRESHOLD: 1, // Start prefetching when 1 page away

  // Generation polling
  GENERATION_POLL_INITIAL: 2000, // 2 seconds initial poll
  GENERATION_POLL_MAX: 8000, // 8 seconds max poll (exponential backoff)
  GENERATION_POLL_BACKOFF: 2, // Backoff multiplier
};

// Chat configuration
export const CHAT_CONFIG = {
  // SSE streaming
  SSE_THROTTLE_MS: 50, // Throttle content updates
  SSE_RECONNECT_DELAY: 1000, // 1 second reconnect delay
  SSE_MAX_RETRIES: 3,

  // Message limits
  MAX_MESSAGE_LENGTH: 4000,
  MAX_CONTEXT_MESSAGES: 50,

  // Stale times
  STALE_TIME_SESSIONS: 60 * 1000, // 1 minute
  STALE_TIME_MESSAGES: 30 * 1000, // 30 seconds
};

// Billing configuration
export const BILLING_CONFIG = {
  // Stale times
  STALE_TIME_BALANCE: 20 * 1000, // 20 seconds
  STALE_TIME_LIMITS: 30 * 1000, // 30 seconds
  STALE_TIME_USAGE: 60 * 1000, // 1 minute
  STALE_TIME_TRANSACTIONS: 2 * 60 * 1000, // 2 minutes

  // Refetch intervals
  REFETCH_BALANCE_INTERVAL: 60 * 1000, // 1 minute

  // Rate limit handling
  RATE_LIMIT_COUNTDOWN_INTERVAL: 1000, // 1 second countdown tick
};
