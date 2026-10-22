# Instant Consult ("See a Doctor Now") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

---

### Overview & Goal
Build the on-demand **Instant Consult** flow for Fast Care Now.
When a patient taps **"See a Doctor Now"**, rather than browsing directory cards, they immediately enter an on-demand matching flow:
1. **Screen 1 (`FindingDoctorScreen.tsx`)**: Full-screen modal overlay with breathing stethoscope SVG animation, 4 rotating reassurance messages (4s crossfading), EKG SVG baseline, and haptic vibration.
2. **Screen 2 (`DoctorFoundScreen.tsx`)**: In-place center transition via `AnimatePresence` revealing the matched doctor card, "Ready now" status, auto-greeting quote, an animated 3-second progress bar, and an optional allergy note input.
3. **Screen 3 (`ConsultationPage.tsx`)**: Curtain split transition into the active consultation room, with an active countdown timer, "in_session" status sync, "Dr. X has joined" system notification, and the doctor's auto-greeting with typing indicator.
4. **No Doctor Available State (`NoDoctorScreen.tsx`)**: Real-time queue position display, estimated wait, next available doctor cards, AI symptom checker shortcut, and Ethiopian emergency numbers (907 / 991).
5. **Doctor-Side Matching**: Real-time incoming call modal with audio chime and a 30s accept timer for active doctors.
6. **Backend Queue & Matchmaker**: Redis-backed queue (with in-memory fallback) and Socket.io events.

---

### Proposed File Structure

```
fcn-backend/
├── src/
│   ├── modules/
│   │   └── instant-consult/
│   │       ├── instant-consult.service.ts      # Matching, queue management (Redis + fallback), appointment creation
│   │       ├── instant-consult.controller.ts   # Request, Accept, Decline, Cancel endpoints
│   │       └── instant-consult.routes.ts       # Express router mounted at /api/v1/instant-consult
│   └── socket/
│       └── index.ts                            # User-level socket rooms (user:userId, role:doctor) & instant events

fcn-frontend/
├── src/
│   ├── services/
│   │   └── instant-consult.service.ts          # Axios API endpoints for instant consult
│   ├── store/
│   │   └── instant-consult.store.ts            # State store for overlay stages & queue info
│   ├── components/
│   │   └── instant-consult/
│   │       ├── InstantConsultOverlay.tsx       # Root full-screen portal modal with gradient & EKG
│   │       ├── FindingDoctorScreen.tsx         # Screen 1: Breathing stethoscope, rotating reassurance
│   │       ├── DoctorFoundScreen.tsx           # Screen 2: Doctor card, 3s progress bar, allergy prompt
│   │       ├── NoDoctorScreen.tsx              # Screen fallback: Queue position, emergency hotline, AI CTA
│   │       ├── DoctorIncomingInstantModal.tsx  # Doctor-side accept/decline popup with 30s timer
│   │       └── StethoscopeAnimation.tsx        # Framer Motion breathing stethoscope SVG
│   └── pages/
│       ├── consultation/
│       │   └── ConsultationPage.tsx            # Screen 3: Split transition, countdown timer, auto-greeting
│       └── dashboard/
│           └── DashboardPage.tsx               # "See a Doctor Now" primary CTA button
```

---

### Tasks

#### Task 1: Backend Instant Consult Module & Queue System
- [ ] Create `fcn-backend/src/modules/instant-consult/instant-consult.service.ts`:
  - `findAvailableDoctor()`: Queries Prisma for `User` where `role: 'doctor'`, `status: 'active'`, and `doctor_profile.availability_status: 'available'`.
  - `requestInstantConsult(patientId, chiefComplaint, allergies)`:
    - If an available doctor exists: creates appointment (`appointment_type: 'remote'`, status: `'confirmed'`, `platform_fee_etb: 50`, `payment_status: 'paid'`). Emits `instant_consult_incoming` to `user:${doctorId}` via Socket.io.
    - If no doctor is immediately available: pushes `patientId` to Redis sorted set / list (with in-memory queue fallback), calculates queue position (e.g. index + 1) and estimated wait (`position * 5` minutes). Emits `queue_update`.
  - `acceptInstantConsult(doctorId, appointmentId)`: Updates appointment to `in_session`, doctor to `in_session`, emits `doctor_accepted` to `user:${patientId}` and `consultation_ready` with appointment ID.
  - `declineInstantConsult(doctorId, appointmentId)`: Re-routes patient to next available doctor or into queue.
  - `cancelInstantConsult(patientId, appointmentId)`: Removes from queue or cancels pending appointment.
