// Upload Book Screen

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  Upload,
  FileText,
  ChevronDown,
  Globe,
  Lock,
  Users,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/providers/ThemeProvider";
import { useUploadBook } from "@/hooks/useBooks";
import { useDocumentPicker, formatFileSize } from "@/hooks/useUpload";
import { useCategories, CATEGORIES, type BookCategory } from "@/hooks/useCategories";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { LoadingOverlay } from "@/components/ui/Loading";

// ============================================================================
// Schema
// ============================================================================

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  author: z.string().max(255).optional(),
  description: z.string().max(5000).optional(),
  category: z.string().default("other"),
  visibility: z.enum(["public", "private", "friends"]).default("private"),
  language: z.string().max(10).default("en"),
});

type UploadFormData = z.infer<typeof uploadSchema>;

// ============================================================================
// Screen
// ============================================================================

export default function UploadScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { categories } = useCategories();

  const { selectedFile, error: fileError, pickDocument, clearSelection } =
    useDocumentPicker();
  const uploadBook = useUploadBook();

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      author: "",
      description: "",
      category: "other",
      visibility: "private",
      language: "en",
    },
  });

  const selectedCategory = watch("category");
  const selectedVisibility = watch("visibility");
  const categoryInfo = CATEGORIES.find((c) => c.id === selectedCategory);

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const handlePickFile = async () => {
    const file = await pickDocument();
    if (file && !watch("title")) {
      // Auto-fill title from filename
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setValue("title", nameWithoutExt);
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    if (!selectedFile) {
      Alert.alert("Error", "Please select a file to upload");
      return;
    }

    try {
      await uploadBook.mutateAsync({
        file: {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.type,
        },
        title: data.title,
        author: data.author || undefined,
        description: data.description || undefined,
        category: data.category,
        visibility: data.visibility,
        language: data.language,
      });

      Alert.alert("Success", "Book uploaded successfully!", [
        { text: "OK", onPress: handleClose },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to upload book");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LoadingOverlay
        visible={uploadBook.isPending}
        message="Uploading book..."
      />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={handleClose} style={{ padding: 8 }}>
          <X size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: colors.foreground,
          }}
        >
          Upload Book
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 100,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* File Picker */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.foreground,
              marginBottom: 8,
            }}
          >
            Book File *
          </Text>

          {selectedFile ? (
            <Card style={{ marginBottom: 24 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      backgroundColor: colors.secondary,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                    }}
                  >
                    <FileText size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: colors.foreground,
                      }}
                    >
                      {selectedFile.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted }}>
                      {formatFileSize(selectedFile.size)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={clearSelection} style={{ padding: 8 }}>
                  <X size={20} color={colors.muted} />
                </TouchableOpacity>
              </View>
            </Card>
          ) : (
            <TouchableOpacity
              onPress={handlePickFile}
              style={{
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: fileError ? colors.destructive : colors.border,
                borderRadius: 12,
                padding: 32,
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Upload size={40} color={colors.muted} style={{ marginBottom: 12 }} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "500",
                  color: colors.foreground,
                  marginBottom: 4,
                }}
              >
                Select a file
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                PDF, EPUB, or TXT (max 500MB)
              </Text>
            </TouchableOpacity>
          )}

          {fileError && (
            <Text style={{ color: colors.destructive, fontSize: 12, marginTop: -16, marginBottom: 16 }}>
              {fileError}
            </Text>
          )}

          {/* Title */}
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Title *"
                placeholder="Enter book title"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.title?.message}
              />
            )}
          />

          {/* Author */}
          <Controller
            control={control}
            name="author"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Author"
                placeholder="Enter author name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.author?.message}
              />
            )}
          />

          {/* Description */}
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Description"
                placeholder="Enter book description"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={4}
                style={{ height: 100, textAlignVertical: "top" }}
                error={errors.description?.message}
              />
            )}
          />

          {/* Category Picker */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: colors.foreground,
              marginBottom: 6,
            }}
          >
            Category
          </Text>
          <TouchableOpacity
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              marginBottom: showCategoryPicker ? 8 : 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {categoryInfo && (
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    backgroundColor: categoryInfo.bgColor,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 8,
                  }}
                />
              )}
              <Text style={{ fontSize: 16, color: colors.foreground }}>
                {categoryInfo?.label || "Select category"}
              </Text>
            </View>
            <ChevronDown size={20} color={colors.muted} />
          </TouchableOpacity>

          {showCategoryPicker && (
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 16,
                maxHeight: 200,
              }}
            >
              <ScrollView nestedScrollEnabled>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => {
                      setValue("category", cat.id);
                      setShowCategoryPicker(false);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 12,
                      backgroundColor:
                        selectedCategory === cat.id ? colors.secondary : "transparent",
                    }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        backgroundColor: cat.bgColor,
                        marginRight: 12,
                      }}
                    />
                    <Text style={{ fontSize: 14, color: colors.foreground }}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Visibility */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: colors.foreground,
              marginBottom: 8,
            }}
          >
            Visibility
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
            {[
              { value: "public", label: "Public", icon: Globe },
              { value: "private", label: "Private", icon: Lock },
              { value: "friends", label: "Friends", icon: Users },
            ].map(({ value, label, icon: Icon }) => (
              <TouchableOpacity
                key={value}
                onPress={() => setValue("visibility", value as any)}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor:
                    selectedVisibility === value ? colors.primary : colors.secondary,
                }}
              >
                <Icon
                  size={16}
                  color={selectedVisibility === value ? "#FFFFFF" : colors.foreground}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: selectedVisibility === value ? "#FFFFFF" : colors.foreground,
                  }}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Submit Button */}
          <Button
            onPress={handleSubmit(onSubmit)}
            isLoading={uploadBook.isPending}
            disabled={!selectedFile}
            leftIcon={<Upload size={20} color="#FFFFFF" />}
          >
            Upload Book
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
