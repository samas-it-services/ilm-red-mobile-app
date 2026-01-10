// Enhanced Register Screen - Multi-step wizard with beautiful animations

import React, { useState, useEffect, useCallback } from "react";
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
import {
  Mail,
  Lock,
  User,
  AtSign,
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  BookOpen,
  Sparkles,
  Users,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInRight,
  FadeOutLeft,
  SlideInRight,
  SlideOutLeft,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ============================================================================
// Constants
// ============================================================================

const BOOK_CATEGORIES = [
  { id: "fiction", label: "Fiction", icon: "📖" },
  { id: "non-fiction", label: "Non-Fiction", icon: "📰" },
  { id: "science", label: "Science", icon: "🔬" },
  { id: "technology", label: "Technology", icon: "💻" },
  { id: "business", label: "Business", icon: "💼" },
  { id: "self-help", label: "Self-Help", icon: "🌱" },
  { id: "history", label: "History", icon: "🏛️" },
  { id: "biography", label: "Biography", icon: "👤" },
];

const AVATAR_COLORS = [
  "#4F46E5", // Indigo
  "#EC4899", // Pink
  "#10B981", // Green
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#EF4444", // Red
  "#84CC16", // Lime
];

// ============================================================================
// Schema
// ============================================================================

const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must be less than 50 characters")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, underscores, and hyphens"
      ),
    display_name: z
      .string()
      .min(1, "Display name is required")
      .max(100, "Display name must be less than 100 characters"),
    avatarColor: z.string().optional(),
    categories: z.array(z.string()).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// ============================================================================
// Password Strength Component
// ============================================================================

function PasswordStrength({ password }: { password: string }) {
  const { colors } = useTheme();

  const getStrength = useCallback((pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return Math.min(score, 4);
  }, []);

  const strength = getStrength(password);

  const strengthConfig = [
    { label: "Weak", color: "#EF4444" },
    { label: "Fair", color: "#F59E0B" },
    { label: "Good", color: "#84CC16" },
    { label: "Strong", color: "#10B981" },
    { label: "Excellent", color: "#06B6D4" },
  ];

  const config = strengthConfig[strength] || strengthConfig[0];

  if (!password) return null;

  return (
    <Animated.View entering={FadeIn} style={styles.strengthContainer}>
      <View style={styles.strengthBars}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.strengthBar,
              {
                backgroundColor: index < strength ? config.color : colors.border,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.strengthLabel, { color: config.color }]}>
        {config.label}
      </Text>
    </Animated.View>
  );
}

// ============================================================================
// Progress Dots Component
// ============================================================================

function ProgressDots({ currentStep, totalSteps, colors }: { currentStep: number; totalSteps: number; colors: any }) {
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View key={index} style={styles.progressDotWrapper}>
          <Animated.View
            style={[
              styles.progressDot,
              {
                backgroundColor: index <= currentStep ? colors.primary : colors.border,
                transform: [{ scale: index === currentStep ? 1.2 : 1 }],
              },
            ]}
          >
            {index < currentStep && (
              <Check size={10} color="#FFF" strokeWidth={3} />
            )}
          </Animated.View>
          {index < totalSteps - 1 && (
            <View
              style={[
                styles.progressLine,
                { backgroundColor: index < currentStep ? colors.primary : colors.border },
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// Step Components
// ============================================================================

interface StepProps {
  control: any;
  errors: any;
  colors: any;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
  watch: any;
}

function Step1Email({ control, errors, colors, showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword, watch }: StepProps) {
  const password = watch("password");

  return (
    <Animated.View
      entering={SlideInRight.duration(300)}
      exiting={SlideOutLeft.duration(300)}
      style={styles.stepContent}
    >
      <View style={styles.stepHeader}>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>
          Create Your Account
        </Text>
        <Text style={[styles.stepSubtitle, { color: colors.muted }]}>
          Start with your email and a secure password
        </Text>
      </View>

      <View style={styles.formFields}>
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
                  placeholder="Create a password"
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={[styles.input, { color: colors.foreground }]}
                  placeholderTextColor={colors.muted}
                />
                <TouchableOpacity
                  onPress={() => {
                    setShowPassword(!showPassword);
                    Haptics.selectionAsync();
                  }}
                  style={styles.eyeButton}
                >
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
              <PasswordStrength password={password || ""} />
            </View>
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputWrapper}>
              <Text style={[styles.label, { color: colors.foreground }]}>Confirm Password</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: errors.confirmPassword ? colors.destructive : colors.border }]}>
                <Lock size={20} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  placeholder="Confirm your password"
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={[styles.input, { color: colors.foreground }]}
                  placeholderTextColor={colors.muted}
                />
                <TouchableOpacity
                  onPress={() => {
                    setShowConfirmPassword(!showConfirmPassword);
                    Haptics.selectionAsync();
                  }}
                  style={styles.eyeButton}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={colors.muted} />
                  ) : (
                    <Eye size={20} color={colors.muted} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={[styles.errorLabel, { color: colors.destructive }]}>
                  {errors.confirmPassword.message}
                </Text>
              )}
            </View>
          )}
        />
      </View>
    </Animated.View>
  );
}

