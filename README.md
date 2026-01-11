# ILM Red Mobile App

[![Android Build](https://img.shields.io/badge/Android-Build_Passing-brightgreen?logo=android)](https://expo.dev/accounts/bilgrami/projects/ilm-red-mobile-app/builds)
[![iOS Build](https://img.shields.io/badge/iOS-Pending-yellow?logo=apple)](https://expo.dev/accounts/bilgrami/projects/ilm-red-mobile-app/builds)
[![App Version](https://img.shields.io/badge/Version-1.1.0-blue)](./package.json)
[![API Version](https://img.shields.io/badge/API-v1.2.1-green)](https://ilmred-prod-api.braverock-f357973c.westus2.azurecontainerapps.io)
[![React Native](https://img.shields.io/badge/React_Native-0.76-61DAFB?logo=react)](https://reactnative.dev)
[![Expo SDK](https://img.shields.io/badge/Expo_SDK-54-000020?logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**Read, Chat, Understand** — AI-powered digital library mobile app.

**Version:** 1.1.0 | **Released:** 2026-01-10

## Download

| Platform | Link |
|----------|------|
| **Android APK** | [Download v1.1.0](https://expo.dev/artifacts/eas/biNeojeP7nzUCf3tM89tvn.apk) |
| **Build Details** | [EAS Build Page](https://expo.dev/accounts/bilgrami/projects/ilm-red-mobile-app/builds/5377857b-7368-4371-9df9-2eb3088b7f03) |

## Features

### Core Features
- **Authentication** - Secure login/register with JWT tokens stored in SecureStore
- **Book Library** - Browse, search, and filter books by category
- **Book Upload** - Upload PDF/EPUB files directly from your device
- **Page Reading** - Browse book pages with thumbnail grid and full-page reader
- **PDF Viewer** - In-app PDF viewing for books without extracted pages
- **AI Chat** - Have AI-powered conversations about book content (SSE streaming)
- **Book Ratings** - Rate books 1-5 stars with optional reviews
- **Favorites** - Save and manage your favorite books
- **Global Search** - Search books by title, author, description with autocomplete

### User Management
- **Edit Profile** - Extended profile fields (name, location, DOB)
- **Billing** - View AI credit balance and transaction history
- **Dark Mode** - System-aware theme with manual toggle
- **About** - Company info and app version

### Admin Panel (Admin users only)
- **User Management** - List, search, edit, disable users
- **Book Management** - View all books, trigger processing
- **Book Processing** - Generate pages, thumbnails, AI embeddings
- **Chat Sessions** - View and delete AI chat sessions
- **Cache Management** - Redis stats, invalidation, flush
- **System Statistics** - Dashboard with user/book/storage counts

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo SDK 54 |
| Language | TypeScript |
| Navigation | expo-router v4 |
| State | @tanstack/react-query v5 |
| Animations | react-native-reanimated |
| HTTP | Axios |
| PDF Viewing | react-native-webview |
| Icons | Lucide React Native |
| Storage | expo-secure-store, AsyncStorage |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Navigate to project directory
cd /Users/bilgrami/Documents/code/big-two-projects/ilm-red/ilm-red-mobile-app

# Install dependencies
npm install
```

### Configuration

Update the API URL in `constants/config.ts`:

```typescript
export const API_BASE_URL = "https://your-api-url.azurecontainerapps.io";
```

For local development with the API running locally:
```typescript
export const API_BASE_URL = "http://localhost:8000";
```

### Running the App

```bash
# Start Expo development server
npm start

# Run on iOS Simulator
npm run ios

# Run on Android Emulator
npm run android

# Run in web browser
npm run web
```

### Development with Expo Go

1. Install **Expo Go** app on your physical device ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
2. Run `npm start`
3. Scan the QR code with Expo Go (Android) or Camera app (iOS)

## Project Structure

```
ilm-red-mobile-app/
├── app/                           # Expo Router screens
│   ├── (auth)/                    # Auth flow (login, register, welcome)
│   ├── (tabs)/                    # Main tab screens
│   │   ├── index.tsx              # Home with global search
│   │   ├── library.tsx            # Library with filters
│   │   ├── favorites.tsx          # Saved books
│   │   ├── billing.tsx            # AI credits & transactions
│   │   └── profile.tsx            # User profile
│   ├── admin/                     # Admin panel (admin users only)
│   │   ├── index.tsx              # User management
│   │   ├── books.tsx              # Book management
│   │   ├── books/[id].tsx         # Book detail with actions
│   │   ├── chats.tsx              # Chat sessions
│   │   ├── chats/[id].tsx         # Chat detail
│   │   ├── cache.tsx              # Redis management
│   │   └── stats.tsx              # System statistics
│   ├── book/
│   │   ├── [id].tsx               # Book detail screen
│   │   └── [id]/
│   │       ├── read/[page].tsx    # Page reader
│   │       ├── chat.tsx           # AI chat
│   │       └── pdf.tsx            # PDF viewer
│   ├── profile/
│   │   └── edit.tsx               # Edit profile
│   ├── about.tsx                  # About screen
│   └── _layout.tsx                # Root layout with providers
├── components/
│   ├── ui/                        # Reusable UI components
│   ├── GlobalSearch.tsx           # Search bar with autocomplete
│   ├── RatingModal.tsx            # Star rating component
│   ├── BookCard.tsx               # Book card component
│   └── BookList.tsx               # Paginated book list
├── hooks/                         # Custom React hooks
│   ├── useAuth.ts                 # Auth hook
│   ├── useBooks.ts                # Book queries & mutations
│   ├── useAdmin.ts                # Admin operations
│   ├── useSearch.ts               # Global search
│   ├── useProfile.ts              # Profile updates
│   └── useCategories.ts           # Category utilities
├── lib/                           # Core utilities
│   └── api.ts                     # Axios client with interceptors
├── providers/                     # Context providers
│   ├── AuthProvider.tsx           # Auth state management
│   ├── QueryProvider.tsx          # React Query setup
│   └── ThemeProvider.tsx          # Theme context
├── types/
│   └── api.ts                     # TypeScript API types
├── docs/
│   ├── PRD.md                     # Product Requirements
│   └── TDD.md                     # Technical Design
└── CHANGELOG.md                   # Version history
```

## API Integration

**Base URL:** `https://ilmred-prod-api.braverock-f357973c.westus2.azurecontainerapps.io`

| Feature | Method | Endpoint |
|---------|--------|----------|
| Login | POST | `/v1/auth/login` |
| Register | POST | `/v1/auth/register` |
| Refresh Token | POST | `/v1/auth/refresh` |
| Get Profile | GET | `/v1/users/me` |
| Update Profile | PATCH | `/v1/users/me` |
| List Books | GET | `/v1/books` |
| Get Book | GET | `/v1/books/{id}` |
| Upload Book | POST | `/v1/books` |
| Delete Book | DELETE | `/v1/books/{id}` |
| Add Rating | POST | `/v1/books/{id}/ratings` |
| Get Book Pages | GET | `/v1/books/{id}/pages` |
| Download URL | GET | `/v1/books/{id}/download-url` |
| Add Favorite | POST | `/v1/books/{id}/favorite` |
| Remove Favorite | DELETE | `/v1/books/{id}/favorite` |
| Search Books | GET | `/v1/search` |
| Suggestions | GET | `/v1/search/suggestions` |
| AI Chat | POST | `/v1/chat/{book_id}` |
| Admin Users | GET | `/v1/admin/users` |
| Admin Books | GET | `/v1/admin/books` |
| Admin Stats | GET | `/v1/admin/stats` |

See full API documentation at: https://ilmred-prod-api.braverock-f357973c.westus2.azurecontainerapps.io/docs

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build for both
eas build --platform all
```

## Environment Variables

Create a `.env` file or use Expo's environment variable system:

```env
EXPO_PUBLIC_API_URL=https://your-api-url.azurecontainerapps.io
```

## Branding

The app uses the ILM Red brand colors from the website:

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| Primary | `#2563EB` | `#EF4444` |
| Background | `#FFFFFF` | `#0F172A` |
| Foreground | `#111111` | `#F8FAFC` |

## Documentation

- [Product Requirements (PRD)](./docs/PRD.md)
- [Technical Design (TDD)](./docs/TDD.md)
- [Changelog](./CHANGELOG.md)
- [API Swagger Docs](https://ilmred-prod-api.braverock-f357973c.westus2.azurecontainerapps.io/docs)

## About

Developed by **saMas IT Services**
- Location: Milpitas, California
- Website: [samas.tech](https://samas.tech)

## License

MIT - See [LICENSE](./LICENSE)
