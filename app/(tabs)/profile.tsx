// Profile Screen

import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch, Image } from "react-native";
import { useRouter } from "expo-router";
import {
  User,
  Mail,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Settings,
  HelpCircle,
  Shield,
  BookOpen,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// ============================================================================
// Screen
// ============================================================================

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const { colors, isDark, toggleTheme, themePreference, setThemePreference } = useTheme();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    await logout();
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
          Profile
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card */}
        <Card style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* Avatar */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.primary,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 16,
              }}
            >
              {user?.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  style={{ width: 72, height: 72, borderRadius: 36 }}
                />
              ) : (
                <Text style={{ fontSize: 28, fontWeight: "bold", color: "#FFFFFF" }}>
                  {user?.display_name?.charAt(0).toUpperCase() || "U"}
                </Text>
              )}
            </View>

            {/* User Details */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  color: colors.foreground,
                  marginBottom: 4,
                }}
              >
                {user?.display_name || "User"}
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted }}>
                @{user?.username || "username"}
              </Text>
              <Text
                style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}
                numberOfLines={1}
              >
                {user?.email}
              </Text>
            </View>
          </View>
        </Card>

        {/* Theme Settings */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: colors.muted,
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Appearance
        </Text>

        <Card style={{ marginBottom: 24 }}>
          {/* Dark Mode Toggle */}
          <TouchableOpacity
            onPress={toggleTheme}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 4,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {isDark ? (
                <Moon size={22} color={colors.foreground} style={{ marginRight: 12 }} />
              ) : (
                <Sun size={22} color={colors.foreground} style={{ marginRight: 12 }} />
              )}
              <Text style={{ fontSize: 16, color: colors.foreground }}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>
        </Card>

        {/* Account Settings */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: colors.muted,
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Account
        </Text>

        <Card style={{ marginBottom: 24 }} padding="none">
          <SettingsItem
            icon={<BookOpen size={22} color={colors.foreground} />}
            label="My Uploads"
            onPress={() => {}}
            colors={colors}
          />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <SettingsItem
            icon={<Settings size={22} color={colors.foreground} />}
            label="Settings"
            onPress={() => {}}
            colors={colors}
          />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <SettingsItem
            icon={<Shield size={22} color={colors.foreground} />}
            label="Privacy"
            onPress={() => {}}
            colors={colors}
          />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <SettingsItem
            icon={<HelpCircle size={22} color={colors.foreground} />}
            label="Help & Support"
            onPress={() => {}}
            colors={colors}
          />
        </Card>

        {/* Logout */}
        <Button
          variant="destructive"
          onPress={handleLogout}
          isLoading={isLoading}
          leftIcon={<LogOut size={20} color="#FFFFFF" />}
        >
          Sign Out
        </Button>

        {/* Version */}
        <Text
          style={{
            textAlign: "center",
            color: colors.muted,
            fontSize: 12,
            marginTop: 24,
          }}
        >
          ILM Red v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Settings Item Component
// ============================================================================

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  colors: any;
}

function SettingsItem({ icon, label, onPress, colors }: SettingsItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {icon}
        <Text
          style={{
            fontSize: 16,
            color: colors.foreground,
            marginLeft: 12,
          }}
        >
          {label}
        </Text>
      </View>
      <ChevronRight size={20} color={colors.muted} />
    </TouchableOpacity>
  );
}
