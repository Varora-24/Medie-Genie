# Medie Genie — AI-Assisted Patient Portal

Medie Genie is a secure, HIPAA-compliant patient portal that simplifies clinical scheduling, medical history tracking, prescription management, and uses AI for intelligent symptom triage.

This repository contains the rebuilt-from-scratch Next.js application, eliminating fake mock services and establishing a production-grade codebase with real authentication, database modeling, and route security.

---

## 🚀 Tech Stack
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Database ORM**: Prisma (v6)
- **Database Instance**: Supabase PostgreSQL
- **Authentication**: Auth.js (NextAuth v5) with Credentials provider (Secure bcryptjs password hashing)
- **Styling**: Tailwind CSS
- **Testing**: Jest + Testing Library setup
- **Linting & Formatting**: ESLint + Prettier

---

## 🛠️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/Varora-24/Medie-Genie.git
cd Medie-Genie
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory. You can reference the `.env.example` file:
```bash
cp .env.example .env
```
Fill in the credentials:
- `DATABASE_URL`: Your Supabase PostgreSQL Connection Pooler URL (port 6543 with `?pgbouncer=true`).
- `DIRECT_URL`: Your Supabase PostgreSQL Direct Connection URL (port 5432).
- `AUTH_SECRET`: A secure 32-character string for NextAuth.

### 3. Install Dependencies
```bash
npm install
```

### 4. Deploy Database Migrations
Prisma v6 will map the models defined in `prisma/schema.prisma` directly to your active Supabase database:
```bash
npx prisma migrate dev --name init
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗺️ Roadmap
- **Phase 1: Foundation (Current)**:
  - Database schema & Prisma v6 bindings.
  - Safe Credentials Auth with NextAuth v5 and bcryptjs.
  - Responsive marketing landing page and role-aware dashboard layout.
- **Phase 2: Patient Portal Features**:
  - Appointment booking scheduler.
  - Patient prescriptions viewer & doctor renewal requests.
  - Medical record uploads (secure storage integration).
  - Reminders scheduler.
- **Phase 3: AI symptom Chatbot**:
  - Integration with health API LLMs (e.g. OpenAI / Gemini) for secure, conversational triage advice.
- **Phase 4: Dashboard Upgrades & Payments**:
  - Doctor notes module.
  - Stripe payments integration.
  - Admin management views.
  - Production deployment (Vercel/Supabase).
