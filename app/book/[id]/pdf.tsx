// PDF Viewer Screen - Opens PDF in WebView or external browser

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { WebView } from "react-native-webview";
import { ArrowLeft, ExternalLink, Download, ZoomIn, ZoomOut, RotateCcw } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/providers/ThemeProvider";
import { useBook, useBookDownloadUrl } from "@/hooks/useBooks";
import { LoadingScreen } from "@/components/ui/Loading";

export default function PDFViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const { data: book, isLoading: isLoadingBook } = useBook(id!);
  const { refetch: fetchDownloadUrl, isFetching: isFetchingUrl } = useBookDownloadUrl(id!);

  // Fetch PDF URL on mount
  useEffect(() => {
    const loadPdfUrl = async () => {
      try {
        const result = await fetchDownloadUrl();
        if (result.data?.url) {
          setPdfUrl(result.data.url);
        } else {
          setLoadError("Could not load PDF URL");
        }
      } catch (error) {
        setLoadError("Failed to load PDF");
      }
    };

    loadPdfUrl();
  }, [fetchDownloadUrl]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/book/${id}`);
    }
  }, [router, id]);

  const handleOpenExternal = useCallback(async () => {
    if (pdfUrl) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        await Linking.openURL(pdfUrl);
      } catch (error) {
        Alert.alert("Error", "Could not open PDF in external browser");
      }
    }
  }, [pdfUrl]);

  const handleDownload = useCallback(async () => {
    if (pdfUrl) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        await Linking.openURL(pdfUrl);
      } catch (error) {
        Alert.alert("Error", "Could not download PDF");
      }
    }
  }, [pdfUrl]);

  const handleZoomIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setZoom((prev) => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setZoom(1);
  }, []);

  if (isLoadingBook) {
    return <LoadingScreen message="Loading book..." />;
  }

  if (!book) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.errorTitle, { color: colors.foreground }]}>
          Book not found
        </Text>
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.errorButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Google Docs Viewer URL for PDFs
  const googleDocsUrl = pdfUrl
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`
    : null;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top,
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <Text
              style={[styles.titleText, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {book.title}
            </Text>
            <Text style={[styles.subtitleText, { color: colors.muted }]}>
              PDF Viewer
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleOpenExternal}
              style={styles.headerButton}
              disabled={!pdfUrl}
            >
              <ExternalLink
                size={22}
                color={pdfUrl ? colors.foreground : colors.muted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* PDF Viewer */}
        {loadError ? (
          <View style={styles.errorContent}>
            <Text style={[styles.errorTitle, { color: colors.foreground }]}>
              {loadError}
            </Text>
            <Text style={[styles.errorMessage, { color: colors.muted }]}>
              Unable to display PDF in-app. You can open it in your browser instead.
            </Text>
            <TouchableOpacity
              onPress={handleOpenExternal}
              style={[styles.openButton, { backgroundColor: colors.primary }]}
            >
              <ExternalLink size={18} color="#FFFFFF" />
              <Text style={styles.openButtonText}>Open in Browser</Text>
            </TouchableOpacity>
          </View>
        ) : !pdfUrl || isFetchingUrl ? (
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>
              Loading PDF...
            </Text>
          </View>
        ) : (
          <WebView
            source={{ uri: googleDocsUrl! }}
            style={styles.webview}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onError={() => {
              setLoadError("Failed to load PDF viewer");
              setIsLoading(false);
            }}
            javaScriptEnabled
            domStorageEnabled
            scalesPageToFit
            startInLoadingState
            renderLoading={() => (
              <View style={[styles.webviewLoading, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.muted }]}>
                  Loading PDF...
                </Text>
              </View>
            )}
          />
        )}

        {/* Zoom Controls */}
        {pdfUrl && !loadError && (
          <View
            style={[
              styles.zoomControls,
              {
                bottom: insets.bottom + 20,
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleZoomOut}
              style={styles.zoomButton}
              disabled={zoom <= 0.5}
            >
              <ZoomOut
                size={20}
                color={zoom <= 0.5 ? colors.muted : colors.foreground}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleResetZoom} style={styles.zoomButton}>
              <Text style={[styles.zoomText, { color: colors.foreground }]}>
                {Math.round(zoom * 100)}%
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleZoomIn}
              style={styles.zoomButton}
              disabled={zoom >= 3}
            >
              <ZoomIn
                size={20}
                color={zoom >= 3 ? colors.muted : colors.foreground}
              />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity onPress={handleDownload} style={styles.zoomButton}>
              <Download size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "600",
  },
  subtitleText: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  openButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  openButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  zoomControls: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  zoomButton: {
    width: 44,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  zoomText: {
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: 4,
  },
});
