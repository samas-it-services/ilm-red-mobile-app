// Books React Query hooks

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import api, { createFormData } from "@/lib/api";
import type {
  Book,
  BookListItem,
  BookListParams,
  PaginatedResponse,
  UpdateBookRequest,
  DownloadUrlResponse,
  SuccessMessage,
  Rating,
  CreateRatingRequest,
} from "@/types/api";
import { APP_CONFIG } from "@/constants/config";

// ============================================================================
// Query Keys
// ============================================================================

export const bookKeys = {
  all: ["books"] as const,
  lists: () => [...bookKeys.all, "list"] as const,
  list: (params: BookListParams) => [...bookKeys.lists(), params] as const,
  details: () => [...bookKeys.all, "detail"] as const,
  detail: (id: string) => [...bookKeys.details(), id] as const,
  favorites: () => [...bookKeys.all, "favorites"] as const,
  myBooks: () => [...bookKeys.all, "my-books"] as const,
  ratings: (bookId: string) => [...bookKeys.detail(bookId), "ratings"] as const,
  myRating: (bookId: string) => [...bookKeys.detail(bookId), "my-rating"] as const,
};

// ============================================================================
// Fetch Functions
// ============================================================================

const fetchBooks = async (
  params: BookListParams
): Promise<PaginatedResponse<BookListItem>> => {
  const response = await api.get<PaginatedResponse<BookListItem>>("/books", {
    params,
  });
  return response.data;
};

const fetchBook = async (id: string): Promise<Book> => {
  const response = await api.get<Book>(`/books/${id}`);
  return response.data;
};

const fetchFavorites = async (
  params: BookListParams
): Promise<PaginatedResponse<BookListItem>> => {
  const response = await api.get<PaginatedResponse<BookListItem>>(
    "/books/me/favorites",
    { params }
  );
  return response.data;
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch paginated list of books
 */
export function useBooks(params: BookListParams = {}) {
  return useQuery({
    queryKey: bookKeys.list(params),
    queryFn: () =>
      fetchBooks({
        page: 1,
        page_size: APP_CONFIG.DEFAULT_PAGE_SIZE,
        ...params,
      }),
  });
}

/**
 * Fetch books with infinite scrolling
 */
export function useInfiniteBooks(params: Omit<BookListParams, "page"> = {}) {
  return useInfiniteQuery({
    queryKey: bookKeys.list({ ...params, page: undefined }),
    queryFn: ({ pageParam = 1 }) =>
      fetchBooks({
        page_size: APP_CONFIG.DEFAULT_PAGE_SIZE,
        ...params,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.has_next ? lastPage.pagination.page + 1 : undefined,
    getPreviousPageParam: (firstPage) =>
      firstPage.pagination.has_prev ? firstPage.pagination.page - 1 : undefined,
  });
}

/**
 * Fetch single book by ID
 */
export function useBook(id: string) {
  return useQuery({
    queryKey: bookKeys.detail(id),
    queryFn: () => fetchBook(id),
    enabled: !!id,
  });
}

/**
 * Fetch user's favorite books
 */
export function useFavorites(params: BookListParams = {}) {
  return useQuery({
    queryKey: bookKeys.favorites(),
    queryFn: () =>
      fetchFavorites({
        page: 1,
        page_size: APP_CONFIG.DEFAULT_PAGE_SIZE,
        ...params,
      }),
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Upload a new book
 */
export function useUploadBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      file: { uri: string; name: string; type: string };
      title: string;
      author?: string;
      description?: string;
      category?: string;
      visibility?: string;
      language?: string;
    }) => {
      const formData = createFormData(
        {
          title: data.title,
          author: data.author,
          description: data.description,
          category: data.category,
          visibility: data.visibility,
          language: data.language,
        },
        data.file
      );

      const response = await api.post("/books", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate book lists to refetch
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookKeys.myBooks() });
    },
  });
}

/**
 * Update a book
 */
export function useUpdateBook(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateBookRequest) => {
      const response = await api.patch<Book>(`/books/${bookId}`, data);
      return response.data;
    },
    onSuccess: (updatedBook) => {
      // Update cache with new data
      queryClient.setQueryData(bookKeys.detail(bookId), updatedBook);
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
    },
  });
}

/**
 * Delete a book
 */
export function useDeleteBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: string) => {
      await api.delete(`/books/${bookId}`);
      return bookId;
    },
    onSuccess: (bookId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: bookKeys.detail(bookId) });
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookKeys.favorites() });
    },
  });
}

/**
 * Add book to favorites
 */
export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: string) => {
      const response = await api.post<SuccessMessage>(
        `/books/${bookId}/favorite`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.favorites() });
    },
  });
}

/**
 * Remove book from favorites
 */
export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: string) => {
      await api.delete(`/books/${bookId}/favorite`);
      return bookId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.favorites() });
    },
  });
}

/**
 * Toggle favorite status
 */
export function useToggleFavorite() {
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  return {
    mutate: (bookId: string, isFavorite: boolean) => {
      if (isFavorite) {
        removeFavorite.mutate(bookId);
      } else {
        addFavorite.mutate(bookId);
      }
    },
    isPending: addFavorite.isPending || removeFavorite.isPending,
  };
}

/**
 * Get download URL for a book
 */
export function useBookDownloadUrl(bookId: string) {
  return useQuery({
    queryKey: [...bookKeys.detail(bookId), "download"],
    queryFn: async () => {
      const response = await api.get<DownloadUrlResponse>(
        `/books/${bookId}/download`
      );
      return response.data;
    },
    enabled: false, // Only fetch when explicitly requested
    staleTime: 30 * 60 * 1000, // 30 minutes (URL expires in 1 hour)
  });
}

// ============================================================================
// Rating Hooks
// ============================================================================

/**
 * Get ratings for a book
 */
export function useBookRatings(bookId: string) {
  return useQuery({
    queryKey: bookKeys.ratings(bookId),
    queryFn: async () => {
      const response = await api.get<Rating[]>(`/books/${bookId}/ratings`);
      return response.data;
    },
    enabled: !!bookId,
  });
}

/**
 * Get current user's rating for a book
 */
export function useMyBookRating(bookId: string) {
  return useQuery({
    queryKey: bookKeys.myRating(bookId),
    queryFn: async () => {
      const response = await api.get<Rating | null>(`/books/${bookId}/ratings/me`);
      return response.data;
    },
    enabled: !!bookId,
    retry: false, // Don't retry on 404 (no rating)
  });
}

/**
 * Add or update rating for a book
 */
export function useAddRating(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRatingRequest) => {
      const response = await api.post<Rating>(`/books/${bookId}/ratings`, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate ratings and book detail to get updated average
      queryClient.invalidateQueries({ queryKey: bookKeys.ratings(bookId) });
      queryClient.invalidateQueries({ queryKey: bookKeys.myRating(bookId) });
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
    },
  });
}

/**
 * Delete current user's rating for a book
 */
export function useDeleteRating(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/books/${bookId}/ratings`);
      return bookId;
    },
    onSuccess: () => {
      // Invalidate ratings and book detail
      queryClient.invalidateQueries({ queryKey: bookKeys.ratings(bookId) });
      queryClient.invalidateQueries({ queryKey: bookKeys.myRating(bookId) });
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
    },
  });
}
