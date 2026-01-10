# ILM Red Mobile App - Technical Design Document (TDD)

**Version:** 1.1.0
**Date:** 2026-01-10
**Author:** saMas IT Services
**Status:** Approved

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ILM Red Mobile App                        │
├─────────────────────────────────────────────────────────────┤
│  Screens (expo-router)                                       │
│  ├── (auth)/ - Welcome, Login, Register                     │
│  ├── (tabs)/ - Home, Library, Favorites, Billing, Profile   │
│  ├── admin/  - Users, Books, Chats, Cache, Stats            │
│  ├── book/[id]/ - Detail, Pages, Chat, PDF                  │
│  └── profile/ - Edit                                         │
├─────────────────────────────────────────────────────────────┤
│  State Management                                            │
│  ├── React Query (@tanstack/react-query) - Server state     │
│  ├── Context (AuthProvider, ThemeProvider) - App state      │
│  └── AsyncStorage - Persistence                              │
├─────────────────────────────────────────────────────────────┤
│  API Layer (lib/api.ts)                                      │
│  ├── Axios instance with interceptors                        │
│  ├── JWT token management                                    │
│  └── Error handling                                          │
├─────────────────────────────────────────────────────────────┤
│  Hooks Layer                                                 │
│  ├── useBooks.ts - Book CRUD, ratings, downloads            │
│  ├── useAuth.ts - Authentication                             │
│  ├── useProfile.ts - Profile updates                         │
│  ├── useAdmin.ts - Admin operations                          │
│  └── useSearch.ts - Global search                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    ILM Red API (FastAPI)                     │
├─────────────────────────────────────────────────────────────┤
│  Endpoints: /auth, /users, /books, /chat, /admin, /search   │
│  Database: PostgreSQL with JSONB                             │
│  Cache: Redis                                                │
│  Storage: Azure Blob                                         │
│  AI: OpenAI/Azure OpenAI                                     │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Expo | SDK 54 |
| UI Framework | React Native | 0.76+ |
| Navigation | expo-router | v4 |
| State Management | @tanstack/react-query | 5.x |
| Animations | react-native-reanimated | 3.x |
| HTTP Client | Axios | 1.x |
| Forms | react-hook-form + zod | 7.x |
| Storage | expo-secure-store, AsyncStorage | - |
| PDF Viewer | react-native-pdf | 6.x |
| Icons | lucide-react-native | - |

---

## 2. Directory Structure

```
ilm-red-mobile-app/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Auth group (unauthenticated)
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                   # Tab group (authenticated)
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Home
│   │   ├── library.tsx
│   │   ├── favorites.tsx
│   │   ├── billing.tsx
│   │   └── profile.tsx
│   ├── admin/                    # Admin screens
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Users
│   │   ├── books.tsx
│   │   ├── books/[id].tsx
│   │   ├── chats.tsx
│   │   ├── chats/[id].tsx
│   │   ├── cache.tsx
│   │   ├── stats.tsx
│   │   └── users/[id].tsx
│   ├── book/
│   │   ├── [id].tsx              # Book detail
│   │   └── [id]/
│   │       ├── read/[page].tsx   # Page reader
│   │       ├── chat.tsx          # AI chat
│   │       └── pdf.tsx           # PDF viewer
│   ├── profile/
│   │   └── edit.tsx              # Edit profile
│   ├── about.tsx                 # About screen
│   └── _layout.tsx               # Root layout
├── components/
│   ├── ui/                       # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── LoadingSpinner.tsx
│   ├── RatingModal.tsx           # Star rating component
│   └── GlobalSearch.tsx          # Search bar component
├── hooks/
│   ├── useBooks.ts               # Book operations
│   ├── useAuth.ts                # Auth operations
│   ├── useProfile.ts             # Profile updates
│   ├── useAdmin.ts               # Admin operations
│   └── useSearch.ts              # Search operations
├── providers/
│   ├── AuthProvider.tsx          # Auth context
│   ├── ThemeProvider.tsx         # Theme context
│   └── QueryProvider.tsx         # React Query provider
├── lib/
│   ├── api.ts                    # Axios instance
│   └── storage.ts                # Storage utilities
├── types/
│   └── api.ts                    # TypeScript interfaces
├── constants/
│   ├── colors.ts                 # Theme colors
│   └── categories.ts             # Book categories
└── docs/
    ├── PRD.md                    # Product Requirements
    └── TDD.md                    # Technical Design (this file)
```

