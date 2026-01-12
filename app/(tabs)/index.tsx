// Enhanced Home Screen - Book-focused with hero, carousel, categories

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  RefreshControl,
  Dimensions,
  StyleSheet,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Search,
  Plus,
  X,
  ChevronRight,
  BookOpen,
  Clock,
  Flame,
  Star,
  TrendingUp,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useInfiniteBooks, useFavorites, useToggleFavorite } from "@/hooks/useBooks";
import { useCategories, type BookCategory } from "@/hooks/useCategories";
import { useReadingStats, useRecentReads } from "@/hooks/useProgress";
import { useRecommendations } from "@/hooks/useRecommendations";
import { GlobalSearch } from "@/components/GlobalSearch";
import type { BookListItem } from "@/types/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_ITEM_WIDTH = SCREEN_WIDTH * 0.65;
const CAROUSEL_ITEM_HEIGHT = CAROUSEL_ITEM_WIDTH * 1.4;

// ============================================================================
// Category Gradients
// ============================================================================

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  quran: ["#10B981", "#059669"],      // Emerald
  hadith: ["#8B5CF6", "#7C3AED"],     // Violet
  seerah: ["#3B82F6", "#2563EB"],     // Blue
  fiqh: ["#F59E0B", "#D97706"],       // Amber
  aqidah: ["#EF4444", "#DC2626"],     // Red
  tafsir: ["#14B8A6", "#0D9488"],     // Teal
  history: ["#EA580C", "#C2410C"],    // Orange
  spirituality: ["#A855F7", "#9333EA"], // Purple
  children: ["#E11D48", "#BE123C"],   // Rose
  fiction: ["#EC4899", "#DB2777"],    // Pink
  "non-fiction": ["#6366F1", "#4F46E5"], // Indigo
  education: ["#0EA5E9", "#0284C7"],  // Sky
  science: ["#14B8A6", "#0D9488"],    // Teal
  technology: ["#0EA5E9", "#0284C7"], // Sky
  biography: ["#A855F7", "#9333EA"],  // Purple
  "self-help": ["#22C55E", "#16A34A"], // Green
  other: ["#64748B", "#475569"],      // Slate
};

// ============================================================================
// Hero Section Component
// ============================================================================

