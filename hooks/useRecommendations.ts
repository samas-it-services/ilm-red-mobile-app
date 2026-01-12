// Recommendations React Query hooks

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { BookListItem } from "@/types/api";

// ============================================================================
// Types
// ============================================================================

export interface RecommendedBook {
  book_id: string;
  title: string;
  author: string | null;
  category: string;
  cover_url: string | null;
  average_rating: number | null;
  ratings_count: number;
  reason: string;
}

// ============================================================================
// Query Keys
// ============================================================================

export const recommendationKeys = {
  all: ["recommendations"] as const,
  forYou: (limit: number) => [...recommendationKeys.all, "for-you", limit] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get personalized recommendations for the current user
 */
export function useRecommendations(limit: number = 10) {
  return useQuery({
    queryKey: recommendationKeys.forYou(limit),
    queryFn: async () => {
      const response = await api.get<RecommendedBook[]>("/recommendations/for-you", {
        params: { limit },
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
