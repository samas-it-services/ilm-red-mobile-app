// Chat React Query hooks with SSE streaming

import { useState, useCallback, useRef, useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import api from "@/lib/api";
import { getAccessToken } from "@/lib/storage";
import type {
  ChatSession,
  ChatMessage,
  CreateChatSessionRequest,
  SendMessageRequest,
  SSEEvent,
  PaginatedResponse,
} from "@/types/api";
import { API_URL, CHAT_CONFIG } from "@/constants/config";

// ============================================================================
// Query Keys
// ============================================================================

export const chatKeys = {
  all: ["chat"] as const,
  sessions: (bookId?: string) =>
    bookId ? [...chatKeys.all, "sessions", bookId] : [...chatKeys.all, "sessions"],
  session: (sessionId: string) => [...chatKeys.all, "session", sessionId] as const,
  messages: (sessionId: string) =>
    [...chatKeys.all, "messages", sessionId] as const,
};

// ============================================================================
// Fetch Functions
// ============================================================================

const fetchChatSessions = async (
  bookId?: string
): Promise<PaginatedResponse<ChatSession>> => {
  const response = await api.get<PaginatedResponse<ChatSession>>("/chats", {
    params: bookId ? { book_id: bookId } : undefined,
  });
  return response.data;
};

const fetchChatSession = async (sessionId: string): Promise<ChatSession> => {
  const response = await api.get<ChatSession>(`/chats/${sessionId}`);
  return response.data;
};

const fetchChatMessages = async (
  sessionId: string,
  page = 1
): Promise<PaginatedResponse<ChatMessage>> => {
  const response = await api.get<PaginatedResponse<ChatMessage>>(
    `/chats/${sessionId}/messages`,
    { params: { page, page_size: 50 } }
  );
  return response.data;
};

const createChatSession = async (
  data: CreateChatSessionRequest
): Promise<ChatSession> => {
  const response = await api.post<ChatSession>("/chats", data);
  return response.data;
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch chat sessions for a book
 */
export function useChatSessions(bookId?: string) {
  return useQuery({
    queryKey: chatKeys.sessions(bookId),
    queryFn: () => fetchChatSessions(bookId),
    staleTime: CHAT_CONFIG.STALE_TIME_SESSIONS,
  });
}

/**
 * Fetch single chat session
 */
export function useChatSession(sessionId: string) {
  return useQuery({
    queryKey: chatKeys.session(sessionId),
    queryFn: () => fetchChatSession(sessionId),
    enabled: !!sessionId,
  });
}

/**
 * Fetch chat messages with infinite scroll
 */
export function useChatMessages(sessionId: string) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(sessionId),
    queryFn: ({ pageParam = 1 }) => fetchChatMessages(sessionId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.has_next ? lastPage.pagination.page + 1 : undefined,
    getPreviousPageParam: (firstPage) =>
      firstPage.pagination.has_prev ? firstPage.pagination.page - 1 : undefined,
    enabled: !!sessionId,
    staleTime: CHAT_CONFIG.STALE_TIME_MESSAGES,
  });
}

/**
 * Create a new chat session
 */
export function useCreateChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createChatSession,
    onSuccess: (newSession) => {
      // Invalidate sessions list
      queryClient.invalidateQueries({
        queryKey: chatKeys.sessions(newSession.book_id),
      });
    },
  });
}

// ============================================================================
// SSE Streaming Hook
// ============================================================================

interface StreamingState {
  isStreaming: boolean;
  content: string;
  error: string | null;
  messageId: string | null;
  costCents: number;
  tokensUsed: number;
}

const initialStreamingState: StreamingState = {
  isStreaming: false,
  content: "",
  error: null,
  messageId: null,
  costCents: 0,
  tokensUsed: 0,
};

/**
 * Parse SSE event from line
 */
function parseSSEEvent(line: string): SSEEvent | null {
  if (!line.startsWith("data: ")) return null;

  try {
    const jsonStr = line.slice(6); // Remove "data: " prefix
    return JSON.parse(jsonStr) as SSEEvent;
  } catch {
    return null;
  }
}

/**
 * Throttle function to limit update frequency
 */
function throttle<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      fn(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastCall = Date.now();
        timeout = null;
        fn(...args);
      }, delay - timeSinceLastCall);
    }
  };
}

/**
 * Stream chat message with SSE
 */
