# Medie Genie — Project Context

> This document captures the full architectural context, decisions made, features implemented, and current state of the Medie Genie project as of July 2026. It is intended for any developer (or AI agent) picking up work on this codebase.

---

## 1. Project Overview

**Medie Genie** is a patient portal web application that lets users book doctor appointments, view prescriptions, upload medical records to cloud storage, and set medication reminders. It is deployed at **[https://medie-genie.vercel.app](https://medie-genie.vercel.app)** and the source lives at **[github.com/Varora-24/Medie-Genie](https://github.com/Varora-24/Medie-Genie)**.

The project was originally part of a monorepo called "Smart Trainer" and was extracted into its own standalone repository. The initial codebase had mock/fake services and a static HTML frontend; it was rebuilt from scratch using Next.js during Phase 1.

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.10 |
| Language | TypeScript (strict mode) | 5.x |
| Database ORM | Prisma | 6.19.3 |
| Database | Supabase PostgreSQL | ap-southeast-2 region |
| File Storage | Supabase Storage (REST API) | Bucket: `medical-records` |
| Authentication | Auth.js / NextAuth v5 | 5.0.0-beta.31 |
| Password Hashing | bcryptjs | 3.x |
| UI Components | shadcn/ui + Radix primitives | Tailwind v4 |
| Styling | Tailwind CSS | 4.x |
| Validation | Zod | 4.x |
| Icons | Lucide React | 1.23.x |
| Toast Notifications | Sonner | 2.x |
| Testing | Jest + Testing Library | Jest 30.x |
| Deployment | Vercel (auto-deploy from `main`) | — |

---

## 3. Repository Structure

```
Medie-Genie/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Login page (email + password)
│   │   └── signup/page.tsx         # Signup page (hardcoded to patient role)
│   ├── api/auth/[...nextauth]/     # NextAuth API route handler
│   ├── dashboard/
│   │   ├── layout.tsx              # Sidebar layout with role-based nav
│   │   ├── page.tsx                # Dashboard home page
│   │   ├── appointments/
│   │   │   ├── page.tsx            # Appointments listing + booking
│   │   │   ├── appointment-form.tsx
│   │   │   └── appointment-list.tsx
│   │   ├── prescriptions/
│   │   │   └── page.tsx            # Prescriptions viewer
│   │   ├── records/
│   │   │   ├── page.tsx            # Medical records + file upload
│   │   │   ├── record-form.tsx
│   │   │   └── record-list.tsx
│   │   └── reminders/
│   │       ├── page.tsx            # Reminders CRUD
│   │       ├── reminder-form.tsx
│   │       └── reminder-list.tsx
│   ├── globals.css                 # Tailwind v4 config + animations
│   ├── layout.tsx                  # Root layout (fonts, Toaster)
│   └── page.tsx                    # Landing page (redesigned)
├── components/
│   ├── scroll-fade-in.tsx          # IntersectionObserver scroll animation
│   └── ui/
│       └── button.tsx              # shadcn/ui Button component
├── lib/
│   ├── actions/
│   │   ├── appointments.ts         # Server actions: getDoctors, getAppointments, bookAppointment, cancelAppointment
│   │   ├── prescriptions.ts        # Server actions: getPrescriptions
│   │   ├── records.ts              # Server actions: getMedicalRecords, uploadMedicalRecord (Supabase Storage)
│   │   └── reminders.ts            # Server actions: getReminders, createReminder, toggleReminderComplete, deleteReminder
│   ├── auth-actions.ts             # Server actions: loginAction, signUpAction, logoutAction
│   ├── auth-schemas.ts             # Zod schemas: LoginSchema, SignupSchema
│   ├── db.ts                       # Prisma client singleton
│   └── utils.ts                    # shadcn/ui cn() utility
├── prisma/
│   ├── schema.prisma               # 8 models (User, Appointment, Prescription, MedicalRecord, Reminder, ChatSession, ChatMessage, Payment)
│   ├── migrations/                 # Applied migration: 20260708160119_init
│   └── seed.js                     # Seeds default admin account
├── public/
│   └── mockups/                    # Generated UI mockup images for landing page
├── auth.ts                         # NextAuth config with Credentials provider
├── auth.config.ts                  # Auth callbacks: jwt (role+id), session, authorized
├── middleware.ts                   # NextAuth edge middleware for route protection
├── next.config.ts                  # Next.js config
├── .env.example                    # Template for all required env vars
├── AGENTS.md                       # Agent rules (commit to main, no branches)
├── README.md                       # Project readme with setup guide
└── package.json                    # Dependencies, scripts, prisma seed config
```

---

## 4. Database Schema

The Prisma schema defines **8 models** in a single PostgreSQL `public` schema on Supabase:

| Model | Purpose | Key Relations |
|---|---|---|
| `User` | Patients, doctors, admins | Central entity; has role field (`patient` / `doctor` / `admin`) |
| `Appointment` | Doctor-patient scheduling | FK to User (patientId, doctorId); statuses: PENDING, CONFIRMED, CANCELLED |
| `Prescription` | Medication prescriptions | FK to User (patientId, doctorId); has medication, dosage, frequency, date range |
| `MedicalRecord` | Lab results, diagnoses, etc. | FK to User; stores `fileUrl` pointing to Supabase Storage |
| `Reminder` | Medication/appointment alerts | FK to User; types: MEDICATION, APPOINTMENT, GENERAL; has isCompleted toggle |
| `ChatSession` | AI chat conversation container | FK to User (patientId); planned for Phase 3 |
| `ChatMessage` | Individual chat messages | FK to ChatSession; senderRole: PATIENT or AI; planned for Phase 3 |
| `Payment` | Billing/payment records | FK to User + optional FK to Appointment; planned for Phase 4 |

**Supabase Project**: `huednspoofanbpkiumvf` (region: `ap-southeast-2`)
**Connection**: Pooled via port 6543 (`pgbouncer=true` in `DATABASE_URL`), direct on port 5432 (`DIRECT_URL` used for migrations).

---

## 5. Authentication Architecture

- **Provider**: Auth.js (NextAuth v5) with a single `Credentials` provider.
- **Password storage**: bcryptjs hash (cost factor 10).
- **Session strategy**: JWT (not database sessions).
- **JWT enrichment**: The `jwt` callback injects `role` and `id` from the User record into the token. The `session` callback exposes them as `session.user.role` and `session.user.id`.
- **Route protection**: `middleware.ts` runs NextAuth's `authorized` callback on every non-static request. The `/dashboard/*` routes require authentication; authenticated users hitting `/login` or `/signup` are redirected to `/dashboard`.
- **Signup restriction**: Public signup hardcodes `role: "patient"`. Doctor and admin accounts can only be created by seeding or (future) admin dashboard.
- **Seeded admin**: `admin@mediegenie.com` / `AdminPass123!` (dev-only placeholder, not in committed docs).

---

## 6. Supabase Storage Security

The `medical-records` bucket is configured as **private** (`public = false`). Two Row-Level Security policies are active on `storage.objects`:

1. **Upload policy** — `"Allow authenticated upload to own folder"`:
   - `FOR INSERT TO authenticated`
   - `WITH CHECK`: `bucket_id = 'medical-records' AND (storage.foldername(name))[1] = auth.uid()::text`
   - Effect: users can only upload files to a folder named after their own user ID.

2. **Read policy** — `"Allow patient or doctor read access"`:
   - `FOR SELECT TO authenticated`
   - `USING`: joins `storage.objects.name` against `MedicalRecord.fileUrl` and checks that the requester's `auth.uid()` matches either `patientId` or `doctorId` on that record.
   - Effect: only the patient who owns the record or the assigned doctor can read the file.

The Next.js server actions use `SUPABASE_SERVICE_ROLE_KEY` (a server-only secret) to bypass RLS when uploading files on behalf of authenticated users. The upload path is structured as `{userId}/{timestamp}.{extension}`.

---

## 7. Environment Variables

All required variables (documented in `.env.example`):

| Variable | Purpose | Scope |
|---|---|---|
| `DATABASE_URL` | Prisma pooled connection (port 6543, pgbouncer) | Server |
| `DIRECT_URL` | Prisma direct connection (port 5432, migrations) | Server |
| `AUTH_SECRET` | NextAuth JWT signing secret (32+ chars) | Server |
| `NEXTAUTH_URL` | Application base URL | Server |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous API key | Client + Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) | Server only |

