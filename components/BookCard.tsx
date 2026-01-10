// Book Card component

import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Heart, FileText, User } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { getCategoryById } from "@/constants/categories";
import type { BookListItem } from "@/types/api";
import { formatFileSize } from "@/hooks/useUpload";

// ============================================================================
// Types
// ============================================================================

interface BookCardProps {
  book: BookListItem;
  onFavoritePress?: (bookId: string) => void;
  isFavorite?: boolean;
  showFavorite?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function BookCard({
  book,
  onFavoritePress,
  isFavorite = false,
  showFavorite = true,
}: BookCardProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const category = getCategoryById(book.category);

  const handlePress = () => {
    router.push(`/book/${book.id}`);
  };

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    onFavoritePress?.(book.id);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {/* Cover Image */}
      <View
        style={{
          height: 160,
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
          <FileText size={48} color={category?.color || colors.muted} />
        )}

        {/* Favorite Button */}
        {showFavorite && (
          <TouchableOpacity
            onPress={handleFavoritePress}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              backgroundColor: colors.background,
              borderRadius: 20,
              padding: 6,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Heart
              size={18}
              color={isFavorite ? colors.destructive : colors.muted}
              fill={isFavorite ? colors.destructive : "transparent"}
            />
          </TouchableOpacity>
        )}

        {/* File Type Badge */}
        <View
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            backgroundColor: colors.background,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
          }}
        >
          <Text
            style={{
              color: colors.foreground,
              fontSize: 10,
              fontWeight: "600",
              textTransform: "uppercase",
            }}
          >
            {book.file_type}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={{ padding: 12 }}>
        {/* Category Badge */}
        {category && (
          <View
            style={{
              backgroundColor: category.bgColor,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 4,
              alignSelf: "flex-start",
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                color: category.color,
                fontSize: 10,
                fontWeight: "600",
              }}
            >
              {category.label}
            </Text>
          </View>
        )}

        {/* Title */}
        <Text
          numberOfLines={2}
          style={{
            color: colors.foreground,
            fontSize: 14,
            fontWeight: "600",
            marginBottom: 4,
            lineHeight: 20,
          }}
        >
          {book.title}
        </Text>

        {/* Author */}
        {book.author && (
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <User size={12} color={colors.muted} style={{ marginRight: 4 }} />
            <Text
              numberOfLines={1}
              style={{
                color: colors.muted,
                fontSize: 12,
              }}
            >
              {book.author}
            </Text>
          </View>
        )}

        {/* Stats */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 11 }}>
            {formatFileSize(book.file_size)}
          </Text>

          {book.stats.rating_avg !== null && (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ color: "#F59E0B", fontSize: 11, marginRight: 2 }}>
                ★
              </Text>
              <Text style={{ color: colors.muted, fontSize: 11 }}>
                {book.stats.rating_avg.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default BookCard;
