It’s written as a **single, one-shot prompt** you can paste into a Claude coding agent. It explicitly aligns to:

* **Pages-first browsing** (`GET /v1/books/{book_id}/pages`, `GET /v1/books/{book_id}/pages/{page_number}`) 
* **SSE streaming chat** (`POST /v1/chats/{session_id}/stream`) 
* **Signed URLs + TTL behavior** (page URLs return `expires_at`; dev-only `/v1/files/...` uses `expires` + `signature`)
* **Rate limit headers** (`X-RateLimit-*`, `Retry-After`) and tiers in docs

---

# Expo MVP Build Doc (One-shot Claude Agent Prompt) — ilm.red

You are Claude acting as a senior mobile engineer. Build a production-quality **Expo (React Native) + TypeScript** MVP for **ilm.red** that is **modern, sleek, minimal**, and **fast/reliable**.

open api spec is located 
/Users/bilgrami/Documents/code/big-two-projects/ilm-red/ilm-red-api/openapi/api-v1.yaml
/Users/bilgrami/Documents/code/big-two-projects/ilm-red/ilm-red-api/openapi/ilm.red-openapi.json

The app must be “thin”: **most logic stays in the API**. The client orchestrates authentication, browsing pages, streaming chat, and caching/prefetch.

You MUST implement:

* React Query data fetching hooks
* A robust SSE streaming parser module for `text/event-stream`
* A caching + prefetch algorithm optimized for **signed URLs that expire**
* MVP flows aligned to the OpenAPI spec described below

---

## 0) API contract (from OpenAPI)

### Base paths (v1)

* Auth:

  * `POST /v1/auth/register` → TokenResponse (201) 
  * `POST /v1/auth/login` → TokenResponse (200) 
  * `POST /v1/auth/refresh` → TokenResponse (200) (refresh token rotates) 
  * `POST /v1/auth/logout` → 204 
* Books:

  * `GET /v1/books` list (pagination via `page`, `page_size`) 
  * `POST /v1/books` upload book via multipart form-data 
  * `GET /v1/books/{book_id}` details 
  * `POST /v1/books/{book_id}/pages/generate` generates pages + AI chunks, returns PageGenerationResponse
  * `GET /v1/books/{book_id}/pages` returns PageListResponse (pages w/ thumbnails)
  * `GET /v1/books/{book_id}/pages/{page_number}` returns PageDetailResponse (thumbnail_url, medium_url, expires_at)
* Chat:

  * `POST /v1/chats` create session (optionally `book_id`) 
  * `GET /v1/chats/{session_id}/messages` list messages 
  * `POST /v1/chats/{session_id}/messages` send message non-streaming 
  * `POST /v1/chats/{session_id}/stream` send message streaming via SSE `text/event-stream` 
* Billing:

  * `GET /v1/billing/balance`, `GET /v1/billing/limits`, `GET /v1/billing/usage`, `GET /v1/billing/transactions`, `POST /v1/billing/estimate` 
* Files (development only):

  * `GET /v1/files/{file_path}?expires=<unix>&signature=<hmac>` validates signed access to local files; production should serve from CDN/SAS 

### Page schemas you must match

* **PageListResponse**: `{ book_id, total_pages, generation_status, pages: PageMetadata[] }` 
* **PageMetadata**: `{ page_number, width, height, thumbnail_url }` 
* **PageDetailResponse**: `{ page_number, width, height, thumbnail_url, medium_url, expires_at }` 
* **PageGenerationResponse**: `{ book_id, status, total_pages, total_chunks, message? }` 

### Rate limiting

Server may return headers:

* `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`

---

## 1) First Principles (mobile)

1. **Pages are the browsing primitive** (never load whole PDFs in-app).
2. **Signed URLs expire** → cache *metadata*, not URLs; refresh URLs on failure.
3. **Fast “time-to-first-page”** is the MVP success metric.
4. **API owns logic** (generation, chunking, cost tracking, permissions).
5. **Network is unreliable** → retries + offline-aware UI.
6. **Abuse-aware UX**: clean handling for 401/402/429.

---

## 2) MVP features (mobile)

### Must-have (ship)