- [ ] Create `fcn-backend/src/modules/instant-consult/instant-consult.controller.ts` & `instant-consult.routes.ts`:
  - `POST /api/v1/instant-consult/request`
  - `POST /api/v1/instant-consult/accept`
  - `POST /api/v1/instant-consult/decline`
  - `POST /api/v1/instant-consult/cancel`
  - `GET /api/v1/instant-consult/queue-status`
- [ ] Register router in `fcn-backend/src/app.ts`.
- [ ] Update `fcn-backend/src/socket/index.ts`:
  - On connection, automatically join `user:${user.id}`.
  - If `user.role === 'doctor'`, join `role:doctor`.
  - Expose events `doctor_accepted`, `consultation_ready`, `no_doctors_available`, `queue_update`.

#### Task 2: Frontend Instant Consult Service & Store
- [ ] Create `fcn-frontend/src/services/instant-consult.service.ts`:
  - `requestInstantConsult(data: { chief_complaint?: string; allergies?: string })`
  - `acceptInstantConsult(appointmentId: string)`
  - `declineInstantConsult(appointmentId: string)`
  - `cancelInstantConsult(appointmentId?: string)`
  - `getQueueStatus()`
- [ ] Create `fcn-frontend/src/store/instant-consult.store.ts`:
  - State: `isOpen`, `step` (`'finding' | 'found' | 'no_doctor' | 'ready'`), `appointmentId`, `doctor`, `queuePosition`, `estimatedWaitMinutes`, `allergiesNote`.
  - Actions: `openInstantConsult()`, `close()`, `setDoctorFound(doctor, appointmentId)`, `setNoDoctor(queuePosition, estimatedWait)`, `setStep()`, `setAllergiesNote()`.

