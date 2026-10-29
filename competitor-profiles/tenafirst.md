# Competitor Profile: TenaFirst (TenaFirst Plus)
**Analysis Date:** 2026-10-28  
**Target URLs:** https://www.tenafirst.com/ | https://www.tenafirst.net/  
**Raw Data Reference:** `competitor-profiles/raw/tenafirst/2026-10-28/scrapes/`  
**Focus:** Landing Page Architecture, Service Offerings, Patient Journeys & Adaptable Features for Fast Care Now (FCN)

---

## 1. Executive Summary

**TenaFirst Plus** (`tenafirst.com` / `tenafirst.net`) is one of the most prominent commercial telemedicine and digital healthcare platforms operating in Ethiopia. Founded to address doctor shortages, long hospital wait queues, and geographic healthcare disparities in Ethiopia, TenaFirst combines an online multi-specialty doctor booking directory, video/audio/chat telehealth consultations, in-person partner clinic appointments, home nursing visits, and a vendor network linking pharmacies and diagnostic laboratories.

A deep reverse-engineering of their production web application revealed that the platform is built on an enterprise service directory/marketplace backend (Laravel + Inertia.js + Vue.js) augmented with **Agora.io** for real-time video/voice consultations, **Pusher** for instant messaging and push notifications, and a dedicated **Ethiopian Diaspora Health Sponsorship** module leveraging Zelle and Commercial Bank of Ethiopia (CBE) accounts.

---

## 2. Technical Stack & Infrastructure Teardown

From live HTTP headers, JavaScript bundles (`app-8cc86598.js`), and server responses:

| Dimension | TenaFirst Implementation | Fast Care Now (FCN) Architecture | Comparative Advantage |
| :--- | :--- | :--- | :--- |
| **Backend Architecture** | Laravel (PHP 8.x) + Inertia.js SSR + MySQL | Node.js / Express + TypeScript + Prisma / MongoDB / PostgreSQL | **FCN** has faster asynchronous event loops, native TypeScript type-safety across stack. |
| **Frontend Framework** | Vue.js (Inertia.js SPA) + Bootstrap 5 / Tailwind CSS + FontAwesome 6 | React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion + GSAP | **FCN** delivers significantly superior visual polish, 60fps animations, and mobile responsiveness. |
| **Real-time Video / Audio** | **Agora.io** Web SDK (`agora_app_id: e7add42c625e...`) | Direct Cellular Doctor Calling (`tel:`) + WebRTC fallback | **TenaFirst** has in-app video calls; **FCN** has carrier direct cellular calls (crucial for weak 3G/2G connections in Ethiopia). |
| **Real-time Chat & Alerts** | **Pusher** (`pusher_app_id: 1926621`, cluster: `ap2`) | Socket.io / WebSocket server | **FCN** avoids per-message third-party SaaS costs with self-hosted websockets. |
| **Location & Maps** | Google Maps JavaScript API + Places Autocomplete | Leaflet / OpenStreetMap + Custom Ethiopian hospital data | **FCN** avoids Google Maps API billing quotas while providing precise hospital facility maps. |
| **Payment Gateways** | Manual Bank Transfer (CBE `1000643563219`), Telebirr, Zelle (US diaspora) | Telebirr, CBE Birr, Chapa / Stripe integration | **FCN** supports automated digital checkout via Telebirr API. |
| **Language Support** | 3 Languages: English (`en`), Amharic (`am`), Afaan Oromoo (`om`) | 4 Languages: English, Amharic, Afaan Oromoo, **Somali** | **FCN** uniquely serves Somali-speaking populations (vital for Dire Dawa & Somali Region). |
| **Mobile Distribution** | Android App on Google Play (`tenaplus.ahaduweb.com`) | Progressive Web App (PWA) + responsive mobile web | **TenaFirst** has Play Store presence; **FCN** requires no app download (works on any browser). |

---

## 3. Landing Page Breakdown (Section by Section)

TenaFirst’s homepage is composed of 12 distinct functional modules extracted from their live Inertia page state:

### 1. Urgent Call Center & Crisis Banner (Header)
- **Emergency Disclaimer:** Prominently warns: *"Don't use this site if: You are in a crisis or if any other person may be in danger."*
- **Shortcode Hotline:** Highlights national short code **6037** and landline `0116 353516` for instant voice dispatch without requiring internet access.