* Auth: register/login/logout, refresh tokens (rotating refresh) 
* Library: list books with search filters (q, category, visibility, status) 
* Book detail: show metadata + status + “Generate pages” action
* Pages:

  * Page grid/scroll: thumbnails from `GET /pages`
  * Reader: fetch `GET /pages/{page_number}` for medium_url (and show it)
  * Prefetch next pages’ medium_url
  * URL expiry recovery
* Chat:

  * Create chat session tied to a book
  * Send message streaming via SSE
  * Persist messages list
* Billing:

  * Balance + limits
  * Cost estimate (optional but recommended preflight)
  * Handle rate limit responses with cooldown UX

### Explicitly NOT in MVP

* Annotations / bookmarks / highlights (deferred)
* Social / clubs
* Offline full book downloads

---

## 3) UX / navigation structure (expo-router)

Routes:

* `(auth)/welcome`
* `(auth)/login`
* `(tabs)/library`
* `book/[bookId]` (Book detail)
* `book/[bookId]/pages` (Page list)
* `book/[bookId]/read/[pageNumber]` (Reader)
* `book/[bookId]/chat` (Chat)
* `(tabs)/billing`
* `(tabs)/settings`

UI style: minimal, black/white/gray, soft radius, lots of whitespace, skeleton loaders.

---

## 4) Tech stack (Expo)

* Expo SDK + TypeScript
* `expo-router`
* `@tanstack/react-query`
* `zod` for runtime validation of API responses
* `expo-image` for fast image rendering/caching
* Storage:

  * `react-native-mmkv` for tokens + small state
* (Optional) `@react-native-community/netinfo`

---

## 5) API client layer (`src/lib/apiClient.ts`)

Implement:

* `request<T>(path, { method, body, headers, signal, timeoutMs })`
* Inject `Authorization: Bearer <access_token>` on authenticated calls.
* On `401`:

  * call `POST /v1/auth/refresh` with refresh token 
  * store new tokens (refresh rotates) 
  * retry once
* Implement timeouts via AbortController.
* Normalize errors: `{ status, code?, message, requestId? }`

Map common statuses:

* 401: refresh or relogin
* 402: show paywall / “not enough credits” (balance screen)
* 429: use `Retry-After` header when present 

---

## 6) React Query configuration (`src/lib/queryClient.ts`)

Defaults:

* `retry`: 2 (only network/5xx)
* `staleTime`:

  * books list: 30s
  * book detail: 60s
  * pages list: 5m
  * page detail (medium_url): 2m (URLs can expire)
  * billing balance/limits: 20s
* `gcTime`: 30m

Query keys:

* `['books', params]`
* `['book', bookId]`
* `['pages', bookId]`  // PageListResponse
* `['page', bookId, pageNumber]` // PageDetailResponse
* `['chatSession', bookId]`
* `['chatMessages', sessionId, page, page_size]`
* `['billingBalance']`, `['billingLimits']`, `['billingUsage', period]`

---

## 7) Data fetching hooks (REQUIRED)

Create `src/hooks/*` with Zod schemas reflecting the OpenAPI.

### Auth hooks

* `useRegisterMutation()`
* `useLoginMutation()`
* `useRefreshMutation()`
* `useLogoutMutation()`
* `useAuthStore()` (MMKV-backed token store)

  * `accessToken`, `refreshToken`, `setTokens()`, `clear()`

### Books hooks

* `useBooksList(params)` → `GET /v1/books` 
* `useBook(bookId)` → `GET /v1/books/{book_id}` 
* `useUploadBookMutation()` → `POST /v1/books` multipart 

### Pages hooks

* `usePagesList(bookId)` → `GET /v1/books/{book_id}/pages`
* `usePageDetail(bookId, pageNumber)` → `GET /v1/books/{book_id}/pages/{page_number}`
* `useGeneratePagesMutation(bookId)` → `POST /v1/books/{book_id}/pages/generate`

### Chat hooks

* `useCreateChatSessionMutation()` → `POST /v1/chats` (pass book_id) 
* `useChatMessages(sessionId, { page, page_size })` → `GET /v1/chats/{session_id}/messages` 
* `useSendMessageMutation(sessionId)` → non-streaming `POST /messages` 
* `useStreamMessage(sessionId)` → wraps SSE module below; calls `POST /stream` 

