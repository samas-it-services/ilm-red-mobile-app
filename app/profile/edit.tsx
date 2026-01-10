// Edit Profile Screen

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { ArrowLeft, Check, User, MapPin, Calendar, FileText } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useUpdateProfile, UpdateProfileRequest, UserExtraData } from "@/hooks/useProfile";

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, updateUser } = useAuth();
  const insets = useSafeAreaInsets();
  const updateProfile = useUpdateProfile();

  // Form state
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [fullName, setFullName] = useState((user as any)?.extra_data?.full_name || "");
  const [city, setCity] = useState((user as any)?.extra_data?.city || "");
  const [stateProvince, setStateProvince] = useState((user as any)?.extra_data?.state_province || "");
  const [country, setCountry] = useState((user as any)?.extra_data?.country || "");
  const [dateOfBirth, setDateOfBirth] = useState((user as any)?.extra_data?.date_of_birth || "");

  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const originalDisplayName = user?.display_name || "";
    const originalBio = user?.bio || "";
    const originalExtraData = (user as any)?.extra_data || {};

    const changed =
      displayName !== originalDisplayName ||
      bio !== originalBio ||
      fullName !== (originalExtraData.full_name || "") ||
      city !== (originalExtraData.city || "") ||
      stateProvince !== (originalExtraData.state_province || "") ||
      country !== (originalExtraData.country || "") ||
      dateOfBirth !== (originalExtraData.date_of_birth || "");

    setHasChanges(changed);
  }, [displayName, bio, fullName, city, stateProvince, country, dateOfBirth, user]);

  const handleSave = async () => {
    if (!hasChanges) return;

    try {
      const data: UpdateProfileRequest = {};

      if (displayName !== user?.display_name) {
        data.display_name = displayName.trim();
      }

      if (bio !== (user?.bio || "")) {
        data.bio = bio.trim();
      }

      const extraData: UserExtraData = {};
      const originalExtraData = (user as any)?.extra_data || {};

      if (fullName !== (originalExtraData.full_name || "")) {
        extraData.full_name = fullName.trim() || undefined;
      }
      if (city !== (originalExtraData.city || "")) {
        extraData.city = city.trim() || undefined;
      }
      if (stateProvince !== (originalExtraData.state_province || "")) {
        extraData.state_province = stateProvince.trim() || undefined;
      }
      if (country !== (originalExtraData.country || "")) {
        extraData.country = country.trim() || undefined;
      }
      if (dateOfBirth !== (originalExtraData.date_of_birth || "")) {
        extraData.date_of_birth = dateOfBirth.trim() || undefined;
      }

      if (Object.keys(extraData).length > 0) {
        data.extra_data = extraData;
      }

      const updatedUser = await updateProfile.mutateAsync(data);
      updateUser(updatedUser);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to update profile");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Edit Profile",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
              <ArrowLeft size={24} color={colors.foreground} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              disabled={!hasChanges || updateProfile.isPending}
              style={{ padding: 8, opacity: hasChanges ? 1 : 0.5 }}
            >
              {updateProfile.isPending ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Check size={24} color={hasChanges ? colors.primary : colors.muted} />
              )}
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.foreground },
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          padding: 24,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic Info Section */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Basic Information
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Username
          </Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <User size={18} color={colors.muted} />
            <Text style={[styles.readOnlyText, { color: colors.muted }]}>
              @{user?.username}
            </Text>
          </View>
          <Text style={[styles.hint, { color: colors.muted }]}>
            Username cannot be changed
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Display Name *
          </Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <User size={18} color={colors.muted} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your display name"
              placeholderTextColor={colors.muted}
              maxLength={100}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Bio
          </Text>
          <View
            style={[
              styles.inputContainer,
              styles.textAreaContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[styles.textArea, { color: colors.foreground }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>
          <Text style={[styles.charCount, { color: colors.muted }]}>
            {bio.length}/500
          </Text>
        </View>

        {/* Extended Profile Section */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>
          Extended Profile
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Full Name
          </Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <User size={18} color={colors.muted} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full legal name"
              placeholderTextColor={colors.muted}
              maxLength={200}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            City
          </Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <MapPin size={18} color={colors.muted} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={city}
              onChangeText={setCity}
              placeholder="Your city"
              placeholderTextColor={colors.muted}
              maxLength={100}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            State / Province
          </Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <MapPin size={18} color={colors.muted} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={stateProvince}
              onChangeText={setStateProvince}
              placeholder="Your state or province"
              placeholderTextColor={colors.muted}
              maxLength={100}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Country
          </Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <MapPin size={18} color={colors.muted} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={country}
              onChangeText={setCountry}
              placeholder="Your country"
              placeholderTextColor={colors.muted}
              maxLength={100}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Date of Birth
          </Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Calendar size={18} color={colors.muted} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              maxLength={10}
            />
          </View>
          <Text style={[styles.hint, { color: colors.muted }]}>
            Format: YYYY-MM-DD (e.g., 1990-05-15)
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: hasChanges ? colors.primary : colors.muted,
              opacity: updateProfile.isPending ? 0.7 : 1,
            },
          ]}
          onPress={handleSave}
          disabled={!hasChanges || updateProfile.isPending}
        >
          {updateProfile.isPending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  textAreaContainer: {
    height: "auto",
    minHeight: 100,
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    margin: 0,
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    margin: 0,
    textAlignVertical: "top",
    minHeight: 80,
  },
  readOnlyText: {
    flex: 1,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  saveButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
