// React Query Provider

import React, { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { APP_CONFIG } from "@/constants/config";

// Create a client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: APP_CONFIG.CACHE_DURATION,
      // Cache data for 10 minutes
      gcTime: APP_CONFIG.STALE_DURATION,
      // Retry failed requests up to 3 times
      retry: 3,
      // Don't refetch on window focus for mobile
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// Export query client for direct access if needed
export { queryClient };

export default QueryProvider;