#### Task 3: Screen 1 — FindingDoctorScreen.tsx & Stethoscope Animation
- [ ] Create `fcn-frontend/src/components/instant-consult/StethoscopeAnimation.tsx`:
  - Framer Motion SVG breathing stethoscope (scale loop `[1, 1.05, 1]` every 2s).
  - Glowing pulse aura in teal (#2dd4bf).
- [ ] Create `fcn-frontend/src/components/instant-consult/FindingDoctorScreen.tsx`:
  - Centered layout inside teal dark gradient `#0A1628` -> `#0A7EA4`.
  - Breathing stethoscope SVG.
  - Title: "Finding your doctor..." (`text-xl font-medium text-white`).
  - 4 rotating reassurance messages (4s interval, crossfade transition via `AnimatePresence`):
    1. "Checking verified Ethiopian specialists active right now..."
    2. "Testing video connection & bandwidth..."
    3. "Consultations start within minutes with zero clinic queue..."
    4. "Average doctor connection speed: under 3 minutes..."
  - Mount hook: triggers `navigator.vibrate?.(200)` for haptic feedback.
  - Cancel button: "Cancel search" at bottom.

#### Task 4: Screen 2 — DoctorFoundScreen.tsx
- [ ] Create `fcn-frontend/src/components/instant-consult/DoctorFoundScreen.tsx`:
  - Smooth swap replacing center content of Screen 1 using `AnimatePresence`.
  - Header: "✅ Doctor found!" in vibrant emerald.
  - `DoctorFoundCard`:
    - Doctor avatar/photo with verified shield.
    - Full name, specialty, star rating.
    - "🟢 Ready now" pulsing indicator.
    - Pre-configured doctor greeting quote: "Hello! I am ready to review your symptoms and assist you."
  - 3-Second animated progress bar:
    - Framer Motion `width: 0% -> 100%`, `duration: 3`, gradient `from-teal-400 to-emerald-400`.
    - Label: "Connecting to consultation room in 3s..."
  - Quick interaction: "Any allergies or current medications?" quick input chip allowing the patient to type or select quick pills before connecting.
  - On progress complete: triggers transition to Screen 3 (`/consultation/:appointmentId`).

#### Task 5: Screen Fallback — NoDoctorScreen.tsx
- [ ] Create `fcn-frontend/src/components/instant-consult/NoDoctorScreen.tsx`:
  - Live queue counter: "You are #X in queue • Estimated wait: ~Y mins".
  - Real-time updates via Socket `queue_update`.
  - Mini cards of next doctors on shift.
  - Immediate action buttons:
    - "Check symptoms with AI Assistant while you wait" (routes to `/ai-check`).
    - Ethiopian Emergency Hotline banner:
      - 🚑 Ambulance / Red Cross: **907**
      - 🚓 Police Emergency: **991 / 911**
      - 🏥 Dire Dawa Dil Chora Hospital: **+251 25 111 2020**
  - "Leave Queue" button.

#### Task 6: InstantConsultOverlay.tsx Master Container & Doctor Incoming Modal
- [ ] Create `fcn-frontend/src/components/instant-consult/InstantConsultOverlay.tsx`:
  - Fullscreen portal overlay (`fixed inset-0 z-50 overflow-hidden flex flex-col justify-between`).
  - Rich background gradient `#0A1628` -> `#0A7EA4`.
  - Top header: FCN Logo (40px, fade in) + close button.
  - Bottom baseline: EKG SVG line animation (opacity 0.3).
  - Socket listeners for `doctor_accepted`, `consultation_ready`, `no_doctors_available`, `queue_update`.
- [ ] Create `fcn-frontend/src/components/instant-consult/DoctorIncomingInstantModal.tsx`:
  - Active for doctors when online.
  - Plays ring chime when `instant_consult_incoming` is received.
  - Shows patient name, chief complaint, 30s countdown bar, "Accept" and "Decline" buttons.
  - On Accept: opens consultation directly for the doctor!
- [ ] Add `DoctorIncomingInstantModal` inside `PageLayout.tsx`.

#### Task 7: Screen 3 & ConsultationPage.tsx Enhancements
- [ ] In `fcn-frontend/src/pages/consultation/ConsultationPage.tsx`:
  - Implement curtain split reveal page transition on mount.
  - Add Consultation Countdown Timer (15:00 / 30:00 countdown badge with color shifts: green > 5m, amber 2-5m, pulsing red < 2m).
  - Automatically mark appointment status as `in_session` via socket/API.
  - Insert initial system message: "Dr. [Name] has joined the consultation".
  - Trigger auto-greeting message: 2-second typing indicator -> doctor's greeting message rendered into chat.

#### Task 8: Entry Points & Triggers across App
- [ ] Add prominent "See a Doctor Now ⚡" CTA on:
  - Patient Dashboard ([`DashboardPage.tsx`](file:///c:/Users/USER/Desktop/FCN-new/fcn-frontend/src/pages/dashboard/DashboardPage.tsx)).
  - Find Doctors Page banner ([`FindDoctorsPage.tsx`](file:///c:/Users/USER/Desktop/FCN-new/fcn-frontend/src/pages/doctors/FindDoctorsPage.tsx)).
  - Landing Hero / Navigation for quick entry.

#### Task 9: Verification, Tests & Push
- [ ] Backend route & service unit tests with Vitest.
- [ ] Frontend build verification (`tsc --noEmit && vite build`).
- [ ] Commit & push to `master`.