export function useStreamMessage(sessionId: string) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<StreamingState>(initialStreamingState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const contentBufferRef = useRef("");

  // Throttled state update
  const throttledSetContent = useCallback(
    throttle((content: string) => {
      setState((prev) => ({ ...prev, content }));
    }, CHAT_CONFIG.SSE_THROTTLE_MS),
    []
  );

  const sendMessage = useCallback(
    async (content: string) => {
      // Reset state
      setState({
        isStreaming: true,
        content: "",
        error: null,
        messageId: null,
        costCents: 0,
        tokensUsed: 0,
      });
      contentBufferRef.current = "";

      // Create abort controller
      abortControllerRef.current = new AbortController();

      try {
        // Add optimistic user message to cache
        const optimisticUserMessage: ChatMessage = {
          id: `temp-${Date.now()}`,
          session_id: sessionId,
          role: "user",
          content,
          cost_cents: 0,
          created_at: new Date().toISOString(),
        };

        queryClient.setQueryData(
          chatKeys.messages(sessionId),
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page: any, idx: number) =>
                idx === 0
                  ? { ...page, data: [optimisticUserMessage, ...page.data] }
                  : page
              ),
            };
          }
        );

        // Get access token
        const token = await getAccessToken();
        if (!token) {
          throw new Error("Not authenticated");
        }

        // Make SSE request
        const response = await fetch(
          `${API_URL}/chats/${sessionId}/stream`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              Accept: "text/event-stream",
            },
            body: JSON.stringify({ content, stream: true }),
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to send message");
        }

        // Process SSE stream
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            const event = parseSSEEvent(trimmedLine);
            if (!event) continue;

            switch (event.type) {
              case "chunk":
                contentBufferRef.current += event.content;
                throttledSetContent(contentBufferRef.current);
                break;

              case "done":
                setState((prev) => ({
                  ...prev,
                  isStreaming: false,
                  content: contentBufferRef.current,
                  messageId: event.message_id,
                  costCents: event.cost_cents,
                  tokensUsed: event.tokens_used,
                }));

                // Add assistant message to cache
                const assistantMessage: ChatMessage = {
                  id: event.message_id,
                  session_id: sessionId,
                  role: "assistant",
                  content: contentBufferRef.current,
                  cost_cents: event.cost_cents,
                  tokens_used: event.tokens_used,
                  created_at: new Date().toISOString(),
                };

                queryClient.setQueryData(
                  chatKeys.messages(sessionId),
                  (old: any) => {
                    if (!old) return old;
                    return {
                      ...old,
                      pages: old.pages.map((page: any, idx: number) =>
                        idx === 0
                          ? { ...page, data: [assistantMessage, ...page.data] }
                          : page
                      ),
                    };
                  }
                );

                // Invalidate to sync with server
                queryClient.invalidateQueries({
                  queryKey: chatKeys.messages(sessionId),
                });
                queryClient.invalidateQueries({
                  queryKey: chatKeys.session(sessionId),
                });
                break;

              case "error":
                setState((prev) => ({
                  ...prev,
                  isStreaming: false,
                  error: event.message,
                }));
                break;
            }
          }
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          setState((prev) => ({ ...prev, isStreaming: false }));
        } else {
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            error: error.message || "Failed to send message",
          }));
        }
      }
    },
    [sessionId, queryClient, throttledSetContent]
  );

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({ ...prev, isStreaming: false }));
  }, []);

  const resetState = useCallback(() => {
    setState(initialStreamingState);
    contentBufferRef.current = "";
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    sendMessage,
    cancelStream,
    resetState,
  };
}

// ============================================================================
// Combined Chat Hook
// ============================================================================

/**
 * Combined hook for chat functionality
 */
export function useChat(bookId: string, sessionId?: string) {
  const queryClient = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState(sessionId);

  const sessionsQuery = useChatSessions(bookId);
  const messagesQuery = useChatMessages(activeSessionId || "");
  const createSession = useCreateChatSession();
  const streaming = useStreamMessage(activeSessionId || "");

  // Create or get session
  const getOrCreateSession = useCallback(async () => {
    if (activeSessionId) return activeSessionId;

    // Check if there's an existing session
    const sessions = sessionsQuery.data?.data;
    if (sessions && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
      return sessions[0].id;
    }

    // Create new session
    const newSession = await createSession.mutateAsync({
      book_id: bookId,
    });
    setActiveSessionId(newSession.id);
    return newSession.id;
  }, [activeSessionId, bookId, sessionsQuery.data, createSession]);

  // Send message wrapper
  const sendMessage = useCallback(
    async (content: string) => {
      const sid = await getOrCreateSession();
      if (!sid) return;
      streaming.sendMessage(content);
    },
    [getOrCreateSession, streaming]
  );

  // Flatten messages
  const messages = messagesQuery.data?.pages.flatMap((page) => page.data) ?? [];

  return {
    sessionId: activeSessionId,
    sessions: sessionsQuery.data?.data ?? [],
    messages,
    isLoadingSessions: sessionsQuery.isLoading,
    isLoadingMessages: messagesQuery.isLoading,
    isStreaming: streaming.isStreaming,
    streamingContent: streaming.content,
    streamingError: streaming.error,
    sendMessage,
    cancelStream: streaming.cancelStream,
    setActiveSession: setActiveSessionId,
    createSession: createSession.mutateAsync,
    loadMoreMessages: messagesQuery.fetchNextPage,
    hasMoreMessages: messagesQuery.hasNextPage,
    refetchMessages: messagesQuery.refetch,
  };
}