The `.env` file is gitignored. Only `.env.example` is tracked.

---

## 8. Key Design Decisions

1. **No branches**: All commits go directly to `main`. No PRs, no feature branches. This is a deliberate project rule documented in `AGENTS.md`.

2. **Server Actions over API routes**: All data mutations (booking, cancellation, uploads, CRUD) use Next.js Server Actions (`'use server'`) rather than `/api/*` routes. The only API route is the NextAuth handler at `/api/auth/[...nextauth]`.

3. **Single signup path**: The duplicate `app/api/signup/route.ts` was deleted. All signups go through the `signUpAction` server action in `lib/auth-actions.ts`.

4. **Supabase Storage via REST**: Instead of using the `@supabase/supabase-js` SDK, file uploads are done via raw `fetch()` calls to the Supabase Storage REST API. This avoids adding another heavy dependency and keeps the upload logic transparent.

5. **Role-based dashboard layout**: The sidebar navigation in `app/dashboard/layout.tsx` renders different links based on `session.user.role` (patient, doctor, admin). All role checks happen server-side.

6. **Landing page honesty**: The landing page was redesigned to remove all false claims (HIPAA, military-grade security, AES-256, MFA, "thousands of patients") and replace them with honest, concrete descriptions of what the app actually does.

---

## 9. Development Phases & Current Status