### Billing hooks

* `useBillingBalance()` → `GET /v1/billing/balance` 
* `useBillingLimits()` → `GET /v1/billing/limits` 
* `useBillingUsage(period)` → `GET /v1/billing/usage?period=` 
* `useCostEstimateMutation()` → `POST /v1/billing/estimate` 

---

## 8) SSE streaming parser module (REQUIRED)

Create `src/lib/sse.ts`.

Constraints:

* Must work in Expo/React Native using `fetch()` streaming (`response.body.getReader()`).
* Parse `text/event-stream` frames:

  * multiple `data:` lines per event are possible
  * blank line ends event
* Data may be JSON chunks; parse safely:

  * If JSON parse fails, treat as plain text chunk.

### API

```ts
export type SSEEvent =
  | { type: 'chunk'; content: string }
  | { type: 'done'; finishReason?: string; messageId?: string; costCents?: number; tokensIn?: number; tokensOut?: number }
  | { type: 'error'; message: string; code?: string };

export async function streamSSE(opts: {
  url: string;
  headers: Record<string, string>;
  body: unknown;             // ChatMessageCreate { content, model? } :contentReference[oaicite:46]{index=46}
  signal?: AbortSignal;
  onEvent: (ev: SSEEvent) => void;
}): Promise<void>;
```

### Chat screen behavior

* Optimistic UI:

  * append user message immediately
  * create assistant “draft bubble”
* On `chunk`: append to draft (throttle updates every ~50ms)
* On `done`: finalize message; refetch messages list
* On `error`: show inline error with Retry button

Endpoint used:

* `POST /v1/chats/{session_id}/stream` with JSON body matching ChatMessageCreate 

---

## 9) Caching + Prefetch algorithm (Reader)

### Given API shape

* `GET /pages` returns **all pages** with thumbnails (PageListResponse.pages[]). 
  This can be large; in MVP, accept it but implement rendering efficiently.

### Reader approach (MVP)

* Page list screen shows thumbnails (fast)
* Reader screen uses medium_url from PageDetailResponse

### Prefetch rules

When user opens page P:

1. Ensure `usePageDetail(P)` is loaded
2. Prefetch next pages `[P+1, P+2]` and previous `[P-1]`:

   * `queryClient.prefetchQuery(['page', bookId, next], fetchPageDetail)`
3. Prefetch should stop at bounds `[1..total_pages]`

### Signed URL expiry recovery

PageDetailResponse includes `expires_at`. 
If image fails to load (403/expired):

* Refetch page detail once (force network)
* Retry image render

### Image caching

Use `expo-image` caching. Do NOT download pages to disk in MVP.

---

## 10) Pages browsing UI implementation

### Page list screen

* Use `FlashList` (or optimized FlatList) grid (2 columns)
* Each item renders `thumbnail_url` from PageMetadata 
* Tapping navigates to Reader page N

### Reader screen

* Displays one page image (medium_url)
* Provide:

  * page indicator: “P / total”
  * next/prev buttons + swipe gesture optional
  * jump-to-page modal (input)

---

## 11) “Generate pages” flow (Book detail)

Use:

* `POST /v1/books/{book_id}/pages/generate` (returns PageGenerationResponse)

Behavior:

* Button “Generate pages”
* On success:

  * immediately refetch book detail + pages list
* Note: OpenAPI response looks like it returns completion status, but generation is described as a background job in summary. Treat it as potentially async:

  * After calling generate, poll `GET /pages` every 2s until `generation_status` becomes completed/failed (based on PageListResponse.generation_status) 

(If server doesn’t update quickly, degrade gracefully with “Processing…” and allow user to leave screen.)

---

## 12) Billing UX (cashflow-friendly)

Screens:

* Balance: show paid + free credits (CreditBalanceResponse) 
* Limits: show current usage limits (UsageLimitsResponse) 
* Usage summary (month default): `GET /billing/usage?period=month` 
* Optional: estimate cost before sending chat message via `POST /billing/estimate` 

  * Only do this if it doesn’t add friction; otherwise call it when balance is low.

