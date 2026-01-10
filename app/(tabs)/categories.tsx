// Categories Screen

import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Book,
  Lightbulb,
  FlaskConical,
  Laptop,
  Clock,
  User,
  Star,
  GraduationCap,
  Baby,
  Folder,
  BookOpen,
  ScrollText,
  Scale,
  Heart,
  MessageSquare,
  Sparkles,
} from "lucide-react-native";

import { useTheme } from "@/providers/ThemeProvider";
import { useCategories } from "@/hooks/useCategories";
import { PressableCard } from "@/components/ui/Card";

// ============================================================================
// Icon Map
// ============================================================================

const iconMap: Record<string, React.ComponentType<any>> = {
  "book-open": BookOpen,
  "scroll-text": ScrollText,
  user: User,
  scale: Scale,
  heart: Heart,
  "message-square": MessageSquare,
  clock: Clock,
  sparkles: Sparkles,
  baby: Baby,
  book: Book,
  lightbulb: Lightbulb,
  "graduation-cap": GraduationCap,
  "flask-conical": FlaskConical,
  laptop: Laptop,
  "user-circle": User,
  star: Star,
  folder: Folder,
};

// ============================================================================
// Screen
// ============================================================================

export default function CategoriesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { categories } = useCategories();

  const handleCategoryPress = (categoryId: string) => {
    // Navigate to home with category filter
    router.push({
      pathname: "/(tabs)",
      params: { category: categoryId },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 16,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: colors.foreground,
            paddingTop: 12,
          }}
        >
          Categories
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
          Browse books by category
        </Text>
      </View>

      {/* Categories Grid */}
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {categories.map((category) => {
            const IconComponent = iconMap[category.icon] || Folder;

            return (
              <PressableCard
                key={category.id}
                onPress={() => handleCategoryPress(category.id)}
                style={{
                  width: "48%",
                  marginBottom: 16,
                  backgroundColor: colors.card,
                }}
                padding="md"
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: category.bgColor,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <IconComponent size={24} color={category.color} />
                </View>

                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.foreground,
                    marginBottom: 4,
                  }}
                >
                  {category.label}
                </Text>

                <Text
                  numberOfLines={2}
                  style={{
                    fontSize: 12,
                    color: colors.muted,
                    lineHeight: 16,
                  }}
                >
                  {category.description}
                </Text>
              </PressableCard>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
