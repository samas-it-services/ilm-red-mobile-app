// Rating Flags React Query hooks

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// ============================================================================
// Types
// ============================================================================

export interface FlagRatingRequest {
  bookId: string;
  ratingId: string;
  reason: "spam" | "offensive" | "irrelevant" | "other";
  details?: string;
}

export interface RatingFlagResponse {
  id: string;
  rating_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Flag a rating as inappropriate
 */
export function useFlagRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FlagRatingRequest) => {
      const response = await api.post<RatingFlagResponse>(
        `/books/${data.bookId}/ratings/${data.ratingId}/flag`,
        {
          reason: data.reason,
          details: data.details,
        }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate ratings query to refresh
      queryClient.invalidateQueries({
        queryKey: ["books", variables.bookId, "ratings"],
      });
    },
  });
}
