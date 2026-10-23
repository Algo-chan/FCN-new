# Doctor Articles & SEO Publishing System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an organic clinical patient acquisition engine allowing verified Ethiopian doctors to write health articles, undergo FCN admin moderation, achieve Google indexing via Schema.org `MedicalWebPage` JSON-LD, and convert readers directly into paid teleconsultations using the Option A floating doctor dock.

**Architecture:** 
1. Backend: PostgreSQL `Article` model via Prisma with relational linkage to `DoctorProfile`, express modular architecture with strict Zod validation, role-based status machine (`draft` -> `pending_review` -> `published` / `rejected`), view tracking, and reading-time estimation.
2. Frontend: Public reader at `/articles` and `/articles/:slug` with Schema.org JSON-LD and sticky Option A floating doctor dock (`FloatingDoctorDock.tsx`), Doctor Portal writing studio (`/doctor/articles`), and Super Admin moderation queue (`/admin/articles`).

**Tech Stack:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, React 18, Vite, Tailwind CSS, Lucide React, Framer Motion.

**Spec:** `docs/superpowers/specs/2026-10-22-doctor-articles-seo-design.md`

## Global Constraints
- Articles MUST be moderated by FCN Admin (`pending_review` -> `published`) before appearing in public listings or Google search results.
- Unauthenticated users and patients can only access `published` articles; drafts and rejected articles are private to author and admin.
- The reader view on `/articles/:slug` MUST feature the **Option A floating doctor pill dock** linking readers directly to booking the authoring doctor.
- Schema.org JSON-LD metadata (`@type: MedicalWebPage` and `@type: Physician`) MUST be injected dynamically for search engine crawlers.
- Doctor consultation booking CTA MUST pre-populate the authoring physician.

## Review Focus
1. Status Security: A doctor attempting to publish directly without admin approval or read another doctor's unpublished drafts must be rejected (403 Forbidden).
2. Public Redaction: Rejection notes and internal moderation metadata must never be exposed on public `/api/v1/articles` endpoints.
3. Slug Uniqueness & Sanitization: Special characters, Amharic titles, and punctuation in article titles must produce clean, unique, URL-safe slugs with collision avoidance.
4. Mobile Viewport Dock: The Option A floating doctor dock must not overlap mobile bottom navigation bars or obscure article text on small screens.
5. Zero-State & Error Handling: Missing cover images or null author profiles must fail gracefully with medical fallback placeholders.

---

### Task 1: Database Migration & Prisma Schema for Articles

**Files:**
- Modify: `fcn-backend/src/prisma/schema.prisma:240-250`
- Modify: `fcn-backend/src/prisma/seed-demo.ts`
- Create: Migration via Prisma CLI

**Steps:**
- [ ] 1. Add `ArticleStatus` enum (`draft`, `pending_review`, `published`, `rejected`) to `fcn-backend/src/prisma/schema.prisma`.
- [ ] 2. Add `model Article` with fields `id` (UUID), `slug` (unique), `title`, `excerpt`, `content` (Text), `cover_image_url`, `category`, `author_id` (UUID foreign key referencing `DoctorProfile.user_id`), `status`, `rejection_reason`, `views_count`, `reading_time_minutes`, `published_at`, `created_at`, `updated_at`.
- [ ] 3. Add `articles Article[]` reverse relation to `DoctorProfile` in `schema.prisma`.
- [ ] 4. Run `npx prisma db push` or create migration and generate Prisma Client (`npx prisma generate`).
- [ ] 5. Add initial demo articles to `fcn-backend/src/prisma/seed-demo.ts` (e.g. Dr. Sara Tesfaye: *"Managing Diabetes in Ethiopia: A Patient Guide"*, Dr. Abebe: *"Pediatric Fever & Dehydration Management"*).
- [ ] 6. Run seed script and verify database rows.
- [ ] 7. Commit changes: `git commit -m "feat(backend): add Article prisma schema, status enum, and demo seed"`.

---

### Task 2: Backend Articles Module (Validation, Service, Controller, Routes & Tests)

**Files:**
- Create: `fcn-backend/src/modules/articles/articles.validators.ts`
- Create: `fcn-backend/src/modules/articles/articles.service.ts`
- Create: `fcn-backend/src/modules/articles/articles.controller.ts`
- Create: `fcn-backend/src/modules/articles/articles.routes.ts`
- Create: `fcn-backend/src/modules/articles/articles.test.ts`
- Modify: `fcn-backend/src/app.ts:20-90`

