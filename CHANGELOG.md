# **Changelog**

All notable changes to this project will be documented in this file.

## Format
- **Reverse chronological order** (newest at top)
- **Header format:** `YYYY-MM-DD | <category>: <title>`
- **Categories:**
  - 🚀 **feat**
  - 🐛 **fix**
  - 📘 **docs**
  - 🧹 **chore**
- **Sections included in every entry:**
  - 📄 **Summary**
  - 📁 **Files Changed**
  - 🧠 **Rationale**
  - 🔄 **Behavior / Compatibility Implications**
  - 🧪 **Testing Recommendations**
  - 📌 **Follow‑ups**

---

## 2026-01-12 | 🐛 fix: Category filter alignment with API (v1.1.2)

### 📄 Summary
Fix category filter not working by aligning mobile app categories with API backend categories. Replace generic categories (popular, trending, new) with actual book categories from API including Islamic categories (quran, hadith, seerah, fiqh, aqidah, tafsir).

### 📁 Files Changed
- `constants/categories.ts` - Updated BookCategory type and CATEGORIES array to match API

### 🧠 Rationale
The library screen category filter was not working because the mobile app was sending category values (like "popular", "trending") that the API doesn't recognize. The API expects specific categories defined in the Book model including Islamic categories.

### 🔄 Behavior / Compatibility Implications
- Category filter in library screen now works correctly
- Categories updated to include Islamic categories: Quran, Hadith, Seerah, Fiqh, Aqidah, Tafsir
- Removed non-API categories: Popular, Trending, New Releases, Classics, Academic, Business
- Kept common categories: History, Spirituality, Children, Fiction, Non-Fiction, Education, Science, Technology, Biography, Self-Help, Other

### 🧪 Testing Recommendations
- Open library screen in Expo app
- Select different categories (Quran, Hadith, Fiction, etc.)
- Verify books are filtered correctly
- Verify "All" shows all books

### 📌 Follow‑ups
- None

---

## 2026-01-11 | 🐛 fix: Add API URL environment variable to EAS builds (v1.1.1)

### 📄 Summary
Configure `EXPO_PUBLIC_API_URL` for all EAS build profiles (preview, testflight, production) to fix network error on login. The app was falling back to `localhost:8000` which doesn't work on physical Android devices.

### 📁 Files Changed
- `eas.json` - Added `EXPO_PUBLIC_API_URL` env var to preview, testflight, and production profiles
- `package.json` - Bumped version to 1.1.1
- `CHANGELOG.md` - This entry

### 🧠 Rationale
The mobile app's `constants/config.ts` uses `process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000"` as the API base URL. When building with EAS, no environment variable was set, causing the APK to be built with `localhost:8000` as the API endpoint. This works in Expo Go (where Metro bundler proxies requests) but fails on standalone APKs installed on physical devices.

### 🔄 Behavior / Compatibility Implications
- No breaking changes
- Existing users must update to the new APK build
- Old APKs will continue to show network error until replaced

### 🧪 Testing Recommendations
1. Build new preview APK: `eas build --platform android --profile preview`
2. Install on Android device
3. Attempt login with valid credentials
4. Verify successful authentication and navigation to home screen

### 📌 Follow‑ups
- None

---

## 2026-01-10 | 🚀 feat: Admin panel, drawer navigation, and enhanced features (v1.1.0)

### 📄 Summary
Major release adding admin panel with user/book management, drawer navigation replacing bottom tabs, global search with autocomplete, PDF viewer, profile editing, and numerous UI improvements.

### 📁 Files Changed
- `app/(tabs)/_layout.tsx` - Converted from Tabs to Drawer navigation
- `components/DrawerContent.tsx` - New custom drawer with admin hierarchy
- `app/admin/*` - 9 new admin screens (users, books, chats, cache, stats)
- `app/book/[id]/pdf.tsx` - New PDF viewer screen
- `app/profile/edit.tsx` - New profile editing screen
- `app/about.tsx` - New about screen
- `hooks/useAdmin.ts`, `hooks/useSearch.ts`, `hooks/useProfile.ts` - New hooks
- `components/GlobalSearch.tsx`, `components/RatingModal.tsx` - New components

### 🧠 Rationale
Expand app functionality for power users and administrators while improving navigation UX with a drawer menu that can accommodate more menu items than bottom tabs.

### 🔄 Behavior / Compatibility Implications
- **BREAKING:** Navigation changed from bottom tabs to hamburger drawer menu
- Admin features only visible to users with admin role

### 🧪 Testing Recommendations
1. Test drawer navigation on all screens
2. Test admin panel with admin user account
3. Test global search and autocomplete
4. Test PDF viewer with books that have no extracted pages

### 📌 Follow‑ups
- Add pull-to-refresh on admin screens
- Add batch operations for admin book processing

---

## 2026-01-09 | 🚀 feat: Initial MVP release (v1.0.0)

### 📄 Summary
Initial release of the ILM Red mobile app featuring book library, AI chat, page reading, user authentication, and billing management.

### 📁 Files Changed
- Complete codebase initial commit

### 🧠 Rationale
Launch MVP mobile app for the ILM Red digital library platform with core reading and AI features.

### 🔄 Behavior / Compatibility Implications
- Initial release, no backward compatibility concerns

### 🧪 Testing Recommendations
1. Test user registration and login
2. Test book browsing and search
3. Test page reading with swipe navigation
4. Test AI chat with SSE streaming
5. Test billing screen displays

### 📌 Follow‑ups
- Add admin panel
- Add global search
- Add PDF viewer for non-extracted books

---

*Developed by saMas IT Services, Milpitas, California*
*Website: samas.tech*