### Phase 1: Foundation ✅ Complete
- Next.js App Router project scaffolded from scratch
- Prisma schema with 8 models
- Auth.js (NextAuth v5) with Credentials provider
- bcryptjs password hashing
- Role-aware dashboard layout with sidebar
- Landing page, login page, signup page
- Jest + Testing Library setup
- Database migrations applied to Supabase
- Admin account seeded

### Phase 2: Patient Portal Core ✅ Complete
- **Appointments**: Book, list, cancel — real DB writes, doctor list from `User` where `role = 'doctor'`
- **Prescriptions**: List active/expired prescriptions filtered by patient ID
- **Medical Records**: File upload to Supabase Storage with private bucket + RLS policies, record creation in DB
- **Reminders**: Full CRUD (create, list, toggle complete, delete) against the `Reminder` table
- Deployed to Vercel with all env vars configured
- README updated with live URL and future scope
- Landing page redesigned with honest copy and real UI mockups

### Phase 3: AI Symptom Chatbot 🔲 Not Started
- `ChatSession` and `ChatMessage` models exist in the schema but have no UI or server actions yet
- Planned: integration with an LLM API (OpenAI or Gemini) for conversational symptom triage
- The dashboard sidebar already has an "AI Symptom Chat" link pointing to `/dashboard/chat`

### Phase 4: Dashboard Upgrades & Payments 🔲 Not Started
- `Payment` model exists in the schema but has no UI or server actions
- Planned: Stripe integration, admin dashboard for user management, doctor notes module
- Doctor and admin account creation will be handled through the admin dashboard (not public signup)

---

## 10. Deployment

- **Platform**: Vercel (auto-deploys from the `main` branch on GitHub)
- **Live URL**: [https://medie-genie.vercel.app](https://medie-genie.vercel.app)
- **Build command**: `next build` (includes `prisma generate` via `postinstall`)
- **Environment variables**: Set in Vercel project settings (DATABASE_URL, DIRECT_URL, AUTH_SECRET, AUTH_TRUST_HOST, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)

---

## 11. Local Development Setup

```bash
# Clone
git clone https://github.com/Varora-24/Medie-Genie.git
cd Medie-Genie

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in real values in .env

# Run database migrations
npx prisma migrate dev

# Seed admin account
npx prisma db seed

# Start dev server
npm run dev
```

---

## 12. Commit History Summary

| Commit | Description |
|---|---|
| `567ec80` | Cleanup: delete legacy static HTML files |
| `8c81934` | Docs: write project README and TODO |
| `a4e1a7a` | Test: add Jest config and sanity test |
| `cea79b6` | Merge rebuild-v2 branch into main |
| `1e32661` | Chore: update package name, configure prisma seed |
| `4b713bf` | **Security**: remove role dropdown from signup, hardcode patient |
| `fe85386` | Refactor: delete duplicate API signup route, add seed script |
| `4c4b560` | Chore: track .env.example, gitignore other .env files |
| `9797892` | Chore: initialize shadcn/ui with Tailwind v4 |
| `3d74915` | Chore: add branching policy rule to AGENTS.md |
| `d2d5821` | **Feat**: run and commit database migrations |
| `da1efb8` | **Feat**: implement appointments module (book, list, cancel) |
| `055608a` | **Feat**: implement prescriptions dashboard module |
| `2a0b47a` | Chore: add Supabase storage env variable placeholders |
| `7dd2092` | **Feat**: implement medical records module with Supabase Storage upload |
| `9621053` | **Feat**: implement medication & clinical reminders CRUD |
| `56aff84` | Docs: update README with status banner and future scope |
| `62af70c` | **Security**: private bucket + RLS policies + service role key |
| `d3941cc` | Docs: update README with live Vercel URL |
| `2d7f6f2` | **Redesign**: complete landing page overhaul |


### Phase 9: Genie Assist & File Upload
- **Renamed** "AI Symptom Chat" to "Genie Assist" across the app (sidebar, dashboard, header, etc.).
- **Database**: Added "attachmentUrl" to "ChatMessage" model and ran migrations.
- **Storage**: Created a new private Supabase bucket "chat-attachments" with Row Level Security allowing authenticated users to insert/select their own folder.
- **Backend**: Implemented "uploadChatAttachment" server action in "lib/actions/chat.ts" using NextAuth session validation, and temporarily elevated "serverActions.bodySizeLimit" to '10mb' in "next.config.ts". Also updated "app/api/chat/route.ts" to convert the file to base64 inline data and pass it to Gemini.
- **Trade-offs**: Used a Server Action to proxy file uploads instead of pure client-to-Supabase REST, because NextAuth cannot mint valid Supabase JWTs easily, meaning RLS wouldn't work for purely client-side fetch calls without a complex presigned-URL flow. The Server Action respects the 5MB file size limit effectively.
