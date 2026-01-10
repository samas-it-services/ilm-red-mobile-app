// Header component

import React from "react";
import { View, Text, TouchableOpacity, StatusBar } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { ArrowLeft, Menu, Bell } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/providers/ThemeProvider";

// ============================================================================
// Types
// ============================================================================

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  showNotifications?: boolean;
  rightAction?: React.ReactNode;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  transparent?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function Header({
  title,
  showBack = false,
  showMenu = false,
  showNotifications = false,
  rightAction,
  onBackPress,
  onMenuPress,
  transparent = false,
}: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={transparent ? "transparent" : colors.background}
      />
      <View
        style={{
          backgroundColor: transparent ? "transparent" : colors.background,
          paddingTop: insets.top,
          borderBottomWidth: transparent ? 0 : 1,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            height: 56,
            paddingHorizontal: 16,
          }}
        >
          {/* Left Section */}
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            {showBack && (
              <TouchableOpacity
                onPress={handleBack}
                style={{
                  padding: 8,
                  marginLeft: -8,
                  marginRight: 8,
                }}
              >
                <ArrowLeft size={24} color={colors.foreground} />
              </TouchableOpacity>
            )}

            {showMenu && (
              <TouchableOpacity
                onPress={onMenuPress}
                style={{
                  padding: 8,
                  marginLeft: -8,
                  marginRight: 8,
                }}
              >
                <Menu size={24} color={colors.foreground} />
              </TouchableOpacity>
            )}

            {title && (
              <Text
                numberOfLines={1}
                style={{
                  color: colors.foreground,
                  fontSize: 18,
                  fontWeight: "600",
                  flex: 1,
                }}
              >
                {title}
              </Text>
            )}
          </View>

          {/* Right Section */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {showNotifications && (
              <TouchableOpacity
                style={{ padding: 8 }}
              >
                <Bell size={24} color={colors.foreground} />
              </TouchableOpacity>
            )}

            {rightAction}
          </View>
        </View>
      </View>
    </>
  );
}

// ============================================================================
// Screen Header (with safe area)
// ============================================================================

interface ScreenHeaderProps extends HeaderProps {
  subtitle?: string;
}

export function ScreenHeader({ title, subtitle, ...props }: ScreenHeaderProps) {
  const { colors } = useTheme();

  return (
    <View>
      <Header title={title} {...props} />
      {subtitle && (
        <View
          style={{
            backgroundColor: colors.background,
            paddingHorizontal: 16,
            paddingBottom: 8,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 14 }}>{subtitle}</Text>
        </View>
      )}
    </View>
  );
}

export default Header;
