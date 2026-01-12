// Flag Rating Modal - Report inappropriate reviews

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { X, Flag, AlertCircle, MessageSquareWarning, Ban, HelpCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/providers/ThemeProvider";
import { useFlagRating } from "@/hooks/useRatingFlags";

interface FlagRatingModalProps {
  visible: boolean;
  bookId: string;
  ratingId: string;
  onClose: () => void;
}

type FlagReason = "spam" | "offensive" | "irrelevant" | "other";

interface ReasonOption {
  value: FlagReason;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export function FlagRatingModal({
  visible,
  bookId,
  ratingId,
  onClose,
}: FlagRatingModalProps) {
  const { colors } = useTheme();
  const [selectedReason, setSelectedReason] = useState<FlagReason | null>(null);
  const [details, setDetails] = useState("");

  const flagRating = useFlagRating();

  const reasons: ReasonOption[] = [
    {
      value: "spam",
      label: "Spam",
      icon: <Ban size={24} color={colors.destructive} />,
      description: "Repetitive or promotional content",
    },
    {
      value: "offensive",
      label: "Offensive",
      icon: <AlertCircle size={24} color={colors.destructive} />,
      description: "Hateful, abusive, or inappropriate language",
    },
    {
      value: "irrelevant",
      label: "Irrelevant",
      icon: <MessageSquareWarning size={24} color={colors.destructive} />,
      description: "Not related to the book",
    },
    {
      value: "other",
      label: "Other",
      icon: <HelpCircle size={24} color={colors.destructive} />,
      description: "Other issue",
    },
  ];

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert("Error", "Please select a reason");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await flagRating.mutateAsync({
        bookId,
        ratingId,
        reason: selectedReason,
        details: details.trim() || undefined,
      });

      Alert.alert(
        "Report Submitted",
        "Thank you for helping keep our community safe. We'll review this report."
      );
      handleClose();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.detail || error?.message || "Failed to submit report"
      );
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDetails("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Flag size={24} color={colors.destructive} />
            <Text style={[styles.title, { color: colors.foreground }]}>
              Report Review
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Reason Selection */}
            <Text style={[styles.label, { color: colors.foreground }]}>
              Why are you reporting this review?
            </Text>

            <View style={styles.reasonsContainer}>
              {reasons.map((reason) => (
                <TouchableOpacity
                  key={reason.value}
                  style={[
                    styles.reasonButton,
                    {
                      backgroundColor:
                        selectedReason === reason.value
                          ? `${colors.destructive}20`
                          : colors.background,
                      borderColor:
                        selectedReason === reason.value
                          ? colors.destructive
                          : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedReason(reason.value);
                  }}
                >
                  <View style={styles.reasonIcon}>{reason.icon}</View>
                  <View style={styles.reasonText}>
                    <Text style={[styles.reasonLabel, { color: colors.foreground }]}>
                      {reason.label}
                    </Text>
                    <Text style={[styles.reasonDescription, { color: colors.muted }]}>
                      {reason.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Optional Details */}
            <Text style={[styles.label, { color: colors.foreground }]}>
              Additional details (optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="Provide more context about this issue..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              value={details}
              onChangeText={setDetails}
              maxLength={500}
            />
            <Text style={[styles.charCount, { color: colors.muted }]}>
              {details.length}/500
            </Text>
          </ScrollView>

          {/* Actions */}
          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.background }]}
              onPress={handleClose}
            >
              <Text style={[styles.cancelText, { color: colors.muted }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: selectedReason ? colors.destructive : colors.muted,
                },
              ]}
              onPress={handleSubmit}
              disabled={!selectedReason || flagRating.isPending}
            >
              {flagRating.isPending ? (
                <Text style={styles.submitText}>Submitting...</Text>
              ) : (
                <Text style={styles.submitText}>Submit Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 8,
  },
  reasonsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  reasonButton: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
    alignItems: "center",
  },
  reasonIcon: {
    width: 40,
    alignItems: "center",
  },
  reasonText: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  reasonDescription: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    textAlignVertical: "top",
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
