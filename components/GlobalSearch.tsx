// Global Search Component with autocomplete

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Search,
  X,
  BookOpen,
  User,
  Tag,
  Clock,
  ArrowRight,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/providers/ThemeProvider";
import { useSearch, useSearchSuggestions, SearchResult, SearchSuggestion } from "@/hooks/useSearch";
import { getCategoryById, type BookCategory } from "@/hooks/useCategories";

// ============================================================================
// Constants
// ============================================================================

const RECENT_SEARCHES_KEY = "@ilm_red_recent_searches";
const MAX_RECENT_SEARCHES = 5;

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
      style={[
        styles.searchBar,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      activeOpacity={0.7}
    >
      <Search size={18} color={colors.muted} />
      <Text style={[styles.searchPlaceholder, { color: colors.muted }]}>
        {placeholder}
      </Text>
    </TouchableOpacity>
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
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const { data: searchResults, isLoading: isSearching } = useSearch(query);
  const { data: suggestions } = useSearchSuggestions(query);

  // Load recent searches
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load recent searches:", error);
    }
  };

  const saveRecentSearch = async (searchTerm: string) => {
    try {
      const updated = [
        searchTerm,
        ...recentSearches.filter((s) => s !== searchTerm),
      ].slice(0, MAX_RECENT_SEARCHES);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save recent search:", error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error("Failed to clear recent searches:", error);
    }
  };

  const handleSelectResult = useCallback(
    (bookId: string, title: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      saveRecentSearch(title);
      onClose();
      setQuery("");
      router.push(`/book/${bookId}`);
    },
    [router, onClose]
  );

  const handleSelectSuggestion = useCallback(
    (suggestion: SearchSuggestion | string) => {
      const text = typeof suggestion === "string" ? suggestion : suggestion.text;
      setQuery(text);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    []
  );

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    setQuery("");
    onClose();
  }, [onClose]);

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "author":
        return <User size={14} color={colors.muted} />;
      case "category":
        return <Tag size={14} color={colors.muted} />;
      default:
        return <BookOpen size={14} color={colors.muted} />;
    }
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    const category = getCategoryById(item.category as BookCategory);

    return (
      <TouchableOpacity
        onPress={() => handleSelectResult(item.id, item.title)}
        style={[styles.resultItem, { backgroundColor: colors.card }]}
      >
        <View
          style={[
            styles.resultCover,
            { backgroundColor: category?.bgColor || colors.secondary },
          ]}
        >
          <BookOpen size={20} color={category?.color || colors.muted} />
        </View>
        <View style={styles.resultInfo}>
          <Text
            style={[styles.resultTitle, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {item.author && (
            <Text
              style={[styles.resultAuthor, { color: colors.muted }]}
              numberOfLines={1}
            >
              {item.author}
            </Text>
          )}
          {category && (
            <View
              style={[styles.resultCategory, { backgroundColor: category.bgColor }]}
            >
              <Text style={[styles.resultCategoryText, { color: category.color }]}>
                {category.label}
              </Text>
            </View>
          )}
        </View>
        <ArrowRight size={18} color={colors.muted} />
      </TouchableOpacity>
    );
  };

  const showSuggestions = query.length >= 1 && !searchResults?.results?.length && suggestions?.suggestions?.length;
  const showResults = query.length >= 2 && searchResults?.results?.length;
  const showRecent = !query && recentSearches.length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.modalHeader,
            { paddingTop: insets.top + 8, borderBottomColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.searchInputContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Search size={18} color={colors.muted} />
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Search books, authors..."
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <X size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: colors.primary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.modalContent}>
          {/* Loading */}
          {isSearching && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}

          {/* Suggestions */}
          {showSuggestions && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.muted }]}>
                Suggestions
              </Text>
              {suggestions.suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSelectSuggestion(suggestion)}
                  style={[styles.suggestionItem, { backgroundColor: colors.card }]}
                >
                  {getSuggestionIcon(suggestion.type)}
                  <Text style={[styles.suggestionText, { color: colors.foreground }]}>
                    {suggestion.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Search Results */}
          {showResults && (
            <FlatList
              data={searchResults.results}
              keyExtractor={(item) => item.id}
              renderItem={renderSearchResult}
              contentContainerStyle={styles.resultsList}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <Text style={[styles.resultsCount, { color: colors.muted }]}>
                  {searchResults.total} result{searchResults.total !== 1 ? "s" : ""} for "{query}"
                </Text>
              }
            />
          )}

          {/* Recent Searches */}
          {showRecent && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.muted }]}>
                  Recent Searches
                </Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={[styles.clearText, { color: colors.primary }]}>
                    Clear
                  </Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((search, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSelectSuggestion(search)}
                  style={[styles.recentItem, { backgroundColor: colors.card }]}
                >
                  <Clock size={14} color={colors.muted} />
                  <Text style={[styles.recentText, { color: colors.foreground }]}>
                    {search}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Empty State */}
          {query.length >= 2 && !isSearching && !searchResults?.results?.length && (
            <View style={styles.emptyContainer}>
              <Search size={48} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No results found
              </Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                Try a different search term
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
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
});

export default GlobalSearch;
