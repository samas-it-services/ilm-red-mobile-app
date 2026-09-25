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

## 2026-09-25 | 🧹 chore: Store release workflow, app version 1.5.0, tax collected once

### 📄 Summary
Adds a hand-run GitHub Actions workflow that builds iOS and Android with the production profile and submits both to the stores. The app version shown in the stores is now 1.5.0 (it was still 1.0.0), and build numbers are managed by EAS so each store build gets a higher one. The Zelle screen now says tax is taken once, when you pay.

### 📁 Files Changed
- `.github/workflows/eas-release.yml` - new: build (all, ios or android) and optional submit
- `app.json` - version 1.5.0
- `eas.json` - `appVersionSource: remote`, production `autoIncrement`
- `components/billing/ZelleTopUp.tsx` - tax-once sentence

### 🧠 Rationale
The existing workflow only builds Android preview APKs. Store releases need both platforms and a submit step.

### 🔄 Behavior / Compatibility Implications
- None for users beyond the new sentence.

### 🧪 Testing Recommendations
- Run "EAS Release (store builds)" from the Actions tab; check the build and submit steps.

### 📌 Follow‑ups
- None.

---

## 2026-09-25 | 🚀 feat: Billing tab on the new API, Zelle top-ups on Android, sales tax in lines (v1.5.0)

### 📄 Summary
The Billing tab now reads everything from api.ilm.red, the same as the website: what I can spend (monthly allowance left plus credits I added, less anything held for a refund request), my top-ups and my receipts. On Android I can add funds by Zelle: pick $5, $20, $50, $100 or another amount, see the sales tax in three lines (California state 7.25%, Santa Clara County 2.50%, City of Milpitas 0.25%) and the credits I get, agree to the billing agreement when one is in force, then see the QR code, the recipient, the amount and my ILM- reference, send from my bank app and tap "I've sent it". Top-ups are refunded as credits only, and the screen says so before I pay. On iOS, "Add funds on ilm.red" opens the website. The retired `/billing/*` endpoints are no longer called.

### 📁 Files Changed
- `hooks/useBilling.ts` - rewritten on the typed client: credit account, payment methods, top-ups, payments, billing agreement, and the create / sent / cancel / accept mutations
- `app/(tabs)/billing.tsx` - rewritten: You can spend, Add funds, Your top-ups, Receipts
- `components/billing/ZelleTopUp.tsx` - new: amount picker, tax preview, send panel
- `components/billing/AgreementSheet.tsx` - new: read and agree to the billing agreement
- `components/billing/ZelleQr.tsx` - new: QR code drawn on the device from the bank's QR text
- `lib/tax.ts` - new: tax preview split the same way the server does
- `constants/config.ts` - `ILM_WEB_URL` for pages the app opens on the website
- `lib/api-client/*` - synced from ilm-red-unbound (billing agreement, top-ups, tax lines)
- `package.json` - `uqr` (pure JavaScript QR encoder, no native code)
- `docs/implementation_plans/billing_zelle/agents.md` - plan, assumptions and checks

### 🧠 Rationale
One billing backend for the website and the app, so both show the same numbers. Zelle lets members top up without a card processor. iOS links out because App Store rules require in-app purchase for digital credits bought inside the app.

### 🔄 Behavior / Compatibility Implications
- The old balance, usage meters and transaction list are gone; the new screen shows the API's figures.
- Zelle is switched off on the server until Finance turns it on; until then Add funds says it is not open yet.
- No new native modules: works as an over-the-air update.

### 🧪 Testing Recommendations
1. Open Billing: "You can spend" matches Premium > Billing on ilm.red for the same account.
2. Android, with Zelle switched on: pick $20; you see $1.45 + $0.50 + $0.05 tax and 18.00 credits. Tap Pay.
3. If a billing agreement is published, the agreement sheet opens; tick and agree; the top-up is created.
4. The send screen shows the QR code, recipient, $20.00 and an ILM- reference; the share buttons copy each.
5. Tap "I've sent it": a confirmation appears and the top-up shows as marked sent under Your top-ups.
6. iPhone: Add funds shows "Add funds on ilm.red" and opens the website.

