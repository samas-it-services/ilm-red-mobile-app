// Admin Panel Layout with Tab Navigation

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Tabs, useRouter, usePathname } from "expo-router";
import {
  Users,
  BookOpen,
  MessageSquare,
  Database,
  BarChart3,
  ArrowLeft,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";

export default function AdminLayout() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Check if user is admin
  const isAdmin = user?.roles?.includes("admin") || user?.roles?.includes("super_admin");

  if (!isAdmin) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <Text style={[styles.errorTitle, { color: colors.foreground }]}>
          Access Denied
        </Text>
        <Text style={[styles.errorMessage, { color: colors.muted }]}>
          You don't have permission to access the admin panel.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Admin Panel
        </Text>
        <View style={styles.headerButton} />
      </View>

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Users",
            tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="books"
          options={{
            title: "Books",
            tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="chats"
          options={{
            title: "Chats",
            tabBarIcon: ({ color, size }) => (
              <MessageSquare size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="cache"
          options={{
            title: "Cache",
            tabBarIcon: ({ color, size }) => <Database size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "Stats",
            tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
          }}
        />
        {/* Hide detail screens from tab bar */}
        <Tabs.Screen
          name="users/[id]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="books/[id]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="chats/[id]"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
