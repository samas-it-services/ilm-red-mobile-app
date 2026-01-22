// Book Detail Screen

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Heart,
  Download,
  Trash2,
  FileText,
  User,
  Calendar,
  Eye,
  Star,
  Grid3X3,
  MessageCircle,
  BookOpen,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";
import {
  useBook,
  useBookDownloadUrl,
  useDeleteBook,
  useAddFavorite,
  useRemoveFavorite,
  useFavorites,
  useMyBookRating,
} from "@/hooks/useBooks";
import { getCategoryById } from "@/hooks/useCategories";
import { LoadingScreen, LoadingOverlay } from "@/components/ui/Loading";
import { Button } from "@/components/ui/Button";
import { formatFileSize } from "@/hooks/useUpload";
import { RatingModal } from "@/components/RatingModal";

// ============================================================================
// Screen
// ============================================================================

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Queries
  const { data: book, isLoading, error } = useBook(id!);
  const { data: favoritesData } = useFavorites();
  const { data: myRating } = useMyBookRating(id!);
  const { refetch: fetchDownloadUrl, isFetching: isLoadingDownload } =
    useBookDownloadUrl(id!);
  const deleteBook = useDeleteBook();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const isFavorite = favoritesData?.data?.some((b) => b.id === id) ?? false;
  const isOwner = book?.owner?.id === user?.id;
  const category = book ? getCategoryById(book.category) : null;

  // Handlers
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleFavoriteToggle = useCallback(() => {
    if (isFavorite) {
      removeFavorite.mutate(id!);
    } else {
      addFavorite.mutate(id!);
    }
  }, [isFavorite, id, addFavorite, removeFavorite]);

  const handleDownload = useCallback(async () => {
    try {
      const result = await fetchDownloadUrl();
      if (result.data?.url) {
        const supported = await Linking.canOpenURL(result.data.url);
        if (supported) {
          await Linking.openURL(result.data.url);
        } else {
          Alert.alert("Error", "Cannot open download link on this device");
        }
      } else {
        Alert.alert("Error", "No download URL available. The file may not exist.");
      }
    } catch (err: any) {
      const message = err?.message || "Unknown error occurred";
      Alert.alert("Download Failed", `Could not download file: ${message}`);
    }
  }, [fetchDownloadUrl]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Delete Book",
      "Are you sure you want to delete this book? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBook.mutateAsync(id!);
              router.back();
            } catch (err) {
              Alert.alert("Error", "Failed to delete book");
            }
          },
        },
      ]
    );
  }, [id, deleteBook, router]);

  const handleBrowsePages = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/book/${id}/pages`);
  }, [id, router]);

  const handleChatWithAI = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/book/${id}/chat`);
  }, [id, router]);

  const handleRateBook = useCallback(() => {
    if (isOwner) {
      Alert.alert("Cannot Rate", "You cannot rate your own book.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowRatingModal(true);
  }, [isOwner]);

  const handleReadBook = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (book?.file_type === 'pdf') {
      // Always go to pages view for PDFs (pages will auto-generate if needed)
      router.push(`/book/${id}/pages`);
    } else {
      // For non-PDF files, prompt to download
      Alert.alert(
        "Download Required",
        `${book?.file_type?.toUpperCase()} files must be downloaded to read. Would you like to download?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Download", onPress: handleDownload }
        ]
      );
    }
  }, [id, router, book?.file_type, handleDownload]);

  if (isLoading) {
    return <LoadingScreen message="Loading book details..." />;
  }

  if (error || !book) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text style={{ color: colors.foreground, fontSize: 18, marginBottom: 16 }}>
          Book not found
        </Text>
        <Button onPress={handleBack}>Go Back</Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LoadingOverlay visible={deleteBook.isPending} message="Deleting book..." />

      {/* Header */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          paddingTop: insets.top,
          paddingHorizontal: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          height: insets.top + 56,
        }}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleFavoriteToggle}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Heart
            size={24}
            color={isFavorite ? colors.destructive : colors.foreground}
            fill={isFavorite ? colors.destructive : "transparent"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Image */}
        <View
          style={{
            height: 300,
            backgroundColor: category?.bgColor || colors.secondary,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {book.cover_url ? (
            <Image
              source={{ uri: book.cover_url }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <FileText size={80} color={category?.color || colors.muted} />
          )}
        </View>

        {/* Content */}
        <View style={{ padding: 16 }}>
          {/* Category Badge */}
          {category && (
            <View
              style={{
                backgroundColor: category.bgColor,
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 16,
                alignSelf: "flex-start",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: category.color,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {category.label}
              </Text>
            </View>
          )}

          {/* Title */}
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: colors.foreground,
              marginBottom: 8,
            }}
          >
            {book.title}
          </Text>

          {/* Author */}
          {book.author && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <User size={16} color={colors.muted} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 16, color: colors.muted }}>
                {book.author}
              </Text>
            </View>
          )}

          {/* Stats Row */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              marginBottom: 24,
              gap: 16,
            }}
          >
            <StatItem
              icon={<Eye size={16} color={colors.muted} />}
              label={`${book.stats?.views ?? 0} views`}
              colors={colors}
            />
            <StatItem
              icon={<Download size={16} color={colors.muted} />}
              label={`${book.stats?.downloads ?? 0} downloads`}
              colors={colors}
            />
            {book.stats?.rating_avg != null && (
              <StatItem
                icon={<Star size={16} color="#F59E0B" />}
                label={`${book.stats.rating_avg.toFixed(1)} (${book.stats?.rating_count ?? 0})`}
                colors={colors}
              />
            )}
            <StatItem
              icon={<FileText size={16} color={colors.muted} />}
              label={`${book.file_type?.toUpperCase() ?? "FILE"} - ${formatFileSize(book.file_size ?? 0)}`}
              colors={colors}
            />
          </View>

          {/* Description */}
          {book.description && (
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: colors.foreground,
                  marginBottom: 8,
                }}
              >
                About this book
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.muted,
                  lineHeight: 22,
                }}
              >
                {book.description}
              </Text>
            </View>
          )}

          {/* Owner Info */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 12,
              backgroundColor: colors.card,
              borderRadius: 12,
              marginBottom: 24,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primary,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                {(book.owner?.display_name ?? "U").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                {book.owner?.display_name ?? "Unknown"}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                @{book.owner?.username ?? "unknown"}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 12 }}>
            {/* Primary Actions Row */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={handleReadBook}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.card,
                  paddingVertical: 14,
                  borderRadius: 12,
                  gap: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                {book?.file_type === 'pdf' ? (
                  <Grid3X3 size={20} color={colors.primary} />
                ) : (
                  <Download size={20} color={colors.primary} />
                )}
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
                  {book?.file_type === 'pdf' ? "Browse Pages" : "Download to Read"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleChatWithAI}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  borderRadius: 12,
                  gap: 8,
                }}
              >
                <MessageCircle size={20} color="#FFFFFF" />
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>
                  Chat with AI
                </Text>
              </TouchableOpacity>
            </View>

            {/* Rate & Download Row */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              {!isOwner && (
                <TouchableOpacity
                  onPress={handleRateBook}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: myRating ? "#FEF3C7" : colors.card,
                    paddingVertical: 14,
                    borderRadius: 12,
                    gap: 8,
                    borderWidth: 1,
                    borderColor: myRating ? "#F59E0B" : colors.border,
                  }}
                >
                  <Star
                    size={20}
                    color="#F59E0B"
                    fill={myRating ? "#F59E0B" : "transparent"}
                  />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: myRating ? "#B45309" : colors.foreground,
                    }}
                  >
                    {myRating ? `Rated ${myRating.rating}/5` : "Rate Book"}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleDownload}
                disabled={isLoadingDownload}
                style={{
                  flex: isOwner ? undefined : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.card,
                  paddingVertical: 14,
                  paddingHorizontal: isOwner ? 24 : 0,
                  borderRadius: 12,
                  gap: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: isLoadingDownload ? 0.7 : 1,
                }}
              >
                <Download size={20} color={colors.primary} />
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
                  Download
                </Text>
              </TouchableOpacity>
            </View>

            {isOwner && (
              <Button
                variant="destructive"
                onPress={handleDelete}
                leftIcon={<Trash2 size={20} color="#FFFFFF" />}
              >
                Delete Book
              </Button>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Rating Modal */}
      <RatingModal
        visible={showRatingModal}
        bookId={id!}
        bookTitle={book?.title || ""}
        existingRating={myRating?.rating}
        existingReview={myRating?.review || ""}
        onClose={() => setShowRatingModal(false)}
      />
    </View>
  );
}

// ============================================================================
// Stat Item Component
// ============================================================================

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  colors: any;
}

function StatItem({ icon, label, colors }: StatItemProps) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {icon}
      <Text style={{ fontSize: 13, color: colors.muted, marginLeft: 4 }}>
        {label}
      </Text>
    </View>
  );
}
