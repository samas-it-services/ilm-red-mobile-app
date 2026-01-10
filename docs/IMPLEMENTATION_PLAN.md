# ILM Red Implementation Plan

**Version:** 1.1.0
**Date:** 2026-01-10
**Status:** Active Development

---

## Current Release Summary

### v1.1.0 (Released 2026-01-10)

**Downloads:**
- **Android APK:** [Download](https://expo.dev/artifacts/eas/biNeojeP7nzUCf3tM89tvn.apk)
- **Build Page:** [EAS Build](https://expo.dev/accounts/bilgrami/projects/ilm-red-mobile-app/builds/5377857b-7368-4371-9df9-2eb3088b7f03)

**API URL:** `https://ilmred-prod-api.braverock-f357973c.westus2.azurecontainerapps.io`

**Completed Features:**
- Admin panel with user/book/chat/cache management
- Global search with Redis-backed autocomplete
- Extended user profile (extra_data JSON)
- In-app PDF viewer
- Book rating system
- Edit profile screen
- About screen

---

## Next Steps (Prioritized)

### Phase 1: Core Improvements (High Priority)

#### 1.1 RAG Integration for AI Chat
**Goal:** Enhance AI chat with actual book content context

| Task | Description | Effort |
|------|-------------|--------|
| Implement chunking service | Extract text from PDFs and split into chunks | Medium |
| Generate embeddings | Use OpenAI/Azure OpenAI to create vector embeddings | Medium |
| Store in pgvector | Save embeddings in PostgreSQL with pgvector | Low |
| Update chat API | Retrieve relevant chunks during chat | Medium |
| Test context quality | Verify AI responses reference book content | Low |

**Files to modify:**
- `app/services/chunking_service.py` (create)
- `app/services/embedding_service.py` (create)
- `app/services/chat_service.py` (modify)
- `app/models/chunk.py` (create)
- `app/db/migrations/` (new migration for chunks table)

#### 1.2 Actual Page Generation
**Goal:** Convert PDF pages to images for mobile browsing

| Task | Description | Effort |
|------|-------------|--------|
| PDF rendering service | Use pdfjs-dist with node-canvas | High |
| Multi-resolution output | Generate thumbnail (150px), medium (800px), high (1600px) | Medium |
| Background processing | Queue-based async processing with ARQ | Medium |
| Azure Blob storage | Store generated images in blob storage | Low |
| Signed URLs | Generate time-limited URLs for secure access | Low |

**Files to modify:**
- `app/services/page_service.py` (create)
- `app/workers/page_worker.py` (create)
- `app/api/v1/books.py` (modify for page generation trigger)

#### 1.3 iOS Release
**Goal:** Publish to Apple App Store

| Task | Description | Effort |
|------|-------------|--------|
| Apple Developer account | Set up account if not exists | Low |
| App Store Connect setup | Create app listing, screenshots | Medium |
| EAS build for iOS | Configure and run iOS build | Low |
| TestFlight distribution | Internal testing | Low |
| App Store submission | Submit for review | Medium |

---

### Phase 2: User Experience (Medium Priority)

#### 2.1 Offline Reading Mode
**Goal:** Allow users to read cached pages without internet

| Task | Description | Effort |
|------|-------------|--------|
| Page caching strategy | Determine which pages to cache | Low |
| expo-file-system storage | Store page images locally | Medium |
| Offline detection | Check connectivity and show cached content | Low |
| Sync mechanism | Update cache when online | Medium |
| Storage management | Clear old cached pages | Low |

#### 2.2 Reading Progress Sync
**Goal:** Track and resume reading position across devices

| Task | Description | Effort |
|------|-------------|--------|
| API endpoint | POST/GET /books/{id}/progress | Low |
| Local storage | Save progress locally | Low |
| Sync on app open | Fetch remote progress | Low |
| UI indicator | Show progress bar on book cards | Low |
| Resume reading | Navigate to last read page | Low |

#### 2.3 Push Notifications
**Goal:** Notify users of new books, chat responses

| Task | Description | Effort |
|------|-------------|--------|
| Expo Push setup | Configure push notifications | Medium |
| Backend integration | Send notifications from API | Medium |
| User preferences | Allow notification opt-in/out | Low |
| Notification types | New books, chat ready, admin alerts | Low |

---

### Phase 3: Social Features (Lower Priority)

#### 3.1 Book Clubs
**Goal:** Allow users to form reading groups

| Task | Description | Effort |
|------|-------------|--------|
| Club CRUD API | Create, join, leave clubs | Medium |
| Club membership | Invite, accept, roles | Medium |
| Club books | Shared book collection | Low |
| Club discussions | Thread-based discussions | High |
| Mobile screens | Club list, detail, members | High |

#### 3.2 Notes and Highlights
**Goal:** Allow users to annotate books

| Task | Description | Effort |
|------|-------------|--------|
| Annotation model | Notes, highlights with page reference | Medium |
| API endpoints | CRUD for annotations | Low |
| Page overlay | Display highlights on pages | High |
| Note sidebar | View all notes for a book | Medium |
| Export | Export notes as PDF/markdown | Low |

#### 3.3 Social Sharing
**Goal:** Share books and reading progress

| Task | Description | Effort |
|------|-------------|--------|
| Share links | Generate shareable book links | Low |
| Social meta tags | OG tags for link previews | Low |
| In-app sharing | Share to social platforms | Low |
| Activity feed | See what friends are reading | Medium |

---

### Phase 4: Performance & Scale (Ongoing)

#### 4.1 Caching Optimization
- Implement Redis caching for frequently accessed data
- Add CDN for static assets (images, PDFs)
- Optimize API response times

#### 4.2 Database Optimization
- Add database indexes for common queries
- Implement connection pooling
- Set up read replicas for scale

#### 4.3 Monitoring & Alerting
- Set up Azure Application Insights
- Configure alerts for errors and latency
- Implement structured logging

---

## Technical Debt

| Item | Description | Priority |
|------|-------------|----------|
| Unit tests | Add comprehensive test coverage | High |
| E2E tests | Implement Detox testing | Medium |
| Error boundaries | Add React error boundaries | Medium |
| Accessibility | Audit and fix a11y issues | Medium |
| Performance profiling | Profile and optimize render performance | Low |

---

## Infrastructure Roadmap

### Current Setup
- **API:** Azure Container Apps (auto-scaling 1-10 replicas)
- **Database:** PostgreSQL Flexible Server
- **Cache:** Azure Redis Cache
- **Storage:** Azure Blob Storage
- **Mobile:** EAS Build (Expo)

### Planned Improvements
- [ ] Set up staging environment
- [ ] Implement CI/CD with GitHub Actions
- [ ] Add database backups and point-in-time recovery
- [ ] Configure CDN for global distribution
- [ ] Set up Azure Monitor dashboards

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| PDF processing performance | High | Use background workers, queue system |
| AI token costs | Medium | Implement usage limits, cost monitoring |
| Storage costs | Low | Implement cleanup policies, tiered storage |
| iOS App Store rejection | Medium | Follow guidelines, plan for review cycles |

---

## Contact

**Development Team:** saMas IT Services
**Location:** Milpitas, California
**Website:** [samas.tech](https://samas.tech)

---

*Last Updated: 2026-01-10*