---

## 3. Core Components

### 3.1 Navigation Architecture

```typescript
// Root layout structure
app/
├── _layout.tsx                   // Stack navigator (root)
│   ├── (auth)/_layout.tsx        // Stack navigator (unauth)
│   ├── (tabs)/_layout.tsx        // Tab navigator (auth)
│   ├── admin/_layout.tsx         // Tab navigator (admin)
│   └── [Dynamic routes]          // Stack screens
```

**Navigation Flow:**
1. App checks auth state in root layout
2. Unauthenticated → Redirect to `/(auth)/welcome`
3. Authenticated → Show `/(tabs)/` with bottom tabs
4. Admin users see additional Admin tab

### 3.2 State Management

#### 3.2.1 Server State (React Query)

```typescript
// hooks/useBooks.ts
export function useBooks(params?: BookQueryParams) {
  return useQuery({
    queryKey: ['books', params],
    queryFn: () => api.get('/books', { params }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAddRating(bookId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { rating: number; review?: string }) =>
      api.post(`/books/${bookId}/ratings`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['book', bookId]);
    },
  });
}
```

#### 3.2.2 App State (Context)

```typescript
// providers/AuthProvider.tsx
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}
```

### 3.3 API Layer

```typescript
// lib/api.ts
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 30000,
});

// Request interceptor - Add auth token
api.interceptors.request.use((config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('token');
      router.replace('/(auth)/login');
    }
    return Promise.reject(error);
  }
);
```

---

## 4. Feature Implementations

### 4.1 Book Rating System

**Components:**
- `components/RatingModal.tsx` - Modal with star rating UI
- `hooks/useBooks.ts` - Rating hooks

**API Endpoints:**
- `POST /books/{id}/ratings` - Add/update rating
- `GET /books/{id}/ratings` - Get ratings for book
- `DELETE /books/{id}/ratings` - Remove user's rating

**Implementation:**
```typescript
// components/RatingModal.tsx
interface RatingModalProps {
  visible: boolean;
  bookId: string;
  existingRating?: number;
  onClose: () => void;
}

function RatingModal({ visible, bookId, existingRating, onClose }: RatingModalProps) {
  const [rating, setRating] = useState(existingRating || 0);
  const [review, setReview] = useState('');
  const { mutate: addRating, isLoading } = useAddRating(bookId);

  const handleSubmit = () => {
    addRating({ rating, review }, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
      },
    });
  };

  return (
    <Modal visible={visible} animationType="slide">
      <StarRatingInput value={rating} onChange={setRating} />
      <TextInput placeholder="Review (optional)" value={review} onChangeText={setReview} />
      <Button onPress={handleSubmit} loading={isLoading}>Submit Rating</Button>
    </Modal>
  );
}
```

### 4.2 PDF Reader

**Dependencies:**
```bash
npx expo install react-native-pdf react-native-blob-util
```

**Implementation:**
```typescript
// app/book/[id]/pdf.tsx
import Pdf from 'react-native-pdf';

export default function PDFReaderScreen() {
  const { id } = useLocalSearchParams();
  const { data: downloadUrl } = useBookDownloadUrl(id as string);

  return (
    <View style={{ flex: 1 }}>
      <Pdf
        source={{ uri: downloadUrl }}
        style={{ flex: 1 }}
        onLoadComplete={(pages) => console.log(`Loaded ${pages} pages`)}
        onError={(error) => console.error(error)}
        enablePaging
        horizontal
      />
    </View>
  );
}
```

### 4.3 Global Search

**Components:**
- `components/GlobalSearch.tsx` - Search bar with autocomplete
- `hooks/useSearch.ts` - Search hooks

**API Endpoints:**
- `GET /search?q={query}` - Full-text search
- `GET /search/suggestions?q={query}` - Autocomplete

**Implementation:**
```typescript
// hooks/useSearch.ts
export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => api.get('/search', { params: { q: query } }),
    enabled: query.length >= 2,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: ['search', 'suggestions', query],
    queryFn: () => api.get('/search/suggestions', { params: { q: query } }),
    enabled: query.length >= 1,
    staleTime: 30 * 1000,
  });
}
```

### 4.4 Admin Panel

