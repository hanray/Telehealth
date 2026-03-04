# Telehealth vs Telemedicine – Functionality Comparison

This document compares **before consolidation** vs **current** behavior in this repo, based on git history.

- Repo: `hanray/Telehealth`
- Pre-consolidation snapshot: `930b02a` (this is also `origin/main` and the parent of `ca71c9c`)
- Consolidation introduced: `ca71c9c` (adds `telemedicine -> telehealth` alias)
- Current snapshot: `0f60fe4` (HEAD at time of review)

## A) Pre-consolidation (930b02a)

### Product selection + portal mapping (client)
- Product picker offers: `telehealth`, `telemedicine`, `homecare`, `admin` (and `myhealth` exists in code paths)
- Key behavior in `client/src/App.js`:
  - `telemedicine` maps to **patient** (if role=patient) or **doctor** (otherwise)
  - `telehealth`/`homecare` maps to **patient** (if role=patient) or **nurse** (otherwise)

### Major client modules/components
- Dashboards/portals: `PatientDashboard`, `DoctorDashboard`, `NurseDashboard`, `AdminPortal`, `PSWDashboard`
- Workspace/visit: `TelehealthWorkspace`, `TelehealthVisitSummary`
- Clinical modules: `MedicalRecordModule`, `PatientsModule`, `PatientChartModule`, `PatientChart`, `PatientAssignmentModule`
- Messaging: `ChatModule`
- Modals/workflows: `AppointmentModal`, `InsuranceModal`, `LabResultModal`, `RefillModal`
- Analytics: `AnalyticsDashboard` (+ `MiniLineChart`)

### Backend routes (server)
- Route modules present:
  - `auth`, `users`, `admin`, `appointments`, `messages`, `pharmacies`, `prescriptions`, `plans`, `subscriptions`, `transactions`

## B) Current (0f60fe4)

### Product selection + portal mapping (client)
- `telemedicine` is treated as a **legacy alias** of `telehealth`.
- Key behavior in `client/src/App.js`:
  - `LEGACY_PRODUCT_ALIASES = { telemedicine: 'telehealth' }`
  - Selecting/visiting `/telemedicine` normalizes to the `telehealth` product.

### Major client modules/components (current)
- Everything from the pre-consolidation list, plus:
  - Subscription + billing UX: `PricingPage`, `CheckoutPage`, `SubscriptionOnboarding`, `SubscriptionSettingsModal`
  - Feature gating: `ProFeatureGateModal`
  - Country onboarding: `CountryOfOriginModal`
  - Shell layout: `TelehealthShell`

### Backend routes (server) – current endpoints overview
- All pre-consolidation route modules, plus `billing`.
- Discovered endpoints (non-exhaustive; from route definitions):
  - `billing`: `GET /status`, `POST /checkout-session`, `GET /portal`, `POST /webhook`
  - `subscriptions`: `GET /`, `POST /`
  - `plans`: `GET /`, `POST /` (admin)
  - `transactions`: `POST /`, `POST /:id/confirm`
  - `prescriptions`: `POST /` (doctor), `GET /`, `PATCH /:id/status` (pharmacy/admin)
  - `messages`: providers, conversations, messages, send, mark read, unread
  - `auth`: register/signup/login, forgot-password, magic link, me, logout
  - `appointments`: list/create (role-gated)

## C) What appears “missing” after consolidation

These are not necessarily deleted files; they are *behavioral deltas* that can make features feel missing.

### Likely missing / changed behavior
- **Telemedicine-specific product flow**: previously `telemedicine` could route clinicians into the **doctor** portal; now `telemedicine` normalizes to `telehealth`.
- **Clear separation of Telemedicine vs Telehealth**: any differences in branding, navigation, or role-based default portal selection tied to the product are now collapsed.

### Not deleted (still present in current)
- Doctor-facing UI still exists (`DoctorDashboard` and doctor role handling), but product-driven entry into it may be different.

## D) How to reproduce the comparison locally

- Files changed since pre-consolidation:
  - `git diff --name-status 930b02a..HEAD`
- Pinpoint consolidation change:
  - `git log -S "telemedicine: 'telehealth'" -- client/src/App.js`

## E) Next step (to build the real “missing functions” checklist)

If you tell me **which specific workflows you believe are missing** (e.g., “doctor can’t see X”, “telemedicine product tile gone”, “Rx status update missing”), I can:
1) trace where that feature lived in `930b02a`,
2) trace where it should live now,
3) produce a concrete checklist of missing functions + the exact files/symbols to restore.
