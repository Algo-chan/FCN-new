# Changelog

All notable changes to the Fast Care Now (FCN) monorepo are documented here.

## [Unreleased] — Feature 2.1: Public Doctor Profiles

Branch: `f1/public-doctor-profiles` — one feature, one branch, one merge.

### Added (backend)
- Public, unauthenticated `GET /api/v1/doctors` — paginated list (page/limit ≤ 50),
  flat card shape, filters: `specialty`, `hospital_id`, `city`, `min_fee`, `max_fee`,
  `language`, `available_today`, `available_now`, `verified_only`, `search`.
- Public `GET /api/v1/doctors/:id` — detail profile (bio, fees, languages, ratings,
  next available slot). **Never exposes doctor email or phone.**
- Public `GET /api/v1/doctors/cities` and existing `GET /api/v1/doctors/specialties`
  used by the filters.
- `next_available_slot` computed from real appointments over a 7-day window
  (`buildSlotsForDate` / `buildOccupiedByDate` / `findFirstAvailableSlot`).
- Feature flag `FEATURE_PUBLIC_DOCTORS` (env var; default `true`). When `false`, all
  public doctor endpoints respond `404 NOT_FOUND` via `requireFeature` middleware.
- MySQL/Postgres migration `20260923000001_public_doctor_profiles` (reversible):
  `DoctorProfile.city`, `follow_up_fee_etb`, `verified`, `verification_note` + indexes.
- Test stack: vitest + supertest. 15 backend tests (slot logic + API happy paths:
  no-auth 200, filters forwarded, no email/phone, 404/422 shapes, flag-off 404).
- Fixed `.env` secret generation (previous values contained `#` which truncates values
  in `dotenv`); secrets are now long hex strings passing validation.

### Added (frontend)
- Lightweight i18n: `src/i18n/` (`I18nProvider`, `useTranslation`, en/am dictionaries,
  `{param}` interpolation), wired in `main.tsx`. All new/changed UI strings are
  translated (English + Amharic); an in-page locale toggle ships with the doctors page.
- `src/pages/doctors/FindDoctorsPage` is now **public** (`/doctors`, public Navbar/Footer
  wrapper, no auth wall). Patient route remains protected.
- `DoctorCard` / `DoctorFilters` / `DoctorDetailModal` updated to the flat public shape:
  verified badge, city, languages, consult + follow-up fee (— when unset), next available
  slot, and new filters (city, fee range, language, verified-only, available today).
- Book/Message CTAs redirect to `/login` (with `state.from` back to booking) when the
  visitor is not authenticated.
- Search page adds a "Browse all doctors" entry to the public directory.
- Frontend tests: vitest (v2, compatible with Vite 5); 4 i18n tests including
  en/am key parity.

### Fixed (prior, merged to `main` as `043bb92`)
- Admin appointments `GET /admin/all` now lists appointments correctly (status +
  hospital scope + limit) instead of miswired `getMyAppointments`.
- Removed unused backend deps; `@types/*` moved to devDependencies; `allowScripts`
  declared for postinstall scripts (Prisma client generation).