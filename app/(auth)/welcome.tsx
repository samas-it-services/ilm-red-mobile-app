// Welcome/Landing Screen - Beautiful onboarding for new users

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import {
  BookOpen,
  MessageCircle,
  Sparkles,
  Search,
  Library,
} from "lucide-react-native";

import { useTheme } from "@/providers/ThemeProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ============================================================================
// Feature Card Component
// ============================================================================

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
  colors: any;
}

function FeatureCard({ icon, title, description, delay, colors }: FeatureCardProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    opacity.value = withDelay(delay, withSpring(1));
    translateY.value = withDelay(delay, withSpring(0));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.featureCard, { backgroundColor: colors.card }, animatedStyle]}>
      <View style={[styles.featureIconContainer, { backgroundColor: colors.primary + "20" }]}>
        {icon}
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={[styles.featureTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: colors.muted }]}>{description}</Text>
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Floating Book Animation
// ============================================================================

function FloatingBooks({ colors }: { colors: any }) {
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);

  useEffect(() => {
    float1.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    float2.value = withDelay(
      500,
      withRepeat(
        withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
    float3.value = withDelay(
      1000,
      withRepeat(
        withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, []);

  const style1 = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float1.value, [0, 1], [0, -15]) },
      { rotate: `${interpolate(float1.value, [0, 1], [-5, 5])}deg` },
    ],
  }));

  const style2 = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float2.value, [0, 1], [0, -20]) },
      { rotate: `${interpolate(float2.value, [0, 1], [5, -5])}deg` },
    ],
  }));

  const style3 = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float3.value, [0, 1], [0, -12]) },
      { rotate: `${interpolate(float3.value, [0, 1], [-3, 3])}deg` },
    ],
  }));

  return (
    <View style={styles.floatingContainer}>
      <Animated.View style={[styles.floatingBook, styles.book1, style1]}>
        <View style={[styles.bookShape, { backgroundColor: "#4F46E5" }]}>
          <BookOpen size={24} color="#FFF" />
        </View>
      </Animated.View>
      <Animated.View style={[styles.floatingBook, styles.book2, style2]}>
        <View style={[styles.bookShape, { backgroundColor: "#EC4899" }]}>
          <Library size={24} color="#FFF" />
        </View>
      </Animated.View>
      <Animated.View style={[styles.floatingBook, styles.book3, style3]}>
        <View style={[styles.bookShape, { backgroundColor: "#10B981" }]}>
          <Sparkles size={24} color="#FFF" />
        </View>
      </Animated.View>
    </View>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Animations
  const logoScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 12 });
    titleOpacity.value = withDelay(300, withSpring(1));
    buttonsOpacity.value = withDelay(800, withSpring(1));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
  }));

  const features = [
    {
      icon: <BookOpen size={24} color={colors.primary} />,
      title: "Access Any Book",
      description: "Upload PDFs, EPUBs and read anywhere",
    },
    {
      icon: <MessageCircle size={24} color={colors.primary} />,
      title: "AI Book Discussions",
      description: "Chat with AI about any book's content",
    },
    {
      icon: <Sparkles size={24} color={colors.primary} />,
      title: "Track Progress",
      description: "Monitor your reading across all devices",
    },
    {
      icon: <Search size={24} color={colors.primary} />,
      title: "Reading Communities",
      description: "Join clubs and discuss with readers",
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark
          ? ["#1a1a2e", "#16213e", "#0f3460"]
          : ["#f8fafc", "#e2e8f0", "#cbd5e1"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating Books Animation */}
      <FloatingBooks colors={colors} />

      <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
        {/* Logo & Title */}
        <Animated.View style={[styles.headerSection, logoStyle]}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>IR</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.titleSection, titleStyle]}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            ILM Red
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Read. Chat. Learn.
          </Text>
        </Animated.View>

        {/* Features */}
        <View style={styles.featuresSection}>
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={400 + index * 150}
              colors={colors}
            />
          ))}
        </View>

        {/* Buttons */}
        <Animated.View style={[styles.buttonsSection, buttonsStyle]}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(auth)/register")}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => router.push("/(auth)/login")}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
              I already have an account
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  floatingContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  floatingBook: {
    position: "absolute",
  },
  book1: {
    top: "15%",
    right: "10%",
  },
  book2: {
    top: "25%",
    left: "5%",
  },
  book3: {
    top: "8%",
    left: "40%",
  },
  bookShape: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
  },
  featuresSection: {
    flex: 1,
    justifyContent: "center",
    gap: 12,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
  },
  buttonsSection: {
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
