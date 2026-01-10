// Category Chip component

import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
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
import type { CategoryInfo, BookCategory } from "@/constants/categories";

// ============================================================================
// Types
// ============================================================================

interface CategoryChipProps {
  category: CategoryInfo;
  isSelected?: boolean;
  onPress?: (categoryId: BookCategory) => void;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

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
// Component
// ============================================================================

export function CategoryChip({
  category,
  isSelected = false,
  onPress,
  size = "md",
  showIcon = true,
}: CategoryChipProps) {
  const { colors, isDark } = useTheme();

  const sizeStyles = {
    sm: { paddingH: 8, paddingV: 4, fontSize: 11, iconSize: 12 },
    md: { paddingH: 12, paddingV: 6, fontSize: 13, iconSize: 14 },
    lg: { paddingH: 16, paddingV: 8, fontSize: 15, iconSize: 18 },
  };

  const { paddingH, paddingV, fontSize, iconSize } = sizeStyles[size];

  const IconComponent = iconMap[category.icon] || Folder;

  const backgroundColor = isSelected
    ? category.color
    : isDark
      ? colors.secondary
      : category.bgColor;

  const textColor = isSelected
    ? "#FFFFFF"
    : isDark
      ? colors.foreground
      : category.color;

  return (
    <TouchableOpacity
      onPress={() => onPress?.(category.id)}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor,
        paddingHorizontal: paddingH,
        paddingVertical: paddingV,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      {showIcon && (
        <IconComponent
          size={iconSize}
          color={textColor}
          style={{ marginRight: 4 }}
        />
      )}
      <Text
        style={{
          color: textColor,
          fontSize,
          fontWeight: isSelected ? "600" : "500",
        }}
      >
        {category.label}
      </Text>
    </TouchableOpacity>
  );
}

// ============================================================================
// Category List
// ============================================================================

interface CategoryListProps {
  categories: CategoryInfo[];
  selectedCategory?: BookCategory | null;
  onSelectCategory?: (categoryId: BookCategory | null) => void;
  showAll?: boolean;
}

export function CategoryList({
  categories,
  selectedCategory,
  onSelectCategory,
  showAll = true,
}: CategoryListProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {showAll && (
        <TouchableOpacity
          onPress={() => onSelectCategory?.(null)}
          activeOpacity={0.7}
          style={{
            backgroundColor:
              selectedCategory === null
                ? colors.primary
                : isDark
                  ? colors.secondary
                  : colors.tagBg,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            marginRight: 8,
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              color:
                selectedCategory === null
                  ? "#FFFFFF"
                  : isDark
                    ? colors.foreground
                    : colors.primary,
              fontSize: 13,
              fontWeight: selectedCategory === null ? "600" : "500",
            }}
          >
            All
          </Text>
        </TouchableOpacity>
      )}

      {categories.map((category) => (
        <CategoryChip
          key={category.id}
          category={category}
          isSelected={selectedCategory === category.id}
          onPress={onSelectCategory}
        />
      ))}
    </View>
  );
}

export default CategoryChip;
