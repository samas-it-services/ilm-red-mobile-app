// Search React Query hooks

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Book } from "@/types/api";

// ============================================================================
// Types
// ============================================================================

export interface SearchResult {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  category: string;
  cover_url: string | null;
  score: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
}

export interface SearchSuggestion {
  text: string;
  type: "title" | "author" | "category";
}

export interface SearchSuggestionsResponse {
  query: string;
  suggestions: SearchSuggestion[];
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Search for books
 */
export function useSearch(
  query: string,
  options?: {
    category?: string;
    limit?: number;
  }
) {
  return useQuery({
    queryKey: ["search", query, options],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("q", query);
      if (options?.category) params.set("category", options.category);
      if (options?.limit) params.set("limit", String(options.limit));

      const response = await api.get<SearchResponse>(`/search?${params.toString()}`);
      return response.data;
    },
    enabled: query.length >= 2,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Get search suggestions (autocomplete)
 */
export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: ["search", "suggestions", query],
    queryFn: async () => {
      const response = await api.get<SearchSuggestionsResponse>(
        `/search/suggestions?q=${encodeURIComponent(query)}`
      );
      return response.data;
    },
    enabled: query.length >= 1,
    staleTime: 60000, // 1 minute
  });
}