**Steps:**
- [ ] 1. Write `articles.validators.ts` using Zod for `createArticleSchema`, `updateArticleSchema`, `articleQuerySchema`, and `moderateArticleSchema`.
- [ ] 2. Write `articles.service.ts`:
  - `getPublishedArticles(query)`: paginated list with search, category filtering, and author projection.
  - `getArticleBySlug(slug)`: single article with author doctor profile and increments `views_count`.
  - `getDoctorArticles(doctorId)`: list of all articles by the logged-in doctor.
  - `createArticle(doctorId, input)`: generates unique slug, calculates reading time (200 wpm), defaults to `draft` or `pending_review`.
  - `updateArticle(doctorId, articleId, input)`: allows updating if owned and status is `draft` or `rejected`.
  - `deleteArticle(doctorId, articleId)`: soft or hard delete of draft.
  - `getAdminArticles(query)`: lists all articles with status filtering.
  - `moderateArticle(adminId, articleId, status, rejectionReason)`: approves (`published_at = now()`) or rejects with reason.
- [ ] 3. Write `articles.controller.ts` mapping HTTP requests to service calls with standard FCN API response envelope `{ success, data, message }`.
- [ ] 4. Write `articles.routes.ts`:
  - Public routes: `GET /api/v1/articles` and `GET /api/v1/articles/:slug`.
  - Doctor routes: `GET /api/v1/articles/my`, `POST /api/v1/articles`, `PUT /api/v1/articles/:id`, `DELETE /api/v1/articles/:id` (with `authenticate` and `requireRole("doctor")`).
  - Admin routes: `GET /api/v1/admin/articles`, `PATCH /api/v1/admin/articles/:id/status` (with `authenticate` and `requireRole("super_admin")`).
- [ ] 5. Mount article routes in `fcn-backend/src/app.ts`.
- [ ] 6. Write automated unit/integration tests in `articles.test.ts` covering author authorization, moderation flow, slug generation, and public search.
- [ ] 7. Run test suite: `npm --prefix fcn-backend test src/modules/articles/articles.test.ts`.
- [ ] 8. Commit changes: `git commit -m "feat(backend): implement articles API module, moderation workflow, and tests"`.

---

### Task 3: Frontend Types, API Service, and Navigation Integration

**Files:**
- Create: `fcn-frontend/src/types/article.ts`
- Create: `fcn-frontend/src/services/article.service.ts`
- Modify: `fcn-frontend/src/components/layout/Sidebar.tsx:110-180`
- Modify: `fcn-frontend/src/components/layout/TopBar.tsx`

**Steps:**
- [ ] 1. Define TypeScript interfaces in `fcn-frontend/src/types/article.ts`:
  - `Article`, `ArticleAuthor`, `ArticleStatus`, `ArticleQueryParams`, `CreateArticleInput`, `UpdateArticleInput`, `ModerateArticleInput`.
- [ ] 2. Implement `articleService` in `fcn-frontend/src/services/article.service.ts` connecting to `/api/v1/articles` endpoints with Axios.
- [ ] 3. Update `Sidebar.tsx`:
  - Add `{ label: "Medical Articles", icon: "BookOpen", path: "/doctor/articles" }` under Doctor navigation.
  - Add `{ label: "Article Moderation", icon: "BookOpen", path: "/admin/articles" }` under Super Admin navigation.
- [ ] 4. Update `TopBar.tsx`:
  - Add "Health Guides" / "Articles" link in public header navigation.
- [ ] 5. Test type checking with `npm --prefix fcn-frontend run build`.
- [ ] 6. Commit changes: `git commit -m "feat(frontend): add article types, API service, and sidebar/topbar navigation"`.

---

### Task 4: Public Articles Directory & Reader Experience (Option A Dock & SEO)

**Files:**
- Create: `fcn-frontend/src/components/articles/FloatingDoctorDock.tsx`
- Create: `fcn-frontend/src/components/articles/ArticleCard.tsx`
- Create: `fcn-frontend/src/components/articles/ArticleJsonLd.tsx`
- Create: `fcn-frontend/src/pages/articles/ArticlesDirectoryPage.tsx`
- Create: `fcn-frontend/src/pages/articles/ArticleDetailPage.tsx`
- Modify: `fcn-frontend/src/router/index.tsx`

**Steps:**
- [ ] 1. Build `FloatingDoctorDock.tsx`:
  - Pinned floating dock at `bottom-6 left-1/2 -translate-x-1/2 z-40`.
  - Doctor avatar with verified checkmark, full name, specialty badge, consultation fee in ETB.
  - Direct CTA button: **"Book Dr. [Name] ➔"** that routes to `/appointments/book?doctor=[doctorId]`.
  - Responsive collapse on ultra-narrow mobile viewports.
- [ ] 2. Build `ArticleJsonLd.tsx` injecting Schema.org `MedicalWebPage` and `Physician` JSON-LD scripts into document head.
- [ ] 3. Build `ArticleCard.tsx` for directory grid: cover image, category pill, reading time, publication date, title, excerpt, and author avatar with verified badge.
- [ ] 4. Build `ArticlesDirectoryPage.tsx`:
  - Hero header: "Clinical Health Guides & Medical Insights".
  - Search input with debounced query.
  - Category filter pills matching `SPECIALTY_CATEGORIES`.
  - Featured primary article banner + responsive grid of article cards.
