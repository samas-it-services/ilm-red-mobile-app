// Drawer Layout - Side navigation with hamburger menu

import React from "react";
import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTheme } from "@/providers/ThemeProvider";
import DrawerContent from "@/components/DrawerContent";

export default function DrawerLayout() {
  const { colors, isDark } = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={() => <DrawerContent />}
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
          drawerStyle: {
            backgroundColor: colors.background,
            width: 280,
          },
          drawerType: "front",
          swipeEnabled: true,
          swipeEdgeWidth: 100,
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            title: "Home",
            headerTitle: "ILM Red",
          }}
        />
        <Drawer.Screen
          name="library"
          options={{
            title: "Library",
            headerTitle: "My Library",
          }}
        />
        <Drawer.Screen
          name="favorites"
          options={{
            title: "Favorites",
            headerTitle: "Favorites",
          }}
        />
        <Drawer.Screen
          name="billing"
          options={{
            title: "Billing",
            headerTitle: "Billing",
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            title: "Profile",
            headerTitle: "Profile",
          }}
        />
        {/* Hide categories screen from drawer (accessible via home page) */}
        <Drawer.Screen
          name="categories"
          options={{
            drawerItemStyle: { display: "none" },
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