### 2. Hero Section & Dual Value Proposition
- **Headline:** *"Your Healthcare Solution Just a Click Away"* / *"Your Health At Your Fingertips"*
- **Sub-headline:** *"24/7 Video Consultations • Audio Calls • Chat Consultation with Doctors"*
- **Trust Metrics:** *"100+ Online Doctors • 500+ Online Appointments"*
- **Price Anchor:** *"Specialty-Care Services, Starts from 500Br"* (Explicitly highlights ETB 500 starting consultation fee).

### 3. Quick-Access Symptom Tags (Bilingual Pills)
Directly below the hero, patients can tap common symptoms to immediately filter doctors and triage their needs:
- `Abdominal Distention` / `የሆድ እብጠት`
- `Abdominal Bloating` / `የሆድ መነፋት`
- `Anxiety` / `ጭንቀት`
- `Dysuria (Painful Urination)` / `የሽንት ማቃጠል`
- `Kidney Pain` / `የኩላሊት ህመም`
- `Loss of Appetite` / `የምግብ ፍላጎት ማጣት`

### 4. Live Statistics Bar (`HomeStatisticsBar`)
Provides social proof through transparent network metrics:
- **12,750+** Registered Members
- **2,452+** Doctors & Medical Specialists
- **9+** Partner Hospitals & Diagnostic Clinics
- **737+** Booked Online Appointments

### 5. Doctor Spotlight & Specialization Tabs (`LawyersTabsSection`)
- Allows toggling between **"Top Rated Doctors"** and **"Featured Specialists"**.
- Displays doctor cards with: Full name, medical qualification (MD, Specialist), department, star rating, hourly/per-visit fee in ETB, and a direct **"Book Doctor"** button.

### 6. Geolocation "Nearest Doctors & Clinics" (`NearestTabSection`)
- Leverages the user's browser GPS / Google Places API to recommend doctors and physical healthcare centers closest to the patient's current Ethiopian city or neighborhood.

### 7. Partner Healthcare Facilities (`FeaturedLawfirmSection`)
- Highlights prominent partner hospitals and specialty centers in Addis Ababa, enabling patients who need physical surgery, lab scans, or in-person admissions to transition smoothly from tele-triage to in-clinic care.

### 8. Direct Service Booking ("Quick by Service")
- Enables patients to book a standardized service (e.g., General Health Check, Pediatric Consult, Diabetes Follow-up, Dermatology Review) without having to manually select a specific doctor first.

### 9. Diaspora Health Sponsorship / Philanthropy (`donate`)
- Targeted at the Ethiopian Diaspora in the United States, Canada, and Europe:
  - **$10:** Sponsors an online doctor consultation for an Ethiopian citizen in need.
  - **$25:** Funds doctor follow-up plus essential laboratory tests.
  - **$50+:** Provides monthly chronic care medication and management.
  - Payment channels: Zelle (+1 703-677-4571) and Commercial Bank of Ethiopia (CBE account `1000643563219`).

### 10. Patient Health Portal ("TenaFirst MyChart")
- Lightweight patient medical portal protected by SMS OTP verification (`Auth/MyChartOtpVerification`), avoiding cumbersome password resets for elderly or mobile-first users.

### 11. Remote Lab Result Interpretation (`LabResultSubmit`)
- Dedicated upload feature allowing patients who received blood work or imaging at local diagnostic labs to submit their results for remote physician interpretation.

### 12. Doctor Recruitment CTA (`FreeConsultationSection`)
- Dedicated B2B banner: *"Are you a Doctor? Be a part of the next big thing in healthcare. Join us in our journey of revolutionizing healthcare delivery."* with button *"Get Registered Free"*.

---

## 4. Strengths vs. Weaknesses Analysis

### TenaFirst Strengths
1. **Clear Price Anchoring:** Stating *"Starts from 500Br"* immediately overcomes the common Ethiopian patient fear of exorbitant or unpredictable medical fees.
2. **Diaspora Monetization Engine:** Actively facilitates remittance-based healthcare where family members abroad pay directly for medical services in Ethiopia.
3. **Offline Inclusivity:** The **6037** shortcode ensures people without smartphones or with intermittent internet can still access doctors.
4. **Symptom-Driven Navigation:** Non-technical patients don't know medical specialties (e.g. *nephrology* or *gastroenterology*); symptom tags (e.g., *Kidney Pain / የኩላሊት ህመም*) guide them straight to the right care.
5. **Lab Result Submission:** Solves a huge pain point in Ethiopia where patients get lab tests done at private labs but cannot easily find a doctor to interpret them.

