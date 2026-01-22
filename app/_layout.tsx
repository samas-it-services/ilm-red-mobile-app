// Root Layout - wraps the entire app with providers

import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider, useTheme } from "@/providers/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import "@/global.css";

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash screen might already be hidden or unavailable
});

// ============================================================================
// Auth Guard Component
// ============================================================================

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to welcome if not authenticated
      router.replace("/(auth)/welcome");
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if authenticated but on auth screen
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  return <>{children}</>;
}

// ============================================================================
// Root Navigation
// ============================================================================

function RootNavigation() {
  const { colors, isDark } = useTheme();
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {
        // Splash screen might already be hidden
      });
    }
  }, [isLoading]);

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <AuthGuard>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="book/[id]"
            options={{
              presentation: "card",
            }}
          />
          <Stack.Screen
            name="book/[id]/pages"
            options={{
              presentation: "card",
            }}
          />
          <Stack.Screen
            name="book/[id]/read/[page]"
            options={{
              presentation: "fullScreenModal",
              animation: "fade",
            }}
          />
          <Stack.Screen
            name="book/[id]/chat"
            options={{
              presentation: "card",
            }}
          />
          <Stack.Screen
            name="upload"
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
        </Stack>
      </AuthGuard>
    </>
  );
}

// ============================================================================
// Root Layout
// ============================================================================

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <RootNavigation />
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
