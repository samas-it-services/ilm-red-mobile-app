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

## 2026-01-12 | 🐛 fix: Resolve startup crash due to missing readingStats prop (v1.2.3)

### 📄 Summary
Fix critical startup crash caused by accessing readingStats property in HeroSection component before it was passed as a prop. The app was crashing with "Property 'readingStats' doesn't exist" error during startup.

### 📁 Files Changed
- `app/(tabs)/index.tsx` - Modified HeroSection and ContinueReadingCard components to properly receive readingStats and progressPercent as props

### 🧠 Rationale
The HeroSection component was attempting to access readingStats?.current_streak_days but the readingStats variable was defined in the parent component and not passed down as a prop. This caused a ReferenceError that crashed the app on startup. Similarly, the ContinueReadingCard component was accessing recentReads?.[0]?.progress_percent without receiving it as a prop.

### 🔄 Behavior / Compatibility Implications
- Fixes immediate crash on app startup
- No breaking changes to functionality
- Maintains all existing features and UI elements
- Reading streak and progress indicators continue to work as expected

### 🧪 Testing Recommendations
- Launch the app and verify it no longer crashes on startup
- Check that the reading streak badge displays correctly on the home screen
- Verify that the progress percentage shows correctly in the "Continue Reading" card
- Test the app on both development and production builds

### 📌 Follow‑ups
- Add TypeScript strict typing to prevent similar issues in the future
- Implement additional error boundaries to catch component-level errors gracefully

---

## 2026-01-12 | 🚀 feat: Rating flags infrastructure (v1.2.2)

### 📄 Summary
Add infrastructure for reporting inappropriate reviews. Users can flag reviews as spam, offensive, irrelevant, or other with optional details. Includes hooks and UI component ready for integration.

### 📁 Files Changed
- `hooks/useRatingFlags.ts` - NEW: React Query hook for flag API
- `components/FlagRatingModal.tsx` - NEW: Modal for reporting reviews

### 🧠 Rationale
Community moderation requires users to report inappropriate content. Rating flags allow users to report spam, offensive language, or irrelevant reviews. Admin can then review and take action.

### 🔄 Behavior / Compatibility Implications
- Infrastructure ready but not yet integrated into UI
- Requires review list component to show "Report" buttons
- FlagRatingModal provides clean UI for selecting reason + details
- API endpoint: POST /v1/books/{book_id}/ratings/{rating_id}/flag

### 🧪 Testing Recommendations
- Feature requires review list UI to be built first
- Once integrated, tap "Report" on a review
- Select reason (spam, offensive, irrelevant, other)
- Add optional details
- Submit and verify success message

### 📌 Follow‑ups
- Build review list component for book detail page
- Add "Report" button to each review in the list
- Integrate FlagRatingModal when user taps "Report"

---

## 2026-01-12 | 🚀 feat: Personalized recommendations on home page (v1.2.1)

### 📄 Summary
Add personalized book recommendations section to home page. Recommendations are based on user's reading history, showing books in categories they've been reading, top-rated books, and trending content. Each recommendation includes a reason explaining why it was suggested.

### 📁 Files Changed
- `hooks/useRecommendations.ts` - NEW: React Query hooks for recommendations API
- `app/(tabs)/index.tsx` - Add "Recommended for You" section on home page

### 🧠 Rationale
Users need personalized content discovery to find relevant books. Generic book lists don't help users discover books tailored to their interests. Recommendations improve engagement and help users find books they'll enjoy based on their reading patterns.

### 🔄 Behavior / Compatibility Implications
- New "Recommended for You" section appears on home page
- Shows up to 5 recommended books in horizontal carousel
- Each book shows reason badge (e.g., "Based on your interest in Fiqh")
- Requires API endpoint: GET /v1/recommendations/for-you
- Only shows when user has recommendations available

### 🧪 Testing Recommendations
- Open home page in Expo app
- Scroll to "Recommended for You" section
- Verify books shown match your reading interests
- Tap a book to view details
- Read books from recommended categories to improve future recommendations

### 📌 Follow‑ups
- None

---

## 2026-01-12 | 🚀 feat: Real reading progress and streak tracking (v1.2.0)

### 📄 Summary
Replace hardcoded progress (35%) and streak (3 days) with real data from backend API. Progress updates automatically as users read pages, and reading streaks motivate daily reading.

### 📁 Files Changed
- `hooks/useProgress.ts` - NEW: React Query hooks for progress tracking
- `app/book/[id]/read/[page].tsx` - Add debounced progress updates on page change
- `app/(tabs)/index.tsx` - Use real progress and streak data from API
- `app/(tabs)/index.tsx` - Update category gradients to match new categories

### 🧠 Rationale
Hardcoded progress and streak values provided no real value. With backend tracking:
- Progress syncs across devices (iOS/Android/Web)
- Streaks encourage daily reading habit
- Reading time tracked per book
- Resume reading from last page

### 🔄 Behavior / Compatibility Implications
- Progress now shows actual reading position (not hardcoded 35%)
- Streak shows real consecutive reading days (not hardcoded 3)
- Progress updates every 2 seconds after page change (debounced)
- Requires authenticated user (progress tied to account)

### 🧪 Testing Recommendations
- Read a few pages, verify progress updates on home screen
- Read on multiple devices, verify progress syncs
- Read multiple days in a row, verify streak increases
- Skip a day, verify streak resets

### 📌 Follow‑ups
- Add reading progress indicator to library book cards
- Show reading time on book detail page

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