### TenaFirst Weaknesses & FCN Opportunities
1. **Generic Marketplace Architecture:** TenaFirst is built on an off-the-shelf consultant marketplace script (relics like "Lawyers", "LawFirms", and "My Source Network" remain in their database and UI strings).
2. **No AI Triage Intelligence:** Unlike FCN's interactive multilingual AI Triage Co-Pilot, TenaFirst relies solely on manual search and static forms.
3. **No Hospital Bed or Emergency Transparency:** TenaFirst does not display real-time ICU, maternity, or general bed capacity at partner hospitals (a marquee feature in FCN).
4. **No Cryptographic E-Prescription QR Verification:** FCN's verifiable QR-code prescription system with pharmacy dispensing status is significantly more tamper-proof than TenaFirst's standard notes.
5. **Outdated UI & Animations:** TenaFirst's layout uses Bootstrap 5 styling with basic stock imagery. FCN's modern dark/light mode, GSAP heartbeat lines, Framer Motion transitions, and clean typography offer a vastly superior user experience.

---

## 5. High-Impact Features Recommended for Fast Care Now (FCN)

Based on TenaFirst's highest-converting patterns, here are the concrete features FCN should adapt:

### Tier 1: Immediate Landing Page Enhancements (High Impact, Low Effort)

| Feature | Description | Implementation in FCN |
| :--- | :--- | :--- |
| **1. Bilingual Symptom Quick-Filter Pills** | Add interactive symptom pills under the Hero/Search bar (e.g. *Headache / የራስ ምታት*, *Chest Pain / የደረት ህመም*, *Child Fever / የህፃናት ትኩሳት*, *Stomach Pain / የሆድ ህመም*). | Clicking a pill immediately initiates FCN's AI Symptom Checker or pre-filters the doctor directory with that specialization. |
| **2. Transparent Price Anchor Badge** | Prominently display consultation starting price on the hero (e.g., *"Consultations from 400 ETB"*). | Builds immediate patient trust and eliminates fee anxiety. |
| **3. Offline / Emergency Shortcode Hotline Banner** | Add a prominent top ribbon or card: *"No internet connection? Call our direct medical helpline at 994 / 6037"*. | Caters to Ethiopian cellular infrastructure and 2G/feature phones. |
| **4. Live Trust Metrics Bar** | Add animated metric counters to FCN's TrustBar (e.g., *1,500+ Consultations Completed, 50+ Verified Ethiopian MDs, 3 Partner Hospitals in Dire Dawa, 98% Patient Satisfaction*). | Reinforces legitimacy for first-time visitors. |

### Tier 2: Core Platform & Clinical Enhancements (High Value)

| Feature | Description | Implementation in FCN |
| :--- | :--- | :--- |
| **5. "Send Care Home" Diaspora Package** | A dedicated landing section and checkout flow allowing Ethiopians in North America, Europe, and the Middle East to buy healthcare subscriptions or emergency care vouchers for family members in Ethiopia. | Connect with Stripe/PayPal for diaspora cards + Telebirr/CBE for local disbursement. |
| **6. Fast Lab Result Upload & Review Portal** | A dedicated page/modal (`/lab-review`) where patients can take a phone photo of their lab/ultrasound paper report and request a 15-minute doctor tele-review. | Direct upload to FCN health records, tagged as `PENDING_LAB_INTERPRETATION`. |
| **7. "Quick Consultation" Standard Service Booking** | Instead of browsing doctor profiles and selecting timeslots, patients can click *"Quick Consultation - Connect in < 15 mins"* to enter an on-demand triage queue. | Matches the first available on-duty doctor via FCN cellular calling. |
| **8. One-Tap SMS OTP Patient Login ("FCN Quick-Pass")** | Enable returning patients to enter their Ethiopian mobile number (`09...`) and verify via a 6-digit SMS code to instantly view prescriptions and test records without remembering passwords. | Complements FCN's existing Google OAuth and password authentication. |
