// Admin Cache Management Screen

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import {
  Database,
  Trash2,
  RefreshCw,
  Key,
  Cpu,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/providers/ThemeProvider";
import {
  useCacheStats,
  useInvalidateCache,
  useFlushCache,
} from "@/hooks/useAdmin";

export default function AdminCacheScreen() {
  const { colors } = useTheme();

  const [pattern, setPattern] = useState("");

  const { data: stats, isLoading, refetch, isRefetching } = useCacheStats();
  const invalidateCache = useInvalidateCache();
  const flushCache = useFlushCache();

  const handleInvalidate = useCallback(() => {
    if (!pattern.trim()) {
      Alert.alert("Error", "Please enter a cache pattern (e.g., books:*, users:*)");
      return;
    }

    Alert.alert(
      "Invalidate Cache",
      `Are you sure you want to invalidate all keys matching "${pattern}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Invalidate",
          style: "destructive",
          onPress: async () => {
            try {
              await invalidateCache.mutateAsync(pattern);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setPattern("");
              refetch();
            } catch (error) {
              Alert.alert("Error", "Failed to invalidate cache");
            }
          },
        },
      ]
    );
  }, [pattern, invalidateCache, refetch]);

  const handleFlush = useCallback(() => {
    Alert.alert(
      "Flush All Cache",
      "This will delete ALL cached data. This action cannot be undone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Flush All",
          style: "destructive",
          onPress: async () => {
            try {
              await flushCache.mutateAsync();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              refetch();
            } catch (error) {
              Alert.alert("Error", "Failed to flush cache");
            }
          },
        },
      ]
    );
  }, [flushCache, refetch]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const quickPatterns = [
    { label: "Books", pattern: "books:*" },
    { label: "Users", pattern: "users:*" },
    { label: "Search", pattern: "search:*" },
    { label: "Sessions", pattern: "sessions:*" },
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
      {/* Connection Status */}
      <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
        <View style={styles.statusHeader}>
          <Database size={20} color={colors.primary} />
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>
            Redis Cache
          </Text>
        </View>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : stats?.connected ? (
          <View style={styles.statusBadge}>
            <CheckCircle size={16} color="#10B981" />
            <Text style={[styles.statusText, { color: "#10B981" }]}>Connected</Text>
          </View>
        ) : (
          <View style={styles.statusBadge}>
            <XCircle size={16} color="#EF4444" />
            <Text style={[styles.statusText, { color: "#EF4444" }]}>Disconnected</Text>
          </View>
        )}
      </View>

      {/* Stats Grid */}
      {stats && (
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Key size={20} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {stats.total_keys?.toLocaleString() || "0"}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>
              Total Keys
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Cpu size={20} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {stats.memory_used || "0 MB"}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>
              Memory Used
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Zap size={20} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {stats.hit_rate ? `${(stats.hit_rate * 100).toFixed(1)}%` : "N/A"}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>
              Hit Rate
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Clock size={20} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {stats.uptime_seconds ? formatUptime(stats.uptime_seconds) : "N/A"}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>
              Uptime
            </Text>
          </View>
        </View>
      )}

      {/* Invalidate by Pattern */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Invalidate by Pattern
        </Text>
        <Text style={[styles.sectionDesc, { color: colors.muted }]}>
          Delete cache keys matching a pattern (e.g., books:*, users:123)
        </Text>

        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Enter pattern (e.g., books:*)"
            placeholderTextColor={colors.muted}
            value={pattern}
            onChangeText={setPattern}
          />
        </View>

        {/* Quick Patterns */}
        <View style={styles.quickPatterns}>
          {quickPatterns.map((qp) => (
            <TouchableOpacity
              key={qp.label}
              onPress={() => setPattern(qp.pattern)}
              style={[
                styles.quickPatternChip,
                {
                  backgroundColor:
                    pattern === qp.pattern ? colors.primary : colors.background,
                  borderColor:
                    pattern === qp.pattern ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.quickPatternText,
                  {
                    color: pattern === qp.pattern ? "#FFFFFF" : colors.foreground,
                  },
                ]}
              >
                {qp.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleInvalidate}
          disabled={!pattern.trim() || invalidateCache.isPending}
          style={[
            styles.actionButton,
            {
              backgroundColor: pattern.trim() ? colors.primary : colors.muted,
              opacity: invalidateCache.isPending ? 0.7 : 1,
            },
          ]}
        >
          {invalidateCache.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <RefreshCw size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Invalidate Pattern</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Flush All */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.dangerHeader}>
          <AlertTriangle size={20} color="#EF4444" />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Danger Zone
          </Text>
        </View>
        <Text style={[styles.sectionDesc, { color: colors.muted }]}>
          Flush all cached data. This will clear the entire Redis cache and may
          temporarily slow down the application.
        </Text>

        <TouchableOpacity
          onPress={handleFlush}
          disabled={flushCache.isPending}
          style={[
            styles.dangerButton,
            { opacity: flushCache.isPending ? 0.7 : 1 },
          ]}
        >
          {flushCache.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Trash2 size={18} color="#FFFFFF" />
              <Text style={styles.dangerButtonText}>Flush All Cache</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: "47%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  input: {
    height: 44,
    fontSize: 15,
  },
  quickPatterns: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  quickPatternChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickPatternText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 10,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  dangerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#EF4444",
  },
  dangerButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
