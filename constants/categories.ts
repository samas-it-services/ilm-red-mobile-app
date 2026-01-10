// Book Categories with colors and icons
// General digital library categories

export type BookCategory =
  | "popular"
  | "trending"
  | "new"
  | "classics"
  | "academic"
  | "fiction"
  | "non-fiction"
  | "science"
  | "technology"
  | "business"
  | "self-help"
  | "biography"
  | "history"
  | "children"
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
    id: "popular",
    label: "Popular",
    icon: "flame",
    color: "#EF4444", // Red-500
    bgColor: "#FEE2E2", // Red-100
    description: "Most read books this month",
  },
  {
    id: "trending",
    label: "Trending",
    icon: "trending-up",
    color: "#8B5CF6", // Violet-500
    bgColor: "#EDE9FE", // Violet-100
    description: "What's hot right now",
  },
  {
    id: "new",
    label: "New Releases",
    icon: "sparkles",
    color: "#10B981", // Emerald-500
    bgColor: "#D1FAE5", // Emerald-100
    description: "Recently added books",
  },
  {
    id: "classics",
    label: "Classics",
    icon: "book-open",
    color: "#F59E0B", // Amber-500
    bgColor: "#FEF3C7", // Amber-100
    description: "Timeless literary works",
  },
  {
    id: "academic",
    label: "Academic",
    icon: "graduation-cap",
    color: "#3B82F6", // Blue-500
    bgColor: "#DBEAFE", // Blue-100
    description: "Scholarly and research materials",
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
    id: "business",
    label: "Business",
    icon: "briefcase",
    color: "#64748B", // Slate-500
    bgColor: "#F1F5F9", // Slate-100
    description: "Business, finance, and entrepreneurship",
  },
  {
    id: "self-help",
    label: "Self-Help",
    icon: "heart",
    color: "#22C55E", // Green-500
    bgColor: "#DCFCE7", // Green-100
    description: "Personal growth and development",
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
    id: "history",
    label: "History",
    icon: "clock",
    color: "#EA580C", // Orange-600
    bgColor: "#FFEDD5", // Orange-100
    description: "Historical events and periods",
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
