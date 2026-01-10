// Admin Books List Screen

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
import {
  Search,
  BookOpen,
  ChevronRight,
  XCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/providers/ThemeProvider";
import { useAdminBooks, AdminBook } from "@/hooks/useAdmin";
import { getCategoryById } from "@/hooks/useCategories";

export default function AdminBooksScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data, isLoading, refetch, isRefetching } = useAdminBooks({
    page,
    per_page: 20,
    search: search.length >= 2 ? search : undefined,
    status: statusFilter,
  });

  const handleBookPress = useCallback(
    (bookId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/admin/books/${bookId}` as Href);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle size={14} color="#10B981" />;
      case "processing":
        return <Clock size={14} color="#F59E0B" />;
      case "failed":
        return <AlertCircle size={14} color="#EF4444" />;
      default:
        return <Clock size={14} color={colors.muted} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return { bg: "#10B98120", text: "#10B981" };
      case "processing":
        return { bg: "#F59E0B20", text: "#F59E0B" };
      case "failed":
        return { bg: "#EF444420", text: "#EF4444" };
      default:
        return { bg: colors.muted + "20", text: colors.muted };
    }
  };

  const renderBook = useCallback(
    ({ item }: { item: AdminBook }) => {
      const category = getCategoryById(item.category);
      const statusColors = getStatusColor(item.processing_status || "pending");

      return (
        <TouchableOpacity
          onPress={() => handleBookPress(item.id)}
          style={[styles.bookCard, { backgroundColor: colors.card }]}
        >
          {/* Book Cover Placeholder */}
          <View
            style={[
              styles.bookCover,
              { backgroundColor: category?.bgColor || colors.secondary },
            ]}
          >
            {item.cover_url ? (
              <></>
            ) : (
              <FileText size={24} color={category?.color || colors.muted} />
            )}
          </View>

          <View style={styles.bookInfo}>
            <Text
              style={[styles.bookTitle, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={[styles.bookAuthor, { color: colors.muted }]} numberOfLines={1}>
              {item.author || "Unknown Author"}
            </Text>
            <View style={styles.bookMeta}>
              {category && (
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: category.bgColor },
                  ]}
                >
                  <Text style={[styles.categoryText, { color: category.color }]}>
                    {category.label}
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColors.bg },
                ]}
              >
                {getStatusIcon(item.processing_status || "pending")}
                <Text style={[styles.statusText, { color: statusColors.text }]}>
                  {item.processing_status || "pending"}
                </Text>
              </View>
            </View>
            <Text style={[styles.pageCount, { color: colors.muted }]}>
              {item.page_count || 0} pages
            </Text>
          </View>

          <ChevronRight size={20} color={colors.muted} />
        </TouchableOpacity>
      );
    },
    [colors, handleBookPress]
  );

  const statusFilters = [
    { label: "All", value: undefined },
    { label: "Ready", value: "ready" },
    { label: "Processing", value: "processing" },
    { label: "Failed", value: "failed" },
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
            placeholder="Search books..."
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
                  statusFilter === filter.value ? colors.primary : colors.card,
                borderColor:
                  statusFilter === filter.value ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    statusFilter === filter.value ? "#FFFFFF" : colors.foreground,
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
            {data.total} book{data.total !== 1 ? "s" : ""} found
          </Text>
        </View>
      )}

      {/* Book List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data?.data || []}
          keyExtractor={(item) => item.id}
          renderItem={renderBook}
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
              <BookOpen size={48} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                No books found
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
  bookCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  bookCover: {
    width: 50,
    height: 65,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  bookAuthor: {
    fontSize: 12,
    marginBottom: 6,
  },
  bookMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  pageCount: {
    fontSize: 11,
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
