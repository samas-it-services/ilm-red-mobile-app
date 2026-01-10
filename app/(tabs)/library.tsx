// Library Screen - Search and browse books

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Search, Plus, X, SlidersHorizontal } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/providers/ThemeProvider";
import { useInfiniteBooks, useFavorites, useToggleFavorite } from "@/hooks/useBooks";
import { useCategories, type BookCategory } from "@/hooks/useCategories";
import { BookList } from "@/components/BookList";
import { CategoryList } from "@/components/CategoryChip";

// ============================================================================
// Screen
// ============================================================================

export default function LibraryScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { categories } = useCategories();
  const params = useLocalSearchParams<{ category?: string }>();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BookCategory | null>(
    (params.category as BookCategory) || null
  );
  const [showFilters, setShowFilters] = useState(!!params.category);

  // Queries
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteBooks({
    q: searchQuery || undefined,
    category: selectedCategory || undefined,
  });

  const { data: favoritesData } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  // Memoized values
  const books = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );

  const favoriteIds = useMemo(
    () => new Set(favoritesData?.data.map((b) => b.id) ?? []),
    [favoritesData]
  );

  // Handlers
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleFavoritePress = useCallback(
    (bookId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      toggleFavorite.mutate(bookId, favoriteIds.has(bookId));
    },
    [toggleFavorite, favoriteIds]
  );

  const handleUploadPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/upload");
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleCategorySelect = (category: BookCategory | null) => {
    Haptics.selectionAsync();
    setSelectedCategory(category);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top, borderBottomColor: colors.border },
        ]}
      >
        {/* Title Row */}
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Library
          </Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setShowFilters(!showFilters);
            }}
            style={[styles.filterButton, showFilters && { backgroundColor: `${colors.primary}15` }]}
          >
            <SlidersHorizontal
              size={20}
              color={showFilters ? colors.primary : colors.foreground}
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Search size={20} color={colors.muted} />
          <TextInput
            placeholder="Search books, authors..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filters */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <CategoryList
              categories={categories.slice(0, 10)}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
            />
          </View>
        )}
      </View>

      {/* Book List */}
      <BookList
        books={books}
        isLoading={isLoading}
        isRefreshing={isRefetching}
        onRefresh={handleRefresh}
        onEndReached={handleEndReached}
        hasMore={hasNextPage}
        onFavoritePress={handleFavoritePress}
        favoriteIds={favoriteIds}
        emptyMessage={
          searchQuery
            ? `No books found for "${searchQuery}"`
            : selectedCategory
            ? `No books in ${selectedCategory}`
            : "No books in your library yet"
        }
      />

      {/* Upload FAB */}
      <TouchableOpacity
        onPress={handleUploadPress}
        style={[styles.fab, { bottom: 24 + insets.bottom }]}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[colors.primary, "#7C3AED"]}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Plus size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  filtersContainer: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});
