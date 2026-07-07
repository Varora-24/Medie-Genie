# TODO List — Deferred Features (Medie Genie Rebuild)

This list tracks the modules and features intentionally deferred from Phase 1 (Foundation) to be implemented in subsequent phases.

---

## 📅 Phase 2: Patient Portal Core Modules
- [ ] **Appointments Booking**:
  - Implement appointment scheduling layout inside `/dashboard/appointments`.
  - Create appointment scheduling API: validation of slot overlaps, status transitions (PENDING, CONFIRMED, CANCELLED).
- [ ] **Prescription Tracking**:
  - Render active prescriptions for patients under `/dashboard/prescriptions`.
  - Create doctor renewal request buttons and API hooks.
- [ ] **Medical Records File Storage**:
  - Hook up Supabase Storage Buckets to securely upload PDFs and images.
  - Render patient medical record cards in `/dashboard/records`.
- [ ] **Medication Reminders**:
  - Implement reminder notifications dashboard view `/dashboard/reminders`.
  - Hook up local scheduling system to toggle `isCompleted` values on reminder tasks.

---

## 🤖 Phase 3: AI symptom Chatbot
- [ ] **Intelligent Symptom Triage**:
  - Integrate AI SDK (e.g. OpenAI / Gemini) to dynamically answer symptom queries inside `/dashboard/chat`.
  - Maintain message logs and database mapping (`ChatSession` and `ChatMessage` models).

---

## 💳 Phase 4: Financials & Admin Panel
- [ ] **Doctor notes module**:
  - Allow medical professionals to leave private, encrypted observations on patient files.
- [ ] **Stripe payment processor**:
  - Setup Stripe checkout session API for telemedicine/booking payments.
  - Map status changes directly to `Payment` model.
- [ ] **Admin Console**:
  - Implement active patient/doctor lookup directory with search fields.
