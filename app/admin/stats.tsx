// Admin Stats Dashboard Screen

import React from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import {
  Users,
  BookOpen,
  MessageSquare,
  FileText,
  HardDrive,
  TrendingUp,
  UserCheck,
  Globe,
} from "lucide-react-native";

import { useTheme } from "@/providers/ThemeProvider";
import { useSystemStats } from "@/hooks/useAdmin";

export default function AdminStatsScreen() {
  const { colors } = useTheme();

  const { data: stats, isLoading, refetch, isRefetching } = useSystemStats();

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const statsItems = [
    {
      icon: Users,
      label: "Total Users",
      value: stats?.total_users?.toLocaleString() || "0",
      color: "#3B82F6",
    },
    {
      icon: UserCheck,
      label: "Active Users",
      value: stats?.active_users?.toLocaleString() || "0",
      color: "#10B981",
    },
    {
      icon: BookOpen,
      label: "Total Books",
      value: stats?.total_books?.toLocaleString() || "0",
      color: "#8B5CF6",
    },
    {
      icon: Globe,
      label: "Public Books",
      value: stats?.public_books?.toLocaleString() || "0",
      color: "#06B6D4",
    },
    {
      icon: FileText,
      label: "Total Pages",
      value: stats?.total_pages?.toLocaleString() || "0",
      color: "#F59E0B",
    },
    {
      icon: MessageSquare,
      label: "Chat Sessions",
      value: stats?.total_chats?.toLocaleString() || "0",
      color: "#EC4899",
    },
    {
      icon: HardDrive,
      label: "Storage Used",
      value: stats?.storage_used_formatted || "0 MB",
      color: "#6366F1",
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TrendingUp size={28} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          System Statistics
        </Text>
      </View>
      <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
        Real-time overview of your application
      </Text>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {statsItems.map((item, index) => (
          <View
            key={item.label}
            style={[
              styles.statCard,
              { backgroundColor: colors.card },
              index === statsItems.length - 1 && statsItems.length % 2 !== 0
                ? styles.fullWidthCard
                : {},
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: item.color + "20" },
              ]}
            >
              <item.icon size={24} color={item.color} />
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {item.value}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Quick Info */}
      <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.infoTitle, { color: colors.foreground }]}>
          About Statistics
        </Text>
        <Text style={[styles.infoText, { color: colors.muted }]}>
          These statistics are updated in real-time and refresh automatically
          every 30 seconds. Pull down to manually refresh.
        </Text>
        <View style={styles.infoRow}>
          <View style={[styles.dot, { backgroundColor: "#10B981" }]} />
          <Text style={[styles.infoText, { color: colors.muted }]}>
            Active users are those who logged in within the last 30 days
          </Text>
        </View>
        <View style={styles.infoRow}>
          <View style={[styles.dot, { backgroundColor: "#3B82F6" }]} />
          <Text style={[styles.infoText, { color: colors.muted }]}>
            Storage includes books, pages, and generated thumbnails
          </Text>
        </View>
      </View>

      {/* Footer Timestamp */}
      <Text style={[styles.timestamp, { color: colors.muted }]}>
        Last updated: {new Date().toLocaleString()}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: "47%",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  fullWidthCard: {
    width: "100%",
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  timestamp: {
    fontSize: 11,
    textAlign: "center",
  },
});
