// Book upload utilities

import { useState, useCallback } from "react";
import * as DocumentPicker from "expo-document-picker";
import { APP_CONFIG } from "@/constants/config";

// ============================================================================
// Types
// ============================================================================

export interface SelectedFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// ============================================================================
// Hook
// ============================================================================

export function useDocumentPicker() {
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickDocument = useCallback(async () => {
    try {
      setError(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: APP_CONFIG.ALLOWED_FILE_TYPES,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return null;
      }

      const file = result.assets[0];

      // Validate file size
      if (file.size && file.size > APP_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`File size must be less than ${APP_CONFIG.MAX_FILE_SIZE_MB}MB`);
        return null;
      }

      // Validate file extension
      const extension = file.name.toLowerCase().split(".").pop();
      const allowedExtensions = APP_CONFIG.ALLOWED_EXTENSIONS.map((ext) =>
        ext.replace(".", "")
      );

      if (!extension || !allowedExtensions.includes(extension)) {
        setError(
          `Invalid file type. Allowed: ${APP_CONFIG.ALLOWED_EXTENSIONS.join(", ")}`
        );
        return null;
      }

      const selectedFile: SelectedFile = {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/octet-stream",
        size: file.size || 0,
      };

      setSelectedFile(selectedFile);
      return selectedFile;
    } catch (err) {
      console.error("Document picker error:", err);
      setError("Failed to pick document");
      return null;
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  return {
    selectedFile,
    error,
    pickDocument,
    clearSelection,
  };
}

// ============================================================================
// Utilities
// ============================================================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

export function getFileExtension(filename: string): string {
  return filename.toLowerCase().split(".").pop() || "";
}

export function isValidFileType(filename: string): boolean {
  const extension = `.${getFileExtension(filename)}`;
  return APP_CONFIG.ALLOWED_EXTENSIONS.includes(extension);
}
