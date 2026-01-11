// Favorites Screen

import React, { useCallback, useMemo } from "react";
import { View, Text, Alert } from "react-native";
import { Heart } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/providers/ThemeProvider";
import { useFavorites, useRemoveFavorite } from "@/hooks/useBooks";
import { BookList } from "@/components/BookList";
import { EmptyState } from "@/components/ui/Loading";
import { Button } from "@/components/ui/Button";
import { useRouter } from "expo-router";

// ============================================================================
// Screen
// ============================================================================

export default function FavoritesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { data, isLoading, isRefetching, refetch } = useFavorites();
  const removeFavorite = useRemoveFavorite();

  const books = useMemo(() => data?.data ?? [], [data]);
  const favoriteIds = useMemo(
    () => new Set(books.map((b) => b.id)),
    [books]
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleFavoritePress = useCallback(
    (bookId: string) => {
      removeFavorite.mutate(bookId, {
        onError: (error: any) => {
          Alert.alert("Error", error.message || "Failed to remove from favorites");
        },
      });
    },
    [removeFavorite]
  );

  const handleBrowsePress = () => {
    router.push("/(tabs)");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 16,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: colors.foreground,
            paddingTop: 12,
          }}
        >
          Favorites
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
          Your saved books
        </Text>
      </View>

      {/* Book List */}
      {books.length === 0 && !isLoading ? (
        <EmptyState
          icon={<Heart size={48} color={colors.muted} />}
          title="No favorites yet"
          description="Start adding books to your favorites to see them here"
          action={
            <Button variant="primary" onPress={handleBrowsePress}>
              Browse Library
            </Button>
          }
        />
      ) : (
        <BookList
          books={books}
          isLoading={isLoading}
          isRefreshing={isRefetching}
          onRefresh={handleRefresh}
          onFavoritePress={handleFavoritePress}
          favoriteIds={favoriteIds}
          emptyMessage="No favorites yet"
        />
      )}
    </View>
  );
}
