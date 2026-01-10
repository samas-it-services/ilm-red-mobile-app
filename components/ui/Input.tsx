// Input component with label and error

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";

// ============================================================================
// Types
// ============================================================================

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  secureTextEntry,
  style,
  ...props
}: InputProps) {
  const { colors } = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const hasError = !!error;
  const isPassword = secureTextEntry !== undefined;

  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text
          style={{
            color: colors.foreground,
            fontSize: 14,
            fontWeight: "500",
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.inputBg,
          borderColor: hasError ? colors.destructive : colors.inputBorder,
          borderWidth: 1,
          borderRadius: 8,
          paddingHorizontal: 12,
        }}
      >
        {leftIcon && (
          <View style={{ marginRight: 8 }}>{leftIcon}</View>
        )}

        <TextInput
          style={[
            {
              flex: 1,
              paddingVertical: 12,
              fontSize: 16,
              color: colors.foreground,
            },
            style,
          ]}
          placeholderTextColor={colors.muted}
          secureTextEntry={isPassword && !isPasswordVisible}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={{ padding: 4 }}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={colors.muted} />
            ) : (
              <Eye size={20} color={colors.muted} />
            )}
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && (
          <View style={{ marginLeft: 8 }}>{rightIcon}</View>
        )}
      </View>

      {(error || helperText) && (
        <Text
          style={{
            color: hasError ? colors.destructive : colors.muted,
            fontSize: 12,
            marginTop: 4,
          }}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

export default Input;
