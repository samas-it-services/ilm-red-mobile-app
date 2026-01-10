// Card component

import React from "react";
import { View, ViewProps, TouchableOpacity, TouchableOpacityProps } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";

// ============================================================================
// Types
// ============================================================================

interface CardProps extends ViewProps {
  variant?: "default" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
}

interface PressableCardProps extends TouchableOpacityProps {
  variant?: "default" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
}

// ============================================================================
// Components
// ============================================================================

export function Card({
  variant = "default",
  padding = "md",
  style,
  children,
  ...props
}: CardProps) {
  const { colors } = useTheme();

  const paddingValues = {
    none: 0,
    sm: 8,
    md: 16,
    lg: 24,
  };

  return (
    <View
      style={[
        {
          backgroundColor: variant === "default" ? colors.card : "transparent",
          borderColor: colors.border,
          borderWidth: variant === "outlined" ? 1 : 0,
          borderRadius: 12,
          padding: paddingValues[padding],
          // Shadow for light mode
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

export function PressableCard({
  variant = "default",
  padding = "md",
  style,
  children,
  ...props
}: PressableCardProps) {
  const { colors } = useTheme();

  const paddingValues = {
    none: 0,
    sm: 8,
    md: 16,
    lg: 24,
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        {
          backgroundColor: variant === "default" ? colors.card : "transparent",
          borderColor: colors.border,
          borderWidth: variant === "outlined" ? 1 : 0,
          borderRadius: 12,
          padding: paddingValues[padding],
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}

export default Card;