interface Step2Props {
  control: any;
  errors: any;
  colors: any;
  selectedAvatarColor: string;
  setSelectedAvatarColor: (color: string) => void;
  watch: any;
}

function Step2Profile({ control, errors, colors, selectedAvatarColor, setSelectedAvatarColor, watch }: Step2Props) {
  const displayName = watch("display_name") || "";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <Animated.View
      entering={SlideInRight.duration(300)}
      exiting={SlideOutLeft.duration(300)}
      style={styles.stepContent}
    >
      <View style={styles.stepHeader}>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>
          Your Profile
        </Text>
        <Text style={[styles.stepSubtitle, { color: colors.muted }]}>
          Tell us a bit about yourself
        </Text>
      </View>

      {/* Avatar Preview */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatarPreview, { backgroundColor: selectedAvatarColor }]}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
        <View style={styles.avatarColors}>
          {AVATAR_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              onPress={() => {
                setSelectedAvatarColor(color);
                Haptics.selectionAsync();
              }}
              style={[
                styles.avatarColorOption,
                { backgroundColor: color },
                selectedAvatarColor === color && styles.avatarColorSelected,
              ]}
            >
              {selectedAvatarColor === color && (
                <Check size={16} color="#FFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formFields}>
        <Controller
          control={control}
          name="display_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputWrapper}>
              <Text style={[styles.label, { color: colors.foreground }]}>Display Name</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: errors.display_name ? colors.destructive : colors.border }]}>
                <User size={20} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  placeholder="Enter your name"
                  autoComplete="name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={[styles.input, { color: colors.foreground }]}
                  placeholderTextColor={colors.muted}
                />
              </View>
              {errors.display_name && (
                <Text style={[styles.errorLabel, { color: colors.destructive }]}>
                  {errors.display_name.message}
                </Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputWrapper}>
              <Text style={[styles.label, { color: colors.foreground }]}>Username</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: errors.username ? colors.destructive : colors.border }]}>
                <AtSign size={20} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  placeholder="Choose a username"
                  autoCapitalize="none"
                  autoComplete="username"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={[styles.input, { color: colors.foreground }]}
                  placeholderTextColor={colors.muted}
                />
              </View>
              {errors.username && (
                <Text style={[styles.errorLabel, { color: colors.destructive }]}>
                  {errors.username.message}
                </Text>
              )}
              <Text style={[styles.helperText, { color: colors.muted }]}>
                This will be your unique identifier
              </Text>
            </View>
          )}
        />
      </View>
    </Animated.View>
  );
}

interface Step3Props {
  colors: any;
  selectedCategories: string[];
  toggleCategory: (id: string) => void;
}

