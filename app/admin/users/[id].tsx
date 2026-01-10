// Admin User Detail Screen

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Shield,
  ShieldOff,
  Ban,
  Check,
  MapPin,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/providers/ThemeProvider";
import {
  useAdminUser,
  useUpdateAdminUser,
  useDisableUser,
} from "@/hooks/useAdmin";

export default function AdminUserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const { data: user, isLoading, refetch } = useAdminUser(id!);
  const updateUser = useUpdateAdminUser();
  const disableUser = useDisableUser();

  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleAdmin = useCallback(async () => {
    if (!user) return;

    const isAdmin = user.roles?.includes("admin");
    const action = isAdmin ? "remove admin privileges from" : "grant admin privileges to";

    Alert.alert(
      isAdmin ? "Remove Admin" : "Make Admin",
      `Are you sure you want to ${action} ${user.display_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setIsUpdating(true);
            try {
              const newRoles = isAdmin
                ? (user.roles || []).filter((r) => r !== "admin")
                : [...(user.roles || []), "admin"];

              await updateUser.mutateAsync({
                userId: id!,
                data: { roles: newRoles },
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              refetch();
            } catch (error) {
              Alert.alert("Error", "Failed to update user roles");
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  }, [user, id, updateUser, refetch]);

  const handleToggleStatus = useCallback(async () => {
    if (!user) return;

    const isSuspended = user.status === "suspended";
    const action = isSuspended ? "reactivate" : "suspend";

    Alert.alert(
      isSuspended ? "Reactivate User" : "Suspend User",
      `Are you sure you want to ${action} ${user.display_name}? ${
        !isSuspended ? "They will no longer be able to access the app." : ""
      }`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: isSuspended ? "default" : "destructive",
          onPress: async () => {
            setIsUpdating(true);
            try {
              await updateUser.mutateAsync({
                userId: id!,
                data: { status: isSuspended ? "active" : "suspended" },
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              refetch();
            } catch (error) {
              Alert.alert("Error", "Failed to update user status");
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  }, [user, id, updateUser, refetch]);

  const handleDisableAccount = useCallback(async () => {
    if (!user) return;

    Alert.alert(
      "Disable Account",
      `Are you sure you want to permanently disable ${user.display_name}'s account? This action is difficult to reverse.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable",
          style: "destructive",
          onPress: async () => {
            setIsUpdating(true);
            try {
              await disableUser.mutateAsync(id!);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch (error) {
              Alert.alert("Error", "Failed to disable account");
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  }, [user, id, disableUser, router]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.errorText, { color: colors.foreground }]}>
          User not found
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

  const isAdmin = user.roles?.includes("admin");
  const isSuspended = user.status === "suspended";

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "User Details",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
              <ArrowLeft size={24} color={colors.foreground} />
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.foreground },
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        {/* User Header */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <View
            style={[styles.avatar, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.avatarText}>
              {user.display_name?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
          <Text style={[styles.displayName, { color: colors.foreground }]}>
            {user.display_name}
          </Text>
          <Text style={[styles.username, { color: colors.muted }]}>
            @{user.username}
          </Text>

          <View style={styles.badges}>
            {isAdmin && (
              <View style={[styles.badge, { backgroundColor: colors.primary + "20" }]}>
                <Shield size={14} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  Admin
                </Text>
              </View>
            )}
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    user.status === "active"
                      ? "#10B98120"
                      : user.status === "suspended"
                      ? "#F59E0B20"
                      : "#EF444420",
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color:
                      user.status === "active"
                        ? "#10B981"
                        : user.status === "suspended"
                        ? "#F59E0B"
                        : "#EF4444",
                  },
                ]}
              >
                {user.status || "active"}
              </Text>
            </View>
          </View>
        </View>

        {/* User Info */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Account Information
          </Text>

          <View style={styles.infoRow}>
            <Mail size={18} color={colors.muted} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                Email
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {user.email}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Calendar size={18} color={colors.muted} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                Joined
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {formatDate(user.created_at)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Calendar size={18} color={colors.muted} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                Last Login
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {formatDate(user.last_login_at)}
              </Text>
            </View>
          </View>

          {user.bio && (
            <View style={styles.infoRow}>
              <User size={18} color={colors.muted} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.muted }]}>
                  Bio
                </Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>
                  {user.bio}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Admin Actions
          </Text>

          <TouchableOpacity
            onPress={handleToggleAdmin}
            disabled={isUpdating}
            style={[
              styles.actionButton,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            {isAdmin ? (
              <ShieldOff size={20} color="#F59E0B" />
            ) : (
              <Shield size={20} color={colors.primary} />
            )}
            <Text style={[styles.actionText, { color: colors.foreground }]}>
              {isAdmin ? "Remove Admin Role" : "Make Admin"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleStatus}
            disabled={isUpdating}
            style={[
              styles.actionButton,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            {isSuspended ? (
              <Check size={20} color="#10B981" />
            ) : (
              <Ban size={20} color="#F59E0B" />
            )}
            <Text style={[styles.actionText, { color: colors.foreground }]}>
              {isSuspended ? "Reactivate Account" : "Suspend Account"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDisableAccount}
            disabled={isUpdating || user.status === "deleted"}
            style={[
              styles.dangerButton,
              { opacity: user.status === "deleted" ? 0.5 : 1 },
            ]}
          >
            <Ban size={20} color="#FFFFFF" />
            <Text style={styles.dangerButtonText}>Disable Account</Text>
          </TouchableOpacity>
        </View>

        {isUpdating && (
          <View style={styles.updatingOverlay}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 16,
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
  header: {
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "bold",
  },
  displayName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    marginBottom: 12,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  section: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "500",
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    marginTop: 6,
  },
  dangerButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  updatingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
});
