// Button component with variants

import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
} from "react-native";
import { useTheme } from "@/providers/ThemeProvider";

// ============================================================================
// Types
// ============================================================================

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { colors, isDark } = useTheme();

  // Size styles
  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 12, fontSize: 14 },
    md: { paddingVertical: 12, paddingHorizontal: 16, fontSize: 16 },
    lg: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 18 },
  };

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: colors.buttonBg,
          borderColor: colors.buttonBg,
          textColor: colors.buttonText,
        };
      case "secondary":
        return {
          backgroundColor: colors.secondary,
          borderColor: colors.secondary,
          textColor: isDark ? colors.foreground : colors.primary,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderColor: colors.border,
          textColor: colors.foreground,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          borderColor: "transparent",
          textColor: colors.primary,
        };
      case "destructive":
        return {
          backgroundColor: colors.destructive,
          borderColor: colors.destructive,
          textColor: "#FFFFFF",
        };
      default:
        return {
          backgroundColor: colors.buttonBg,
          borderColor: colors.buttonBg,
          textColor: colors.buttonText,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const { paddingVertical, paddingHorizontal, fontSize } = sizeStyles[size];

  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      disabled={isDisabled}
      style={[
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          borderWidth: 1,
          borderRadius: 8,
          paddingVertical,
          paddingHorizontal,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.textColor}
          style={{ marginRight: children ? 8 : 0 }}
        />
      ) : leftIcon ? (
        <View style={{ marginRight: 8 }}>{leftIcon}</View>
      ) : null}

      {typeof children === "string" ? (
        <Text
          style={{
            color: variantStyles.textColor,
            fontSize,
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          {children}
        </Text>
      ) : (
        children
      )}

      {rightIcon && !isLoading && (
        <View style={{ marginLeft: 8 }}>{rightIcon}</View>
      )}
    </TouchableOpacity>
  );
}

export default Button;