function Step3Preferences({ colors, selectedCategories, toggleCategory }: Step3Props) {
  return (
    <Animated.View
      entering={SlideInRight.duration(300)}
      exiting={SlideOutLeft.duration(300)}
      style={styles.stepContent}
    >
      <View style={styles.stepHeader}>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>
          Your Interests
        </Text>
        <Text style={[styles.stepSubtitle, { color: colors.muted }]}>
          Select categories you're interested in (optional)
        </Text>
      </View>

      <View style={styles.categoriesGrid}>
        {BOOK_CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          return (
            <TouchableOpacity
              key={category.id}
              onPress={() => {
                toggleCategory(category.id);
                Haptics.selectionAsync();
              }}
              style={[
                styles.categoryCard,
                { backgroundColor: colors.card, borderColor: isSelected ? colors.primary : colors.border },
                isSelected && { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  { color: isSelected ? colors.primary : colors.foreground },
                ]}
              >
                {category.label}
              </Text>
              {isSelected && (
                <View style={[styles.categoryCheck, { backgroundColor: colors.primary }]}>
                  <Check size={12} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.socialProof, { backgroundColor: colors.card }]}>
        <Users size={20} color={colors.primary} />
        <Text style={[styles.socialProofText, { color: colors.muted }]}>
          Join <Text style={{ color: colors.primary, fontWeight: "600" }}>10,000+</Text> readers on ILM Red
        </Text>
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

export default function RegisterScreen() {
  const { register } = useAuth();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedAvatarColor, setSelectedAvatarColor] = useState(AVATAR_COLORS[0]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      username: "",
      display_name: "",
      avatarColor: AVATAR_COLORS[0],
      categories: [],
    },
    mode: "onChange",
  });

  const toggleCategory = useCallback((id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }, []);

  const validateStep = async (step: number) => {
    switch (step) {
      case 0:
        return await trigger(["email", "password", "confirmPassword"]);
      case 1:
        return await trigger(["username", "display_name"]);
      case 2:
        return true;
      default:
        return true;
    }
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep((prev) => Math.min(prev + 1, 2));
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const prevStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await register({
        email: data.email,
        username: data.username,
        display_name: data.display_name,
        password: data.password,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 2) {
      nextStep();
    } else {
      handleSubmit(onSubmit)();
    }
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={currentStep === 0 ? () => router.back() : prevStep}
              style={[styles.backButton, { backgroundColor: colors.card }]}
            >
              <ArrowLeft size={20} color={colors.foreground} />
            </TouchableOpacity>

            <ProgressDots
              currentStep={currentStep}
              totalSteps={3}
              colors={colors}
            />

            <View style={{ width: 44 }} />
          </View>

          {/* Error Message */}
          {error && (
            <Animated.View
              entering={FadeIn}
              style={[styles.errorContainer, { backgroundColor: `${colors.destructive}15` }]}
            >
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {error}
              </Text>
            </Animated.View>
          )}

          {/* Step Content */}
          <View style={styles.content}>
            {currentStep === 0 && (
              <Step1Email
                control={control}
                errors={errors}
                colors={colors}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                showConfirmPassword={showConfirmPassword}
                setShowConfirmPassword={setShowConfirmPassword}
                watch={watch}
              />
            )}
            {currentStep === 1 && (
              <Step2Profile
                control={control}
                errors={errors}
                colors={colors}
                selectedAvatarColor={selectedAvatarColor}
                setSelectedAvatarColor={setSelectedAvatarColor}
                watch={watch}
              />
            )}
            {currentStep === 2 && (
              <Step3Preferences
                colors={colors}
                selectedCategories={selectedCategories}
                toggleCategory={toggleCategory}
              />
            )}
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navigation}>
            <TouchableOpacity
              onPress={handleNext}
              disabled={isLoading}
              activeOpacity={0.8}
              style={[
                styles.nextButton,
                { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 },
              ]}
            >
              {isLoading ? (
                <Text style={styles.nextButtonText}>Creating Account...</Text>
              ) : (
                <>
                  <Text style={styles.nextButtonText}>
                    {currentStep === 2 ? "Create Account" : "Continue"}
                  </Text>
                  {currentStep < 2 && <ArrowRight size={20} color="#FFF" />}
                </>
              )}
            </TouchableOpacity>

            {currentStep === 0 && (
              <View style={styles.loginLink}>
                <Text style={[styles.loginText, { color: colors.muted }]}>
                  Already have an account?{" "}
                </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text style={[styles.loginLinkText, { color: colors.primary }]}>
                      Sign In
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  backButton: {
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
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressDotWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  progressLine: {
    width: 32,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
  },
  formFields: {
    gap: 20,
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
  helperText: {
    fontSize: 12,
  },
  errorContainer: {
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    textAlign: "center",
    fontSize: 14,
  },
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  strengthBars: {
    flexDirection: "row",
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    height: 4,
    flex: 1,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "500",
    minWidth: 60,
    textAlign: "right",
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
  },
  avatarColors: {
    flexDirection: "row",
    gap: 8,
  },
  avatarColorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarColorSelected: {
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  categoryCard: {
    width: (SCREEN_WIDTH - 48 - 12) / 2,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    position: "relative",
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  categoryCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  socialProof: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  socialProofText: {
    fontSize: 14,
  },
  navigation: {
    paddingHorizontal: 24,
    gap: 16,
  },
  nextButton: {
    height: 56,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
  loginLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontSize: 15,
  },
  loginLinkText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
