// Admin Users List Screen

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter, Href } from "expo-router";
import { Search, User, Shield, ChevronRight, XCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/providers/ThemeProvider";
import { useAdminUsers, AdminUser } from "@/hooks/useAdmin";

export default function AdminUsersScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data, isLoading, refetch, isRefetching } = useAdminUsers({
    page,
    per_page: 20,
    search: search.length >= 2 ? search : undefined,
    status: statusFilter,
  });

  const handleUserPress = useCallback(
    (userId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/admin/users/${userId}` as Href);
    },
    [router]
  );

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
    setPage(1);
  }, []);

  const handleStatusFilter = useCallback((status: string | undefined) => {
    setStatusFilter(status);
    setPage(1);
  }, []);

  const renderUser = useCallback(
    ({ item }: { item: AdminUser }) => (
      <TouchableOpacity
        onPress={() => handleUserPress(item.id)}
        style={[styles.userCard, { backgroundColor: colors.card }]}
      >
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.primary },
          ]}
        >
          <Text style={styles.avatarText}>
            {item.display_name?.charAt(0).toUpperCase() || "U"}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.foreground }]}>
            {item.display_name || "Unknown"}
          </Text>
          <Text style={[styles.userUsername, { color: colors.muted }]}>
            @{item.username}
          </Text>
          <View style={styles.userMeta}>
            {item.roles?.includes("admin") && (
              <View style={[styles.badge, { backgroundColor: colors.primary + "20" }]}>
                <Shield size={10} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  Admin
                </Text>
              </View>
            )}
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.status === "active"
                      ? "#10B98120"
                      : item.status === "suspended"
                      ? "#F59E0B20"
                      : "#EF444420",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      item.status === "active"
                        ? "#10B981"
                        : item.status === "suspended"
                        ? "#F59E0B"
                        : "#EF4444",
                  },
                ]}
              >
                {item.status || "active"}
              </Text>
            </View>
          </View>
        </View>

        <ChevronRight size={20} color={colors.muted} />
      </TouchableOpacity>
    ),
    [colors, handleUserPress]
  );

  const statusFilters = [
    { label: "All", value: undefined },
    { label: "Active", value: "active" },
    { label: "Suspended", value: "suspended" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Search size={18} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search users..."
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={handleSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <XCircle size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status Filters */}
      <View style={styles.filtersContainer}>
        {statusFilters.map((filter) => (
          <TouchableOpacity
            key={filter.label}
            onPress={() => handleStatusFilter(filter.value)}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  statusFilter === filter.value
                    ? colors.primary
                    : colors.card,
                borderColor:
                  statusFilter === filter.value
                    ? colors.primary
                    : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    statusFilter === filter.value
                      ? "#FFFFFF"
                      : colors.foreground,
                },
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results Count */}
      {data && (
        <View style={styles.resultsHeader}>
          <Text style={[styles.resultsCount, { color: colors.muted }]}>
            {data.total} user{data.total !== 1 ? "s" : ""} found
          </Text>
        </View>
      )}

      {/* User List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data?.data || []}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <User size={48} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                No users found
              </Text>
            </View>
          }
          onEndReached={() => {
            if (data && page < data.total_pages) {
              setPage(page + 1);
            }
          }}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultsCount: {
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 13,
    marginBottom: 4,
  },
  userMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
});
