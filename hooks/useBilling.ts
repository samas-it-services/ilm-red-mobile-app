// Billing hooks: credits, adding funds by Zelle, the billing agreement and receipts, all through
// api.ilm.red (openapi/premium.yaml and openapi/me.yaml). Same operations the website uses.
//
// The retired /billing/balance, /billing/limits, /billing/usage and /billing/transactions endpoints
// of the old backend are no longer called.
//
// The server decides every number: limits, the monthly ceiling, the tax, and whether the billing
// agreement must be accepted first. These hooks only carry what it says to the screen.

import { useCallback } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ilmApi, ApiProblem, type ResponseOf } from "@/lib/ilmApi";

// ============================================================================
// Types (from the typed client, so they follow the contract)
// ============================================================================

export type PaymentMethods = ResponseOf<"premium", "listPaymentMethods">;
export type PaymentMethod = PaymentMethods["methods"][number];
export type TopUp = ResponseOf<"premium", "getMyTopUp">;
export type AgreementRead = ResponseOf<"premium", "getBillingAgreement">;
export type MyPayment = ResponseOf<"premium", "listMyPayments">["data"][number];

/** My credit account, from getMyEntitlements.billing (dollars, not cents). */
export interface CreditAccount {
  monthlyLimit: number;
  allowanceLeft: number;
  purchased: number;
  locked: number;
  /** What I can spend now: allowance left + purchased - locked, never below zero. */
  spendable: number;
  usedThisMonth: number;
  periodEnd: string | null;
}

export interface AgreementStatus {
  current_version: number | null;
  accepted_version: number | null;
  required: boolean;
}

// ============================================================================
// Query keys
// ============================================================================

export const billingKeys = {
  all: ["billing"] as const,
  account: () => [...billingKeys.all, "account"] as const,
  methods: () => [...billingKeys.all, "methods"] as const,
  topUps: () => [...billingKeys.all, "topUps"] as const,
  payments: () => [...billingKeys.all, "payments"] as const,
  agreement: () => [...billingKeys.all, "agreement"] as const,
};

// ============================================================================
// Helpers
// ============================================================================

const num = (v: unknown) => (v == null || v === "" ? 0 : Number(v) || 0);

export function spendableCredits(a: { allowanceLeft: number; purchased: number; locked: number }): number {
  return Math.max(0, Math.round((a.allowanceLeft + a.purchased - a.locked) * 100) / 100);
}

/** Money {amount_minor} as "12.34". */
export const dollars = (m: { amount_minor: number } | null | undefined) =>
  ((m?.amount_minor ?? 0) / 100).toFixed(2);

export const formatDollars = (n: number) => `$${n.toFixed(2)}`;

/** Open = the member may still have something to do, or Finance does. */
export const isOpenTopUp = (t: Pick<TopUp, "status">) =>
  t.status === "awaiting_payment" || t.status === "sent";

export function topUpStatusLabel(status: TopUp["status"]): string {
  switch (status) {
    case "awaiting_payment": return "Waiting for you to send";
    case "sent": return "Marked sent, Finance is checking";
    case "processing": return "Being checked";
    case "completed": return "Credits added";
    case "rejected": return "Not received";
    case "cancelled": return "Cancelled";
    case "expired": return "Expired";
    case "failed": return "Failed";
    default: return String(status);
  }
}

/** A readable sentence for an API refusal, falling back to the server's own detail. */
export function problemText(e: unknown, fallback: string): string {
  if (e instanceof ApiProblem) {
    if (e.slug === "top_up_limit") return e.detail ?? "You already have top-ups waiting. Finish or cancel one first.";
    if (e.slug === "over_ceiling") return "That is more than you can add this month. Try a smaller amount.";
    if (e.slug === "method_unavailable") return "Zelle is not available right now.";
    if (e.slug === "agreement_required") return "Please read and agree to the billing agreement first.";
    return e.detail ?? fallback;
  }
  return fallback;
}

/** 404/401 from an older API means "nothing to show here", not an error. */
const quiet = (e: unknown) => e instanceof ApiProblem && (e.status === 404 || e.status === 401);

// ============================================================================
// Queries
// ============================================================================

