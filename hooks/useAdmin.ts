// Admin React Query hooks

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { User, Book } from "@/types/api";

// ============================================================================
// Types
// ============================================================================

export interface AdminUser extends User {
  status: "active" | "suspended" | "deleted";
  created_at: string;
  last_login_at: string | null;
}

export interface AdminBook extends Book {
  processing_status: "ready" | "processing" | "failed" | "pending";
  created_at: string;
  updated_at: string;
}

export interface AdminChatSession {
  id: string;
  book_id: string;
  book_title: string;
  user_id: string;
  user_display_name: string;
  message_count: number;
  created_at: string;
  last_message_at: string;
}

export interface AdminChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface AdminChatSessionDetail extends AdminChatSession {
  messages: AdminChatMessage[];
}

export interface SystemStats {
  total_users: number;
  active_users: number;
  total_books: number;
  public_books: number;
  total_pages: number;
  total_chats: number;
  storage_used_bytes: number;
  storage_used_formatted: string;
}

export interface CacheStats {
  connected: boolean;
  memory_used: string;
  memory_peak: string;
  total_keys: number;
  hit_rate: number;
  uptime_seconds: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface AdminUsersParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  role?: string;
}

export interface AdminBooksParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  category?: string;
  owner_id?: string;
}

export interface AdminChatsParams {
  page?: number;
  per_page?: number;
  book_id?: string;
  user_id?: string;
}

export interface AdminUserUpdate {
  roles?: string[];
  status?: "active" | "suspended" | "deleted";
}

// ============================================================================
// User Management Hooks
// ============================================================================

/**
 * List all users with pagination and filters
 */
export function useAdminUsers(params: AdminUsersParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", String(params.page));
  if (params.per_page) queryParams.set("per_page", String(params.per_page));
  if (params.search) queryParams.set("search", params.search);
  if (params.status) queryParams.set("status", params.status);
  if (params.role) queryParams.set("role", params.role);

  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<AdminUser>>(
        `/admin/users?${queryParams.toString()}`
      );
      return response.data;
    },
  });
}

/**
 * Get a single user by ID
 */
export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: ["admin", "users", userId],
    queryFn: async () => {
      const response = await api.get<AdminUser>(`/admin/users/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });
}

/**
 * Update user roles or status
 */
export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string;
      data: AdminUserUpdate;
    }) => {
      const response = await api.patch<AdminUser>(`/admin/users/${userId}`, data);
      return response.data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", userId] });
    },
  });
}

/**
 * Disable a user account
 */
export function useDisableUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post(`/admin/users/${userId}/disable`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

// ============================================================================
// Book Management Hooks
// ============================================================================

/**
 * List all books with pagination and filters
 */
export function useAdminBooks(params: AdminBooksParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", String(params.page));
  if (params.per_page) queryParams.set("per_page", String(params.per_page));
  if (params.search) queryParams.set("search", params.search);
  if (params.status) queryParams.set("status", params.status);
  if (params.category) queryParams.set("category", params.category);
  if (params.owner_id) queryParams.set("owner_id", params.owner_id);

  return useQuery({
    queryKey: ["admin", "books", params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<AdminBook>>(
        `/admin/books?${queryParams.toString()}`
      );
      return response.data;
    },
  });
}

/**
 * Get a single book by ID (admin view)
 */
export function useAdminBook(bookId: string) {
  return useQuery({
    queryKey: ["admin", "books", bookId],
    queryFn: async () => {
      const response = await api.get<AdminBook>(`/admin/books/${bookId}`);
      return response.data;
    },
    enabled: !!bookId,
  });
}

/**
 * Trigger page generation for a book
 */
export function useTriggerPageGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: string) => {
      const response = await api.post(`/admin/books/${bookId}/generate-pages`);
      return response.data;
    },
    onSuccess: (_, bookId) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "books"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "books", bookId] });
      queryClient.invalidateQueries({ queryKey: ["book", bookId] });
    },
  });
}

/**
 * Regenerate thumbnails for a book
 */
export function useTriggerThumbnailGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: string) => {
      const response = await api.post(`/admin/books/${bookId}/generate-thumbnails`);
      return response.data;
    },
    onSuccess: (_, bookId) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "books"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "books", bookId] });
      queryClient.invalidateQueries({ queryKey: ["book", bookId] });
    },
  });
}

/**
 * Trigger AI processing (embeddings, chunks) for a book
 */
export function useTriggerAIProcessing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: string) => {
      const response = await api.post(`/admin/books/${bookId}/process-ai`);
      return response.data;
    },
    onSuccess: (_, bookId) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "books"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "books", bookId] });
      queryClient.invalidateQueries({ queryKey: ["book", bookId] });
    },
  });
}

// ============================================================================
// Chat Management Hooks
// ============================================================================

/**
 * List all chat sessions
 */
export function useAdminChats(params: AdminChatsParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", String(params.page));
  if (params.per_page) queryParams.set("per_page", String(params.per_page));
  if (params.book_id) queryParams.set("book_id", params.book_id);
  if (params.user_id) queryParams.set("user_id", params.user_id);

  return useQuery({
    queryKey: ["admin", "chats", params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<AdminChatSession>>(
        `/admin/chats?${queryParams.toString()}`
      );
      return response.data;
    },
  });
}

/**
 * Get a chat session with messages
 */
export function useAdminChat(chatId: string) {
  return useQuery({
    queryKey: ["admin", "chats", chatId],
    queryFn: async () => {
      const response = await api.get<AdminChatSessionDetail>(
        `/admin/chats/${chatId}`
      );
      return response.data;
    },
    enabled: !!chatId,
  });
}

/**
 * Delete a chat session
 */
export function useDeleteChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId: string) => {
      await api.delete(`/admin/chats/${chatId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "chats"] });
    },
  });
}

// ============================================================================
// Stats & Cache Hooks
// ============================================================================

/**
 * Get system statistics
 */
export function useSystemStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const response = await api.get<SystemStats>("/admin/stats");
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Get cache statistics
 */
export function useCacheStats() {
  return useQuery({
    queryKey: ["admin", "cache", "stats"],
    queryFn: async () => {
      const response = await api.get<CacheStats>("/cache/stats");
      return response.data;
    },
  });
}

/**
 * Invalidate cache by pattern
 */
export function useInvalidateCache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pattern: string) => {
      const response = await api.post("/cache/invalidate", { pattern });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "cache"] });
    },
  });
}

/**
 * Delete specific cache keys
 */
export function useDeleteCacheKeys() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keys: string[]) => {
      const response = await api.delete("/cache/keys", { data: { keys } });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "cache"] });
    },
  });
}

/**
 * Flush all cache
 */
export function useFlushCache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post("/cache/flush", { confirm: true });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "cache"] });
    },
  });
}
