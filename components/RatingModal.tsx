// Rating Modal Component - Interactive 5-star rating with optional review

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { X, Star } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/providers/ThemeProvider";
import { useAddRating, useDeleteRating } from "@/hooks/useBooks";

interface RatingModalProps {
  visible: boolean;
  bookId: string;
  bookTitle: string;
  existingRating?: number;
  existingReview?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RatingModal({
  visible,
  bookId,
  bookTitle,
  existingRating = 0,
  existingReview = "",
  onClose,
  onSuccess,
}: RatingModalProps) {
  const { colors } = useTheme();
  const [rating, setRating] = useState(existingRating);
  const [review, setReview] = useState(existingReview);
  const [hoveredStar, setHoveredStar] = useState(0);

  const addRating = useAddRating(bookId);
  const deleteRating = useDeleteRating(bookId);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setRating(existingRating);
      setReview(existingReview);
    }
  }, [visible, existingRating, existingReview]);

  const handleStarPress = (value: number) => {
    setRating(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    try {
      await addRating.mutateAsync({
        rating,
        review: review.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess?.();
      onClose();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRating.mutateAsync();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess?.();
      onClose();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const isLoading = addRating.isPending || deleteRating.isPending;
  const hasExistingRating = existingRating > 0;

  const renderStar = (index: number) => {
    const value = index + 1;
    const isActive = value <= (hoveredStar || rating);

    return (
      <TouchableOpacity
        key={index}
        onPress={() => handleStarPress(value)}
        onPressIn={() => setHoveredStar(value)}
        onPressOut={() => setHoveredStar(0)}
        style={styles.starButton}
        disabled={isLoading}
      >
        <Star
          size={40}
          color={isActive ? "#FFD700" : colors.muted}
          fill={isActive ? "#FFD700" : "transparent"}
        />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {hasExistingRating ? "Update Your Rating" : "Rate This Book"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Book Title */}
          <Text
            style={[styles.bookTitle, { color: colors.muted }]}
            numberOfLines={2}
          >
            {bookTitle}
          </Text>

          {/* Star Rating */}
          <View style={styles.starsContainer}>
            {[0, 1, 2, 3, 4].map(renderStar)}
          </View>

          {/* Rating Label */}
          <Text style={[styles.ratingLabel, { color: colors.foreground }]}>
            {rating === 0
              ? "Tap to rate"
              : rating === 1
              ? "Poor"
              : rating === 2
              ? "Fair"
              : rating === 3
              ? "Good"
              : rating === 4
              ? "Very Good"
              : "Excellent"}
          </Text>

          {/* Review Input */}
          <View style={styles.reviewContainer}>
            <Text style={[styles.reviewLabel, { color: colors.foreground }]}>
              Review (optional)
            </Text>
            <TextInput
              style={[
                styles.reviewInput,
                {
                  backgroundColor: colors.background,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Share your thoughts about this book..."
              placeholderTextColor={colors.muted}
              value={review}
              onChangeText={setReview}
              multiline
              numberOfLines={4}
              maxLength={500}
              editable={!isLoading}
            />
            <Text style={[styles.charCount, { color: colors.muted }]}>
              {review.length}/500
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {hasExistingRating && (
              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  { borderColor: colors.destructive },
                ]}
                onPress={handleDelete}
                disabled={isLoading}
              >
                {deleteRating.isPending ? (
                  <ActivityIndicator color={colors.destructive} size="small" />
                ) : (
                  <Text
                    style={[styles.deleteButtonText, { color: colors.destructive }]}
                  >
                    Remove Rating
                  </Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: rating > 0 ? colors.primary : colors.muted,
                  flex: hasExistingRating ? 1 : undefined,
                },
              ]}
              onPress={handleSubmit}
              disabled={rating === 0 || isLoading}
            >
              {addRating.isPending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {hasExistingRating ? "Update Rating" : "Submit Rating"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  bookTitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 24,
  },
  reviewContainer: {
    marginBottom: 24,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  charCount: {
    textAlign: "right",
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 150,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default RatingModal;
