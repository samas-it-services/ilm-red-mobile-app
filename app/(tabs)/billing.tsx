// Billing Screen - Credit balance, usage meters, transaction history

import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CreditCard,
  TrendingUp,
  Clock,
  Zap,
  ChevronRight,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  RotateCcw,
} from "lucide-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/providers/ThemeProvider";
import {
  useBilling,
  useTransactions,
  formatCents,
  formatCredits,
  getTierLabel,
  getTierColor,
} from "@/hooks/useBilling";
import type { Transaction, TransactionType } from "@/types/api";

// ============================================================================
// Balance Card Component
// ============================================================================

function BalanceCard({
  balance,
  tier,
  freeCredits,
  colors,
}: {
  balance: number;
  tier: string;
  freeCredits: number;
  colors: any;
}) {
  const tierColor = getTierColor(tier);

  return (
    <Animated.View entering={FadeInDown.duration(500)}>
      <LinearGradient
        colors={[colors.primary, "#7C3AED"]}
        style={styles.balanceCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.balanceHeader}>
          <View style={styles.balanceIconContainer}>
            <CreditCard size={24} color="#FFF" />
          </View>
          <View style={[styles.tierBadge, { backgroundColor: tierColor + "40" }]}>
            <Text style={styles.tierText}>{getTierLabel(tier)}</Text>
          </View>
        </View>

        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>{formatCents(balance)}</Text>

        {freeCredits > 0 && (
          <View style={styles.freeCreditsContainer}>
            <Gift size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.freeCreditsText}>
              {formatCredits(freeCredits)} free credits remaining
            </Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

// ============================================================================
// Usage Meter Component
// ============================================================================

function UsageMeter({
  label,
  used,
  limit,
  percent,
  icon,
  resetsAt,
  colors,
}: {
  label: string;
  used: number;
  limit: number;
  percent: number;
  icon: React.ReactNode;
  resetsAt?: string;
  colors: any;
}) {
  const isWarning = percent >= 80;
  const isError = percent >= 95;

  const progressColor = isError
    ? colors.destructive
    : isWarning
    ? "#F59E0B"
    : colors.primary;

  return (
    <View style={[styles.meterCard, { backgroundColor: colors.card }]}>
      <View style={styles.meterHeader}>
        <View style={[styles.meterIcon, { backgroundColor: `${progressColor}15` }]}>
          {icon}
        </View>
        <View style={styles.meterInfo}>
          <Text style={[styles.meterLabel, { color: colors.foreground }]}>{label}</Text>
          <Text style={[styles.meterValue, { color: colors.muted }]}>
            {formatCents(used)} / {formatCents(limit)}
          </Text>
        </View>
        <Text style={[styles.meterPercent, { color: progressColor }]}>
          {Math.round(percent)}%
        </Text>
      </View>

      <View style={[styles.meterTrack, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[
            styles.meterFill,
            {
              backgroundColor: progressColor,
              width: `${Math.min(percent, 100)}%`,
            },
          ]}
        />
      </View>

      {resetsAt && (
        <View style={styles.meterFooter}>
          <Clock size={12} color={colors.muted} />
          <Text style={[styles.meterResetText, { color: colors.muted }]}>
            Resets {new Date(resetsAt).toLocaleDateString()}
          </Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Transaction Item Component
// ============================================================================

function TransactionItem({
  transaction,
  colors,
}: {
  transaction: Transaction;
  colors: any;
}) {
  const getIcon = (type: TransactionType) => {
    switch (type) {
      case "credit":
        return <ArrowDownLeft size={20} color="#10B981" />;
      case "debit":
        return <ArrowUpRight size={20} color={colors.destructive} />;
      case "refund":
        return <RotateCcw size={20} color="#F59E0B" />;
      case "bonus":
        return <Gift size={20} color="#8B5CF6" />;
      default:
        return <Zap size={20} color={colors.muted} />;
    }
  };

  const getAmountColor = (type: TransactionType) => {
    switch (type) {
      case "credit":
      case "refund":
      case "bonus":
        return "#10B981";
      case "debit":
        return colors.destructive;
      default:
        return colors.foreground;
    }
  };

  const amountPrefix = transaction.type === "debit" ? "-" : "+";

  return (
    <View style={[styles.transactionItem, { borderBottomColor: colors.border }]}>
      <View style={[styles.transactionIcon, { backgroundColor: colors.card }]}>
        {getIcon(transaction.type)}
      </View>

      <View style={styles.transactionInfo}>
        <Text style={[styles.transactionDescription, { color: colors.foreground }]}>
          {transaction.description}
        </Text>
        <Text style={[styles.transactionDate, { color: colors.muted }]}>
          {new Date(transaction.created_at).toLocaleDateString()} • {transaction.feature || "General"}
        </Text>
      </View>

      <Text style={[styles.transactionAmount, { color: getAmountColor(transaction.type) }]}>
        {amountPrefix}{formatCents(Math.abs(transaction.amount_cents))}
      </Text>
    </View>
  );
}

// ============================================================================
// Usage Summary Component
// ============================================================================

function UsageSummary({
  totalRequests,
  totalCost,
  byFeature,
  colors,
}: {
  totalRequests: number;
  totalCost: number;
  byFeature: Array<{ feature: string; requests: number; cost_cents: number }>;
  colors: any;
}) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
        This Period
      </Text>

      <View style={styles.summaryStats}>
        <View style={styles.summaryStat}>
          <Zap size={20} color={colors.primary} />
          <Text style={[styles.summaryStatValue, { color: colors.foreground }]}>
            {totalRequests}
          </Text>
          <Text style={[styles.summaryStatLabel, { color: colors.muted }]}>
            Requests
          </Text>
        </View>

        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

        <View style={styles.summaryStat}>
          <TrendingUp size={20} color={colors.primary} />
          <Text style={[styles.summaryStatValue, { color: colors.foreground }]}>
            {formatCents(totalCost)}
          </Text>
          <Text style={[styles.summaryStatLabel, { color: colors.muted }]}>
            Total Cost
          </Text>
        </View>
      </View>

      {byFeature.length > 0 && (
        <View style={styles.featureBreakdown}>
          <Text style={[styles.breakdownTitle, { color: colors.muted }]}>
            Breakdown by feature
          </Text>
          {byFeature.map((item, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={[styles.featureName, { color: colors.foreground }]}>
                {item.feature}
              </Text>
              <Text style={[styles.featureCost, { color: colors.muted }]}>
                {item.requests} req • {formatCents(item.cost_cents)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

export default function BillingScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Queries
  const {
    balance,
    limits,
    usage,
    isLoading,
    dailyUsagePercent,
    monthlyUsagePercent,
    refresh,
  } = useBilling();

  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTransactions();

  // Flatten transactions
  const transactions = useMemo(
    () => transactionsData?.pages.flatMap((page) => page.data) ?? [],
    [transactionsData]
  );

  // Handlers
  const handleRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refresh();
  }, [refresh]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 24,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Billing
        </Text>
      </View>

      {/* Balance Card */}
      {balance && (
        <View style={styles.section}>
          <BalanceCard
            balance={balance.balance_cents}
            tier={balance.tier}
            freeCredits={balance.free_credits_remaining}
            colors={colors}
          />
        </View>
      )}

      {/* Usage Meters */}
      {limits && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Usage Limits
          </Text>
          <View style={styles.metersContainer}>
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <UsageMeter
                label="Daily Usage"
                used={limits.daily_used_cents}
                limit={limits.daily_limit_cents}
                percent={dailyUsagePercent}
                icon={<Clock size={20} color={colors.primary} />}
                resetsAt={limits.resets_at}
                colors={colors}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <UsageMeter
                label="Monthly Usage"
                used={limits.monthly_used_cents}
                limit={limits.monthly_limit_cents}
                percent={monthlyUsagePercent}
                icon={<TrendingUp size={20} color={colors.primary} />}
                colors={colors}
              />
            </Animated.View>
          </View>
        </View>
      )}

      {/* Usage Summary */}
      {usage && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Summary
          </Text>
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <UsageSummary
              totalRequests={usage.total_requests}
              totalCost={usage.total_cost_cents}
              byFeature={usage.by_feature}
              colors={colors}
            />
          </Animated.View>
        </View>
      )}

      {/* Transaction History */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Recent Transactions
        </Text>

        {isLoadingTransactions ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : transactions.length === 0 ? (
          <View style={[styles.emptyTransactions, { backgroundColor: colors.card }]}>
            <AlertCircle size={32} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No transactions yet
            </Text>
          </View>
        ) : (
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <View style={[styles.transactionsList, { backgroundColor: colors.card }]}>
              {transactions.slice(0, 10).map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  colors={colors}
                />
              ))}

              {hasNextPage && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={handleLoadMore}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                        Load More
                      </Text>
                      <ChevronRight size={16} color={colors.primary} />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}
      </View>
    </ScrollView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  // Balance Card
  balanceCard: {
    padding: 24,
    borderRadius: 20,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  balanceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tierText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginBottom: 4,
  },
  balanceAmount: {
    color: "#FFF",
    fontSize: 36,
    fontWeight: "bold",
  },
  freeCreditsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  freeCreditsText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
  },
  // Usage Meters
  metersContainer: {
    gap: 12,
  },
  meterCard: {
    padding: 16,
    borderRadius: 14,
  },
  meterHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  meterIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  meterInfo: {
    flex: 1,
    marginLeft: 12,
  },
  meterLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  meterValue: {
    fontSize: 13,
    marginTop: 2,
  },
  meterPercent: {
    fontSize: 16,
    fontWeight: "600",
  },
  meterTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  meterFill: {
    height: "100%",
    borderRadius: 3,
  },
  meterFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  meterResetText: {
    fontSize: 11,
  },
  // Summary
  summaryCard: {
    padding: 16,
    borderRadius: 14,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryStat: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  summaryStatLabel: {
    fontSize: 13,
  },
  summaryDivider: {
    width: 1,
    height: 60,
    marginHorizontal: 16,
  },
  featureBreakdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  breakdownTitle: {
    fontSize: 12,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  featureItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  featureName: {
    fontSize: 14,
    textTransform: "capitalize",
  },
  featureCost: {
    fontSize: 13,
  },
  // Transactions
  transactionsList: {
    borderRadius: 14,
    overflow: "hidden",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: "600",
  },
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 4,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyTransactions: {
    padding: 32,
    borderRadius: 14,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});
