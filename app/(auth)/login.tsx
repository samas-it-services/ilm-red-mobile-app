// Enhanced Login Screen - Beautiful, modern authentication

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, ArrowLeft, BookOpen, Eye, EyeOff } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ============================================================================
// Schema
// ============================================================================

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ============================================================================
// Illustration Component
// ============================================================================

function BookIllustration({ colors }: { colors: any }) {
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withSpring(1, { damping: 8, stiffness: 80 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: float.value }],
  }));

  return (
    <Animated.View style={[styles.illustrationContainer, animatedStyle]}>
      <View style={styles.bookStack}>
        <View style={[styles.bookItem, { backgroundColor: "#4F46E5", transform: [{ rotate: "-8deg" }] }]}>
          <BookOpen size={28} color="#FFF" />
        </View>
        <View style={[styles.bookItem, { backgroundColor: "#EC4899", transform: [{ rotate: "5deg" }], marginTop: -30, marginLeft: 40 }]}>
          <BookOpen size={28} color="#FFF" />
        </View>
        <View style={[styles.bookItem, { backgroundColor: "#10B981", transform: [{ rotate: "-3deg" }], marginTop: -30, marginLeft: 20 }]}>
          <BookOpen size={28} color="#FFF" />
        </View>
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Screen
// ============================================================================

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await login(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
    Haptics.selectionAsync();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark
          ? ["#1a1a2e", "#16213e", colors.background]
          : ["#f0f4ff", "#e8f0fe", colors.background]}
        style={styles.gradient}
        locations={[0, 0.3, 0.6]}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <Animated.View entering={FadeIn.delay(100)} style={styles.backButton}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButtonInner, { backgroundColor: colors.card }]}
            >
              <ArrowLeft size={20} color={colors.foreground} />
            </TouchableOpacity>
          </Animated.View>

          {/* Illustration */}
          <BookIllustration colors={colors} />

          {/* Content */}
          <View style={styles.content}>
            {/* Title */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.titleSection}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                Welcome Back
              </Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                Sign in to continue your reading journey
              </Text>
            </Animated.View>

            {/* Error Message */}
            {error && (
              <Animated.View
                entering={FadeInDown}
                style={[styles.errorContainer, { backgroundColor: `${colors.destructive}15` }]}
              >
                <Text style={[styles.errorText, { color: colors.destructive }]}>
                  {error}
                </Text>
              </Animated.View>
            )}

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.form}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputWrapper}>
                    <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: errors.email ? colors.destructive : colors.border }]}>
                      <Mail size={20} color={colors.muted} style={styles.inputIcon} />
                      <TextInput
                        placeholder="Enter your email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        style={[styles.input, { color: colors.foreground }]}
                        placeholderTextColor={colors.muted}
                      />
                    </View>
                    {errors.email && (
                      <Text style={[styles.errorLabel, { color: colors.destructive }]}>
                        {errors.email.message}
                      </Text>
                    )}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputWrapper}>
                    <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: errors.password ? colors.destructive : colors.border }]}>
                      <Lock size={20} color={colors.muted} style={styles.inputIcon} />
                      <TextInput
                        placeholder="Enter your password"
                        secureTextEntry={!showPassword}
                        autoComplete="password"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        style={[styles.input, { color: colors.foreground }]}
                        placeholderTextColor={colors.muted}
                      />
                      <TouchableOpacity onPress={togglePassword} style={styles.eyeButton}>
                        {showPassword ? (
                          <EyeOff size={20} color={colors.muted} />
                        ) : (
                          <Eye size={20} color={colors.muted} />
                        )}
                      </TouchableOpacity>
                    </View>
                    {errors.password && (
                      <Text style={[styles.errorLabel, { color: colors.destructive }]}>
                        {errors.password.message}
                      </Text>
                    )}
                  </View>
                )}
              />

              {/* Remember Me & Forgot Password */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberMe}
                  onPress={() => {
                    setRememberMe(!rememberMe);
                    Haptics.selectionAsync();
                  }}
                >
                  <View style={[styles.checkbox, { borderColor: colors.border, backgroundColor: rememberMe ? colors.primary : "transparent" }]}>
                    {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[styles.rememberMeText, { color: colors.muted }]}>
                    Remember me
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity>
                  <Text style={[styles.forgotPassword, { color: colors.primary }]}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Submit Button */}
            <Animated.View entering={FadeInDown.delay(400)} style={styles.buttonSection}>
              <TouchableOpacity
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
                activeOpacity={0.8}
                style={[styles.submitButton, { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }]}
              >
                {isLoading ? (
                  <Text style={styles.submitButtonText}>Signing in...</Text>
                ) : (
                  <Text style={styles.submitButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Register Link */}
            <Animated.View entering={FadeInDown.delay(500)} style={styles.registerSection}>
              <Text style={[styles.registerText, { color: colors.muted }]}>
                Don't have an account?{" "}
              </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={[styles.registerLink, { color: colors.primary }]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </Link>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    height: 300,
  },
  backButton: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  backButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  illustrationContainer: {
    alignItems: "center",
    marginBottom: 24,
    height: 140,
  },
  bookStack: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bookItem: {
    width: 70,
    height: 90,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  errorContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    textAlign: "center",
    fontSize: 14,
  },
  form: {
    gap: 20,
    marginBottom: 24,
  },
  inputWrapper: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  eyeButton: {
    padding: 4,
  },
  errorLabel: {
    fontSize: 12,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rememberMe: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  rememberMeText: {
    fontSize: 14,
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: "500",
  },
  buttonSection: {
    marginBottom: 24,
  },
  submitButton: {
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
  registerSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    fontSize: 15,
  },
  registerLink: {
    fontSize: 15,
    fontWeight: "600",
  },
});
