# Changelog

All notable changes to the ILM Red Mobile App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-10

### Download
- **APK Download:** [ilm-red-mobile-app-1.1.0.apk](https://expo.dev/artifacts/eas/biNeojeP7nzUCf3tM89tvn.apk)
- **Build Page:** [EAS Build #5377857b](https://expo.dev/accounts/bilgrami/projects/ilm-red-mobile-app/builds/5377857b-7368-4371-9df9-2eb3088b7f03)

### Added
- Admin panel with user and book management
- Edit profile screen with extended fields (extra_data JSON)
- About screen with saMas IT Services company info
- Global search with Redis-backed autocomplete
- In-app PDF viewer for books without pages (WebView-based)
- Conditional reading mode (pages vs PDF based on availability)
- Book rating modal with 5-star interactive UI
- Admin book processing (generate pages, thumbnails, AI)
- Admin chat session management with message history
- Admin Redis cache management screen
- System statistics dashboard
- Recent searches with AsyncStorage persistence

### Fixed
- Book download functionality on Android
- Rating submission to API
- TextInput components in registration and login forms
- TypeScript errors with expo-router Href types
- Property name `page_count` in Book interface

### Changed
- **MAJOR:** Replaced bottom tab bar with drawer navigation (hamburger menu)
- Admin section now in collapsible drawer menu (for admin users only)
- Profile screen now links to Edit Profile and About
- Book detail shows context-aware reading options
- AuthProvider now exports `updateUser` function

### Technical
- Added `components/DrawerContent.tsx` for custom drawer with admin hierarchy
- Converted `app/(tabs)/_layout.tsx` from Tabs to Drawer navigation
- Installed `@react-navigation/drawer` for drawer support
- Added `hooks/useAdmin.ts` for admin operations
- Added `hooks/useSearch.ts` for global search
- Added `hooks/useProfile.ts` for profile updates
- Added `components/GlobalSearch.tsx` with modal and autocomplete
- Added `components/RatingModal.tsx` with star rating UI
- Added `app/admin/` with 9 admin screens
- Added `app/book/[id]/pdf.tsx` for PDF viewing
- Added `app/profile/edit.tsx` for profile editing
- Added `app/about.tsx` for company info
- Installed `react-native-webview` for PDF viewing
- Installed `@react-native-async-storage/async-storage` for search history

---

## [1.0.0] - 2026-01-09

### Added
- Beautiful landing page with animated floating books
- Multi-step registration wizard with password strength indicator
- Enhanced login screen with book illustrations
- Book-focused home page with hero section and featured carousel
- Library screen with search and category filters
- Book detail page with cover, metadata, and actions
- Pages browsing with thumbnail grid view
- Full-page reader with swipe navigation
- AI chat with Server-Sent Events (SSE) streaming
- Billing screen with usage meters and transaction history
- Favorites management
- Dark/light theme support with system preference detection
- Haptic feedback throughout the app

### Technical
- Expo SDK 54 with TypeScript
- expo-router v4 with nested layouts
- @tanstack/react-query for data fetching
- react-native-reanimated for animations
- react-native-gesture-handler for swipe navigation
- expo-linear-gradient for beautiful gradients
- expo-haptics for tactile feedback
- expo-image for optimized image loading
- expo-secure-store for token storage

### Security
- JWT-based authentication
- Secure token storage
- HTTPS API communication

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.1.0 | 2026-01-10 | Admin panel, search, profile, about, PDF reader |
| 1.0.0 | 2026-01-09 | Initial MVP release |

---

*Developed by saMas IT Services, Milpitas, California*
*Website: samas.tech*
