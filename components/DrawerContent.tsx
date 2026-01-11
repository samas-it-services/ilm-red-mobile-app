// Custom Drawer Content with Admin Hierarchy

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Home,
  Library,
  Heart,
  CreditCard,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  Users,
  BookOpen,
  MessageSquare,
  Database,
  BarChart3,
  Info,
  Shield,
  LucideIcon,
} from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";

interface MenuItem {
  label: string;
  Icon: LucideIcon;
  route: string;
  badge?: number;
}

export default function DrawerContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const [adminExpanded, setAdminExpanded] = useState(false);

  const isAdmin = user?.roles?.includes("admin") || false;

  const iconSize = 22;

  const mainMenuItems: MenuItem[] = [
    { label: "Home", Icon: Home, route: "/(tabs)" },
    { label: "Library", Icon: Library, route: "/(tabs)/library" },
    { label: "Favorites", Icon: Heart, route: "/(tabs)/favorites" },
    { label: "Billing", Icon: CreditCard, route: "/(tabs)/billing" },
    { label: "Profile", Icon: User, route: "/(tabs)/profile" },
  ];

  const adminMenuItems: MenuItem[] = [
    { label: "Users", Icon: Users, route: "/admin" },
    { label: "Books", Icon: BookOpen, route: "/admin/books" },
    { label: "Chat Sessions", Icon: MessageSquare, route: "/admin/chats" },
    { label: "Cache", Icon: Database, route: "/admin/cache" },
    { label: "Statistics", Icon: BarChart3, route: "/admin/stats" },
  ];

  const bottomMenuItems: MenuItem[] = [
    { label: "About", Icon: Info, route: "/about" },
  ];

  const isActive = (route: string) => {
    if (route === "/(tabs)") {
      return pathname === "/" || pathname === "/(tabs)" || pathname === "/(tabs)/index";
    }
    return pathname.startsWith(route);
  };

  const handleNavigation = (route: string) => {
    router.push(route as never);
  };

  const handleLogout = async () => {
    await logout();
  };

  const renderMenuItem = (item: MenuItem) => {
    const active = isActive(item.route);
    const { Icon } = item;
    const iconColor = active ? colors.primary : colors.muted;

    return (
      <TouchableOpacity
        key={item.route}
        style={[
          styles.menuItem,
          { backgroundColor: active ? colors.primary + "15" : "transparent" },
        ]}
        onPress={() => handleNavigation(item.route)}
        activeOpacity={0.7}
      >
        <Icon size={iconSize} color={iconColor} />
        <Text
          style={[
            styles.menuLabel,
            { color: active ? colors.primary : colors.foreground },
          ]}
        >
          {item.label}
        </Text>
        {item.badge && item.badge > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      {/* User Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.avatarContainer}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View
              style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.avatarText}>
                {user?.display_name?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text
            style={[styles.userName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {user?.display_name || "User"}
          </Text>
          <Text
            style={[styles.userEmail, { color: colors.muted }]}
            numberOfLines={1}
          >
            {user?.email || ""}
          </Text>
          {isAdmin && (
            <View style={[styles.adminBadge, { backgroundColor: colors.primary + "20" }]}>
              <Shield size={12} color={colors.primary} />
              <Text style={[styles.adminBadgeText, { color: colors.primary }]}>
                Admin
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Scrollable Menu */}
      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {/* Main Menu */}
        <View style={styles.menuSection}>
          {mainMenuItems.map(renderMenuItem)}
        </View>

        {/* Admin Section (Only for admins) */}
        {isAdmin && (
          <View style={[styles.menuSection, { borderTopColor: colors.border, borderTopWidth: 1 }]}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setAdminExpanded(!adminExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <Shield size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                  Admin Panel
                </Text>
              </View>
              {adminExpanded ? (
                <ChevronDown size={20} color={colors.muted} />
              ) : (
                <ChevronRight size={20} color={colors.muted} />
              )}
            </TouchableOpacity>
            {adminExpanded && (
              <View style={styles.adminMenu}>
                {adminMenuItems.map(renderMenuItem)}
              </View>
            )}
          </View>
        )}

        {/* Bottom Menu */}
        <View style={[styles.menuSection, { borderTopColor: colors.border, borderTopWidth: 1 }]}>
          {bottomMenuItems.map(renderMenuItem)}
        </View>
      </ScrollView>

      {/* Logout Button */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.destructive + "15" }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={20} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  menuContainer: {
    flex: 1,
  },
  menuSection: {
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  adminMenu: {
    paddingLeft: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 10,
    borderRadius: 10,
  },
  menuLabel: {
    fontSize: 15,
    marginLeft: 14,
    flex: 1,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },
});
