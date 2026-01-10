// Book Categories with colors and icons
// Matching ilm-red-unbound website

export type BookCategory =
  | "quran"
  | "hadith"
  | "seerah"
  | "fiqh"
  | "aqidah"
  | "tafsir"
  | "history"
  | "spirituality"
  | "children"
  | "fiction"
  | "non-fiction"
  | "education"
  | "science"
  | "technology"
  | "biography"
  | "self-help"
  | "other";

export interface CategoryInfo {
  id: BookCategory;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: "quran",
    label: "Quran",
    icon: "book-open",
    color: "#2563EB", // Blue-600
    bgColor: "#DBEAFE", // Blue-100
    description: "Quran studies and translations",
  },
  {
    id: "hadith",
    label: "Hadith",
    icon: "scroll-text",
    color: "#7C3AED", // Violet-600
    bgColor: "#EDE9FE", // Violet-100
    description: "Prophetic traditions and narrations",
  },
  {
    id: "seerah",
    label: "Seerah",
    icon: "user",
    color: "#4F46E5", // Indigo-600
    bgColor: "#E0E7FF", // Indigo-100
    description: "Biography of Prophet Muhammad",
  },
  {
    id: "fiqh",
    label: "Fiqh",
    icon: "scale",
    color: "#059669", // Emerald-600
    bgColor: "#D1FAE5", // Emerald-100
    description: "Islamic jurisprudence",
  },
  {
    id: "aqidah",
    label: "Aqidah",
    icon: "heart",
    color: "#DC2626", // Red-600
    bgColor: "#FEE2E2", // Red-100
    description: "Islamic theology and beliefs",
  },
  {
    id: "tafsir",
    label: "Tafsir",
    icon: "message-square",
    color: "#0891B2", // Cyan-600
    bgColor: "#CFFAFE", // Cyan-100
    description: "Quranic exegesis and interpretation",
  },
  {
    id: "history",
    label: "History",
    icon: "clock",
    color: "#EA580C", // Orange-600
    bgColor: "#FFEDD5", // Orange-100
    description: "Islamic and world history",
  },
  {
    id: "spirituality",
    label: "Spirituality",
    icon: "sparkles",
    color: "#DB2777", // Pink-600
    bgColor: "#FCE7F3", // Pink-100
    description: "Tasawwuf and spiritual development",
  },
  {
    id: "children",
    label: "Children",
    icon: "baby",
    color: "#E11D48", // Rose-600
    bgColor: "#FFE4E6", // Rose-100
    description: "Books for young readers",
  },
  {
    id: "fiction",
    label: "Fiction",
    icon: "book",
    color: "#2563EB", // Blue-600
    bgColor: "#DBEAFE", // Blue-100
    description: "Novels and stories",
  },
  {
    id: "non-fiction",
    label: "Non-Fiction",
    icon: "lightbulb",
    color: "#CA8A04", // Yellow-600
    bgColor: "#FEF9C3", // Yellow-100
    description: "Educational and informative books",
  },
  {
    id: "education",
    label: "Education",
    icon: "graduation-cap",
    color: "#0D9488", // Teal-600
    bgColor: "#CCFBF1", // Teal-100
    description: "Academic and learning materials",
  },
  {
    id: "science",
    label: "Science",
    icon: "flask-conical",
    color: "#16A34A", // Green-600
    bgColor: "#DCFCE7", // Green-100
    description: "Scientific literature",
  },
  {
    id: "technology",
    label: "Technology",
    icon: "laptop",
    color: "#9333EA", // Purple-600
    bgColor: "#F3E8FF", // Purple-100
    description: "Tech and computing books",
  },
  {
    id: "biography",
    label: "Biography",
    icon: "user-circle",
    color: "#4F46E5", // Indigo-600
    bgColor: "#E0E7FF", // Indigo-100
    description: "Life stories and memoirs",
  },
  {
    id: "self-help",
    label: "Self Help",
    icon: "star",
    color: "#EC4899", // Pink-500
    bgColor: "#FCE7F3", // Pink-100
    description: "Personal development",
  },
  {
    id: "other",
    label: "Other",
    icon: "folder",
    color: "#6B7280", // Gray-500
    bgColor: "#F3F4F6", // Gray-100
    description: "Miscellaneous books",
  },
];

export const getCategoryById = (id: BookCategory): CategoryInfo | undefined => {
  return CATEGORIES.find((cat) => cat.id === id);
};

export const getCategoryColor = (id: BookCategory): string => {
  return getCategoryById(id)?.color ?? "#6B7280";
};

export const getCategoryBgColor = (id: BookCategory): string => {
  return getCategoryById(id)?.bgColor ?? "#F3F4F6";
};
