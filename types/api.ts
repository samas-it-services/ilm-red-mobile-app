// API Types matching ilm-red-api backend

import type { BookCategory } from "@/constants/categories";

// ============================================================================
// Common Types
// ============================================================================

export type Visibility = "public" | "private" | "friends";

export type BookStatus = "uploading" | "processing" | "ready" | "failed";

// ============================================================================
// User Types
// ============================================================================

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
  };
  ai?: {
    default_model: string;
    default_vendor: string;
    temperature: number;
    max_tokens: number;
    streaming_enabled: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  roles: string[];
  preferences: UserPreferences;
  created_at: string;
  last_login_at: string | null;
}

export interface PublicUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
}

// ============================================================================
// Auth Types
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  display_name: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}

export interface RefreshRequest {
  refresh_token: string;
}

// ============================================================================
// Book Types
// ============================================================================

export interface BookStats {
  views: number;
  downloads: number;
  rating_count: number;
  rating_avg: number | null;
}

export interface BookOwner {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export interface Book {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  category: BookCategory;
  visibility: Visibility;
  language: string;
  isbn: string | null;
  file_type: string;
  file_size: number;
  page_count: number | null;
  cover_url: string | null;
  status: BookStatus;
  processing_error: string | null;
  stats: BookStats;
  owner: BookOwner;
  download_url?: string;
  created_at: string;
  updated_at: string;
}

export interface BookListItem {
  id: string;
  title: string;
  author: string | null;
  category: BookCategory;
  visibility: Visibility;
  file_type: string;
  file_size: number;
  page_count: number | null;
  cover_url: string | null;
  status: BookStatus;
  stats: BookStats;
  owner: BookOwner;
  created_at: string;
}

export interface UploadBookRequest {
  file: File | Blob;
  title: string;
  author?: string;
  description?: string;
  category?: BookCategory;
  visibility?: Visibility;
  language?: string;
  isbn?: string;
}

export interface UpdateBookRequest {
  title?: string;
  author?: string;
  description?: string;
  category?: BookCategory;
  visibility?: Visibility;
  language?: string;
  isbn?: string;
}

export interface DownloadUrlResponse {
  url: string;
  expires_in: number;
}

// ============================================================================
// Rating Types
// ============================================================================

export interface Rating {
  id: string;
  book_id: string;
  rating: number;
  review: string | null;
  user: PublicUser;
  created_at: string;
  updated_at: string;
}

export interface CreateRatingRequest {
  rating: number;
  review?: string;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface BookListParams extends PaginationParams {
  q?: string;
  category?: BookCategory;
  visibility?: Visibility;
  status?: BookStatus;
  owner_id?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
  request_id?: string;
}

export interface ApiError {
  error: ApiErrorDetail;
}

// ============================================================================
// Response Types
// ============================================================================

export interface SuccessMessage {
  message: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  timestamp: string;
  checks: Record<string, unknown>;
}

// ============================================================================
// Page Types
// ============================================================================

export type PageGenerationStatusType = "pending" | "processing" | "completed" | "failed";

export interface PageThumbnail {
  page_number: number;
  thumbnail_url: string;
  width: number;
  height: number;
}

export interface PageManifest {
  book_id: string;
  total_pages: number;
  generation_status: PageGenerationStatusType;
  pages: PageThumbnail[];
}

export interface PageImage {
  book_id: string;
  page_number: number;
  thumbnail_url: string;
  medium_url: string;
  high_url?: string;
  ultra_url?: string;
  width: number;
  height: number;
  expires_at: string;
}

export interface PageGenerationStatus {
  book_id: string;
  status: PageGenerationStatusType;
  progress: number;
  current_page: number;
  total_pages: number;
  error?: string;
  started_at?: string;
  completed_at?: string;
}

// ============================================================================
// Chat Types
// ============================================================================

export type ChatMessageRole = "user" | "assistant" | "system";

export interface ChatSession {
  id: string;
  book_id: string;
  user_id: string;
  title: string;
  message_count: number;
  total_cost_cents: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: ChatMessageRole;
  content: string;
  cost_cents: number;
  model?: string;
  tokens_used?: number;
  created_at: string;
}

export interface CreateChatSessionRequest {
  book_id: string;
  title?: string;
}

export interface SendMessageRequest {
  content: string;
  stream?: boolean;
}

// SSE Event Types
export interface SSEChunkEvent {
  type: "chunk";
  content: string;
}

export interface SSEDoneEvent {
  type: "done";
  message_id: string;
  cost_cents: number;
  tokens_used: number;
}

export interface SSEErrorEvent {
  type: "error";
  code: string;
  message: string;
}

export type SSEEvent = SSEChunkEvent | SSEDoneEvent | SSEErrorEvent;

// ============================================================================
// Billing Types
// ============================================================================

export type BillingTier = "free" | "basic" | "premium" | "enterprise";

export interface CreditBalance {
  balance_cents: number;
  free_credits_remaining: number;
  tier: BillingTier;
  next_reset_at: string;
}

export interface UsageLimits {
  daily_limit_cents: number;
  daily_used_cents: number;
  daily_remaining_cents: number;
  monthly_limit_cents: number;
  monthly_used_cents: number;
  monthly_remaining_cents: number;
  requests_per_minute: number;
  requests_this_minute: number;
  resets_at: string;
}

export interface UsageByFeature {
  feature: string;
  requests: number;
  cost_cents: number;
}

export interface UsageSummary {
  total_requests: number;
  total_cost_cents: number;
  period_start: string;
  period_end: string;
  by_feature: UsageByFeature[];
}

export type TransactionType = "credit" | "debit" | "refund" | "bonus";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount_cents: number;
  balance_after_cents: number;
  description: string;
  feature?: string;
  reference_id?: string;
  created_at: string;
}

export interface TransactionListParams extends PaginationParams {
  type?: TransactionType;
  start_date?: string;
  end_date?: string;
}
