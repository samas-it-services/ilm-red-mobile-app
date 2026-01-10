// Page Reader Screen - Full page view with navigation

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  MessageCircle,
  AlertCircle,
} from "lucide-react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import {
  GestureDetector,
  Gesture,
  type GestureStateChangeEvent,
  type PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/providers/ThemeProvider";
import {
  usePageManifest,
  usePageImage,
  usePrefetchPages,
  useRefreshExpiredUrl,
} from "@/hooks/usePages";
import { useBook } from "@/hooks/useBooks";
import { FEATURES } from "@/constants/config";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ============================================================================
// Navigation Controls Component
// ============================================================================

function NavigationControls({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  onGoToPages,
  onGoToChat,
  visible,
  colors,
  insets,
}: {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onGoToPages: () => void;
  onGoToChat: () => void;
  visible: boolean;
  colors: any;
  insets: any;
}) {
  if (!visible) return null;

  return (
    <>
      {/* Top Bar */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={[
          styles.topBar,
          { backgroundColor: colors.background + "E6", paddingTop: insets.top },
        ]}
      >
        <TouchableOpacity onPress={onGoToPages} style={styles.topButton}>
          <Grid3X3 size={24} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.pageIndicator}>
          <Text style={[styles.pageIndicatorText, { color: colors.foreground }]}>
            {currentPage} / {totalPages}
          </Text>
        </View>

        {FEATURES.ENABLE_AI_CHAT && (
          <TouchableOpacity onPress={onGoToChat} style={styles.topButton}>
            <MessageCircle size={24} color={colors.foreground} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Bottom Navigation */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={[
          styles.bottomBar,
          { backgroundColor: colors.background + "E6", paddingBottom: insets.bottom + 12 },
        ]}
      >
        <TouchableOpacity
          onPress={onPrev}
          disabled={currentPage <= 1}
          style={[
            styles.navButton,
            { backgroundColor: colors.card, opacity: currentPage <= 1 ? 0.5 : 1 },
          ]}
        >
          <ChevronLeft size={24} color={colors.foreground} />
          <Text style={[styles.navButtonText, { color: colors.foreground }]}>Prev</Text>
        </TouchableOpacity>

        {/* Page Scrubber */}
        <View style={styles.scrubberContainer}>
          <View style={[styles.scrubberTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.scrubberFill,
                {
                  backgroundColor: colors.primary,
                  width: `${(currentPage / totalPages) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={onNext}
          disabled={currentPage >= totalPages}
          style={[
            styles.navButton,
            { backgroundColor: colors.card, opacity: currentPage >= totalPages ? 0.5 : 1 },
          ]}
        >
          <Text style={[styles.navButtonText, { color: colors.foreground }]}>Next</Text>
          <ChevronRight size={24} color={colors.foreground} />
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

export default function PageReaderScreen() {
  const { id, page } = useLocalSearchParams<{ id: string; page: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const pageNumber = parseInt(page || "1", 10);

  // State
  const [showControls, setShowControls] = useState(true);
  const [imageError, setImageError] = useState(false);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Queries
  const { data: manifest } = usePageManifest(id!);
  const { data: pageData, isLoading, isError, refetch } = usePageImage(id!, pageNumber);
  const refreshExpiredUrl = useRefreshExpiredUrl();

  // Prefetch adjacent pages
  usePrefetchPages(id!, pageNumber);

  const totalPages = manifest?.total_pages ?? 0;

  // Auto-hide controls
  useEffect(() => {
    if (showControls) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, [showControls]);

  // Handlers
  const toggleControls = useCallback(() => {
    Haptics.selectionAsync();
    setShowControls((prev) => !prev);
  }, []);

  const goToPage = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > totalPages) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setImageError(false);
      router.setParams({ page: newPage.toString() });
    },
    [totalPages, router]
  );

  const handlePrev = useCallback(() => {
    goToPage(pageNumber - 1);
  }, [pageNumber, goToPage]);

  const handleNext = useCallback(() => {
    goToPage(pageNumber + 1);
  }, [pageNumber, goToPage]);

  const handleGoToPages = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/book/${id}/pages`);
  }, [id, router]);

  const handleGoToChat = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/book/${id}/chat`);
  }, [id, router]);

  const handleImageError = useCallback(async () => {
    setImageError(true);
    // Try to refresh expired URL
    try {
      await refreshExpiredUrl(id!, pageNumber);
      setImageError(false);
    } catch (error) {
      console.error("Failed to refresh URL:", error);
    }
  }, [id, pageNumber, refreshExpiredUrl]);

  // Gestures
  const tapGesture = Gesture.Tap().onEnd(() => {
    toggleControls();
  });

  const swipeGesture = Gesture.Pan()
    .onEnd((event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
      if (event.velocityX > 500) {
        // Swipe right - go to previous page
        handlePrev();
      } else if (event.velocityX < -500) {
        // Swipe left - go to next page
        handleNext();
      }
    })
    .runOnJS(true);

  const composedGesture = Gesture.Race(tapGesture, swipeGesture);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar hidden={!showControls} />

      <View style={[styles.container, { backgroundColor: isDark ? "#000" : colors.background }]}>
        <GestureDetector gesture={composedGesture}>
          <Pressable style={styles.imageContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.muted }]}>
                  Loading page {pageNumber}...
                </Text>
              </View>
            ) : isError || imageError ? (
              <View style={styles.errorContainer}>
                <AlertCircle size={48} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.foreground }]}>
                  Failed to load page
                </Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setImageError(false);
                    refetch();
                  }}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : pageData ? (
              <Image
                source={{ uri: pageData.medium_url }}
                style={styles.pageImage}
                contentFit="contain"
                transition={200}
                onError={handleImageError}
              />
            ) : null}
          </Pressable>
        </GestureDetector>

        <NavigationControls
          currentPage={pageNumber}
          totalPages={totalPages}
          onPrev={handlePrev}
          onNext={handleNext}
          onGoToPages={handleGoToPages}
          onGoToChat={handleGoToChat}
          visible={showControls}
          colors={colors}
          insets={insets}
        />

        {/* Edge Tap Zones */}
        {!showControls && (
          <>
            <TouchableOpacity
              style={styles.leftTapZone}
              onPress={handlePrev}
              activeOpacity={1}
            />
            <TouchableOpacity
              style={styles.rightTapZone}
              onPress={handleNext}
              activeOpacity={1}
            />
          </>
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
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pageImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "500",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  topButton: {
    padding: 8,
  },
  pageIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pageIndicatorText: {
    fontSize: 16,
    fontWeight: "600",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  scrubberContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  scrubberTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  scrubberFill: {
    height: "100%",
    borderRadius: 2,
  },
  leftTapZone: {
    position: "absolute",
    left: 0,
    top: "20%",
    bottom: "20%",
    width: "25%",
  },
  rightTapZone: {
    position: "absolute",
    right: 0,
    top: "20%",
    bottom: "20%",
    width: "25%",
  },
});
