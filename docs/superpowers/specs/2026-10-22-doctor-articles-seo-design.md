# Design Specification: Doctor Articles & SEO Publishing System

## 1. Intent & The "Why"
Fast Care Now (FCN) aims to establish a zero-cost organic patient acquisition flywheel and elevate physician authority through clinical content marketing:
1. **Physician Authority**: Verified Ethiopian doctors publish high-quality health guides (e.g., Dr. Sara writes *"Managing Diabetes in Ethiopia"*).
2. **Search Engine Discovery**: Articles are indexed by Google with structured `MedicalWebPage` metadata. When patients search queries like *"diabetes management Ethiopia"* or *"child fever care Dire Dawa"*, FCN articles rank at the top.
3. **High-Conversion Booking Loop**: Readers consume the verified article. Throughout their reading session, a **floating doctor pill dock (Option A)** stays anchored at the bottom with Dr. Sara's verified credentials, consultation fee, and a direct **"Book Dr. Sara ➔"** CTA.
4. **Result**: Free patient acquisition, doctor brand growth, and immediate conversion into paid teleconsultations.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
* **Doctor Authoring Experience**: A distraction-free clinical rich-text editor in the Doctor Portal where physicians write, format, preview, and submit articles.
* **FCN Admin Moderation Queue**: Dedicated admin workflow with `"pending_review"` status to vet medical accuracy, safety, and formatting before an article goes live.
* **Public Discovery & SEO**: Clean, fast-loading public routes (`/articles` and `/articles/:slug`) equipped with OpenGraph tags, semantic HTML, and Schema.org `MedicalWebPage` JSON-LD.
* **Frictionless Conversion**: The Option A floating doctor dock and end-of-article author card that routes patients directly into the booking flow with that authoring physician.

### Non-Goals
* Complex multi-tier paywalls or subscription paygates (articles are 100% public for maximum SEO reach).
* Public patient commenting or unmoderated user forums (keeps clinical liability strictly zero).

### Anti-Goals
* Never publish articles directly to Google without FCN clinical administrative approval.
* Never show generic, unrelated doctor ads on an article written by a specific physician—the authoring doctor always owns the direct booking conversion.

---

## 3. User Flows & Architecture

### Flow A: Doctor Writing Lifecycle
1. Doctor navigates to **Doctor Portal → Articles** (`/doctor/articles`).
2. Taps **"Write New Article"** (`/doctor/articles/new`).
3. Enters:
   * Title (e.g., *"Managing Diabetes in Ethiopia"*)
   * Auto-generated SEO slug (e.g., `managing-diabetes-in-ethiopia`)
   * Short excerpt (1–2 sentences for Google search snippet)
   * Medical Category (Primary Care, Women & Child, Heart & Chronic, etc.)
   * Cover image (upload or medical photo URL)
   * Rich text content (headings, bold, bullet points, clinical tips, medication disclaimers).
4. Options:
   * **Save as Draft** (keeps private, editable anytime)
   * **Submit for Review** (status changes to `pending_review`).

### Flow B: Admin Moderation Lifecycle
1. Admin navigates to **Admin Panel → Article Moderation** (`/admin/articles`).
2. Reviews the queue of `pending_review` articles.
3. Clicks on an article to open the preview drawer showing the full formatted article and authoring doctor profile.
4. Admin Actions:
   * **Approve & Publish**: Status becomes `published`, `published_at` timestamp set, public URL activated.
   * **Request Changes**: Status becomes `rejected`, admin enters feedback notes (e.g., *"Please cite standard Ethiopian insulin titration guidelines"*). Doctor is notified to revise and resubmit.

### Flow C: Public Patient Reading & Booking Lifecycle
1. Patient searches Google or visits `/articles`.
2. Lands on `/articles/:slug`.
3. Reading experience:
   * Header with category pill, title, reading time, publication date, author doctor avatar & verified MD badge.
   * Clean typography for clinical readability.
   * **Option A Floating Pill Dock**: As the user scrolls, a floating dock is pinned at bottom-center:
     * Doctor avatar + Verified MD tag
     * Specialty + Consultation fee (e.g., *Endocrinology • 400 ETB*)
     * Button: **"Book Dr. Sara ➔"**
4. Clicking the booking CTA opens the booking modal/flow pre-populated with Dr. Sara's schedule.

---

## 4. Technical Specifications

### 4.1 Database Schema (Prisma PostgreSQL)
```prisma
enum ArticleStatus {
  draft
  pending_review
  published
  rejected
}

model Article {
  id                    String        @id @default(uuid())
  slug                  String        @unique
  title                 String
  excerpt               String
  content               String        @db.Text
  cover_image_url       String?
  category              String
  author_id             String
  author                DoctorProfile @relation(fields: [author_id], references: [id], onDelete: Cascade)
  status                ArticleStatus @default(draft)
  rejection_reason      String?
  views_count           Int           @default(0)
  reading_time_minutes  Int           @default(3)
  published_at          DateTime?
  created_at            DateTime      @default(now())
  updated_at            DateTime      @updatedAt

  @@index([status, published_at])
  @@index([author_id])
  @@index([slug])
  @@map("articles")
}
```

### 4.2 Backend API Routes (`/api/v1/articles` & `/api/v1/admin/articles`)
* **Public**:
  * `GET /api/v1/articles` — Paginated published articles with search and category filtering.
  * `GET /api/v1/articles/:slug` — Single published article with author profile & related articles (increments `views_count`).
* **Doctor**:
  * `GET /api/v1/articles/my` — List all articles created by the authenticated doctor.
  * `POST /api/v1/articles` — Create article (draft or submit for review).
  * `PUT /api/v1/articles/:id` — Update article (if draft or rejected).
  * `DELETE /api/v1/articles/:id` — Delete draft article.
* **Admin**:
  * `GET /api/v1/admin/articles` — List all articles with status filtering (`pending_review`, `published`, etc.).
  * `PATCH /api/v1/admin/articles/:id/status` — Approve or reject article with feedback.

### 4.3 SEO & Structured Data Requirements
* Dynamic `<title>`: `[Article Title] — Dr. [Doctor Name] | Fast Care Now`
* Meta Description: `[Article Excerpt]`
* Canonical URL: `https://fcncare.com/articles/[slug]`
* JSON-LD:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "headline": "Managing Diabetes in Ethiopia",
    "description": "...",
    "author": {
      "@type": "Physician",
      "name": "Dr. Sara Tesfaye",
      "medicalSpecialty": "Endocrinology",
      "url": "https://fcncare.com/doctors/[doctorId]"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Fast Care Now Ethiopia",
      "url": "https://fcncare.com"
    }
  }
  ```

---

## 5. UI Components Breakdown

1. **`FloatingDoctorDock.tsx`**: Floating pill at bottom-center with avatar, verified badge, specialty, consultation fee, and booking button.
2. **`ArticleEditor.tsx`**: Rich formatting toolbar (H2, H3, Bold, Italic, Lists, Quotes), cover image upload/preview, category dropdown, character counters.
3. **`AdminArticleModerationTable.tsx`**: Tabbed moderation view with preview modal, one-click Approve, and Reject with reason.
4. **`ArticlesDirectoryPage.tsx`**: Search bar, category filter tabs, featured hero article, grid of doctor article cards.
5. **`ArticleDetailPage.tsx`**: Clean editorial layout, reading progress bar, floating doctor dock, author bio card at bottom.