export function useCreditAccount() {
  return useQuery({
    queryKey: billingKeys.account(),
    staleTime: 20_000,
    refetchInterval: 60_000,
    queryFn: async (): Promise<{ account: CreditAccount | null; agreement: AgreementStatus | null }> => {
      const ent = await ilmApi.call("me", "getMyEntitlements", {});
      const b = (ent as { billing?: Record<string, unknown> | null }).billing ?? null;
      const agreement = ((ent as { billing_agreement?: AgreementStatus }).billing_agreement ?? null);
      if (!b) return { account: null, agreement };
      const base = {
        monthlyLimit: num(b.monthly_credit_limit),
        allowanceLeft: num(b.current_month_credits_remaining),
        purchased: num(b.purchased_credits_balance),
        locked: num(b.locked_credits),
        usedThisMonth: num(b.current_month_usage),
        periodEnd: (b.current_billing_period_end as string | null) ?? null,
      };
      return { account: { ...base, spendable: spendableCredits(base) }, agreement };
    },
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: billingKeys.methods(),
    staleTime: 30_000,
    queryFn: async (): Promise<PaymentMethods | null> => {
      try {
        return await ilmApi.call("premium", "listPaymentMethods", {});
      } catch (e) {
        if (quiet(e)) return null;
        throw e;
      }
    },
  });
}

export function useMyTopUps() {
  return useQuery({
    queryKey: billingKeys.topUps(),
    staleTime: 15_000,
    queryFn: async (): Promise<TopUp[]> => {
      try {
        return (await ilmApi.call("premium", "listMyTopUps", { query: { limit: 20 } })).data;
      } catch (e) {
        if (quiet(e)) return [];
        throw e;
      }
    },
  });
}

export function useMyPayments() {
  return useQuery({
    queryKey: billingKeys.payments(),
    staleTime: 60_000,
    queryFn: async (): Promise<MyPayment[]> => {
      try {
        return (await ilmApi.call("premium", "listMyPayments", { query: { limit: 20 } })).data;
      } catch (e) {
        if (quiet(e)) return [];
        throw e;
      }
    },
  });
}

export function useBillingAgreement(enabled: boolean) {
  return useQuery({
    queryKey: billingKeys.agreement(),
    enabled,
    staleTime: 5 * 60_000,
    queryFn: () => ilmApi.call("premium", "getBillingAgreement", {}),
  });
}

// ============================================================================
// Mutations
// ============================================================================

export function useRefreshBilling() {
  const qc = useQueryClient();
  return useCallback(() => qc.invalidateQueries({ queryKey: billingKeys.all }), [qc]);
}

export function useTopUpActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: billingKeys.all });

  const create = useMutation({
    mutationFn: ({ method, amountMinor }: { method: string; amountMinor: number }) =>
      ilmApi.call("premium", "createTopUp", {
        body: { method, amount: { amount_minor: amountMinor, currency: "USD" } },
        idempotent: true,
      }),
    onSuccess: refresh,
  });

  const markSent = useMutation({
    mutationFn: ({ id, senderName, confirmation }: { id: string; senderName: string; confirmation: string }) => {
      const body: { sender_name?: string; bank_confirmation?: string } = {};
      if (senderName.trim()) body.sender_name = senderName.trim();
      if (confirmation.trim()) body.bank_confirmation = confirmation.trim();
      return ilmApi.call("premium", "markTopUpSent", { path: { top_up_id: id }, body, idempotent: true });
    },
    onSuccess: refresh,
  });

  const cancel = useMutation({
    mutationFn: (id: string) =>
      ilmApi.call("premium", "cancelTopUp", { path: { top_up_id: id }, idempotent: true }),
    onSuccess: refresh,
  });

  const acceptAgreement = useMutation({
    mutationFn: (version: number) =>
      ilmApi.call("premium", "acceptBillingAgreement", {
        body: {
          version,
          surface: "mobile",
          app_version: `${Platform.OS} ${Constants.expoConfig?.version ?? "0"}`.slice(0, 40),
        },
        idempotent: true,
      }),
    onSuccess: refresh,
  });

  return { create, markSent, cancel, acceptAgreement };
}
