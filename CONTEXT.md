# Medie Genie — Project Context

> **IMPORTANT — Why CONTEXT.md Drifted Previously**: The earlier version of this file was written in full after Phase 2-3, and never updated as Phases 4-9 were implemented. Each subsequent session re-discovered the architecture from scratch. Going forward: update this file at the END of every phase before committing, not after.

---

## 1. Project Overview

**Medie Genie** is a patient portal web application deployed at **[https://medie-genie.vercel.app](https://medie-genie.vercel.app)**. Source: **[github.com/Varora-24/Medie-Genie](https://github.com/Varora-24/Medie-Genie)**.

All commits go directly to `main` (no branches, no PRs) as documented in `AGENTS.md`.

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.10 |
| Language | TypeScript (strict mode) | 5.x |
| Database ORM | Prisma | 6.19.3 |
| Database | Supabase PostgreSQL | ap-southeast-2 region |
| File Storage | Supabase Storage (REST API) | Buckets: `medical-records`, `chat-attachments` |
| Authentication | Auth.js / NextAuth v5 | 5.0.0-beta.31 |
| OAuth | Google OAuth (via Auth.js auto-detect) | — |
| Password Hashing | bcryptjs | 3.x |
| Encryption | Node.js `crypto` AES-256-GCM | Built-in |
| UI Components | shadcn/ui + Radix primitives | Tailwind v4 |
| Styling | Tailwind CSS | 4.x |
| Payments | Stripe | 2026-06-24.dahlia API version |
| AI / LLM | Google Gemini 3.1 Flash Lite | `@google/generative-ai` |
| Facility Search | OpenStreetMap Nominatim + Overpass API | Free, no API key |
| Icons | Lucide React | 1.23.x |
| Toast Notifications | Sonner | 2.x |
| Deployment | Vercel (auto-deploy from `main`) | — |

---

## 3. Repository Structure (Verified July 2026)

```
Medie-Genie/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx              # Tabbed login: Patient/Doctor/Admin tabs + Google OAuth
│   │   └── signup/page.tsx             # Public signup (hardcoded to patient role)
│   ├── apply-doctor/page.tsx           # Public doctor application form
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts # NextAuth handler
│   │   ├── chat/route.ts               # Genie Assist: Gemini integration + tool-calling
│   │   ├── chat/action/route.ts        # Genie Assist: confirmation execution endpoint
│   │   ├── checkout/route.ts           # Stripe checkout session creation
│   │   ├── maps/geocode/route.ts       # Geocoding proxy (for Find Care)
│   │   ├── maps/places/route.ts        # (Legacy) Places proxy
│   │   └── webhooks/stripe/route.ts    # Stripe webhook: idempotent payment fulfillment
│   ├── dashboard/
│   │   ├── layout.tsx                  # Sidebar with role-based nav (patient/doctor/admin)
│   │   ├── page.tsx                    # Dashboard home (different UI per role)
│   │   ├── appointments/               # Book, list, cancel, update status; Stripe checkout button
│   │   ├── chat/                       # Genie Assist chat UI + file upload
│   │   ├── doctor-applications/        # Admin: review/approve/reject doctor applications
│   │   ├── emergency-contacts/         # Patient: add/edit/delete emergency contacts
│   │   ├── find-care/                  # OpenStreetMap facility search
│   │   ├── patients/                   # Doctor: patient roster
│   │   ├── patients/[patientId]/       # Doctor: per-patient notes (AES-256-GCM) + prescription form
│   │   ├── prescriptions/              # Patient/Doctor: prescriptions list
│   │   ├── profile/                    # All roles: profile editing
│   │   ├── records/                    # Patient/Doctor: medical record upload (Supabase Storage)
│   │   ├── reminders/                  # Patient: medication/appointment/general reminders CRUD
│   │   └── users/                      # Admin: user directory + staff account creation
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                        # Landing page (honest copy, no false claims)
├── components/
│   ├── complete-reminder-button.tsx    # Client component for marking reminders done
│   ├── notification-bell.tsx           # Patient notification bell (due reminders indicator)
│   ├── scroll-fade-in.tsx
│   └── ui/button.tsx
├── lib/
│   ├── actions/
│   │   ├── admin.ts                    # getUsers, createStaffAccount (admin-only)
│   │   ├── appointments.ts             # getDoctors, getAppointments, bookAppointment, cancelAppointment, updateAppointmentStatus
│   │   ├── chat.ts                     # uploadChatAttachment (Supabase Storage for chat)
│   │   ├── emergency-contacts.ts       # CRUD for EmergencyContact model
│   │   ├── notes.ts                    # getDoctorPatients, getPatientNotes, addDoctorNote (AES-256-GCM)
│   │   ├── prescriptions.ts            # getPrescriptions, addPrescription
│   │   ├── records.ts                  # getMedicalRecords, uploadMedicalRecord
│   │   └── reminders.ts                # getReminders, createReminder, toggleReminderComplete, deleteReminder
│   ├── auth-actions.ts                 # loginAction, signUpAction, logoutAction
│   ├── auth-schemas.ts                 # Zod schemas
│   ├── db.ts                           # Prisma client singleton
│   ├── encryption.ts                   # AES-256-GCM encryptNote / decryptNote using ENCRYPTION_KEY env var
│   └── utils.ts
├── prisma/
│   ├── schema.prisma                   # 10 models (see §4 below)
│   ├── migrations/                     # 9 applied migrations (latest: add_performance_indexes)
│   └── seed.js                         # Seeds admin account with random password (logged to console, not committed)
├── public/mockups/                     # UI mockup images for landing page
├── auth.ts                             # NextAuth config (Credentials + Google providers)
├── auth.config.ts                      # JWT/session callbacks injecting role+id; route guards
├── middleware.ts                       # NextAuth edge middleware for route protection
├── next.config.ts                      # serverActions.bodySizeLimit: '10mb' (for chat file uploads)
├── AGENTS.md                           # Agent rules: commit to main only, no branches
├── CONTEXT.md                          # This file — update at end of every phase
└── package.json
```

---

## 4. Database Schema (10 Models)

| Model | Purpose | Key Indexes |
|---|---|---|
| `User` | Patients, doctors, admins. Has `role`, `authProvider`, `specialty`, `image` | Email (unique) |
| `Appointment` | Doctor-patient bookings. Status: PENDING → CONFIRMED/CANCELLED | `[patientId]`, `[doctorId]`, `[status]`, `[patientId, status]` |
| `Prescription` | Prescriptions issued by doctors to patients | `[patientId]`, `[doctorId]` |
| `MedicalRecord` | Lab results/diagnoses. `fileUrl` points to Supabase `medical-records` bucket | `[patientId]`, `[doctorId]` |
| `Reminder` | Medication/appointment/general alerts. Has `isCompleted` toggle | `[userId]`, `[userId, isCompleted]`, `[scheduleTime]` |
| `ChatSession` | Container for a Genie Assist conversation | `[patientId]` |
| `ChatMessage` | Individual messages. `attachmentUrl` for Supabase `chat-attachments`. `flagged` for emergency detection. Content stores either plain text OR `TOOL_CALL_PENDING`/`TOOL_CALL_ACTIONED` JSON | `[sessionId]`, `[sessionId, createdAt]` |
| `Payment` | Stripe payment records linked to appointments | `[patientId]`, `[appointmentId]`, `[status]` |
| `DoctorNote` | Clinical notes. `encryptedContent` + `iv` stored (AES-256-GCM via `ENCRYPTION_KEY` env var). **If ENCRYPTION_KEY is lost, all existing notes are permanently unreadable.** | `[patientId]`, `[doctorId]` |
| `DoctorApplication` | Public doctor application submissions reviewed by admin | `[status]` |
| `EmergencyContact` | Up to 5 contacts per patient. Shown on dashboard + in Genie Assist emergency responses | `[userId]` |

**Supabase Project**: `huednspoofanbpkiumvf` (ap-southeast-2). Pooled via port 6543 (`DATABASE_URL`), direct on port 5432 (`DIRECT_URL` for migrations).

---

## 5. Authentication Architecture

- **Providers**: Credentials (email+bcrypt) AND Google OAuth (auto-detected via `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` env vars).
- **Login UI**: Three tabs (Patient / Doctor / Admin) — cosmetic only; actual role is from the DB record.
- **Session**: JWT strategy. `jwt` callback injects `role` and `id` from DB. `session` callback exposes `session.user.role` and `session.user.id`.
- **Route protection**: `middleware.ts` runs NextAuth `authorized` callback. `/dashboard/*` requires auth. `/login` and `/signup` redirect authenticated users away.
- **Signup restriction**: Public signup hardcodes `role: "patient"`. Doctor accounts come from the doctor application workflow (admin approves → account created). Admin accounts created via admin User Directory panel.

---

## 6. Supabase Storage Security

**`medical-records` bucket** — Private:
- INSERT: Only authenticated users uploading to their own `{userId}/` folder.
- SELECT: Only the patient who owns the record or their assigned doctor.
- Server actions use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for uploads on behalf of users.

**`chat-attachments` bucket** — Private:
- INSERT: Owner-scoped RLS (`{userId}/*` path).
- SELECT: Owner-scoped RLS.
- The `uploadChatAttachment` server action proxies uploads through Next.js (required because NextAuth cannot mint Supabase JWTs for client-side RLS). File is stored, then fetched and base64-encoded before being sent to Gemini.

---

## 7. Genie Assist (AI Chat) Architecture

**Files**: `app/api/chat/route.ts` (main), `app/api/chat/action/route.ts` (confirmation), `app/dashboard/chat/` (UI)

**Flow**:
1. Patient sends message → POST `/api/chat`
2. Server validates session, rate-limits (15/min), checks for emergency keywords.
3. Current server time injected into Gemini system prompt for accurate relative date resolution.
4. Gemini responds. If it returns a **function call**:
   - **Read-only tools** (`list_available_doctors`, `get_emergency_contacts`, `find_nearby_care`): executed immediately server-side, result fed back to Gemini.
   - **Mutation tools** (`book_appointment`, `create_reminder`): **pre-validated server-side** (date must be future, doctorId must exist in DB with `role='doctor'`). If valid, stored as `TOOL_CALL_PENDING` JSON in `ChatMessage.content`. UI shows confirmation card.
5. Patient clicks Confirm → POST `/api/chat/action` with `messageId`, `sessionId`, `toolName`, `args`.
6. Action route: re-validates session, rate-limits (15/min), **verifies message is still `TOOL_CALL_PENDING`** (idempotency), re-validates inputs, executes DB mutation, marks message as `TOOL_CALL_ACTIONED`.

**Bug Fixes Applied**:
- Model is instructed (rule #8) to ALWAYS call `list_available_doctors` first and only use returned IDs.
- `TOOL_CALL_PENDING`/`TOOL_CALL_ACTIONED` messages are filtered out of Gemini chat history (they break history parsing and were a cause of hallucinated doctorIds across turns).
- Hard server-side date validation rejects past dates before showing confirmation card.
- Idempotency: double-confirming a card returns 400 "already processed."
- Rate limiting: 15 req/min on BOTH `/api/chat` AND `/api/chat/action`.

---

## 8. Stripe Payments Architecture

- `/api/checkout` — Creates Stripe Checkout session. Checks appointment ownership + PENDING status. Reuses existing pending Payment record (idempotent).
- `/api/webhooks/stripe` — Handles `checkout.session.completed`. Uses `db.$transaction` for atomic idempotent update: marks Payment as COMPLETED, marks Appointment as CONFIRMED.
- Consultation fee: $50.00 USD (hardcoded constant in `checkout/route.ts`).

---

## 9. Doctor Notes Encryption

- `lib/encryption.ts` uses Node.js `crypto` AES-256-GCM with a random 12-byte IV per note.
- Key sourced from `ENCRYPTION_KEY` env var (32-byte hex string). **This key must never be rotated without a re-encryption migration plan** — loss = permanent data loss.
- Notes decrypted server-side in `lib/actions/notes.ts` before returning to client.
- Access control: doctors can only view/write notes for patients they have an existing appointment with (`verifyDoctorAccess`).

---

## 10. Environment Variables

| Variable | Purpose | Scope |
|---|---|---|
| `DATABASE_URL` | Prisma pooled connection (port 6543, pgbouncer) | Server |
| `DIRECT_URL` | Prisma direct connection (port 5432, migrations) | Server |
| `AUTH_SECRET` | NextAuth JWT signing secret | Server |
| `NEXTAUTH_URL` | Application base URL | Server |
| `AUTH_GOOGLE_ID` | Google OAuth client ID | Server |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret | Server |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous API key | Client + Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) | Server only |
| `GEMINI_API_KEY` | Google AI API key for Genie Assist | Server only |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256-GCM doctor notes | Server only |
| `STRIPE_SECRET_KEY` | Stripe secret key | Server only |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Server only |

---

## 11. Key Design Decisions

1. **Server Actions over API routes**: All data mutations use Next.js Server Actions (`'use server'`). Only exceptions: NextAuth (`/api/auth`), Gemini chat (`/api/chat`), Stripe checkout (`/api/checkout`), Stripe webhook (`/api/webhooks/stripe`), and map proxies.
2. **No branches**: All commits directly to `main`.
3. **Supabase Storage via REST**: Raw `fetch()` to Supabase REST API instead of SDK, to avoid heavy dependency and keep uploads transparent.
4. **Role-based UI**: Sidebar, dashboard home, and page guards all check `session.user.role` server-side.
5. **Concurrent DB queries**: Dashboard page and appointments page use `Promise.all` to run independent DB queries in parallel (not sequentially).
6. **DB Indexes**: All FK-heavy fields (patientId, doctorId, userId, status, sessionId, scheduleTime) have explicit `@@index` directives. Migration `20260730161335_add_performance_indexes` applied.
7. **Doctor application workflow**: Public `/apply-doctor` form → `DoctorApplication` record → Admin reviews at `/dashboard/doctor-applications` → Approval creates a real User record with `role='doctor'` and random password (emailed to applicant in future, for now logged to admin console).

---

## 12. Completed Phases

| Phase | Status | Summary |
|---|---|---|
| 1 | ✅ Complete | Foundation: Next.js, Prisma, Auth.js, landing page, base layout |
| 2 | ✅ Complete | Patient portal: appointments, prescriptions, medical records (Supabase Storage), reminders |
| 3 | ✅ Complete | Genie Assist chatbot: Gemini LLM, tool-calling, emergency detection, rate limiting |
| 4 | ✅ Complete | Admin dashboard + user management, doctor notes (AES-256-GCM), Stripe payments |
| 5 | ✅ Complete | Find Care: OpenStreetMap Nominatim + Overpass facility search |
| 6 | ✅ Complete | Doctor dashboard: patient roster, prescriptions, settings, appointments management |
| 7 | ✅ Complete | Patient dashboard home: metrics, quick actions, emergency contacts card, notification bell |
| 8 | ✅ Complete | Emergency contacts CRUD, doctor application workflow, Google OAuth, tabbed login |
| 9 | ✅ Complete | Genie Assist renamed (was "AI Symptom Chat"), chat file attachments via Supabase `chat-attachments` |
| Performance | ✅ Applied | DB indexes migration, Promise.all parallelization, N+1 fix (getDoctorPatients distinct), history filtering |
| Bug Fixes | ✅ Applied | doctorId hallucination prevention (system prompt rule + history filtering), date validation, idempotency, rate limiting on action endpoint |
