// Search hooks: library search, my library counts and search history, all through api.ilm.red.
//
// One engine for the website, this app and assistants (GET /v1/search): books by title, author and
// tags; words inside pages, in the original and every saved translation; Urdu and Arabic letter
// shapes and vowel marks; English word forms. 20 results per page, top 200 in all.
// The retired Azure /search and /search/suggestions endpoints are no longer called.

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ilmApi } from "@/lib/ilmApi";

// ============================================================================
// Types (openapi/books.yaml SearchResults, openapi/me.yaml SearchEntry and LibraryCounts)
// ============================================================================

export interface SearchBookRef {
  id: string;
  title: string;
  author: string | null;
  slug: string | null;
  language: string | null;
  cover_url: string | null;
  category: { slug: string; name?: string } | null;
}

export type SearchHit =
  | { kind: "book"; book: SearchBookRef; matched_field: string; match_type: string; snippet: string | null; url: string; score: number }
  | { kind: "page"; book: SearchBookRef; page: number; lang: string; is_translation: boolean; snippet: string | null; match_count: number; url: string; score: number }
  | { kind: "author"; author: string; book_count: number; url: string; score: number }
  | { kind: "person"; user: { id: string; username: string | null; display_name: string; avatar_url: string | null }; url: string; score: number }
  | { kind: "club"; club: { id: string; name: string }; url: string; score: number }
  | { kind: "question"; question: { id: string; title: string }; url: string; score: number };

export interface SearchHint { code: string; message: string }

export interface SearchPage {
  data: SearchHit[];
  next_cursor: string | null;
  total: number;
  total_capped: boolean;
  hint: SearchHint | null;
}

export interface SearchEntry {
  id: string;
  query: string;
  kind: string | null;
  book: { id: string; title: string } | null;
  result_count: number | null;
  source: "web" | "app" | "api" | "assistant";
  assistant: string | null;
  created_at: string;
}

export interface VisibilityCount { books: number; with_text: number; processing: number; papers?: number }

export interface LibraryCounts {
  public: VisibilityCount | null;
  members: VisibilityCount | null;
  private: VisibilityCount | null;
  shared: VisibilityCount | null;
  total: number;
  private_shared_with_agent: boolean;
}

// Operations added in the search release; the synced client knows them, the cast keeps this file
// independent of how strictly each generated signature is typed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const call = ilmApi.call as any as (tag: string, op: string, args?: Record<string, unknown>) => Promise<any>;

// ============================================================================
// Library search
// ============================================================================

/**
 * Search the library. `kind` "book" finds books by title, author and tags; "page" finds words
 * inside pages. Pages of 20, following the cursor, up to 200.
 */
export function useLibrarySearch(query: string, kind: "book" | "page", options?: { bookId?: string }) {
  const q = query.trim();
  return useInfiniteQuery({
    queryKey: ["search", kind, q, options?.bookId ?? null],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) =>
      (await call("books", "searchLibrary", {
        query: {
          q,
          kind,
          limit: 20,
          ...(options?.bookId ? { book_id: options.bookId, lang: "all" } : {}),
          ...(pageParam ? { cursor: pageParam } : {}),
        },
      })) as SearchPage,
    getNextPageParam: (last) => last.next_cursor,
    enabled: q.length >= 2,
    staleTime: 30_000,
  });
}

// ============================================================================
// My library
// ============================================================================

/** How many books I have, by who can see them. Signed-in members only. */
export function useMyLibraryCounts(enabled: boolean) {
  return useQuery({
    queryKey: ["me", "library"],
    queryFn: async () => (await call("me", "getMyLibrary", {})) as LibraryCounts,
    enabled,
    staleTime: 60_000,
  });
}

// ============================================================================
// Search history (off by default; the member turns it on)
// ============================================================================

export function useSearchHistoryEnabled(enabled: boolean) {
  return useQuery({
    queryKey: ["me", "preferences", "search_history"],
    queryFn: async () => Boolean((await call("me", "getMyPreferences", {}))?.search_history),
    enabled,
  });
}

export function useMySearches(enabled: boolean, limit = 10) {
  return useQuery({
    queryKey: ["me", "searches", limit],
    queryFn: async () => (await call("me", "listMySearches", { query: { limit } })) as { data: SearchEntry[]; next_cursor: string | null },
    enabled,
    staleTime: 10_000,
  });
}

function useRefreshHistory() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["me", "preferences", "search_history"] });
    void qc.invalidateQueries({ queryKey: ["me", "searches"] });
  };
}

/** Turn history on, or off (deleting what is saved unless `keep`). */
export function useSetSearchHistory() {
  const refresh = useRefreshHistory();
  return useMutation({
    mutationFn: async (v: { on: boolean; keep?: boolean }) =>
      call("me", "updateMyPreferences", {
        body: { search_history: v.on, ...(v.on ? {} : { delete_search_history: !v.keep }) },
      }),
    onSuccess: refresh,
  });
}

export function useClearSearches() {
  const refresh = useRefreshHistory();
  return useMutation({ mutationFn: async () => call("me", "clearMySearches", {}), onSuccess: refresh });
}

export function useDeleteSearch() {
  const refresh = useRefreshHistory();
  return useMutation({
    mutationFn: async (id: string) => call("me", "deleteMySearch", { path: { search_id: id } }),
    onSuccess: refresh,
  });
}

// ============================================================================
// Helpers
// ============================================================================

/** "<mark>word</mark>" and «word» snippets → text parts with the matched words flagged. */
export function snippetParts(snippet: string | null | undefined): Array<{ text: string; hit: boolean }> {
  if (!snippet) return [];
  const clean = snippet.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  const out: Array<{ text: string; hit: boolean }> = [];
  const re = /<mark>(.*?)<\/mark>|«(.*?)»/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) {
    if (m.index > last) out.push({ text: clean.slice(last, m.index), hit: false });
    out.push({ text: m[1] ?? m[2] ?? "", hit: true });
    last = m.index + m[0].length;
  }
  if (last < clean.length) out.push({ text: clean.slice(last), hit: false });
  return out;
}

/** True when the text is mostly right-to-left script (Urdu, Arabic, Persian). */
export const isRtl = (s: string | null | undefined) => /[֐-ࣿיִ-﷿ﹰ-﻿]/.test(s ?? "");