Handle 402/insufficient credits by linking to Billing + Upgrade CTA.

---

## 13) Security + abuse-aware client behavior

* Respect rate limits:

  * If 429, show “Try again in X seconds”, using `Retry-After` if present 
* Avoid accidental “self-DDoS” from the app:

  * prefetch max 2 ahead
  * poll generation with backoff (2s → 4s → 8s)
* Do not expose API keys; only JWT auth in mobile.
* Media access:

  * only via signed URLs returned by API
  * dev-only `/v1/files/...` is supported by backend for local dev (do not rely on it in prod) 

---

## 14) Repo structure

```
src/
  app/
    (auth)/
      welcome.tsx
      login.tsx
    (tabs)/
      library.tsx
      billing.tsx
      settings.tsx
    book/
      [bookId]/index.tsx
      [bookId]/pages.tsx
      [bookId]/read/[pageNumber].tsx
      [bookId]/chat.tsx
  components/
    BookCard.tsx
    PageThumb.tsx
    PageViewer.tsx
    MessageBubble.tsx
    ChatComposer.tsx
    Skeleton.tsx
    ErrorState.tsx
  hooks/
    useAuth.ts
    useBooks.ts
    usePages.ts
    useChat.ts
    useBilling.ts
  lib/
    apiClient.ts
    queryClient.ts
    sse.ts
    storage.ts
    zodSchemas.ts
    errors.ts
  theme/
    colors.ts
    spacing.ts
    typography.ts
```

---

## 15) QA acceptance checklist

* Auth: login/refresh/logout works; refresh token rotates properly 
* Library: list books + pagination works 
* Book detail: generate pages triggers and shows progress using pages list status 
* Page list: thumbnails load fast; scroll smooth
* Reader: medium page loads; prefetch works; expired URL recovery works (refetch detail)
* Chat: SSE streaming renders; cancellation stops stream; messages persist 
* Billing: balance/limits show; 429 uses Retry-After; 402 routes to billing

---

## 16) Implementation order (fastest path)

1. Expo scaffold + router + theme + QueryClient provider
2. Auth + token store + refresh-on-401
3. Library list + book detail
4. Pages list + reader + prefetch + expiry recovery
5. Chat session create + messages list
6. SSE streaming module + streaming chat UX
7. Billing screens + error handling for 402/429
8. Polish (skeletons, empty states, small animations)

---

## 17) Known spec gaps / critiques (must leave TODOs)

1. **Pages list returns all pages** without pagination. For large books this is heavy; add pagination in API later (e.g., `page`, `page_size`). Current app must handle it carefully with virtualization. 
2. **Page detail only provides thumbnail + medium** (no high/ultra in this JSON). If you want zoom/deep reading, API should expose more resolutions. 
3. **No explicit “pages/status” endpoint** in this OpenAPI JSON. We rely on `PageListResponse.generation_status` + polling `/pages`. 
4. **SSE event schema isn’t defined** (response schema is generic). Implement a resilient parser that handles both JSON and plain text chunks. 

---

## 18) Deliverables you must produce

* Working Expo app implementing all MVP screens
* Typed API client with refresh rotation
* React Query hooks with Zod validation
* SSE parser module
* Reader prefetch + expiry recovery
* README with env var: `EXPO_PUBLIC_API_BASE_URL`

END.

---

# Second One-Shot Prompt for Claude Agent  
## Auto-generate TypeScript types + Zod schemas from OpenAPI, then wire into Expo app

You are Claude acting as a senior TypeScript tooling + mobile engineer. You are working inside the existing Expo MVP repo for **ilm.red**.

### Input
- Use the OpenAPI spec located at: `/mnt/data/ilm.red-openapi.json`  
  (Copy it into the repo at `./openapi/ilm.red-openapi.json` as part of your work.)

### Goal
Create a **repeatable codegen pipeline** that:
1) Generates **TypeScript API types** from OpenAPI  
2) Generates **Zod schemas** (runtime validators) from OpenAPI  
3) Exposes a clean, typed client layer usable by React Query hooks  
4) Minimizes handwritten schemas (only exceptions allowed)

