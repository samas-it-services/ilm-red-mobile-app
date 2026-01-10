# ILM Red Mobile App

A React Native mobile application for managing books and categories, built with Expo and connected to the ILM Red API backend.

## Features

- **Authentication** - Secure login/register with JWT tokens stored in SecureStore
- **Book Library** - Browse, search, and filter books by category
- **Book Upload** - Upload PDF/EPUB files directly from your device
- **Categories** - 17 book categories with color-coded icons
- **Favorites** - Save and manage your favorite books
- **Dark Mode** - System-aware theme with manual toggle
- **Profile** - User settings and account management

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo SDK 52 |
| Language | TypeScript |
| Navigation | Expo Router |
| Styling | NativeWind v4 (Tailwind CSS) |
| State | React Query v5 |
| Forms | React Hook Form + Zod |
| Icons | Lucide React Native |
| HTTP | Axios |

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
│   ├── (auth)/                    # Auth flow (login, register)
│   ├── (tabs)/                    # Main tab screens
│   │   ├── index.tsx              # Library/Home
│   │   ├── categories.tsx         # Browse categories
│   │   ├── favorites.tsx          # Saved books
│   │   └── profile.tsx            # User profile
│   ├── book/[id].tsx              # Book detail screen
│   ├── upload.tsx                 # Upload book modal
│   └── _layout.tsx                # Root layout with providers
├── components/
│   ├── ui/                        # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Loading.tsx
│   ├── BookCard.tsx               # Book card component
│   ├── BookList.tsx               # Paginated book list
│   ├── CategoryChip.tsx           # Category badge
│   └── Header.tsx                 # Screen header
├── hooks/                         # Custom React hooks
│   ├── useAuth.ts                 # Auth hook
│   ├── useBooks.ts                # Book queries & mutations
│   ├── useCategories.ts           # Category utilities
│   └── useUpload.ts               # Document picker
├── lib/                           # Core utilities
│   ├── api.ts                     # Axios client with interceptors
│   ├── auth.ts                    # Auth API functions
│   └── storage.ts                 # SecureStore helpers
├── providers/                     # Context providers
│   ├── AuthProvider.tsx           # Auth state management
│   ├── QueryProvider.tsx          # React Query setup
│   └── ThemeProvider.tsx          # Theme context
├── constants/                     # App constants
│   ├── colors.ts                  # Brand colors
│   ├── categories.ts              # Category definitions
│   └── config.ts                  # API configuration
├── types/
│   └── api.ts                     # TypeScript API types
└── assets/                        # Images & fonts
```

## API Endpoints

The app connects to these ILM Red API endpoints:

| Feature | Method | Endpoint |
|---------|--------|----------|
| Login | POST | `/v1/auth/login` |
| Register | POST | `/v1/auth/register` |
| Refresh Token | POST | `/v1/auth/refresh` |
| Get Profile | GET | `/v1/users/me` |
| List Books | GET | `/v1/books` |
| Get Book | GET | `/v1/books/{id}` |
| Upload Book | POST | `/v1/books` |
| Delete Book | DELETE | `/v1/books/{id}` |
| Get Favorites | GET | `/v1/books/me/favorites` |
| Add Favorite | POST | `/v1/books/{id}/favorite` |
| Remove Favorite | DELETE | `/v1/books/{id}/favorite` |

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

## License

Private - ILM Red Project
