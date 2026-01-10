# ILM Red Mobile App - Product Requirements Document (PRD)

**Version:** 1.1.0
**Date:** 2026-01-10
**Author:** saMas IT Services
**Status:** Approved

---

## 1. Executive Summary

ILM Red is an AI-powered digital library mobile application that enables users to upload, read, and interact with books through artificial intelligence. The app provides a seamless reading experience with features like page browsing, PDF viewing, AI-powered book discussions, and comprehensive book management.

**Tagline:** Read. Chat. Learn.

---

## 2. Product Overview

### 2.1 Vision
To create the most intuitive and intelligent digital reading platform that enhances learning through AI-assisted book discussions and seamless access to digital content.

### 2.2 Goals
- Enable users to upload and manage their digital book collection
- Provide multiple reading modes (page-by-page browsing, PDF viewing)
- Facilitate AI-powered conversations about book content
- Offer administrators tools to manage users, books, and system resources
- Support global search across the entire library

### 2.3 Target Users

| Persona | Description | Key Needs |
|---------|-------------|-----------|
| **Casual Reader** | Everyday users who want to read and organize books | Easy upload, smooth reading, favorites |
| **Student/Researcher** | Academic users needing to study content deeply | AI chat, search, note-taking |
| **Content Admin** | Library administrators managing collections | Bulk operations, user management |
| **Super Admin** | System administrators | Full system access, cache management |

---

## 3. Feature Requirements

### 3.1 Authentication & User Management

| Feature | Priority | Description |
|---------|----------|-------------|
| User Registration | P0 | Multi-step wizard with email/password |
| User Login | P0 | Email/password with remember me option |
| Edit Profile | P1 | Update display name, bio, and extended fields |
| Password Reset | P2 | Email-based password recovery |
| Account Deletion | P2 | Self-service account removal |

#### 3.1.1 Extended Profile Fields (extra_data)
Future-proof JSON storage for user profile data:
- Full Name
- City
- State/Province
- Country
- Date of Birth
- Custom fields (extensible without migrations)

### 3.2 Book Management

| Feature | Priority | Description |
|---------|----------|-------------|
| Upload Books | P0 | PDF/EPUB upload with metadata extraction |
| Book Library | P0 | Grid/list view with sorting and filters |
| Book Details | P0 | Cover, metadata, ratings, download |
| Favorites | P1 | Save and manage favorite books |
| Book Categories | P1 | Browse by predefined categories |
| Book Ratings | P1 | 1-5 star rating with optional review |
| Book Download | P1 | Download original file to device |

### 3.3 Reading Experience

| Feature | Priority | Description |
|---------|----------|-------------|
| Page Browsing | P0 | Thumbnail grid with full-page reader |
| PDF Viewer | P1 | In-app PDF viewing for books without pages |
| Conditional Mode | P1 | Auto-select pages vs PDF based on availability |
| Reading Progress | P2 | Track and resume reading position |
| Offline Reading | P3 | Cache pages for offline access |

#### 3.3.1 Reading Mode Logic
```
IF book.pages_count > 0 THEN
  Show "Browse Pages" button
  Navigate to page thumbnail grid
ELSE
  Show "Read PDF" button
  Open in-app PDF viewer
END IF

ALWAYS show "Download" button
```

### 3.4 AI Chat

| Feature | Priority | Description |
|---------|----------|-------------|
| Book Chat | P0 | AI-powered discussions about book content |
| Streaming Responses | P0 | Real-time SSE streaming for AI responses |
| Chat History | P1 | View past conversations per book |
| Multi-turn Context | P1 | AI maintains conversation context |

### 3.5 Global Search

| Feature | Priority | Description |
|---------|----------|-------------|
| Search Bar | P1 | Prominent search in header/home |
| Multi-field Search | P1 | Search by title, author, description, category |
| Auto-complete | P2 | Suggestions as user types |
| Recent Searches | P2 | Store and display recent queries |
| Search Results | P1 | Paginated results with navigation to book |

### 3.6 Admin Panel

| Feature | Priority | Description |
|---------|----------|-------------|
| User Management | P1 | List, search, edit, disable users |
| Book Management | P1 | List all books, trigger processing |
| Generate Pages | P1 | Convert PDF to browsable pages |
| Generate Thumbnails | P1 | Regenerate page thumbnails |
| Process AI | P1 | Generate embeddings and chunks |
| Chat Sessions | P1 | View and delete chat sessions |
| Cache Management | P1 | View stats, invalidate, flush Redis |
| System Statistics | P1 | Dashboard with user/book/storage counts |

