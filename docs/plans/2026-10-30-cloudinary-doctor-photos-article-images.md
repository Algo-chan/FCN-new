# Cloudinary Doctor Photos & Article Images Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable doctors to upload and showcase professional profile photos during registration and account management (displayed in doctor search, directory, and profiles), and empower doctors to upload clinical cover images and in-article illustrations to Cloudinary when publishing medical articles.

**Architecture:** 
- Secure backend image processing pipeline leveraging Node.js `multer` memory storage and Cloudinary SDK v2 with automatic face gravity cropping for doctor portraits and responsive WebP optimization for clinical article media.
- Multi-step registration enhancement enabling doctors to upload their photo during onboarding before or during final account submission, persisted into `DoctorProfile.photo_url` and `photo_public_id`.
- Global search API enhancement returning `photo_url` on doctor records and rendering rich clinical doctor search cards in `SearchPage.tsx`.
- Article Editor upgrade replacing plain URL input with a drag-and-drop Cloudinary cover image uploader, plus an in-article markdown image insertion tool.

**Tech Stack:**
- Backend: Express, TypeScript, Cloudinary v2, Multer, Zod, Prisma ORM (PostgreSQL)
- Frontend: React 18, Vite, TypeScript, Tailwind CSS, Lucide icons, Framer Motion, TanStack Query

---

### Task 1: Backend Cloudinary Service & Validation Hardening

**Files:**
- Modify: `fcn-backend/src/config/cloudinary.ts`
- Create: `fcn-backend/src/services/cloudinary.service.ts`
- Modify: `fcn-backend/src/middleware/upload.middleware.ts`
- Test: `fcn-backend/src/services/cloudinary.service.test.ts`

**Step 1: Write the failing test**
Create unit tests to verify:
1. Rejection of unsupported MIME types (e.g. `application/pdf`, `text/plain`).
2. Rejection of oversized files (> 5MB).
3. Graceful error handling when Cloudinary credentials are not configured or invalid.
4. Correct generation of doctor avatar options (face detection, square aspect ratio, WebP) vs. article image options (max width 1600, quality auto).

**Step 2: Run test to verify it fails**
Run: `npm --prefix fcn-backend run test src/services/cloudinary.service.test.ts`
Expected: FAIL (service not found)

