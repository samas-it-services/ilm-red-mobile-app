// Pages Grid Screen - Thumbnail grid with generation progress

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/providers/ThemeProvider";
import {
  usePageManifest,
  usePageGenerationStatus,
  useTriggerPageGeneration,
} from "@/hooks/usePages";
import { useBook } from "@/hooks/useBooks";
import type { PageThumbnail } from "@/types/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const ITEM_SPACING = 12;
const ITEM_WIDTH = (SCREEN_WIDTH - 48 - ITEM_SPACING * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const ITEM_HEIGHT = ITEM_WIDTH * 1.4;

// ============================================================================
// Progress Bar Component
// ============================================================================

function GenerationProgress({
  progress,
  currentPage,
  totalPages,
  colors,
}: {
  progress: number;
  currentPage: number;
  totalPages: number;
  colors: any;
}) {
  return (
    <Animated.View
      entering={FadeIn}
      style={[styles.progressContainer, { backgroundColor: colors.card }]}
    >
      <View style={styles.progressHeader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.progressTitle, { color: colors.foreground }]}>
          Generating Pages...
        </Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.primary,
              width: `${progress}%`,
            },
          ]}
        />
      </View>
      <Text style={[styles.progressText, { color: colors.muted }]}>
        Page {currentPage} of {totalPages} ({Math.round(progress)}%)
      </Text>
    </Animated.View>
  );
}

// ============================================================================
// Thumbnail Item Component
// ============================================================================

function ThumbnailItem({
  item,
  index,
  colors,
  onPress,
}: {
  item: PageThumbnail;
  index: number;
  colors: any;
  onPress: () => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <Animated.View entering={FadeInDown.delay(index * 30).duration(300)}>
      <TouchableOpacity
        style={[styles.thumbnailContainer, { backgroundColor: colors.card }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {!hasError ? (
          <Image
            source={{ uri: item.thumbnail_url }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={200}
            onLoadStart={() => setIsLoading(true)}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        ) : (
          <View style={[styles.thumbnailError, { backgroundColor: colors.border }]}>
            <AlertCircle size={20} color={colors.muted} />
          </View>
        )}

        {isLoading && !hasError && (
          <View style={[styles.thumbnailLoading, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        <View style={[styles.pageNumber, { backgroundColor: colors.background + "CC" }]}>
          <Text style={[styles.pageNumberText, { color: colors.foreground }]}>
            {item.page_number}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

function EmptyState({
  status,
  colors,
  onGenerate,
  isGenerating,
}: {
  status: string;
  colors: any;
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  if (status === "pending" || status === "failed") {
    return (
      <View style={styles.emptyContainer}>
        <AlertCircle size={48} color={colors.muted} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          {status === "failed" ? "Generation Failed" : "No Pages Yet"}
        </Text>
        <Text style={[styles.emptyText, { color: colors.muted }]}>
          {status === "failed"
            ? "Something went wrong. Try generating again."
            : "Generate page images to browse this book"}
        </Text>
        <TouchableOpacity
          style={[styles.generateButton, { backgroundColor: colors.primary }]}
          onPress={onGenerate}
          disabled={isGenerating}
        >
          <RefreshCw size={20} color="#FFF" />
          <Text style={styles.generateButtonText}>
            {isGenerating ? "Generating..." : "Generate Pages"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

// ============================================================================
// Main Screen
// ============================================================================

export default function PagesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Queries
  const { data: book } = useBook(id!);
  const { data: manifest, isLoading, refetch, isRefetching } = usePageManifest(id!);
  const { data: generationStatus } = usePageGenerationStatus(
    id!,
    manifest?.generation_status === "processing"
  );
  const triggerGeneration = useTriggerPageGeneration();

  // Computed values
  const isGenerating =
    manifest?.generation_status === "processing" ||
    triggerGeneration.isPending;
  const showProgress = isGenerating && generationStatus;
  const hasPages = (manifest?.pages?.length ?? 0) > 0;

  // Handlers
  const handlePagePress = useCallback(
    (pageNumber: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/book/${id}/read/${pageNumber}`);
    },
    [id, router]
  );

  const handleGenerate = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    triggerGeneration.mutate(id!, {
      onError: (error: any) => {
        Alert.alert("Error", error.message || "Failed to generate pages. Please try again.");
      },
    });
  }, [id, triggerGeneration]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Render item
  const renderItem = useCallback(
    ({ item, index }: { item: PageThumbnail; index: number }) => (
      <ThumbnailItem
        item={item}
        index={index}
        colors={colors}
        onPress={() => handlePagePress(item.page_number)}
      />
    ),
    [colors, handlePagePress]
  );

  const keyExtractor = useCallback(
    (item: PageThumbnail) => `page-${item.page_number}`,
    []
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Pages",
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header Info */}
        {book && (
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.bookTitle, { color: colors.foreground }]} numberOfLines={1}>
              {book.title}
            </Text>
            <Text style={[styles.pageCount, { color: colors.muted }]}>
              {manifest?.total_pages ?? book.page_count ?? 0} pages
            </Text>
          </View>
        )}

        {/* Generation Progress */}
        {showProgress && (
          <GenerationProgress
            progress={generationStatus!.progress}
            currentPage={generationStatus!.current_page}
            totalPages={generationStatus!.total_pages}
            colors={colors}
          />
        )}

        {/* Loading State */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : hasPages ? (
          /* Pages Grid */
          <FlatList
            data={manifest?.pages}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            numColumns={NUM_COLUMNS}
            contentContainerStyle={{
              padding: 24,
              paddingBottom: insets.bottom + 24,
            }}
            columnWrapperStyle={{ gap: ITEM_SPACING }}
            ItemSeparatorComponent={() => <View style={{ height: ITEM_SPACING }} />}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
          />
        ) : (
          /* Empty State */
          <EmptyState
            status={manifest?.generation_status ?? "pending"}
            colors={colors}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        )}
      </View>
    </>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  pageCount: {
    fontSize: 14,
  },
  progressContainer: {
    margin: 24,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailContainer: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailError: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pageNumber: {
    position: "absolute",
    bottom: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pageNumberText: {
    fontSize: 10,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  generateButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
