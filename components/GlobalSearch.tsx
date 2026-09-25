// Global Search: the library search on api.ilm.red (GET /v1/search).
//
// Two lists, like the website: Books (title, author, tags) and In pages (words inside pages, in
// the original and every saved translation, Urdu included). 20 at a time, up to 200. When nothing
// matches, the server's hint says why (for example "this book has Urdu text; try Urdu script").
// Recent searches come from the member's search history when they turned it on (Settings), and
// from this phone otherwise. Results open on ilm.red until the book screens move to the new API.

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { Search, X, BookOpen, Clock, ArrowRight, FileText } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";
import {
  useLibrarySearch,
  useMySearches,
  useSearchHistoryEnabled,
  useClearSearches,
  snippetParts,
  isRtl,
  type SearchHit,
} from "@/hooks/useSearch";

// ============================================================================
// Constants
// ============================================================================

const RECENT_SEARCHES_KEY = "@ilm_red_recent_searches";
const MAX_RECENT_SEARCHES = 5;

type Tab = "book" | "page";

// ============================================================================
// Search Bar (Trigger)
// ============================================================================

interface SearchBarProps {
  onPress: () => void;
  placeholder?: string;
}

export function SearchBar({ onPress, placeholder = "Search books..." }: SearchBarProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.7}
    >
      <Search size={18} color={colors.muted} />
      <Text style={[styles.searchPlaceholder, { color: colors.muted }]}>{placeholder}</Text>
    </TouchableOpacity>
  );
}

// ============================================================================
// Snippet with the matched words in bold
// ============================================================================

function Snippet({ text, color, hitColor }: { text: string | null; color: string; hitColor: string }) {
  const parts = snippetParts(text);
  if (!parts.length) return null;
  const rtl = isRtl(text);
  return (
    <Text
      style={[styles.snippet, { color, textAlign: rtl ? "right" : "left", writingDirection: rtl ? "rtl" : "ltr" }]}
      numberOfLines={3}
    >
      {parts.map((p, i) => (
        <Text key={i} style={p.hit ? { fontWeight: "700", color: hitColor } : undefined}>
          {p.text}
        </Text>
      ))}
    </Text>
  );
}

// ============================================================================
// Search Modal
// ============================================================================

