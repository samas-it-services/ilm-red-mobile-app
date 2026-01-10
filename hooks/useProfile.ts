// Profile React Query hooks

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { User } from "@/types/api";

// ============================================================================
// Types
// ============================================================================

export interface UserExtraData {
  full_name?: string;
  city?: string;
  state_province?: string;
  country?: string;
  date_of_birth?: string;
  [key: string]: any;
}

export interface UpdateProfileRequest {
  display_name?: string;
  bio?: string;
  extra_data?: UserExtraData;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Update current user's profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const response = await api.patch<User>("/users/me", data);
      return response.data;
    },
    onSuccess: (updatedUser) => {
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      // Return the updated user for the auth context
      return updatedUser;
    },
  });
}
