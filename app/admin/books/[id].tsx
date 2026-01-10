// Admin Book Detail Screen

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  Image as ImageIcon,
  Brain,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Star,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/providers/ThemeProvider";
import { useBook } from "@/hooks/useBooks";
import {
  useTriggerPageGeneration,
  useTriggerThumbnailGeneration,
  useTriggerAIProcessing,
} from "@/hooks/useAdmin";
import { getCategoryById } from "@/hooks/useCategories";
import { formatFileSize } from "@/hooks/useUpload";

export default function AdminBookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const { data: book, isLoading, refetch } = useBook(id!);
  const triggerPages = useTriggerPageGeneration();
  const triggerThumbnails = useTriggerThumbnailGeneration();
  const triggerAI = useTriggerAIProcessing();

  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const handleGeneratePages = useCallback(async () => {
    Alert.alert(
      "Generate Pages",
      "This will extract all pages from the PDF and create images. This process may take several minutes.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: async () => {
            setProcessingAction("pages");
            try {
              await triggerPages.mutateAsync(id!);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Success", "Page generation has been queued. Check back later for results.");
              refetch();
            } catch (error) {
              Alert.alert("Error", "Failed to trigger page generation");
            } finally {
              setProcessingAction(null);
            }
          },
        },
      ]
    );
  }, [id, triggerPages, refetch]);

  const handleRegenerateThumbnails = useCallback(async () => {
    Alert.alert(
      "Regenerate Thumbnails",
      "This will recreate all thumbnails for the book pages.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: async () => {
            setProcessingAction("thumbnails");
            try {
              await triggerThumbnails.mutateAsync(id!);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Success", "Thumbnail generation has been queued.");
              refetch();
            } catch (error) {
              Alert.alert("Error", "Failed to trigger thumbnail generation");
            } finally {
              setProcessingAction(null);
            }
          },
        },
      ]
    );
  }, [id, triggerThumbnails, refetch]);

  const handleProcessAI = useCallback(async () => {
    Alert.alert(
      "Process AI",
      "This will generate embeddings and text chunks for AI chat functionality. This process may take several minutes.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: async () => {
            setProcessingAction("ai");
            try {
              await triggerAI.mutateAsync(id!);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Success", "AI processing has been queued. Check back later for results.");
              refetch();
            } catch (error) {
              Alert.alert("Error", "Failed to trigger AI processing");
            } finally {
              setProcessingAction(null);
            }
          },
        },
      ]
    );
  }, [id, triggerAI, refetch]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  if (!book) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.errorText, { color: colors.foreground }]}>
          Book not found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const category = getCategoryById(book.category);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Book Details",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
              <ArrowLeft size={24} color={colors.foreground} />
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.foreground },
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        {/* Book Header */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <View
            style={[
              styles.coverPlaceholder,
              { backgroundColor: category?.bgColor || colors.secondary },
            ]}
          >
            <FileText size={40} color={category?.color || colors.muted} />
          </View>
          <Text
            style={[styles.title, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {book.title}
          </Text>
          <Text style={[styles.author, { color: colors.muted }]}>
            {book.author || "Unknown Author"}
          </Text>

          {category && (
            <View
              style={[styles.categoryBadge, { backgroundColor: category.bgColor }]}
            >
              <Text style={[styles.categoryText, { color: category.color }]}>
                {category.label}
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Eye size={18} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {book.stats.views}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Views</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Download size={18} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {book.stats.downloads}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Downloads</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Star size={18} color="#F59E0B" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {book.stats.rating_avg?.toFixed(1) || "N/A"}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Rating</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <FileText size={18} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {book.page_count || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Pages</Text>
          </View>
        </View>

        {/* Book Info */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Book Information
          </Text>

          <View style={styles.infoRow}>
            <User size={18} color={colors.muted} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                Uploaded By
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {book.owner.display_name} (@{book.owner.username})
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <FileText size={18} color={colors.muted} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                File
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {book.file_type.toUpperCase()} - {formatFileSize(book.file_size)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Calendar size={18} color={colors.muted} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                Created
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {formatDate(book.created_at)}
              </Text>
            </View>
          </View>

          {book.description && (
            <View style={styles.descriptionContainer}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                Description
              </Text>
              <Text style={[styles.description, { color: colors.foreground }]}>
                {book.description}
              </Text>
            </View>
          )}
        </View>

        {/* Processing Actions */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Processing Actions
          </Text>
          <Text style={[styles.sectionDesc, { color: colors.muted }]}>
            Use these actions to process or reprocess the book content.
          </Text>

          <TouchableOpacity
            onPress={handleGeneratePages}
            disabled={!!processingAction}
            style={[
              styles.actionButton,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            {processingAction === "pages" ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <RefreshCw size={20} color={colors.primary} />
            )}
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>
                Generate Pages
              </Text>
              <Text style={[styles.actionDesc, { color: colors.muted }]}>
                Extract pages from PDF and create images
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRegenerateThumbnails}
            disabled={!!processingAction || !book.page_count}
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                opacity: book.page_count ? 1 : 0.5,
              },
            ]}
          >
            {processingAction === "thumbnails" ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <ImageIcon size={20} color={colors.primary} />
            )}
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>
                Regenerate Thumbnails
              </Text>
              <Text style={[styles.actionDesc, { color: colors.muted }]}>
                Recreate all page thumbnails
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleProcessAI}
            disabled={!!processingAction}
            style={[
              styles.actionButton,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            {processingAction === "ai" ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Brain size={20} color={colors.primary} />
            )}
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>
                Process AI
              </Text>
              <Text style={[styles.actionDesc, { color: colors.muted }]}>
                Generate embeddings and text chunks for AI chat
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  coverPlaceholder: {
    width: 100,
    height: 130,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
  },
  author: {
    fontSize: 14,
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: "23%",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
  },
  section: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
  },
  descriptionContainer: {
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 12,
  },
});
