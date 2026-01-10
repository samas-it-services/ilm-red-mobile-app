// Book List component with FlatList

import React from "react";
import {
  FlatList,
  View,
  RefreshControl,
  ActivityIndicator,
  Text,
  Dimensions,
} from "react-native";
import { BookOpen } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { BookCard } from "./BookCard";
import { EmptyState } from "./ui/Loading";
import type { BookListItem } from "@/types/api";

// ============================================================================
// Types
// ============================================================================

interface BookListProps {
  books: BookListItem[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  hasMore?: boolean;
  onFavoritePress?: (bookId: string) => void;
  favoriteIds?: Set<string>;
  emptyMessage?: string;
  numColumns?: 2 | 3;
  ListHeaderComponent?: React.ReactElement;
}

// ============================================================================
// Component
// ============================================================================

const { width } = Dimensions.get("window");

export function BookList({
  books,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onEndReached,
  hasMore = false,
  onFavoritePress,
  favoriteIds = new Set(),
  emptyMessage = "No books found",
  numColumns = 2,
  ListHeaderComponent,
}: BookListProps) {
  const { colors } = useTheme();

  // Calculate card width based on number of columns
  const cardWidth = (width - 16 * (numColumns + 1)) / numColumns;

  const renderItem = ({ item, index }: { item: BookListItem; index: number }) => (
    <View
      style={{
        width: cardWidth,
        marginLeft: 16,
        marginBottom: 16,
      }}
    >
      <BookCard
        book={item}
        onFavoritePress={onFavoritePress}
        isFavorite={favoriteIds.has(item.id)}
      />
    </View>
  );

  const renderFooter = () => {
    if (!hasMore || !isLoading) return null;

    return (
      <View style={{ padding: 16, alignItems: "center" }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <EmptyState
        icon={<BookOpen size={48} color={colors.muted} />}
        title={emptyMessage}
        description="Try adjusting your search or filters"
      />
    );
  };

  return (
    <FlatList
      data={books}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      contentContainerStyle={{
        paddingTop: 16,
        paddingBottom: 100,
        flexGrow: books.length === 0 ? 1 : undefined,
      }}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      ListHeaderComponent={ListHeaderComponent}
      showsVerticalScrollIndicator={false}
    />
  );
}

export default BookList;
