# Doctors Module

Public doctor discovery + private doctor self-management.

## Feature flag

Public endpoints are gated behind `FEATURE_PUBLIC_DOCTORS` (default `true`).

| Value  | Effect |
| ------ | ------ |
| `true` | Public browse/search endpoints respond normally |
| `false`| All public endpoints (`GET /doctors`, `/specialties`, `/cities`, `/:id`, `/:id/availability`) return `404 NOT_FOUND`; authenticated `/doctors/me/*` routes still work |

Set it in `fcn-backend/.env`:

```
FEATURE_PUBLIC_DOCTORS=true
```

## Public endpoints (no auth)

| Method | Path | Notes |
| ------ | ---- | ----- |
| GET | `/api/v1/doctors?page&limit&specialty&hospital_id&city&min_fee&max_fee&language&available_today&available_now&verified_only&search` | Paginated list, active doctors only, default page 1 / limit 12 (max 50) |
| GET | `/api/v1/doctors/cities` | Distinct non-null cities for filters |
| GET | `/api/v1/doctors/specialties` | Distinct specialties for filters |
| GET | `/api/v1/doctors/:id` | Detail: bio, fees, languages, ratings, `next_available_slot`, `estimated_response_time` |
| GET | `/api/v1/doctors/:id/availability?date=YYYY-MM-DD` | Time slots for a day (8:00–18:00, 30-min) |

### Privacy guarantees
- `PublicDoctorCard` / `PublicDoctorDetail` never include `email` or `phone`.
- Only `role: "doctor"` + `status: "active"` profiles are returned.

### Card / detail fields (flat shape)
`id`, `full_name`, `specialty`, `city`, `photo_url`, `languages_spoken`,
`consultation_fee_etb`, `follow_up_fee_etb`, `rating_average`, `rating_count`,
`verified`, `availability_status`, `next_available_slot`, `hospital_name`, `hospital_location`.
Detail adds `bio`, `years_experience`, `clinic_address`, `consultation_types`,
`total_consultations`, `estimated_response_time`, `recent_ratings`.

## Private endpoints (auth: doctor)

`GET/PATCH /doctors/me/profile`, `GET/PATCH /doctors/me/availability`
(`available` | `in_session` | `unavailable`), `POST/DELETE /doctors/me/photo`,
`GET /doctors/me/appointments`.

## Migration

Reversible Prisma migration: `src/prisma/migrations/20260923000001_public_doctor_profiles/`
(adds `city`, `follow_up_fee_etb`, `verified`, `verification_note` to `DoctorProfile` +
indexes). Rollback: `prisma migrate resolve --rolled-back 20260923000001_public_doctor_profiles`.

## Tests

```
cd fcn-backend
npm test
```

- `doctors.slots.test.ts` — pure slot-window / occupancy / first-available logic.
- `doctors.routes.test.ts` — supertest: no-auth 200, query filters forwarded, cities,
  no `email`/`phone` on detail, `404` AppError shape, `422` validation, flag-off `404`.

## Manual verification checklist

1. With `FEATURE_PUBLIC_DOCTORS=true` and server running, without any token:
   `curl -i http://localhost:5000/api/v1/doctors?city=Dire+Dawa&verified_only=true` → `200`, body has no `email`/`phone`, flat fields present, `meta.total`.
2. `curl -i http://localhost:5000/api/v1/doctors/<id>` → `200`, detail fields incl.
   `next_available_slot`, `follow_up_fee_etb` (or `null`), `verified`.
3. `curl -i http://localhost:5000/api/v1/doctors` with `page=0` → `422` validation error.
4. Set `FEATURE_PUBLIC_DOCTORS=false`, restart, repeat step 1 → `404 NOT_FOUND`.
5. Frontend: open `/doctors` logged out → page renders with public Navbar/Footer;
   verify city/fee/language/verified-only/available-today filters work.
6. Click "Book Appointment" logged out → redirected to `/login`; after sign-in,
   lands back on booking for the selected doctor.
7. Switch the page language toggle (English ⇄ አማርኛ) — doctors page strings update.
8. Doctor email/phone never appears in any card, modal, or JSON response.