interface GlobalSearchModalProps {
  visible: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ visible, onClose }: GlobalSearchModalProps) {
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("book");
  const [localRecent, setLocalRecent] = useState<string[]>([]);

  // Wait for a pause in typing before asking the server.
  useEffect(() => {
    const id = setTimeout(() => setQuery(input.trim()), 300);
    return () => clearTimeout(id);
  }, [input]);

  const books = useLibrarySearch(query, "book");
  const pages = useLibrarySearch(query, "page");
  const active = tab === "book" ? books : pages;
  const hits: SearchHit[] = (active.data?.pages ?? []).flatMap((p) => p.data);
  const first = active.data?.pages?.[0];
  const total = (q: typeof books) => q.data?.pages?.[0]?.total ?? 0;
  const capped = (q: typeof books) => Boolean(q.data?.pages?.[0]?.total_capped);

  // Recent searches: the member's history when it is on, this phone's list otherwise.
  const historyOn = useSearchHistoryEnabled(isAuthenticated && visible);
  const serverRecent = useMySearches(isAuthenticated && visible && historyOn.data === true, 10);
  const clearServer = useClearSearches();
  const usingServer = historyOn.data === true;
  const recent: string[] = usingServer
    ? Array.from(new Set((serverRecent.data?.data ?? []).map((e) => e.query))).slice(0, 10)
    : localRecent;

  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY)
      .then((s) => setLocalRecent(s ? JSON.parse(s) : []))
      .catch(() => setLocalRecent([]));
  }, []);

  useEffect(() => {
    if (visible) setTimeout(() => inputRef.current?.focus(), 100);
  }, [visible]);

  const rememberLocally = async (term: string) => {
    if (usingServer) return; // the server already saved it
    const updated = [term, ...localRecent.filter((s) => s !== term)].slice(0, MAX_RECENT_SEARCHES);
    setLocalRecent(updated);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)).catch(() => {});
  };

  const clearRecent = async () => {
    if (usingServer) { clearServer.mutate(); return; }
    setLocalRecent([]);
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY).catch(() => {});
  };

  const open = useCallback(
    async (hit: SearchHit) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void rememberLocally(query);
      await WebBrowser.openBrowserAsync(hit.url);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, usingServer, localRecent]
  );

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    setInput("");
    setQuery("");
    onClose();
  }, [onClose]);

  const renderHit = ({ item }: { item: SearchHit }) => {
    if (item.kind !== "book" && item.kind !== "page") return null;
    const title = item.book.title;
    const rtlTitle = isRtl(title);
    return (
      <TouchableOpacity onPress={() => open(item)} style={[styles.resultItem, { backgroundColor: colors.card }]}>
        <View style={[styles.resultCover, { backgroundColor: colors.secondary }]}>
          {item.kind === "page" ? <FileText size={20} color={colors.muted} /> : <BookOpen size={20} color={colors.muted} />}
        </View>
        <View style={styles.resultInfo}>
          <Text
            style={[styles.resultTitle, { color: colors.foreground, textAlign: rtlTitle ? "right" : "left" }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {item.kind === "page" ? (
            <Text style={[styles.resultAuthor, { color: colors.muted }]}>
              {`Page ${item.page}${item.is_translation ? ` · ${item.lang.toUpperCase()} translation` : ""}`}
            </Text>
          ) : (
            item.book.author && (
              <Text style={[styles.resultAuthor, { color: colors.muted }]} numberOfLines={1}>
                {item.book.author}
              </Text>
            )
          )}
          <Snippet text={item.snippet} color={colors.muted} hitColor={colors.foreground} />
        </View>
        <ArrowRight size={18} color={colors.muted} />
      </TouchableOpacity>
    );
  };

  const searching = query.length >= 2 && active.isLoading;
  const showResults = query.length >= 2 && hits.length > 0;
  const showRecent = !input && recent.length > 0;
  const countLabel = (q: typeof books) => `${total(q)}${capped(q) ? "+" : ""}`;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
          <View style={[styles.searchInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Search size={18} color={colors.muted} />
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, { color: colors.foreground, textAlign: isRtl(input) ? "right" : "left" }]}
              placeholder="Search books and pages..."
              placeholderTextColor={colors.muted}
              value={input}
              onChangeText={setInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {input.length > 0 && (
              <TouchableOpacity onPress={() => setInput("")}>
                <X size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Books / In pages */}
        {query.length >= 2 && (
          <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
            {(["book", "page"] as Tab[]).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(t)}
                style={[styles.tab, tab === t && { borderBottomColor: colors.primary }]}
              >
                <Text style={[styles.tabText, { color: tab === t ? colors.foreground : colors.muted }]}>
                  {t === "book" ? `Books (${countLabel(books)})` : `In pages (${countLabel(pages)})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.modalContent}>
          {searching && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}

          {showResults && (
            <FlatList
              data={hits}
              keyExtractor={(item, i) => `${item.kind}:${"book" in item ? item.book.id : i}:${"page" in item ? `${item.page}:${item.lang}` : ""}:${i}`}
              renderItem={renderHit}
              contentContainerStyle={styles.resultsList}
              showsVerticalScrollIndicator={false}
              onEndReachedThreshold={0.4}
              onEndReached={() => { if (active.hasNextPage && !active.isFetchingNextPage) void active.fetchNextPage(); }}
              ListFooterComponent={active.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : null}
            />
          )}

          {showRecent && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.muted }]}>
                  {usingServer ? "Your search history" : "Recent Searches"}
                </Text>
                <TouchableOpacity onPress={clearRecent}>
                  <Text style={[styles.clearText, { color: colors.primary }]}>Clear</Text>
                </TouchableOpacity>
              </View>
              {recent.map((term, index) => (
                <TouchableOpacity
                  key={`${term}:${index}`}
                  onPress={() => { setInput(term); setQuery(term); }}
                  style={[styles.recentItem, { backgroundColor: colors.card }]}
                >
                  <Clock size={14} color={colors.muted} />
                  <Text style={[styles.recentText, { color: colors.foreground }]}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {query.length >= 2 && !active.isLoading && hits.length === 0 && (
            <View style={styles.emptyContainer}>
              <Search size={48} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No results found</Text>
              <Text style={[styles.emptyText, { color: colors.muted, textAlign: "center" }]}>
                {first?.hint?.message ?? "Try a different search term"}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// Combined Component
// ============================================================================

interface GlobalSearchProps {
  placeholder?: string;
}

export function GlobalSearch({ placeholder }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <SearchBar onPress={() => setIsOpen(true)} placeholder={placeholder} />
      <GlobalSearchModal visible={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  // Search Bar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
  },

  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
  },

  // Content
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: "center",
  },

  // Sections
  section: {
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  clearText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // Suggestions
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6,
    gap: 10,
  },
  suggestionText: {
    fontSize: 15,
  },

  // Recent
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6,
    gap: 10,
  },
  recentText: {
    fontSize: 15,
  },

  // Results
  resultsList: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  resultsCount: {
    fontSize: 13,
    marginBottom: 12,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  resultCover: {
    width: 48,
    height: 62,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  resultAuthor: {
    fontSize: 12,
    marginBottom: 6,
  },
  resultCategory: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultCategoryText: {
    fontSize: 10,
    fontWeight: "600",
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
  },
  // Tabs and snippets (search release)
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    gap: 16,
  },
  tab: {
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  snippet: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 19,
  },
});
