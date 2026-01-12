// Book Categories with colors and icons
// Aligned with API backend (BOOK_CATEGORIES)

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
    color: "#10B981", // Emerald-500
    bgColor: "#D1FAE5", // Emerald-100
    description: "The Holy Quran and related works",
  },
  {
    id: "hadith",
    label: "Hadith",
    icon: "scroll-text",
    color: "#8B5CF6", // Violet-500
    bgColor: "#EDE9FE", // Violet-100
    description: "Prophetic traditions and sayings",
  },
  {
    id: "seerah",
    label: "Seerah",
    icon: "user-circle",
    color: "#3B82F6", // Blue-500
    bgColor: "#DBEAFE", // Blue-100
    description: "Biography of Prophet Muhammad (PBUH)",
  },
  {
    id: "fiqh",
    label: "Fiqh",
    icon: "scale",
    color: "#F59E0B", // Amber-500
    bgColor: "#FEF3C7", // Amber-100
    description: "Islamic jurisprudence and law",
  },
  {
    id: "aqidah",
    label: "Aqidah",
    icon: "heart",
    color: "#EF4444", // Red-500
    bgColor: "#FEE2E2", // Red-100
    description: "Islamic theology and belief",
  },
  {
    id: "tafsir",
    label: "Tafsir",
    icon: "book-open-check",
    color: "#14B8A6", // Teal-500
    bgColor: "#CCFBF1", // Teal-100
    description: "Quranic exegesis and interpretation",
  },
  {
    id: "history",
    label: "History",
    icon: "clock",
    color: "#EA580C", // Orange-600
    bgColor: "#FFEDD5", // Orange-100
    description: "Historical events and Islamic history",
  },
  {
    id: "spirituality",
    label: "Spirituality",
    icon: "sparkles",
    color: "#A855F7", // Purple-500
    bgColor: "#F3E8FF", // Purple-100
    description: "Spiritual growth and development",
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
    color: "#EC4899", // Pink-500
    bgColor: "#FCE7F3", // Pink-100
    description: "Novels, stories, and literature",
  },
  {
    id: "non-fiction",
    label: "Non-Fiction",
    icon: "newspaper",
    color: "#6366F1", // Indigo-500
    bgColor: "#E0E7FF", // Indigo-100
    description: "Facts, essays, and documentaries",
  },
  {
    id: "education",
    label: "Education",
    icon: "graduation-cap",
    color: "#0EA5E9", // Sky-500
    bgColor: "#E0F2FE", // Sky-100
    description: "Educational materials and textbooks",
  },
  {
    id: "science",
    label: "Science",
    icon: "flask-conical",
    color: "#14B8A6", // Teal-500
    bgColor: "#CCFBF1", // Teal-100
    description: "Scientific discoveries and research",
  },
  {
    id: "technology",
    label: "Technology",
    icon: "laptop",
    color: "#0EA5E9", // Sky-500
    bgColor: "#E0F2FE", // Sky-100
    description: "Tech, programming, and innovation",
  },
  {
    id: "biography",
    label: "Biography",
    icon: "user",
    color: "#A855F7", // Purple-500
    bgColor: "#F3E8FF", // Purple-100
    description: "Life stories and memoirs",
  },
  {
    id: "self-help",
    label: "Self-Help",
    icon: "heart-handshake",
    color: "#22C55E", // Green-500
    bgColor: "#DCFCE7", // Green-100
    description: "Personal growth and development",
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
