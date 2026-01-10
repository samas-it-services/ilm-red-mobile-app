// Loading components

import React from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";

// ============================================================================
// Full Screen Loading
// ============================================================================

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text
          style={{
            color: colors.muted,
            fontSize: 14,
            marginTop: 12,
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );
}

// ============================================================================
// Inline Loading
// ============================================================================

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
}

export function LoadingSpinner({ size = "small", color }: LoadingSpinnerProps) {
  const { colors } = useTheme();

  return <ActivityIndicator size={size} color={color || colors.primary} />;
}

// ============================================================================
// Loading Overlay
// ============================================================================

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 12,
          padding: 24,
          alignItems: "center",
          minWidth: 150,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        {message && (
          <Text
            style={{
              color: colors.foreground,
              fontSize: 14,
              marginTop: 12,
              textAlign: "center",
            }}
          >
            {message}
          </Text>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// Empty State
// ============================================================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      {icon && <View style={{ marginBottom: 16 }}>{icon}</View>}
      <Text
        style={{
          color: colors.foreground,
          fontSize: 18,
          fontWeight: "600",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={{
            color: colors.muted,
            fontSize: 14,
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          {description}
        </Text>
      )}
      {action}
    </View>
  );
}

export default LoadingScreen;
