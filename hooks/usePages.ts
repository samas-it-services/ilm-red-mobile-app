// Pages React Query hooks with prefetching and generation status

import { useCallback, useEffect, useRef } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  PageManifest,
  PageImage,
  PageGenerationStatus,
  PaginatedResponse,
} from "@/types/api";
import { PAGES_CONFIG } from "@/constants/config";

// ============================================================================
// Query Keys
// ============================================================================

export const pageKeys = {
  all: ["pages"] as const,
  manifest: (bookId: string) => [...pageKeys.all, bookId, "manifest"] as const,
  page: (bookId: string, pageNumber: number) =>
    [...pageKeys.all, bookId, "page", pageNumber] as const,
  status: (bookId: string) => [...pageKeys.all, bookId, "status"] as const,
};

// ============================================================================
// Fetch Functions
// ============================================================================

const fetchPageManifest = async (bookId: string): Promise<PageManifest> => {
  const response = await api.get<PageManifest>(`/books/${bookId}/pages`);
  return response.data;
};

const fetchPageImage = async (
  bookId: string,
  pageNumber: number
): Promise<PageImage> => {
  const response = await api.get<PageImage>(
    `/books/${bookId}/pages/${pageNumber}`
  );
  return response.data;
};

const fetchGenerationStatus = async (
  bookId: string
): Promise<PageGenerationStatus> => {
  const response = await api.get<PageGenerationStatus>(
    `/books/${bookId}/pages/status`
  );
  return response.data;
};

const triggerPageGeneration = async (bookId: string): Promise<void> => {
  await api.post(`/books/${bookId}/pages/generate`);
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch page manifest for a book (thumbnails list)
 */
export function usePageManifest(bookId: string) {
  return useQuery({
    queryKey: pageKeys.manifest(bookId),
    queryFn: () => fetchPageManifest(bookId),
    enabled: !!bookId,
    staleTime: PAGES_CONFIG.STALE_TIME_PAGES_LIST,
  });
}

/**
 * Fetch single page image with signed URL
 */
export function usePageImage(bookId: string, pageNumber: number) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: pageKeys.page(bookId, pageNumber),
    queryFn: () => fetchPageImage(bookId, pageNumber),
    enabled: !!bookId && pageNumber > 0,
    staleTime: PAGES_CONFIG.STALE_TIME_PAGE_DETAIL,
    // Check if URL is about to expire
    select: (data) => {
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / 60000;

      // If expires in less than 5 minutes, trigger a refetch
      if (minutesUntilExpiry < 5) {
        queryClient.invalidateQueries({
          queryKey: pageKeys.page(bookId, pageNumber),
        });
      }

      return data;
    },
  });
}

/**
 * Fetch page generation status with exponential backoff polling
 */
export function usePageGenerationStatus(bookId: string, enabled = true) {
  const pollIntervalRef = useRef(PAGES_CONFIG.GENERATION_POLL_INITIAL);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: pageKeys.status(bookId),
    queryFn: () => fetchGenerationStatus(bookId),
    enabled: !!bookId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      // Stop polling if completed or failed
      if (status === "completed" || status === "failed") {
        // Invalidate manifest to get fresh data
        if (status === "completed") {
          queryClient.invalidateQueries({
            queryKey: pageKeys.manifest(bookId),
          });
        }
        return false;
      }

      // Exponential backoff
      const currentInterval = pollIntervalRef.current;
      pollIntervalRef.current = Math.min(
        currentInterval * PAGES_CONFIG.GENERATION_POLL_BACKOFF,
        PAGES_CONFIG.GENERATION_POLL_MAX
      );

      return currentInterval;
    },
  });

  // Reset interval when query is re-enabled
  useEffect(() => {
    if (enabled) {
      pollIntervalRef.current = PAGES_CONFIG.GENERATION_POLL_INITIAL;
    }
  }, [enabled]);

  return query;
}

/**
 * Trigger page generation for a book
 */
export function useTriggerPageGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: triggerPageGeneration,
    onSuccess: (_, bookId) => {
      // Invalidate status to start polling
      queryClient.invalidateQueries({
        queryKey: pageKeys.status(bookId),
      });
    },
  });
}

// ============================================================================
// Prefetch Hooks
// ============================================================================

/**
 * Prefetch next pages for smooth navigation
 */
export function usePrefetchPages(bookId: string, currentPage: number) {
  const queryClient = useQueryClient();

  const prefetchPage = useCallback(
    async (pageNumber: number) => {
      await queryClient.prefetchQuery({
        queryKey: pageKeys.page(bookId, pageNumber),
        queryFn: () => fetchPageImage(bookId, pageNumber),
        staleTime: PAGES_CONFIG.STALE_TIME_PAGE_DETAIL,
      });
    },
    [bookId, queryClient]
  );

  // Prefetch next pages when current page changes
  useEffect(() => {
    if (!bookId || currentPage <= 0) return;

    const pagesToPrefetch: number[] = [];

    // Prefetch next N pages
    for (let i = 1; i <= PAGES_CONFIG.PAGE_PREFETCH_COUNT; i++) {
      pagesToPrefetch.push(currentPage + i);
    }

    // Also prefetch previous page if not already cached
    if (currentPage > 1) {
      pagesToPrefetch.push(currentPage - 1);
    }

    // Prefetch in background
    pagesToPrefetch.forEach((pageNum) => {
      // Check if already cached
      const cached = queryClient.getQueryData(pageKeys.page(bookId, pageNum));
      if (!cached) {
        prefetchPage(pageNum);
      }
    });
  }, [bookId, currentPage, prefetchPage, queryClient]);

  return { prefetchPage };
}

/**
 * Handle expired URL recovery
 * Call this when an image fails to load with 403
 */
export function useRefreshExpiredUrl() {
  const queryClient = useQueryClient();

  return useCallback(
    async (bookId: string, pageNumber: number) => {
      // Invalidate and refetch the page
      await queryClient.invalidateQueries({
        queryKey: pageKeys.page(bookId, pageNumber),
      });

      // Return fresh data
      return queryClient.fetchQuery({
        queryKey: pageKeys.page(bookId, pageNumber),
        queryFn: () => fetchPageImage(bookId, pageNumber),
      });
    },
    [queryClient]
  );
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Combined hook for page reader with prefetching
 */
export function usePageReader(bookId: string, initialPage = 1) {
  const manifest = usePageManifest(bookId);
  const currentPageQuery = usePageImage(bookId, initialPage);
  const { prefetchPage } = usePrefetchPages(bookId, initialPage);
  const refreshExpiredUrl = useRefreshExpiredUrl();

  const handleImageError = useCallback(async () => {
    // On 403/expired URL, refresh
    try {
      await refreshExpiredUrl(bookId, initialPage);
    } catch (error) {
      console.error("Failed to refresh expired URL:", error);
    }
  }, [bookId, initialPage, refreshExpiredUrl]);

  return {
    manifest,
    currentPage: currentPageQuery,
    totalPages: manifest.data?.total_pages ?? 0,
    prefetchPage,
    handleImageError,
    isLoading: manifest.isLoading || currentPageQuery.isLoading,
    isError: manifest.isError || currentPageQuery.isError,
  };
}