### Constraints
- Keep app logic thin; API owns logic
- Must work in an Expo + TS project (Metro bundler)
- Codegen should run in Node as a dev script (not in-app)
- Ensure generated files are stable and committed (or generated during CI)

---

## A) Tooling & dependencies (choose one approach)

### Preferred approach (most practical)
Use:
- `openapi-typescript` for TS types
- `openapi-zod-client` for Zod schemas + typed fetch client (or just schemas)

Install dev deps:
```bash
npm i -D openapi-typescript openapi-zod-client
````

If your repo uses yarn/pnpm, adapt accordingly.

---

## B) Repo structure to create

Create:

```
openapi/
  ilm.red-openapi.json

src/generated/
  openapi-types.ts           # generated TS types (no runtime code)
  zod/
    schemas.ts               # generated Zod schemas for request/response bodies
    client.ts                # optional typed client wrappers (if generated)
  index.ts                   # clean exports for the app

scripts/
  codegen-openapi.mjs        # runs generation steps
```

---

## C) Implement the codegen script

Create `scripts/codegen-openapi.mjs` that:

1. Reads `openapi/ilm.red-openapi.json`
2. Runs `openapi-typescript` to output `src/generated/openapi-types.ts`
3. Runs `openapi-zod-client` to output Zod schema module(s) under `src/generated/zod/`

### Requirements for the script

* Must run cross-platform (mac/windows/linux)
* Must overwrite outputs deterministically
* Must print clear success/error logs
* Should fail the process on error (non-zero exit)

---

## D) Package.json scripts

Add:

```json
{
  "scripts": {
    "codegen:openapi": "node scripts/codegen-openapi.mjs",
    "codegen": "npm run codegen:openapi"
  }
}
```

---

## E) Integration into the Expo app

### 1) Generated exports

Create `src/generated/index.ts` that exports:

* all OpenAPI TS types
* all Zod schemas
* any typed fetch helpers

### 2) API client wrapper (still needed)

Even if openapi-zod-client generates a client, you MUST still maintain a thin app-level wrapper:
`src/lib/apiClient.ts` that:

* injects Bearer token
* refreshes token on 401 (refresh rotates)
* normalizes errors
* supports AbortController timeout

### 3) Zod validation strategy

For each React Query hook, validate responses using the generated Zod schema:

* `schema.parse(data)` for strict validation
* If schema is missing/incorrect, allow a minimal handwritten schema override in `src/lib/zodOverrides.ts` and comment why.

### 4) Hook typing strategy

React Query hooks must return strongly typed results by using:

* TS types from `openapi-types.ts` (compile-time)
* Zod parse from generated schemas (runtime)

Example pattern:

```ts
const data = await api.request('/v1/books', { ... });
return Z.BooksListResponse.parse(data);
```

Where `Z` is the generated schemas namespace.

---

## F) Fix common OpenAPI → Zod issues (you must handle)

OpenAPI codegen often produces rough edges. You must address these:

1. **Nullable + optional** mismatches

   * Ensure schemas allow `null` only when spec says so.

2. **oneOf / anyOf**

   * If generated schemas are too broad, wrap them with tighter refinement in overrides.

3. **date-time strings**

   * Keep them as strings in the schema; do NOT coerce to Date automatically.

4. **binary / multipart**

   * For upload endpoints, don’t rely on Zod body generation; implement manual form-data builder.

5. **SSE responses**

   * The streaming endpoint response schema likely isn’t well-defined. Do NOT try to Zod-validate SSE streams.
   * Only validate the request body (ChatMessageCreate) if available.

---

## G) Verification checklist (must complete)

After implementing, you must:

1. Run `npm run codegen` successfully
2. Ensure the app compiles with Expo/Metro
3. Update at least 3 key hooks to use generated Zod schemas:

   * `useBooksList`
   * `usePagesList`
   * `useBillingBalance`
4. Confirm no circular imports and no `fs` usage in runtime app code
5. Add a short `README` section: “OpenAPI Codegen”

---

## H) Deliverables

* `openapi/ilm.red-openapi.json` checked into repo
* `scripts/codegen-openapi.mjs`
* Generated outputs in `src/generated/`
* Updated `package.json` scripts
* Updated hooks using generated schemas
* Notes/TODOs for any schema override required

---

