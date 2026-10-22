# Consultation Duration Tiers, Countdown Timer & Session Extension Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

---

### Overview & Goal
Implement consultation duration tiers (15 min General, 30 min Specialist, 45 min Complex), a live countdown timer in the consultation chat with a 5-minute ending warning, and a doctor-requested / patient-approved session extension flow.

### Key Requirements
1. **Duration Tiers**:
   - 15 min: General consultation (standard rate)
   - 30 min: Specialist consultation
   - 45 min: Complex case
2. **Live Countdown Timer in Chat**:
   - Active countdown timer rendered in `TopBar` and inline session notice.
   - Accurately anchored to `consultation_started_at` + `duration_minutes`.
   - Visual states: Normal (> 5m), Amber warning (2–5m), Pulsing Red (< 2m).
   - "Session ending in 5 min" prominent banner when timer drops below 5 minutes.
3. **Session Extension Flow**:
   - Doctor can request an extension (+10 min or +15 min).
   - Patient receives a real-time prompt in the consultation view to approve or wrap up.
   - Upon patient approval:
     - Backend updates appointment `duration_minutes`.
     - Socket event broadcasts `extension_granted` with new duration.
     - System chat message is inserted: *"Session extended by 10 minutes (approved by patient)"*.
     - Countdown timer immediately adds the extra minutes for both doctor and patient.
   - Upon decline:
     - Doctor receives notification that extension was declined, and chat prompts to wrap up.

---

### Proposed File Changes

```
fcn-backend/
├── src/
│   ├── modules/
│   │   └── consultation/
│   │       ├── consultation.service.ts       # Expose duration_minutes, requestExtension, approveExtension
│   │       ├── consultation.controller.ts    # Extension request & approve handlers
│   │       └── consultation.routes.ts        # POST /:appointmentId/extension/request & /approve
│   └── socket/
│       └── index.ts                          # Socket events: extension_requested, extension_approved, extension_declined

fcn-frontend/
├── src/
│   ├── services/
│   │   └── consultation.service.ts           # requestExtension, approveExtension API calls
│   ├── types/
│   │   └── index.ts                          # Duration tier types & Appointment duration field
│   └── pages/
│       └── consultation/
│           ├── ConsultationPage.tsx          # Real countdown timer, 5-min warning banner, extension triggers
│           └── components/
│               ├── ConsultationTimer.tsx     # Dedicated timer with warning badges and tier chip
│               └── ExtensionApprovalModal.tsx# Patient approval modal / prompt for requested extension
```

---

### Tasks

#### Task 1: Backend Consultation Extension API & Socket Events
- [ ] In `fcn-backend/src/modules/consultation/consultation.service.ts`:
  - Update `getConsultationContext` to return `duration_minutes: appointment.duration_minutes ?? 15` and `consultation_started_at`.
  - Add `requestExtension(appointmentId, doctorId, minutes)`:
    - Verifies doctor is the assigned doctor and appointment is `in_session`.
    - Emits socket event `extension_requested` to `user:${appointment.patient_id}` and `consultationRoom(appointmentId)` with `{ appointmentId, minutes, doctorName }`.
  - Add `approveExtension(appointmentId, patientId, approved, minutes)`:
    - Verifies patient is the assigned patient.
    - If approved:
      - Adds `minutes` to `appointment.duration_minutes`.
      - Inserts an encrypted system message: `"Session extended by ${minutes} minutes (approved by patient)"`.
      - Emits `extension_granted` with `{ appointmentId, duration_minutes, addedMinutes: minutes }`.
    - If declined:
      - Inserts system message: `"Session extension declined. Wrapping up consultation."`.
      - Emits `extension_declined` with `{ appointmentId }`.
- [ ] In `fcn-backend/src/modules/consultation/consultation.controller.ts` & `consultation.routes.ts`:
  - `POST /api/v1/consultations/:appointmentId/extension/request`
  - `POST /api/v1/consultations/:appointmentId/extension/approve`
- [ ] In `fcn-backend/src/socket/index.ts`:
  - Add listeners for `request_consultation_extension` and `respond_consultation_extension`.

#### Task 2: Frontend Consultation Service & Types
- [ ] In `fcn-frontend/src/types/index.ts`:
  - Add `duration_minutes?: number` to `Appointment` and `ConsultationContext`.
  - Add `DurationTier = "general" | "specialist" | "complex"`.
- [ ] In `fcn-frontend/src/services/consultation.service.ts`:
  - Add `requestExtension(appointmentId: string, minutes: number)`.
  - Add `respondExtension(appointmentId: string, approved: boolean, minutes: number)`.

#### Task 3: Countdown Timer & 5-Minute Warning in ConsultationPage
- [ ] Create `fcn-frontend/src/components/consultation/ConsultationTimer.tsx`:
  - Computes remaining seconds from `consultation_started_at` + `duration_minutes * 60`.
  - Displays Tier chip:
    - 15m: "General (15m)"
    - 30m: "Specialist (30m)"
    - 45m: "Complex Case (45m)"
  - Displays formatted timer `MM:SS`.
  - Shows warning banner when remaining seconds <= 300 (5 minutes):
    - `"⚠️ Session ending in 5 min. Please finalize clinical advice or request an extension."`
- [ ] In `fcn-frontend/src/pages/consultation/ConsultationPage.tsx`:
  - Integrate `ConsultationTimer` into `TopBar`.
  - Render a floating / inline 5-minute warning alert above chat stream when remaining <= 5 min.
  - Doctor action button in `TopBar`: "+10 min" or "Extend Session".

#### Task 4: Patient Extension Approval Modal & Real-Time Sync
- [ ] Create `fcn-frontend/src/components/consultation/ExtensionApprovalModal.tsx`:
  - Shown to the patient when `extension_requested` socket event is received.
  - Message: *"Dr. [Name] is requesting a [X]-minute extension to complete your care. Do you approve?"*
  - Buttons: `[Approve +10 Min]` (green) and `[Wrap Up / Decline]` (slate).
  - Countdown bar (e.g. 60s auto-decline if unanswered).
- [ ] In `fcn-frontend/src/pages/consultation/ConsultationPage.tsx`:
  - Bind socket listeners for `extension_requested`, `extension_granted`, `extension_declined`.
  - When `extension_granted`:
    - Updates local duration and timer.
    - Plays audio alert.
    - Displays toast: *"Session extended by [X] minutes"*.

#### Task 5: Verification & End-to-End Build
- [ ] Backend typecheck (`npm --prefix fcn-backend run typecheck`).
- [ ] Frontend build (`npm --prefix fcn-frontend run build`).
- [ ] Git commit & push.