#### 3.6.1 Admin Access Control
- Admin features visible only to users with `admin` or `super_admin` role
- Conditional tab in bottom navigation
- Role-based endpoint protection on API

### 3.7 About & Information

| Feature | Priority | Description |
|---------|----------|-------------|
| About Screen | P1 | Company info, version, links |
| Privacy Policy | P2 | Link to privacy policy |
| Terms of Service | P2 | Link to terms |
| Support Contact | P2 | Link to support resources |

**Company Information:**
- Name: saMas IT Services
- Location: Milpitas, California
- Website: samas.tech

---

## 4. User Flows

### 4.1 New User Onboarding
```
Welcome Screen → Get Started → Registration Wizard → Email Verification → Home
```

### 4.2 Book Reading Flow
```
Home/Library → Book Detail → [Browse Pages | Read PDF] → Reading View
                           ↓
                     Download Book
                           ↓
                     Chat with AI
```

### 4.3 Admin Book Processing
```
Admin → Books → Select Book → [Generate Pages | Thumbnails | Process AI] → Status Update
```

### 4.4 Search Flow
```
Header Search → Type Query → See Suggestions → Select/Submit → Results → Book Detail
```

---

## 5. Technical Requirements

### 5.1 Platform Support
- **Primary:** Android (APK via EAS Build)
- **Secondary:** iOS (planned)
- **Minimum SDK:** Android 10 (API 29)

### 5.2 Dependencies
- Expo SDK 54
- React Native 0.76+
- expo-router v4
- @tanstack/react-query
- react-native-reanimated
- react-native-pdf (for PDF viewing)
- expo-file-system (for downloads)

### 5.3 API Integration
- Base URL: `https://ilmred-prod-api.braverock-f357973c.westus2.azurecontainerapps.io`
- Authentication: JWT Bearer tokens
- Real-time: Server-Sent Events (SSE) for chat

### 5.4 Offline Capabilities
- Token persistence in SecureStore
- User preferences in AsyncStorage
- Page caching (future enhancement)

---

## 6. Non-Functional Requirements

### 6.1 Performance
- App launch < 3 seconds
- Page load < 1 second
- Search results < 500ms
- Chat response streaming start < 1 second

### 6.2 Security
- Secure token storage
- HTTPS for all API calls
- Input validation on all forms
- Admin role verification on sensitive operations

### 6.3 Accessibility
- Minimum tap target 44x44 points
- Color contrast ratio 4.5:1
- Screen reader support
- Dark/light theme support

### 6.4 Scalability
- Support 10,000+ concurrent users
- Handle 100,000+ books in library
- Redis caching for search performance

---

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily Active Users | 1,000+ | Analytics |
| Books Uploaded | 500+/month | Database |
| AI Chat Sessions | 5,000+/month | API logs |
| App Rating | 4.5+ stars | App Store |
| Crash-free Rate | 99%+ | Crashlytics |

---

## 8. Release Plan

### 8.1 Version 1.0.0 (Released)
- Core reading functionality
- User authentication
- Book upload and management
- AI chat integration
- Basic library features

### 8.2 Version 1.1.0 (Current - Released 2026-01-10)

**Download:**
- [Android APK v1.1.0](https://expo.dev/artifacts/eas/biNeojeP7nzUCf3tM89tvn.apk)
- [Build Details](https://expo.dev/accounts/bilgrami/projects/ilm-red-mobile-app/builds/5377857b-7368-4371-9df9-2eb3088b7f03)

**Features:**
- Admin panel with full management (users, books, chats, cache, stats)
- Edit profile with extended fields (extra_data JSON)
- About screen with saMas IT Services info
- Global search with Redis-backed autocomplete
- PDF viewer for books without pages
- Rating system fixes
- Download functionality fixes

### 8.3 Future Versions
- iOS release
- Offline reading mode
- Reading clubs/communities
- Advanced analytics
- Multi-language support

---

## 9. Appendix

### 9.1 Glossary

| Term | Definition |
|------|------------|
| Book | Digital document (PDF/EPUB) uploaded to the library |
| Page | Individual page extracted from a book for browsing |
| Chunk | Text segment used for AI embeddings |
| Embedding | Vector representation of text for AI search |
| SSE | Server-Sent Events for real-time streaming |

### 9.2 Related Documents
- [Technical Design Document (TDD)](./TDD.md)
- [API Documentation](https://ilmred-prod-api.braverock-f357973c.westus2.azurecontainerapps.io/docs)
- [Changelog](../CHANGELOG.md)

---

*Document maintained by saMas IT Services, Milpitas, California*
*Website: samas.tech*
