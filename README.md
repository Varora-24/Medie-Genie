# Medie Genie — AI-Assisted Patient Portal

🚧 **Project Status: Under Active Development** (Phase 2: Patient Portal Core)
- **Live URL**: [https://medie-genie.vercel.app](https://medie-genie.vercel.app)

Medie Genie is a secure, HIPAA-compliant patient portal that simplifies clinical scheduling, medical history tracking, prescription management, and uses AI for intelligent symptom triage.

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
- **Phase 1: Foundation (Completed)**:
  - Database schema & Prisma v6 bindings.
  - Safe Credentials Auth with NextAuth v5 and bcryptjs.
  - Responsive marketing landing page and role-aware dashboard layout.
- **Phase 2: Patient Portal Features (Completed)**:
  - Appointment booking scheduler (linked to PostgreSQL database).
  - Patient prescriptions viewer (real-time query filtered by patient ID).
  - Medical record uploads (secure file uploads direct to Supabase Storage).
  - Medication & clinical reminders scheduler (full CRUD).

---

## 🔮 Future Scope
- **AI Symptom Chatbot (Phase 3)**:
  - Integration with health API LLMs (e.g. OpenAI / Gemini) for secure, conversational triage advice.
- **Dashboard Upgrades & Payments (Phase 4)**:
  - Doctor notes module.
  - Stripe payments integration.
  - Admin management views.
- **Additional Enhancements**:
  - Email/SMS reminder notifications.
  - Video consultation support.
