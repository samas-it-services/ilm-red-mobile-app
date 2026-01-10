// Admin Chat Detail Screen

import React, { useCallback } from "react";
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
  MessageSquare,
  User,
  BookOpen,
  Calendar,
  Trash2,
  Bot,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/providers/ThemeProvider";
import { useAdminChat, useDeleteChat } from "@/hooks/useAdmin";

export default function AdminChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const { data: chat, isLoading } = useAdminChat(id!);
  const deleteChat = useDeleteChat();

  const handleDeleteChat = useCallback(() => {
    if (!chat) return;

    Alert.alert(
      "Delete Chat Session",
      `Are you sure you want to delete this chat session? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteChat.mutateAsync(id!);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch (error) {
              Alert.alert("Error", "Failed to delete chat session");
            }
          },
        },
      ]
    );
  }, [chat, id, deleteChat, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
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

  if (!chat) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.errorText, { color: colors.foreground }]}>
          Chat session not found
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

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Chat Session",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
              <ArrowLeft size={24} color={colors.foreground} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleDeleteChat}
              style={{ padding: 8 }}
            >
              <Trash2 size={22} color="#EF4444" />
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
        {/* Chat Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <BookOpen size={18} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                Book
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {chat.book_title}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <User size={18} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                User
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {chat.user_display_name}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MessageSquare size={18} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                Messages
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {chat.message_count} message{chat.message_count !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Calendar size={18} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                Started
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {formatDate(chat.created_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Conversation
        </Text>

        {chat.messages && chat.messages.length > 0 ? (
          chat.messages.map((message, index) => (
            <View
              key={message.id || index}
              style={[
                styles.messageContainer,
                message.role === "user"
                  ? styles.userMessageContainer
                  : styles.assistantMessageContainer,
              ]}
            >
              <View
                style={[
                  styles.messageHeader,
                  { alignItems: message.role === "user" ? "flex-end" : "flex-start" },
                ]}
              >
                <View
                  style={[
                    styles.roleIcon,
                    {
                      backgroundColor:
                        message.role === "user"
                          ? colors.primary + "20"
                          : "#10B98120",
                    },
                  ]}
                >
                  {message.role === "user" ? (
                    <User size={14} color={colors.primary} />
                  ) : (
                    <Bot size={14} color="#10B981" />
                  )}
                </View>
                <Text style={[styles.roleText, { color: colors.muted }]}>
                  {message.role === "user" ? "User" : "AI Assistant"}
                </Text>
              </View>
              <View
                style={[
                  styles.messageBubble,
                  {
                    backgroundColor:
                      message.role === "user" ? colors.primary : colors.card,
                    alignSelf:
                      message.role === "user" ? "flex-end" : "flex-start",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    {
                      color:
                        message.role === "user" ? "#FFFFFF" : colors.foreground,
                    },
                  ]}
                >
                  {message.content}
                </Text>
              </View>
              <Text
                style={[
                  styles.messageTime,
                  {
                    color: colors.muted,
                    textAlign: message.role === "user" ? "right" : "left",
                  },
                ]}
              >
                {formatDate(message.created_at)}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyMessages}>
            <MessageSquare size={40} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No messages in this session
            </Text>
          </View>
        )}

        {/* Delete Button */}
        <TouchableOpacity
          onPress={handleDeleteChat}
          disabled={deleteChat.isPending}
          style={[
            styles.deleteButton,
            { opacity: deleteChat.isPending ? 0.7 : 1 },
          ]}
        >
          {deleteChat.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Trash2 size={18} color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>Delete Chat Session</Text>
            </>
          )}
        </TouchableOpacity>
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
  infoCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
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
    fontSize: 15,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: "flex-end",
  },
  assistantMessageContainer: {
    alignItems: "flex-start",
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  roleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  roleText: {
    fontSize: 12,
    fontWeight: "500",
  },
  messageBubble: {
    maxWidth: "85%",
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  emptyMessages: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    marginTop: 24,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