function HeroSection({ user, colors }: { user: any; colors: any }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.display_name?.split(" ")[0] || "Reader";

  return (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.heroSection}>
      <View style={styles.heroContent}>
        <Text style={[styles.greeting, { color: colors.muted }]}>
          {getGreeting()},
        </Text>
        <Text style={[styles.userName, { color: colors.foreground }]}>
          {firstName}!
        </Text>
      </View>

      {/* Reading Streak Badge */}
      <TouchableOpacity
        style={[styles.streakBadge, { backgroundColor: `${colors.primary}15` }]}
        activeOpacity={0.7}
      >
        <Flame size={20} color={colors.primary} />
        <Text style={[styles.streakText, { color: colors.primary }]}>
          {readingStats?.current_streak_days || 0} day streak
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================================
// Continue Reading Card Component
// ============================================================================

function ContinueReadingCard({
  book,
  colors,
  onPress,
}: {
  book: BookListItem | null;
  colors: any;
  onPress: () => void;
}) {
  if (!book) {
    return (
      <Animated.View
        entering={FadeInDown.delay(100).duration(500)}
        style={[styles.continueCard, { backgroundColor: colors.card }]}
      >
        <View style={[styles.emptyBookCover, { backgroundColor: colors.border }]}>
          <BookOpen size={32} color={colors.muted} />
        </View>
        <View style={styles.continueTextContainer}>
          <Text style={[styles.continueLabel, { color: colors.muted }]}>
            Start your journey
          </Text>
          <Text style={[styles.continueTitle, { color: colors.foreground }]}>
            Upload your first book
          </Text>
          <Text style={[styles.continueSubtitle, { color: colors.muted }]}>
            Tap + to add a book to your library
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(500)}>
      <TouchableOpacity
        style={[styles.continueCard, { backgroundColor: colors.card }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {book.cover_url ? (
          <Image source={{ uri: book.cover_url }} style={styles.continueCover} />
        ) : (
          <View style={[styles.continueCoverPlaceholder, { backgroundColor: colors.primary }]}>
            <BookOpen size={24} color="#FFF" />
          </View>
        )}
        <View style={styles.continueTextContainer}>
          <Text style={[styles.continueLabel, { color: colors.muted }]}>
            Continue Reading
          </Text>
          <Text
            style={[styles.continueTitle, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {book.title}
          </Text>
          {book.author && (
            <Text style={[styles.continueAuthor, { color: colors.muted }]} numberOfLines={1}>
              {book.author}
            </Text>
          )}
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${recentReads?.[0]?.progress_percent || 0}%`
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.muted }]}>
              {recentReads?.[0]?.progress_percent || 0}%
            </Text>
          </View>
        </View>
        <ChevronRight size={24} color={colors.muted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================================
// Featured Book Card Component
// ============================================================================

function FeaturedBookCard({
  book,
  colors,
  onPress,
  index,
}: {
  book: BookListItem;
  colors: any;
  onPress: () => void;
  index: number;
}) {
  const gradient = CATEGORY_GRADIENTS[book.category] || CATEGORY_GRADIENTS.general;

  return (
    <Animated.View entering={FadeInRight.delay(index * 100).duration(400)}>
      <TouchableOpacity
        style={styles.featuredCard}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {book.cover_url ? (
          <Image source={{ uri: book.cover_url }} style={styles.featuredCover} />
        ) : (
          <LinearGradient colors={gradient} style={styles.featuredCover}>
            <BookOpen size={48} color="#FFF" style={{ opacity: 0.8 }} />
          </LinearGradient>
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.featuredOverlay}
        >
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {book.title}
          </Text>
          {book.author && (
            <Text style={styles.featuredAuthor} numberOfLines={1}>
              {book.author}
            </Text>
          )}
          <View style={styles.featuredStats}>
            {book.stats.rating_avg !== null && (
              <View style={styles.featuredStatItem}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.featuredStatText}>
                  {book.stats.rating_avg.toFixed(1)}
                </Text>
              </View>
            )}
            <View style={styles.featuredStatItem}>
              <TrendingUp size={12} color="#FFF" />
              <Text style={styles.featuredStatText}>{book.stats.views}</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================================
// Category Card Component
// ============================================================================

function CategoryCard({
  category,
  colors,
  onPress,
  index,
}: {
  category: { id: string; label: string; icon: string };
  colors: any;
  onPress: () => void;
  index: number;
}) {
  const gradient = CATEGORY_GRADIENTS[category.id] || CATEGORY_GRADIENTS.general;

  return (
    <Animated.View entering={FadeInDown.delay(200 + index * 50).duration(400)}>
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={gradient}
          style={styles.categoryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text style={styles.categoryLabel}>{category.label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================================
// Recent Book Card Component
// ============================================================================

function RecentBookCard({
  book,
  colors,
  onPress,
  onFavoritePress,
  isFavorite,
}: {
  book: BookListItem;
  colors: any;
  onPress: () => void;
  onFavoritePress: () => void;
  isFavorite: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.recentCard, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {book.cover_url ? (
        <Image source={{ uri: book.cover_url }} style={styles.recentCover} />
      ) : (
        <View style={[styles.recentCoverPlaceholder, { backgroundColor: colors.primary }]}>
          <BookOpen size={20} color="#FFF" />
        </View>
      )}
      <View style={styles.recentTextContainer}>
        <Text
          style={[styles.recentTitle, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {book.title}
        </Text>
        {book.author && (
          <Text style={[styles.recentAuthor, { color: colors.muted }]} numberOfLines={1}>
            {book.author}
          </Text>
        )}
        <View style={styles.recentMeta}>
          <Text style={[styles.recentCategory, { color: colors.primary }]}>
            {book.category}
          </Text>
          {book.page_count && (
            <Text style={[styles.recentPages, { color: colors.muted }]}>
              {book.page_count} pages
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ============================================================================
// Section Header Component
// ============================================================================

function SectionHeader({
  title,
  colors,
  onSeeAllPress,
}: {
  title: string;
  colors: any;
  onSeeAllPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {onSeeAllPress && (
        <TouchableOpacity onPress={onSeeAllPress} style={styles.seeAllButton}>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          <ChevronRight size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

const CATEGORIES_DATA = [
  { id: "popular", label: "Popular", icon: "🔥" },
  { id: "trending", label: "Trending", icon: "📈" },
  { id: "new", label: "New", icon: "✨" },
  { id: "classics", label: "Classics", icon: "📚" },
  { id: "fiction", label: "Fiction", icon: "📖" },
  { id: "science", label: "Science", icon: "🔬" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Queries
  const {
    data,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteBooks({});

  const { data: favoritesData } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  // Reading progress
  const { data: readingStats } = useReadingStats();
  const { data: recentReads } = useRecentReads(1);

  // Recommendations
  const { data: recommendations } = useRecommendations(10);

  // Memoized values
  const books = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );

  const featuredBooks = useMemo(() => books.slice(0, 5), [books]);
  const recentBooks = useMemo(() => books.slice(0, 10), [books]);
  const lastReadBook = useMemo(() => books[0] || null, [books]);

  const favoriteIds = useMemo(
    () => new Set(favoritesData?.data.map((b) => b.id) ?? []),
    [favoritesData]
  );

  // Handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const handleBookPress = useCallback(
    (bookId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/book/${bookId}`);
    },
    [router]
  );

  const handleCategoryPress = useCallback(
    (categoryId: string) => {
      Haptics.selectionAsync();
      router.push({ pathname: "/(tabs)/library", params: { category: categoryId } });
    },
    [router]
  );

  const handleFavoritePress = useCallback(
    (bookId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      toggleFavorite.mutate(bookId, favoriteIds.has(bookId));
    },
    [toggleFavorite, favoriteIds]
  );

  const handleUploadPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/upload");
  };

  const handleSearchPress = () => {
    router.push("/(tabs)/library");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header with Search */}
        <View style={styles.header}>
          <HeroSection user={user} colors={colors} />

          {/* Global Search */}
          <Animated.View entering={FadeInDown.delay(150).duration(500)}>
            <GlobalSearch placeholder="Search books, authors..." />
          </Animated.View>
        </View>

        {/* Continue Reading */}
        <View style={styles.section}>
          <ContinueReadingCard
            book={lastReadBook}
            colors={colors}
            onPress={() => lastReadBook && handleBookPress(lastReadBook.id)}
          />
        </View>

        {/* Featured Books Carousel */}
        {featuredBooks.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Featured Books"
              colors={colors}
              onSeeAllPress={() => router.push("/(tabs)/library")}
            />
            <FlatList
              horizontal
              data={featuredBooks}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <FeaturedBookCard
                  book={item}
                  colors={colors}
                  onPress={() => handleBookPress(item.id)}
                  index={index}
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContainer}
              snapToInterval={CAROUSEL_ITEM_WIDTH + 16}
              decelerationRate="fast"
            />
          </View>
        )}

        {/* Categories */}
        <View style={styles.section}>
          <SectionHeader title="Browse Categories" colors={colors} />
          <View style={styles.categoriesGrid}>
            {CATEGORIES_DATA.map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                colors={colors}
                onPress={() => handleCategoryPress(category.id)}
                index={index}
              />
            ))}
          </View>
        </View>

        {/* Recommended for You */}
        {recommendations && recommendations.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Recommended for You"
              colors={colors}
              onSeeAllPress={() => router.push("/(tabs)/library")}
            />
            <FlatList
              horizontal
              data={recommendations.slice(0, 5)}
              keyExtractor={(item) => item.book_id}
              renderItem={({ item, index }) => (
                <Animated.View
                  entering={FadeInRight.delay(index * 100).duration(400)}
                >
                  <BookCard
                    book={{
                      id: item.book_id,
                      title: item.title,
                      author: item.author,
                      cover_url: item.cover_url,
                      category: item.category,
                      average_rating: item.average_rating,
                      ratings_count: item.ratings_count,
                    } as BookListItem}
                    onPress={() => router.push(`/book/${item.book_id}`)}
                    onFavoritePress={() => {}}
                    isFavorite={favoriteIds.has(item.book_id)}
                    colors={colors}
                    width={CAROUSEL_ITEM_WIDTH}
                    badge={item.reason}
                  />
                </Animated.View>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
              snapToInterval={CAROUSEL_ITEM_WIDTH + 16}
              decelerationRate="fast"
            />
          </View>
        )}

        {/* Recently Added */}
        {recentBooks.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Recently Added"
              colors={colors}
              onSeeAllPress={() => router.push("/(tabs)/library")}
            />
            {recentBooks.slice(0, 5).map((book) => (
              <RecentBookCard
                key={book.id}
                book={book}
                colors={colors}
                onPress={() => handleBookPress(book.id)}
                onFavoritePress={() => handleFavoritePress(book.id)}
                isFavorite={favoriteIds.has(book.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Upload FAB */}
      <TouchableOpacity
        onPress={handleUploadPress}
        style={[styles.fab, { bottom: 24 + insets.bottom }]}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[colors.primary, "#7C3AED"]}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Plus size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  heroSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  heroContent: {},
  greeting: {
    fontSize: 16,
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  streakText: {
    fontSize: 14,
    fontWeight: "600",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  searchPlaceholder: {
    fontSize: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  // Continue Reading Card
  continueCard: {
    marginHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  continueCover: {
    width: 60,
    height: 85,
    borderRadius: 8,
  },
  continueCoverPlaceholder: {
    width: 60,
    height: 85,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyBookCover: {
    width: 60,
    height: 85,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  continueTextContainer: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  continueLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  continueTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  continueSubtitle: {
    fontSize: 14,
  },
  continueAuthor: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "500",
  },
  // Featured Carousel
  carouselContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  featuredCard: {
    width: CAROUSEL_ITEM_WIDTH,
    height: CAROUSEL_ITEM_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
  },
  featuredCover: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  featuredOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 40,
  },
  featuredTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  featuredAuthor: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginBottom: 8,
  },
  featuredStats: {
    flexDirection: "row",
    gap: 12,
  },
  featuredStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  featuredStatText: {
    color: "#FFF",
    fontSize: 12,
  },
  // Categories Grid
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    width: (SCREEN_WIDTH - 40 - 24) / 3,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  categoryGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  categoryLabel: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  // Recent Books
  recentCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  recentCover: {
    width: 50,
    height: 70,
    borderRadius: 6,
  },
  recentCoverPlaceholder: {
    width: 50,
    height: 70,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  recentTextContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  recentAuthor: {
    fontSize: 13,
    marginBottom: 6,
  },
  recentMeta: {
    flexDirection: "row",
    gap: 8,
  },
  recentCategory: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  recentPages: {
    fontSize: 12,
  },
  // FAB
  fab: {
    position: "absolute",
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});