**Structure:**
```
app/admin/
├── _layout.tsx        # Tab navigation with icons
├── index.tsx          # Users management
├── books.tsx          # Books with processing actions
├── books/[id].tsx     # Book detail with actions
├── chats.tsx          # Chat sessions list
├── chats/[id].tsx     # Chat detail with messages
├── cache.tsx          # Redis cache management
├── stats.tsx          # System statistics dashboard
└── users/[id].tsx     # User detail/edit
```

**Access Control:**
```typescript
// app/(tabs)/_layout.tsx
const { user } = useAuth();
const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('super_admin');

return (
  <Tabs>
    {/* Standard tabs */}
    {isAdmin && (
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color }) => <Shield size={24} color={color} />,
        }}
      />
    )}
  </Tabs>
);
```

**Admin Hooks:**
```typescript
// hooks/useAdmin.ts
export function useAdminUsers(params?: AdminUserParams) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => api.get('/admin/users', { params }),
  });
}

export function useTriggerPageGeneration(bookId: string) {
  return useMutation({
    mutationFn: () => api.post(`/admin/books/${bookId}/generate-pages`),
  });
}

export function useTriggerThumbnails(bookId: string) {
  return useMutation({
    mutationFn: () => api.post(`/admin/books/${bookId}/generate-thumbnails`),
  });
}

export function useTriggerAIProcessing(bookId: string) {
  return useMutation({
    mutationFn: () => api.post(`/admin/books/${bookId}/process-ai`),
  });
}

export function useSystemStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get('/admin/stats'),
    refetchInterval: 60 * 1000, // Refresh every minute
  });
}
```

### 4.5 Edit Profile

**Extended Fields (extra_data):**
```typescript
// types/api.ts
interface UserExtraData {
  full_name?: string;
  city?: string;
  state_province?: string;
  country?: string;
  date_of_birth?: string;
  [key: string]: any; // Future-proof extensibility
}

interface UserUpdateRequest {
  display_name?: string;
  bio?: string;
  extra_data?: UserExtraData;
}
```

**Implementation:**
```typescript
// hooks/useProfile.ts
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  return useMutation({
    mutationFn: (data: UserUpdateRequest) =>
      api.patch('/users/me', data),
    onSuccess: (response) => {
      updateUser(response.data);
      queryClient.invalidateQueries(['user', 'me']);
    },
  });
}
```

---

## 5. API Integration

### 5.1 Endpoints Reference

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login and get tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate tokens |

#### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get current user |
| PATCH | `/users/me` | Update profile (+ extra_data) |
| DELETE | `/users/me` | Delete account |

#### Books
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/books` | List books |
| POST | `/books` | Upload book |
| GET | `/books/{id}` | Get book detail |
| DELETE | `/books/{id}` | Delete book |
| GET | `/books/{id}/pages` | Get pages |
| GET | `/books/{id}/download-url` | Get download URL |
| POST | `/books/{id}/ratings` | Add rating |
| GET | `/books/{id}/ratings` | Get ratings |
| DELETE | `/books/{id}/ratings` | Delete rating |

#### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/{book_id}` | Send message (SSE) |
| GET | `/chat/{book_id}/history` | Get chat history |

#### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search` | Search books |
| GET | `/search/suggestions` | Autocomplete |

#### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | List users |
| GET | `/admin/users/{id}` | Get user |
| PATCH | `/admin/users/{id}` | Update user |
| POST | `/admin/users/{id}/disable` | Disable user |
| GET | `/admin/books` | List all books |
| GET | `/admin/books/{id}` | Get book status |
| POST | `/admin/books/{id}/generate-pages` | Generate pages |
| POST | `/admin/books/{id}/generate-thumbnails` | Regen thumbnails |
| POST | `/admin/books/{id}/process-ai` | Process embeddings |
| GET | `/admin/chats` | List chat sessions |
| GET | `/admin/chats/{id}` | Get chat detail |
| DELETE | `/admin/chats/{id}` | Delete chat |
| GET | `/admin/stats` | System stats |

#### Cache (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cache/stats` | Cache statistics |
| GET | `/cache/health` | Redis health |
| POST | `/cache/invalidate` | Invalidate by pattern |
| DELETE | `/cache/keys` | Delete keys |
| POST | `/cache/flush` | Flush all |

### 5.2 Error Handling

```typescript
// Standard error response
interface APIError {
  detail: string;
  status_code: number;
  error_code?: string;
}

// Error codes
enum ErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}
```

