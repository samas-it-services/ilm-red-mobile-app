// Reading Progress React Query hooks

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// ============================================================================
// Types
// ============================================================================

export interface ReadingProgress {
  book_id: string;
  current_page: number;
  total_pages: number;
  progress_percent: number;
  last_read_at: string;
  started_at: string;
  completed_at: string | null;
  reading_time_seconds: number;
}

export interface ProgressUpdate {
  current_page: number;
  total_pages: number;
  reading_time_seconds?: number;
}

export interface RecentRead {
  book_id: string;
  book_title: string;
  book_author: string | null;
  book_cover_url: string | null;
  current_page: number;
  total_pages: number;
  progress_percent: number;
  last_read_at: string;
}

export interface ReadingStats {
  total_books_started: number;
  total_books_completed: number;
  total_reading_time_seconds: number;
  total_reading_time_formatted: string;
  current_streak_days: number;
  longest_streak_days: number;
  avg_pages_per_day: number;
}

// ============================================================================
// Query Keys
// ============================================================================

export const progressKeys = {
  all: ["progress"] as const,
  book: (bookId: string) => [...progressKeys.all, "book", bookId] as const,
  recent: () => [...progressKeys.all, "recent"] as const,
  stats: () => [...progressKeys.all, "stats"] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get user's progress for a specific book
 */
export function useBookProgress(bookId: string) {
  return useQuery({
    queryKey: progressKeys.book(bookId),
    queryFn: async () => {
      const response = await api.get<ReadingProgress>(`/books/${bookId}/progress`);
      return response.data;
    },
    enabled: !!bookId,
  });
}

/**
 * Get user's recent reads
 */
export function useRecentReads(limit: number = 10) {
  return useQuery({
    queryKey: [...progressKeys.recent(), limit],
    queryFn: async () => {
      const response = await api.get<RecentRead[]>("/progress/recent", {
        params: { limit },
      });
      return response.data;
    },
  });
}

/**
 * Get user's reading statistics
 */
export function useReadingStats() {
  return useQuery({
    queryKey: progressKeys.stats(),
    queryFn: async () => {
      const response = await api.get<ReadingStats>("/progress/stats");
      return response.data;
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Update reading progress for a book
 */
export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      progress,
    }: {
      bookId: string;
      progress: ProgressUpdate;
    }) => {
      const response = await api.put<ReadingProgress>(
        `/books/${bookId}/progress`,
        progress
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: progressKeys.book(variables.bookId) });
      queryClient.invalidateQueries({ queryKey: progressKeys.recent() });
      queryClient.invalidateQueries({ queryKey: progressKeys.stats() });
    },
  });
}

/**
 * Reset reading progress for a book
 */
export function useResetProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: string) => {
      await api.delete(`/books/${bookId}/progress`);
    },
    onSuccess: (_data, bookId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: progressKeys.book(bookId) });
      queryClient.invalidateQueries({ queryKey: progressKeys.recent() });
      queryClient.invalidateQueries({ queryKey: progressKeys.stats() });
    },
  });
}
