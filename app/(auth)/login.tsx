// Sign-in screen: Google everywhere, Apple on iPhone. Same accounts as ilm.red; a first sign-in
// creates the account, so there is no separate sign-up form.

import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, BookOpen } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as AppleAuthentication from "expo-apple-authentication";

import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { appleSignInAvailable, SignInCancelled } from "@/lib/auth";

export default function LoginScreen() {
  const { signInWithGoogle, signInWithApple } = useAuth();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"google" | "apple" | null>(null);
  const [appleOk, setAppleOk] = useState(false);

  useEffect(() => {
    appleSignInAvailable().then(setAppleOk).catch(() => setAppleOk(false));
  }, []);

  const go = async (which: "google" | "apple") => {
    setError(null);
    setBusy(which);
    try {
      await (which === "google" ? signInWithGoogle() : signInWithApple());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      if (!(e instanceof SignInCancelled)) {
        setError("Sign-in didn't go through. Check your connection and try again.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
      <TouchableOpacity
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/(auth)/welcome"))}
        style={styles.back}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <ArrowLeft size={24} color={colors.foreground} />
      </TouchableOpacity>

      <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <BookOpen size={32} color="#FFF" />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Sign in to ilm.red</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Use the same account as the website. New here? Signing in creates your account.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(250)} style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => go("google")}
          disabled={busy !== null}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          {busy === "google" ? (
            <ActivityIndicator color={colors.foreground} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.foreground }]}>Continue with Google</Text>
          )}
        </TouchableOpacity>

        {Platform.OS === "ios" && appleOk && (
          busy === "apple" ? (
            <View style={[styles.button, { backgroundColor: isDark ? "#FFF" : "#000" }]}>
              <ActivityIndicator color={isDark ? "#000" : "#FFF"} />
            </View>
          ) : (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={isDark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                                  : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={14}
              style={styles.appleButton}
              onPress={() => go("apple")}
            />
          )
        )}

        {error && (
          <Text style={[styles.error, { color: colors.destructive }]} accessibilityLiveRegion="polite">
            {error}
          </Text>
        )}
      </Animated.View>

      <Text style={[styles.legal, { color: colors.muted }]}>
        By continuing you agree to the ilm.red Terms of Use and Privacy Policy.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24 },
  back: { width: 44, height: 44, justifyContent: "center" },
  header: { alignItems: "center", marginTop: 32 },
  logo: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 15, lineHeight: 22, textAlign: "center", marginTop: 8, maxWidth: 320 },
  buttons: { marginTop: 40, gap: 12 },
  button: { height: 54, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  buttonText: { fontSize: 16, fontWeight: "600" },
  appleButton: { height: 54, width: "100%" },
  error: { fontSize: 14, textAlign: "center", marginTop: 4 },
  legal: { fontSize: 12, textAlign: "center", marginTop: "auto" },
});
