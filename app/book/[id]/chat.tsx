// Chat Screen - AI chat with streaming UI

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Send,
  X,
  BookOpen,
  Sparkles,
  User,
  Bot,
  AlertCircle,
} from "lucide-react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/providers/ThemeProvider";
import { useChat } from "@/hooks/useChat";
import { useBook } from "@/hooks/useBooks";
import type { ChatMessage } from "@/types/api";
import { CHAT_CONFIG } from "@/constants/config";

// ============================================================================
// Typing Indicator Component
// ============================================================================

function TypingIndicator({ colors }: { colors: any }) {
  const opacity1 = useSharedValue(0.3);
  const opacity2 = useSharedValue(0.3);
  const opacity3 = useSharedValue(0.3);

  useEffect(() => {
    opacity1.value = withRepeat(
      withTiming(1, { duration: 600 }),
      -1,
      true
    );
    setTimeout(() => {
      opacity2.value = withRepeat(
        withTiming(1, { duration: 600 }),
        -1,
        true
      );
    }, 200);
    setTimeout(() => {
      opacity3.value = withRepeat(
        withTiming(1, { duration: 600 }),
        -1,
        true
      );
    }, 400);
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: opacity1.value,
  }));
  const dot2Style = useAnimatedStyle(() => ({
    opacity: opacity2.value,
  }));
  const dot3Style = useAnimatedStyle(() => ({
    opacity: opacity3.value,
  }));

  return (
    <View style={styles.typingContainer}>
      <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: colors.card }]}>
        <View style={styles.typingDots}>
          <Animated.View style={[styles.typingDot, { backgroundColor: colors.primary }, dot1Style]} />
          <Animated.View style={[styles.typingDot, { backgroundColor: colors.primary }, dot2Style]} />
          <Animated.View style={[styles.typingDot, { backgroundColor: colors.primary }, dot3Style]} />
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// Message Bubble Component
// ============================================================================

function MessageBubble({
  message,
  colors,
  isStreaming,
  streamingContent,
}: {
  message: ChatMessage;
  colors: any;
  isStreaming?: boolean;
  streamingContent?: string;
}) {
  const isUser = message.role === "user";
  const content = isStreaming ? streamingContent || "" : message.content;

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
      ]}
    >
      {/* Avatar */}
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: `${colors.primary}20` }]}>
          <Bot size={20} color={colors.primary} />
        </View>
      )}

      {/* Bubble */}
      <View
        style={[
          styles.messageBubble,
          isUser
            ? [styles.userBubble, { backgroundColor: colors.primary }]
            : [styles.assistantBubble, { backgroundColor: colors.card }],
        ]}
      >
        <Text
          style={[
            styles.messageText,
            { color: isUser ? "#FFF" : colors.foreground },
          ]}
        >
          {content}
          {isStreaming && (
            <Text style={{ color: colors.primary }}>▌</Text>
          )}
        </Text>

        {/* Cost info for assistant messages */}
        {!isUser && message.cost_cents > 0 && (
          <Text style={[styles.costText, { color: colors.muted }]}>
            ${(message.cost_cents / 100).toFixed(3)}
          </Text>
        )}
      </View>

      {/* User Avatar */}
      {isUser && (
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <User size={20} color="#FFF" />
        </View>
      )}
    </Animated.View>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