- [ ] 5. Build `ArticleDetailPage.tsx`:
  - Reading progress bar pinned at top of viewport.
  - Editorial layout with clean typography, reading time, and publication date.
  - Option A `FloatingDoctorDock` anchored at bottom.
  - Author bio section at bottom of article with consultation fee, hospital affiliation, and booking button.
  - Related articles grid at the end.
- [ ] 6. Register `/articles` and `/articles/:slug` in `fcn-frontend/src/router/index.tsx`.
- [ ] 7. Commit changes: `git commit -m "feat(articles): implement public directory, article reader, SEO JSON-LD, and Option A floating doctor dock"`.

---

### Task 5: Doctor Portal Writing Studio & Article Management

**Files:**
- Create: `fcn-frontend/src/components/articles/ArticleEditor.tsx`
- Create: `fcn-frontend/src/pages/doctor/DoctorArticlesListPage.tsx`
- Create: `fcn-frontend/src/pages/doctor/DoctorArticleEditorPage.tsx`
- Modify: `fcn-frontend/src/router/index.tsx`

**Steps:**
- [ ] 1. Build `ArticleEditor.tsx`:
  - Form fields: Title, Excerpt, Medical Category (from `SPECIALTY_CATEGORIES`), Cover Image URL.
  - Rich formatting toolbar: H2, H3, Bold, Italic, Bullet List, Numbered List, Clinical Callout Quote, Medical Disclaimer box.
  - Real-time word count & estimated reading time calculation.
  - Live article preview toggle.
- [ ] 2. Build `DoctorArticlesListPage.tsx`:
  - Stats overview: Total Articles, Published, In Review, Total Views.
  - Filter tabs: All, Published, In Review, Drafts, Needs Attention (Rejected).
  - Article cards/table with status badge, rejection reason alert (if rejected), and action buttons (Edit, View Live, Submit for Review, Delete).
  - "Write New Article" CTA button.
- [ ] 3. Build `DoctorArticleEditorPage.tsx`:
  - Supports both create (`/doctor/articles/new`) and edit (`/doctor/articles/:id/edit`).
  - Action buttons: "Save Draft" (keeps status `draft`) and "Submit for FCN Review" (transitions to `pending_review` with confirmation dialog).
- [ ] 4. Register doctor article routes in `fcn-frontend/src/router/index.tsx`.
- [ ] 5. Commit changes: `git commit -m "feat(doctor): implement doctor article writing studio, editor, and submission flow"`.

---

### Task 6: FCN Admin Article Moderation Queue

**Files:**
- Create: `fcn-frontend/src/components/admin/ArticlePreviewModal.tsx`
- Create: `fcn-frontend/src/pages/admin/AdminArticlesModerationPage.tsx`
- Modify: `fcn-frontend/src/router/index.tsx`

**Steps:**
- [ ] 1. Build `ArticlePreviewModal.tsx`:
  - Full modal rendering of article exactly as it appears to patients.
  - Sidebar with author doctor verification details (license number, specialty, hospital).
  - Direct moderation actions:
    - **"Approve & Publish"**: Marks article as `published`, sets `published_at`, publishes live.
    - **"Request Changes / Reject"**: Opens feedback text area where admin enters clinical review feedback for the doctor.
- [ ] 2. Build `AdminArticlesModerationPage.tsx`:
  - Moderation queue dashboard with status tabs: Pending Review (highlighted badge with count), Published, Rejected, All.
  - Search and filter by category or doctor name.
  - Quick actions in table: "Review Article", "Quick Approve", "View on Live Site".
- [ ] 3. Register `/admin/articles` in `fcn-frontend/src/router/index.tsx` under `<SuperAdminRoute>`.
- [ ] 4. Commit changes: `git commit -m "feat(admin): implement article moderation queue with preview and approval workflow"`.

---

### Task 7: End-to-End Verification & Polish

**Files:**
- Tests & build verification across backend and frontend

**Steps:**
- [ ] 1. Run database seed to populate test data.
- [ ] 2. Test Doctor flow: Log in as doctor, create article, save as draft, edit, submit for review.
- [ ] 3. Test Admin flow: Log in as admin, navigate to `/admin/articles`, open pending article in preview modal, approve article.
- [ ] 4. Test Public flow: Navigate to `/articles`, verify approved article appears, click into `/articles/:slug`.
- [ ] 5. Test Option A Floating Doctor Dock: Verify smooth scrolling, dock stays anchored, tapping "Book Dr. Sara" opens booking flow with pre-selected doctor.
- [ ] 6. Inspect page source / elements for Schema.org `MedicalWebPage` JSON-LD.
- [ ] 7. Run full frontend build (`npm --prefix fcn-frontend run build`) and backend tests (`npm --prefix fcn-backend test`).
- [ ] 8. Commit and push: `git push origin master`.