**Step 3: Implement `cloudinary.service.ts`**
- Provide structured methods:
  - `uploadDoctorPhoto(buffer: Buffer, doctorIdOrTempId: string)`: folder `fcn/doctor-photos`, crop `fill`, gravity `face`, width `400`, height `400`, format `webp`.
  - `uploadArticleImage(buffer: Buffer, doctorId: string)`: folder `fcn/articles`, width `1600`, crop `limit`, quality `auto`, format `webp`.
  - `deleteImage(publicId: string)`: safely removes image from Cloudinary.
  - `isConfigured()`: checks whether `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are set.

**Step 4: Run test to verify it passes**
Run: `npm --prefix fcn-backend run test src/services/cloudinary.service.test.ts`
Expected: PASS

**Step 5: Commit**
`git add fcn-backend/src/services/cloudinary.service.ts fcn-backend/src/middleware/upload.middleware.ts fcn-backend/src/config/cloudinary.ts`
`git commit -m "feat(backend): add centralized Cloudinary image upload service with clinical presets"`

---

### Task 2: Doctor Registration Photo Upload Endpoint & Registration Schema

**Files:**
- Modify: `fcn-backend/src/modules/auth/auth.validators.ts`
- Modify: `fcn-backend/src/modules/auth/auth.service.ts`
- Modify: `fcn-backend/src/modules/auth/auth.controller.ts`
- Modify: `fcn-backend/src/modules/auth/auth.routes.ts`
- Test: `fcn-backend/src/modules/auth/auth.test.ts`

**Step 1: Update Auth Validators & Database Persistence**
- In `RegisterStep2Schema` (`auth.validators.ts`), add optional:
  - `photo_url: z.string().url().optional()`
  - `photo_public_id: z.string().optional()`
- In `auth.service.ts` (`registerStep2` and `registerGoogleUser`):
  - When creating `doctorProfile`, save `photo_url: roleData.photo_url || null` and `photo_public_id: roleData.photo_public_id || null`.

**Step 2: Add Registration Doctor Photo Upload Endpoint**
- Endpoint: `POST /api/v1/auth/upload-doctor-photo`
  - Accepts multipart form data with file field `photo` (limit 5MB, JPG/PNG/WebP).
  - Protected with standard rate limiter (e.g. max 10 uploads per IP per 15 minutes).
  - Uploads photo via `cloudinaryService.uploadDoctorPhoto(buffer, 'reg-' + uuid)`.
  - Returns `{ success: true, data: { photo_url: string, photo_public_id: string } }`.

**Step 3: Run Auth Tests**
Run: `npm --prefix fcn-backend run test src/modules/auth`
Expected: PASS

**Step 4: Commit**
`git commit -m "feat(auth): support doctor profile photo upload during registration"`

---

### Task 3: Doctor Article Image Upload API

**Files:**
- Modify: `fcn-backend/src/modules/articles/articles.routes.ts`
- Modify: `fcn-backend/src/modules/articles/articles.controller.ts`
- Modify: `fcn-backend/src/modules/articles/articles.service.ts`
- Test: `fcn-backend/src/modules/articles/articles.test.ts`

**Step 1: Add Article Image Upload Endpoint**
- Endpoint: `POST /api/v1/articles/upload-image`
  - Auth: `authMiddleware, requireRole("doctor")`
  - Middleware: `uploadMiddleware` (memory storage, max 5MB, JPG/PNG/WebP)
  - Controller: `uploadArticleImageController`
  - Uploads to Cloudinary folder `fcn/articles`
  - Returns `{ success: true, data: { url: string, public_id: string } }`

**Step 2: Run Articles Tests**
Run: `npm --prefix fcn-backend run test src/modules/articles`
Expected: PASS

**Step 3: Commit**
`git commit -m "feat(articles): add doctor article cover and in-article image upload endpoint"`

---

### Task 4: Global Search API Doctor Photo Selection

**Files:**
- Modify: `fcn-backend/src/modules/search/search.routes.ts`
- Modify: `fcn-frontend/src/pages/SearchPage.tsx`
- Modify: `fcn-frontend/src/types/index.ts` (if search response types are defined here)

**Step 1: Update Search API Query**
- In `fcn-backend/src/modules/search/search.routes.ts`:
  - Update doctor query selection:
    ```ts
    doctor_profile: {
      select: {
        specialty: true,
        photo_url: true,
        rating_average: true,
        hospital: { select: { name: true } }
      }
    }
    ```

**Step 2: Update `SearchPage.tsx` UI**
- Display doctor's photo thumbnail alongside doctor name, specialty, and hospital:
  - If `doctor_profile?.photo_url` is present, render crisp circular avatar with `object-cover`.
  - If null, render doctor initials avatar or clinical badge with specialty icon.
  - Link directly to `/doctors/${d.id}`.

**Step 3: Commit**
`git commit -m "feat(search): include doctor photos in search results and render photo cards"`

---

### Task 5: Frontend Doctor Registration Photo Uploader UI

**Files:**
- Create: `fcn-frontend/src/components/auth/DoctorPhotoUploader.tsx`
- Modify: `fcn-frontend/src/pages/auth/RegisterPage.tsx`

**Step 1: Build `DoctorPhotoUploader.tsx`**
- Interactive dropzone matching FCN clinical aesthetic:
  - Camera/Upload icon with dashed teal border.
  - Drag-and-drop or file selector.
  - Instant client-side preview via `URL.createObjectURL`.
  - Automatic upload trigger to `/api/v1/auth/upload-doctor-photo` with loading spinner.
  - Preview card with "Change Photo" and "Remove Photo" buttons.
  - Displays validation errors (file size > 5MB, non-image format).

**Step 2: Integrate into `RegisterPage.tsx`**
- In Phase 3 (`role === "doctor"`):
  - Render `<DoctorPhotoUploader />` right above doctor clinical fields.
  - Stores `photo_url` and `photo_public_id` in form state.
- In Phase 4 (`Phase === "review"`):
  - If `form.role === "doctor"` and `form.photo_url` exists, render the doctor's photo thumbnail in the review card before final submission.
  - Pass `photo_url` and `photo_public_id` in `payload` to `registerStep2` or `registerGoogle`.

**Step 3: Commit**
`git commit -m "feat(register): add doctor photo upload in registration form and review summary"`

---

### Task 6: Frontend Doctor Article Cover & In-Article Image Uploader

**Files:**
- Create: `fcn-frontend/src/components/articles/ArticleImageUploader.tsx`
- Modify: `fcn-frontend/src/components/articles/ArticleEditor.tsx`
- Modify: `fcn-frontend/src/services/article.service.ts`

**Step 1: Add Image Upload Method to `article.service.ts`**
- `uploadArticleImage(file: File): Promise<{ url: string; public_id: string }>` calling `POST /api/v1/articles/upload-image`.

**Step 2: Upgrade `ArticleEditor.tsx`**
- Replace simple text URL input with `ArticleImageUploader`:
  - Drag-and-drop image dropzone for the Article Cover.
  - Shows uploaded image banner preview with resolution metadata and remove button.
  - Allows tab toggle between "Upload Image" and "Image URL" (for Unsplash/external links).
- In-Article Markdown Image helper:
  - Update toolbar `ImageIcon` button:
  - When clicked, opens a compact image upload dialog or file picker.
  - Uploads the image to Cloudinary and automatically inserts `![Clinical image](<url>)` at the current cursor position in markdown.

**Step 3: Commit**
`git commit -m "feat(articles): integrate Cloudinary cover image and in-article image uploader"`

---

### Task 7: Full End-to-End Verification

**Steps:**
1. Typecheck: `npx tsc --noEmit` on both `fcn-backend` and `fcn-frontend`.
2. Test Doctor Registration with Photo:
   - Register a new doctor account with a profile photo.
   - Verify photo upload to Cloudinary.
   - Verify `DoctorProfile` record in PostgreSQL contains `photo_url` and `photo_public_id`.
3. Test Doctor Search:
   - Search for doctor on `/search` and `/doctors`.
   - Verify doctor card renders uploaded photo alongside name and specialty.
4. Test Article Creation with Images:
   - Login as doctor, navigate to `/doctor/articles/new`.
   - Upload article cover image via drag-and-drop.
   - Insert an inline clinical image via toolbar.
   - Publish/save draft, verify image renders in `ArticlesDirectoryPage` and `ArticleDetailPage`.
5. Production Build verification:
   - `npm --prefix fcn-backend run build`
   - `npm --prefix fcn-frontend run build`
