// Billing React Query hooks

import { useCallback } from "react";
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  CreditBalance,
  UsageLimits,
  UsageSummary,
  Transaction,
  TransactionListParams,
  PaginatedResponse,
} from "@/types/api";
import { BILLING_CONFIG } from "@/constants/config";

// ============================================================================
// Query Keys
// ============================================================================

export const billingKeys = {
  all: ["billing"] as const,
  balance: () => [...billingKeys.all, "balance"] as const,
  limits: () => [...billingKeys.all, "limits"] as const,
  usage: () => [...billingKeys.all, "usage"] as const,
  transactions: (params?: TransactionListParams) =>
    params
      ? [...billingKeys.all, "transactions", params]
      : [...billingKeys.all, "transactions"],
};

// ============================================================================
// Fetch Functions
// ============================================================================

const fetchBalance = async (): Promise<CreditBalance> => {
  const response = await api.get<CreditBalance>("/billing/balance");
  return response.data;
};

const fetchLimits = async (): Promise<UsageLimits> => {
  const response = await api.get<UsageLimits>("/billing/limits");
  return response.data;
};

const fetchUsage = async (): Promise<UsageSummary> => {
  const response = await api.get<UsageSummary>("/billing/usage");
  return response.data;
};

const fetchTransactions = async (
  params: TransactionListParams
): Promise<PaginatedResponse<Transaction>> => {
  const response = await api.get<PaginatedResponse<Transaction>>(
    "/billing/transactions",
    { params }
  );
  return response.data;
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch credit balance
 */
export function useCreditBalance() {
  return useQuery({
    queryKey: billingKeys.balance(),
    queryFn: fetchBalance,
    staleTime: BILLING_CONFIG.STALE_TIME_BALANCE,
    refetchInterval: BILLING_CONFIG.REFETCH_BALANCE_INTERVAL,
  });
}

/**
 * Fetch usage limits
 */
export function useUsageLimits() {
  return useQuery({
    queryKey: billingKeys.limits(),
    queryFn: fetchLimits,
    staleTime: BILLING_CONFIG.STALE_TIME_LIMITS,
  });
}

/**
 * Fetch usage summary
 */
export function useUsageSummary() {
  return useQuery({
    queryKey: billingKeys.usage(),
    queryFn: fetchUsage,
    staleTime: BILLING_CONFIG.STALE_TIME_USAGE,
  });
}

/**
 * Fetch transactions with infinite scroll
 */
export function useTransactions(params: Omit<TransactionListParams, "page"> = {}) {
  return useInfiniteQuery({
    queryKey: billingKeys.transactions(params),
    queryFn: ({ pageParam = 1 }) =>
      fetchTransactions({ ...params, page: pageParam, page_size: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.has_next ? lastPage.pagination.page + 1 : undefined,
    getPreviousPageParam: (firstPage) =>
      firstPage.pagination.has_prev ? firstPage.pagination.page - 1 : undefined,
    staleTime: BILLING_CONFIG.STALE_TIME_TRANSACTIONS,
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Invalidate all billing queries
 */
export function useRefreshBilling() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: billingKeys.all });
  }, [queryClient]);
}

/**
 * Combined billing hook
 */
export function useBilling() {
  const balanceQuery = useCreditBalance();
  const limitsQuery = useUsageLimits();
  const usageQuery = useUsageSummary();
  const refreshBilling = useRefreshBilling();

  // Calculate percentages
  const dailyUsagePercent = limitsQuery.data
    ? (limitsQuery.data.daily_used_cents / limitsQuery.data.daily_limit_cents) * 100
    : 0;

  const monthlyUsagePercent = limitsQuery.data
    ? (limitsQuery.data.monthly_used_cents / limitsQuery.data.monthly_limit_cents) * 100
    : 0;

  return {
    balance: balanceQuery.data,
    limits: limitsQuery.data,
    usage: usageQuery.data,
    isLoading:
      balanceQuery.isLoading || limitsQuery.isLoading || usageQuery.isLoading,
    isError: balanceQuery.isError || limitsQuery.isError || usageQuery.isError,
    error:
      balanceQuery.error || limitsQuery.error || usageQuery.error,
    dailyUsagePercent,
    monthlyUsagePercent,
    refresh: refreshBilling,
  };
}

// ============================================================================
// Format Utilities
// ============================================================================

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatCredits(cents: number): string {
  if (cents >= 100) {
    return `$${(cents / 100).toFixed(2)}`;
  }
  return `${cents}¢`;
}

export function getTierLabel(tier: string): string {
  const labels: Record<string, string> = {
    free: "Free Tier",
    basic: "Basic",
    premium: "Premium",
    enterprise: "Enterprise",
  };
  return labels[tier] || tier;
}

export function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    free: "#64748B",
    basic: "#10B981",
    premium: "#8B5CF6",
    enterprise: "#F59E0B",
  };
  return colors[tier] || "#64748B";
}