---

## 6. Data Models

### 6.1 TypeScript Interfaces

```typescript
// types/api.ts

interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  roles: string[];
  extra_data?: UserExtraData;
  created_at: string;
  updated_at: string;
}

interface UserExtraData {
  full_name?: string;
  city?: string;
  state_province?: string;
  country?: string;
  date_of_birth?: string;
}

interface Book {
  id: string;
  title: string;
  author?: string;
  description?: string;
  cover_url?: string;
  file_url?: string;
  category?: string;
  pages_count: number;
  is_public: boolean;
  owner_id: string;
  average_rating?: number;
  ratings_count: number;
  created_at: string;
}

interface Page {
  id: string;
  book_id: string;
  page_number: number;
  thumbnail_url: string;
  image_url: string;
}

interface Rating {
  id: string;
  book_id: string;
  user_id: string;
  rating: number; // 1-5
  review?: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  book_id: string;
  user_id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

interface SystemStats {
  total_users: number;
  active_users: number;
  total_books: number;
  public_books: number;
  total_pages: number;
  total_chats: number;
  storage_used_bytes: number;
  storage_used_formatted: string;
}

interface SearchResult {
  books: Book[];
  total: number;
  page: number;
  page_size: number;
}
```

---

## 7. Security Considerations

### 7.1 Authentication
- JWT tokens stored in `expo-secure-store`
- Access token expiry: 15 minutes
- Refresh token expiry: 7 days
- Automatic token refresh on 401

### 7.2 Authorization
- Role-based access control (RBAC)
- Admin endpoints require `admin` or `super_admin` role
- Book operations validate ownership

### 7.3 Input Validation
- All forms use `zod` schema validation
- Server-side validation on all endpoints
- Sanitization of user-generated content

### 7.4 API Security
- HTTPS only
- Rate limiting on API
- CORS configured for mobile app

---

## 8. Performance Optimizations

### 8.1 Caching Strategy
- React Query caching with `staleTime` and `gcTime`
- Redis caching for search results (API)
- Image caching with `expo-image`

### 8.2 Lazy Loading
- Screen-level code splitting (expo-router)
- Image lazy loading with placeholders
- Infinite scroll for lists

### 8.3 Bundle Optimization
- Tree shaking enabled
- Dead code elimination
- Selective icon imports

---

## 9. Testing Strategy

### 9.1 Unit Tests
- Hooks testing with `@testing-library/react-hooks`
- Utility function tests with Jest

### 9.2 Integration Tests
- Screen rendering tests
- API integration tests
- Navigation flow tests

### 9.3 E2E Tests
- Detox for end-to-end testing
- Critical user flows covered

---

## 10. Deployment

### 10.1 Current Release

**Version 1.1.0 (2026-01-10)**

| Platform | Download |
|----------|----------|
| Android APK | [Download](https://expo.dev/artifacts/eas/biNeojeP7nzUCf3tM89tvn.apk) |
| Build Page | [EAS Build #5377857b](https://expo.dev/accounts/bilgrami/projects/ilm-red-mobile-app/builds/5377857b-7368-4371-9df9-2eb3088b7f03) |

### 10.2 Build Configuration

```json
// eas.json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://ilmred-prod-api.braverock-f357973c.westus2.azurecontainerapps.io"
      }
    },
    "production": {
      "distribution": "store",
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### 10.3 Build Commands
```bash
# Preview APK (for testing/distribution)
eas build --platform android --profile preview

# Production AAB (for Play Store)
eas build --platform android --profile production

# iOS build (requires Apple Developer account)
eas build --platform ios --profile production
```

### 10.4 API Configuration
```env
# Production API
EXPO_PUBLIC_API_URL=https://ilmred-prod-api.braverock-f357973c.westus2.azurecontainerapps.io
```

---

## 11. Appendix

### 11.1 Environment Variables
```env
EXPO_PUBLIC_API_URL=https://ilmred-prod-api.braverock-f357973c.westus2.azurecontainerapps.io
```

### 11.2 Related Documents
- [Product Requirements (PRD)](./PRD.md)
- [API Swagger Docs](https://ilmred-prod-api.braverock-f357973c.westus2.azurecontainerapps.io/docs)
- [Changelog](../CHANGELOG.md)

---

*Document maintained by saMas IT Services, Milpitas, California*
*Website: samas.tech*
