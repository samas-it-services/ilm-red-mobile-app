// Categories hook

import { useMemo } from "react";
import {
  CATEGORIES,
  getCategoryById,
  getCategoryColor,
  getCategoryBgColor,
  type BookCategory,
  type CategoryInfo,
} from "@/constants/categories";

// ============================================================================
// Hook
// ============================================================================

export function useCategories() {
  const categories = useMemo(() => CATEGORIES, []);

  return {
    categories,
    getCategoryById,
    getCategoryColor,
    getCategoryBgColor,
  };
}

// Re-export types and utilities
export type { BookCategory, CategoryInfo };
export { CATEGORIES, getCategoryById, getCategoryColor, getCategoryBgColor };
