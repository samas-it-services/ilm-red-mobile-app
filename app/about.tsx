// About Screen - Company information and app details

import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Globe,
  Mail,
  Heart,
  Shield,
  FileText,
  ExternalLink,
  BookOpen,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";

import { useTheme } from "@/providers/ThemeProvider";

// App version from package.json
const appVersion = Constants.expoConfig?.version || "1.1.0";

export default function AboutScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const handleOpenLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error("Failed to open URL:", error);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "About",
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
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          padding: 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* App Logo and Name */}
        <View style={styles.logoSection}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <BookOpen size={40} color="#FFFFFF" />
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>
            ILM Red
          </Text>
          <Text style={[styles.tagline, { color: colors.muted }]}>
            Read. Chat. Learn.
          </Text>
          <View style={[styles.versionBadge, { backgroundColor: colors.card }]}>
            <Text style={[styles.versionText, { color: colors.muted }]}>
              Version {appVersion}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            About ILM Red
          </Text>
          <Text style={[styles.cardText, { color: colors.muted }]}>
            ILM Red is an AI-powered digital library that revolutionizes how you
            read and learn. Upload your books, browse page by page, and engage in
            intelligent conversations about any content using our advanced AI
            assistant.
          </Text>
        </View>

        {/* Company Info */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Developed By
          </Text>

          <View style={styles.infoRow}>
            <Building2 size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              saMas IT Services
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MapPin size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              Milpitas, California
            </Text>
          </View>

          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => handleOpenLink("https://samas.tech")}
          >
            <Globe size={20} color={colors.primary} />
            <Text style={[styles.infoTextLink, { color: colors.primary }]}>
              samas.tech
            </Text>
            <ExternalLink size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Links */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Legal & Support
          </Text>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => handleOpenLink("https://samas.tech/privacy")}
          >
            <View style={[styles.linkIcon, { backgroundColor: colors.primary + "20" }]}>
              <Shield size={18} color={colors.primary} />
            </View>
            <View style={styles.linkTextContainer}>
              <Text style={[styles.linkTitle, { color: colors.foreground }]}>
                Privacy Policy
              </Text>
              <Text style={[styles.linkSubtitle, { color: colors.muted }]}>
                How we handle your data
              </Text>
            </View>
            <ExternalLink size={18} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => handleOpenLink("https://samas.tech/terms")}
          >
            <View style={[styles.linkIcon, { backgroundColor: colors.primary + "20" }]}>
              <FileText size={18} color={colors.primary} />
            </View>
            <View style={styles.linkTextContainer}>
              <Text style={[styles.linkTitle, { color: colors.foreground }]}>
                Terms of Service
              </Text>
              <Text style={[styles.linkSubtitle, { color: colors.muted }]}>
                Rules and conditions
              </Text>
            </View>
            <ExternalLink size={18} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => handleOpenLink("mailto:support@samas.tech")}
          >
            <View style={[styles.linkIcon, { backgroundColor: colors.primary + "20" }]}>
              <Mail size={18} color={colors.primary} />
            </View>
            <View style={styles.linkTextContainer}>
              <Text style={[styles.linkTitle, { color: colors.foreground }]}>
                Contact Support
              </Text>
              <Text style={[styles.linkSubtitle, { color: colors.muted }]}>
                Get help with the app
              </Text>
            </View>
            <ExternalLink size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.muted }]}>
              Made with
            </Text>
            <Heart size={14} color={colors.destructive} fill={colors.destructive} />
            <Text style={[styles.footerText, { color: colors.muted }]}>
              in California
            </Text>
          </View>
          <Text style={[styles.copyright, { color: colors.muted }]}>
            {new Date().getFullYear()} saMas IT Services. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  logoSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    marginBottom: 12,
  },
  versionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  versionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
  },
  infoTextLink: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  linkTextContainer: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 2,
  },
  linkSubtitle: {
    fontSize: 12,
  },
  footer: {
    alignItems: "center",
    marginTop: 24,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 13,
  },
  copyright: {
    fontSize: 12,
  },
});
