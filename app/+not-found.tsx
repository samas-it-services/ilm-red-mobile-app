// 404 Not Found Screen

import React from "react";
import { View, Text } from "react-native";
import { Link, Stack } from "expo-router";
import { FileQuestion } from "lucide-react-native";

import { useTheme } from "@/providers/ThemeProvider";
import { Button } from "@/components/ui/Button";

export default function NotFoundScreen() {
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <FileQuestion size={64} color={colors.muted} style={{ marginBottom: 24 }} />
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: colors.foreground,
            marginBottom: 8,
          }}
        >
          Page Not Found
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: colors.muted,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          The page you're looking for doesn't exist or has been moved.
        </Text>
        <Link href="/(tabs)" asChild>
          <Button>Go to Home</Button>
        </Link>
      </View>
    </>
  );
}