### 📌 Follow‑ups
- Receipt detail (tax lines per payment) in the app; for now "Statements and invoices on ilm.red".
- Card payments once a processor is connected.

---

## 2026-09-25 | 🚀 feat: Search books and pages on the new library search, search history, my book counts (v1.4.0)

### 📄 Summary
Search now uses the same engine as ilm.red and assistants (`GET /v1/search`). It finds books by title, author and tags, and words inside pages, in the original and in every saved translation, Urdu included (letter shapes and vowel marks do not matter). Results come 20 at a time, up to 200, in two lists: Books and In pages. When nothing matches, the server says why, for example that a book has Urdu text and the word should be typed in Urdu script. The Library tab shows how many books I have, by who can see them. Settings has a search history switch (off by default), with the list, delete one and delete all. The retired Azure `/search` endpoints are no longer called.

### 📁 Files Changed
- `hooks/useSearch.ts` - rewritten on the typed client: `useLibrarySearch` (cursor paging), `useMyLibraryCounts`, search history hooks, snippet helpers
- `components/GlobalSearch.tsx` - Books / In pages tabs, matched words in bold, right-to-left snippets, server hint when empty, recent searches from my history when it is on (this phone's list otherwise)
- `components/SearchHistorySettings.tsx` (new) - switch, recent list, delete one, delete all; turning off asks, delete is the default
- `app/profile/edit.tsx` - shows the search history card
- `app/(tabs)/library.tsx` - "My books" counts line from `GET /v1/me/library`
- `lib/api-client/` - synced from ilm-red-unbound (new search, library and history operations)

### 🧠 Rationale
Searching in the app went to the retired Azure API. Members also asked assistants how many books they have and got wrong numbers; the app now shows the same counts the API gives everyone.

### 🔄 Behavior / Compatibility Implications
- Tapping a result opens it on ilm.red (in-app browser), at the matching page and language, until the book and reader screens move to the new API.
- Searches are saved only when the member turned search history on.

### 🧪 Testing Recommendations
- Search "dastan", then "داستان": the first explains Urdu script, the second finds Arabian Nights pages.
- Turn history on in Settings, search twice, reopen search: both appear under Your search history. Turn it off, choose delete: the list is empty.
- Library tab: the counts line matches ilm.red My Bookshelf.

### 📌 Follow‑ups
- Open books in the app once `app/book/[id].tsx` and the reader use the new API.

---

## 2026-09-22 | 🚀 feat: Sign in with Google and Apple, same accounts as ilm.red (v1.3.0)

### 📄 Summary
The app now signs in exactly like the website: Supabase Auth with Google on every device and Sign in with Apple on iPhone. Who you are comes from api.ilm.red (`GET /v1/me` and `/v1/me/entitlements`) through the typed client shared with the website. The old email and password screens are gone; they talked to the retired Azure API.

### 📁 Files Changed
- `lib/supabase.ts` (new) - Supabase client for sign-in only; session kept in AsyncStorage, refreshed while the app is open
- `lib/auth.ts` - Google through the system browser (PKCE, returns to `ilmred://auth-callback`), Apple through the native sheet on iOS; member loaded from the API
- `lib/ilmApi.ts` (new), `lib/api-client/` (copied from ilm-red-unbound, do not edit here) - typed api.ilm.red client
- `providers/AuthProvider.tsx` - session from Supabase; `signInWithGoogle` and `signInWithApple` replace `login` and `register`
- `app/(auth)/login.tsx` - new sign-in screen; `register.tsx` now forwards to it; welcome's "Get Started" goes to sign-in
- `constants/config.ts` - Supabase and API addresses
- `app.json`, `package.json` - expo-apple-authentication, expo-web-browser, @supabase/supabase-js, react-native-url-polyfill

### 🧠 Rationale
API-first: one sign-in and one API for web, mobile and partners. Apple requires Sign in with Apple in any iPhone app that offers Google.

### 🔄 Behavior / Compatibility Implications
- Everyone signs in again once. Existing ilm.red accounts work as they are.
- Other screens still call the old Azure API and stay broken until each moves to api.ilm.red.
- Needs the Supabase and Apple setup in ilm-red-unbound `docs/kb/apple-sign-in.md` (redirect URLs and the Apple provider) and a new build, since native modules were added.

### 🧪 Testing Recommendations
- Google sign-in on Android and iPhone; Apple sign-in on iPhone; sign out and back in; close and reopen the app and stay signed in.

### 📌 Follow‑ups
- Move books, library and reader onto api.ilm.red (ilm-red-unbound v1.374+).

---

## 2026-01-21 | 🐛 fix: Home screen crash and login error handling (v1.2.5)

### 📄 Summary
Fix home screen crash after login caused by undefined gradient colors, and improve error handling throughout the app. Added diagnostic logging and local build script for easier debugging.

### 📁 Files Changed
- `app/(tabs)/index.tsx` - Fix CATEGORY_GRADIENTS fallback from non-existent `.general` to `.other`
- `lib/api.ts` - Add diagnostic logging to API error interceptor
- `providers/AuthProvider.tsx` - Add catch blocks to rethrow login/register errors
- `package.json` - Bump version to 1.2.5, update Expo packages
- `scripts/local-build.sh` - NEW: Local build and test script

### 🧠 Rationale
The home screen was crashing with "Cannot read property 'map' of undefined" because `LinearGradient` received `undefined` for its `colors` prop. The code fell back to `CATEGORY_GRADIENTS.general` which doesn't exist. Additionally, login errors weren't propagating to the UI due to missing catch blocks in AuthProvider.

### 🔄 Behavior / Compatibility Implications
- Home screen no longer crashes after login
- Login errors now display to user instead of being swallowed
- API errors are logged with detailed diagnostic info in dev mode
- New `./scripts/local-build.sh` script for local testing

### 🧪 Testing Recommendations
- Run `./scripts/local-build.sh test-api` to test with production API
- Login and verify home screen displays without errors
- Check Metro logs for any remaining API errors
- Test login with invalid credentials to verify error message appears

### 📌 Follow-ups
- None

---

## 2026-01-21 | 🐛 fix: Crash protection and comprehensive error handling (v1.2.4)

### 📄 Summary
Fix startup crash caused by missing component reference and add comprehensive error handling throughout the app. Includes ErrorBoundary component, null safety improvements, and reusable error utilities.

### 📁 Files Changed
- `app/_layout.tsx` - Wrap app with ErrorBoundary, add try-catch for SplashScreen
- `app/(tabs)/index.tsx` - Add RecommendationCard component, fix missing styles, add onError to mutations
- `app/book/[id].tsx` - Add null safety for owner, stats, and file_type properties
- `app/book/[id]/read/[page].tsx` - Fix totalPages variable hoisting issue
- `hooks/useChat.ts` - Add error handling for JSON parsing and array operations
- `components/ErrorBoundary.tsx` - NEW: Error boundary components for crash protection
- `lib/errorUtils.ts` - NEW: Reusable error handling utilities

### 🧠 Rationale
The app was crashing on startup due to a missing `BookCard` component reference in the home screen. Investigation revealed multiple potential crash points including unsafe property access, unhandled async errors, and missing null checks. Added comprehensive error handling to make the app resilient to failures.

### 🔄 Behavior / Compatibility Implications
- App no longer crashes on startup
- Unhandled errors are caught by ErrorBoundary and show user-friendly error screen
- Failed favorite toggles now show haptic error feedback
- No breaking changes to existing functionality

### 🧪 Testing Recommendations
- Launch app and verify no crash on startup
- Navigate through all screens to verify ErrorBoundary doesn't interfere
- Toggle favorites and verify error feedback on failure
- Test book detail screen with books that have missing owner/stats data
- Test page reader to verify progress tracking works

### 📌 Follow-ups
- Add error reporting to external service (Sentry, etc.)
- Add retry logic for failed API requests
- Add offline error handling

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