function EmptyState({ book, colors }: { book: any; colors: any }) {
  return (
    <View style={styles.emptyContainer}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.emptyContent}>
        <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}15` }]}>
          <Sparkles size={48} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          Ask about this book
        </Text>
        <Text style={[styles.emptyText, { color: colors.muted }]}>
          Get AI-powered answers about "{book?.title || "this book"}". Ask questions, get summaries, or explore topics.
        </Text>

        {/* Suggestion Chips */}
        <View style={styles.suggestions}>
          <View style={[styles.suggestionChip, { backgroundColor: colors.card }]}>
            <Text style={[styles.suggestionText, { color: colors.foreground }]}>
              "Summarize this book"
            </Text>
          </View>
          <View style={[styles.suggestionChip, { backgroundColor: colors.card }]}>
            <Text style={[styles.suggestionText, { color: colors.foreground }]}>
              "What are the main themes?"
            </Text>
          </View>
          <View style={[styles.suggestionChip, { backgroundColor: colors.card }]}>
            <Text style={[styles.suggestionText, { color: colors.foreground }]}>
              "Who is the author?"
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// ============================================================================
// Input Bar Component
// ============================================================================

function InputBar({
  value,
  onChangeText,
  onSend,
  onCancel,
  isStreaming,
  colors,
  insets,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onCancel: () => void;
  isStreaming: boolean;
  colors: any;
  insets: any;
}) {
  const canSend = value.trim().length > 0 && !isStreaming;

  return (
    <View
      style={[
        styles.inputBar,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + 12,
        },
      ]}
    >
      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.foreground }]}
          placeholder="Ask about this book..."
          placeholderTextColor={colors.muted}
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={CHAT_CONFIG.MAX_MESSAGE_LENGTH}
          editable={!isStreaming}
        />
      </View>

      {isStreaming ? (
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: colors.destructive }]}
          onPress={onCancel}
        >
          <X size={20} color="#FFF" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: colors.primary, opacity: canSend ? 1 : 0.5 },
          ]}
          onPress={onSend}
          disabled={!canSend}
        >
          <Send size={20} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  // State
  const [inputValue, setInputValue] = useState("");

  // Queries
  const { data: book } = useBook(id!);
  const {
    messages,
    isLoadingMessages,
    isStreaming,
    streamingContent,
    streamingError,
    sendMessage,
    cancelStream,
  } = useChat(id!);

  // Handlers
  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputValue("");
    await sendMessage(content);
  }, [inputValue, sendMessage]);

  const handleCancel = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    cancelStream();
  }, [cancelStream]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [messages.length, isStreaming]);

  // Render message
  const renderMessage = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      // Check if this is the streaming message
      const isStreamingMessage =
        isStreaming &&
        index === 0 &&
        item.role === "assistant" &&
        item.id.startsWith("temp-");

      return (
        <MessageBubble
          message={item}
          colors={colors}
          isStreaming={isStreamingMessage}
          streamingContent={isStreamingMessage ? streamingContent : undefined}
        />
      );
    },
    [colors, isStreaming, streamingContent]
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  // Prepare messages with streaming placeholder
  const displayMessages = [...messages];
  if (isStreaming && (!messages[0] || messages[0].role !== "assistant")) {
    // Add placeholder for streaming assistant message
    displayMessages.unshift({
      id: "streaming-placeholder",
      session_id: "",
      role: "assistant",
      content: streamingContent || "",
      cost_cents: 0,
      created_at: new Date().toISOString(),
    });
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Chat",
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
        }}
      />

      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        {/* Book Info Header */}
        {book && (
          <View style={[styles.bookHeader, { borderBottomColor: colors.border }]}>
            <BookOpen size={16} color={colors.primary} />
            <Text
              style={[styles.bookTitle, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {book.title}
            </Text>
          </View>
        )}

        {/* Error Banner */}
        {streamingError && (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={[styles.errorBanner, { backgroundColor: `${colors.destructive}15` }]}
          >
            <AlertCircle size={16} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {streamingError}
            </Text>
          </Animated.View>
        )}

        {/* Messages */}
        {isLoadingMessages ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : displayMessages.length === 0 ? (
          <EmptyState book={book} colors={colors} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={displayMessages}
            keyExtractor={keyExtractor}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            inverted
            ListHeaderComponent={
              isStreaming && !streamingContent ? (
                <TypingIndicator colors={colors} />
              ) : null
            }
          />
        )}

        {/* Input Bar */}
        <InputBar
          value={inputValue}
          onChangeText={setInputValue}
          onSend={handleSend}
          onCancel={handleCancel}
          isStreaming={isStreaming}
          colors={colors}
          insets={insets}
        />
      </KeyboardAvoidingView>
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
  bookHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
    gap: 8,
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  assistantMessageContainer: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  costText: {
    fontSize: 10,
    marginTop: 4,
    textAlign: "right",
  },
  typingContainer: {
    marginBottom: 12,
  },
  typingDots: {
    flexDirection: "row",
    gap: 4,
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyContent: {
    alignItems: "center",
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  suggestions: {
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  suggestionText: {
    fontSize: 14,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  input: {
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
