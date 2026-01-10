// Admin Chats List Screen

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, Href } from "expo-router";
import {
  MessageSquare,
  ChevronRight,
  User,
  BookOpen,
  Calendar,
  Trash2,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/providers/ThemeProvider";
import { useAdminChats, useDeleteChat, AdminChatSession } from "@/hooks/useAdmin";

export default function AdminChatsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useAdminChats({
    page,
    per_page: 20,
  });

  const deleteChat = useDeleteChat();

  const handleChatPress = useCallback(
    (chatId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/admin/chats/${chatId}` as Href);
    },
    [router]
  );

  const handleDeleteChat = useCallback(
    (chatId: string, bookTitle: string) => {
      Alert.alert(
        "Delete Chat Session",
        `Are you sure you want to delete the chat session for "${bookTitle}"? This action cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteChat.mutateAsync(chatId);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (error) {
                Alert.alert("Error", "Failed to delete chat session");
              }
            },
          },
        ]
      );
    },
    [deleteChat]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      return "Just now";
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderChat = useCallback(
    ({ item }: { item: AdminChatSession }) => (
      <TouchableOpacity
        onPress={() => handleChatPress(item.id)}
        style={[styles.chatCard, { backgroundColor: colors.card }]}
      >
        <View
          style={[
            styles.chatIcon,
            { backgroundColor: colors.primary + "20" },
          ]}
        >
          <MessageSquare size={22} color={colors.primary} />
        </View>

        <View style={styles.chatInfo}>
          <Text
            style={[styles.bookTitle, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {item.book_title}
          </Text>

          <View style={styles.metaRow}>
            <User size={12} color={colors.muted} />
            <Text style={[styles.metaText, { color: colors.muted }]}>
              {item.user_display_name}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MessageSquare size={12} color={colors.muted} />
              <Text style={[styles.statText, { color: colors.muted }]}>
                {item.message_count} messages
              </Text>
            </View>
            <View style={styles.statItem}>
              <Calendar size={12} color={colors.muted} />
              <Text style={[styles.statText, { color: colors.muted }]}>
                {formatDate(item.last_message_at || item.created_at)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => handleDeleteChat(item.id, item.book_title)}
            style={[styles.deleteButton, { backgroundColor: "#EF444420" }]}
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
          <ChevronRight size={20} color={colors.muted} />
        </View>
      </TouchableOpacity>
    ),
    [colors, handleChatPress, handleDeleteChat]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Results Count */}
      {data && (
        <View style={styles.resultsHeader}>
          <Text style={[styles.resultsCount, { color: colors.muted }]}>
            {data.total} chat session{data.total !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {/* Chat List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data?.data || []}
          keyExtractor={(item) => item.id}
          renderItem={renderChat}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MessageSquare size={48} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                No chat sessions found
              </Text>
            </View>
          }
          onEndReached={() => {
            if (data && page < data.total_pages) {
              setPage(page + 1);
            }
          }}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  resultsCount: {
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  chatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 11,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
});
