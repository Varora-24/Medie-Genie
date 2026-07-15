import Link from 'next/link'
import Image from 'next/image'
import { auth } from '@/auth'
import {
  HeartPulse,
  CalendarDays,
  FileText,
  Bell,
  ArrowRight,
  UserCheck,
  Lock,
  Database,
  KeyRound,
  Sparkles,
} from 'lucide-react'
import ScrollFadeIn from '@/components/scroll-fade-in'

export default async function LandingPage() {
  const session = await auth()
  const isLoggedIn = !!session?.user

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ──────────── Early-Access Banner ──────────── */}
      <div className="bg-slate-900 text-white text-center text-xs font-medium py-2 px-4">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Early access — new features shipping weekly
        </span>
      </div>

      {/* ──────────── Navigation ──────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-indigo-600" />
            <span className="font-bold text-base tracking-tight text-slate-900">
              Medie Genie
            </span>
          </div>

          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-500">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#security" className="hover:text-slate-900 transition-colors">Security</a>
            <Link href="/apply-doctor" className="hover:text-indigo-600 transition-colors">For Doctors</Link>
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <UserCheck className="h-4 w-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ──────────── Hero — Asymmetric Two-Column ──────────── */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 mb-6">
                <Sparkles className="h-3 w-3" />
                Open-source patient portal
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-5">
                Book appointments, manage prescriptions, and track your health
                <span className="text-slate-400"> — all in one place.</span>
              </h1>

              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-xl">
                Medie Genie gives you a single dashboard for scheduling doctor visits,
                reviewing active prescriptions, uploading medical files, and setting
                medication reminders. No filler — just the tools you actually need.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={isLoggedIn ? "/dashboard" : "/signup"}
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors gap-2"
                >
                  {isLoggedIn ? "Open Dashboard" : "Create Free Account"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors"
                >
                  See how it works
                </a>
              </div>
            </div>

            {/* Right: Dashboard mockup in a browser frame */}
            <div className="relative">
              <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 border-b border-slate-700">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                  <div className="ml-3 flex-1 h-5 bg-slate-700 rounded text-[10px] text-slate-400 flex items-center px-2 font-mono">
                    medie-genie.vercel.app/dashboard
                  </div>
                </div>
                <Image
                  src="/mockups/dashboard.jpg"
                  alt="Medie Genie patient dashboard showing appointments, sidebar navigation, and health overview"
                  width={1280}
                  height={720}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── Features — Alternating Rows ──────────── */}
      <section id="features" className="py-20 border-t border-slate-100 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFadeIn>
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">
                What you can actually do
              </h2>
              <p className="text-slate-500 leading-relaxed">
                Every feature below is live and functional — connected to a real
                PostgreSQL database, not a static demo.
              </p>
            </div>
          </ScrollFadeIn>

          {/* Feature 1: Appointments — image left, text right */}
          <ScrollFadeIn className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-slate-200">
                <Image
                  src="/mockups/appointments.jpg"
                  alt="Appointment booking interface showing doctor selection, date picker, and scheduled sessions list"
                  width={1280}
                  height={720}
                  className="w-full h-auto"
                />
              </div>
              <div>
                <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  Book and manage appointments
                </h3>
                <p className="text-slate-500 leading-relaxed mb-4">
                  Pick a doctor, choose a time slot, and describe your reason for visiting.
                  Your booking is saved instantly to the database. Cancel anytime with
                  one click — no phone calls required.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 flex-shrink-0" />
                    Doctor list pulled from real user records
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 flex-shrink-0" />
                    Status tracking: Pending, Confirmed, Cancelled
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 flex-shrink-0" />
                    One-click cancellation with confirmation
                  </li>
                </ul>
              </div>
            </div>
          </ScrollFadeIn>

          {/* Feature 2: Prescriptions — text left, image right */}
          <ScrollFadeIn className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  View your prescriptions at a glance
                </h3>
                <p className="text-slate-500 leading-relaxed mb-4">
                  See every medication your doctor has prescribed — dosage, frequency,
                  duration, and any special instructions. Active and expired
                  prescriptions are clearly marked so nothing falls through the cracks.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 flex-shrink-0" />
                    Filtered by your patient ID automatically
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 flex-shrink-0" />
                    Active vs. expired status badges
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 flex-shrink-0" />
                    Doctor instructions displayed inline
                  </li>
                </ul>
              </div>
              <div className="order-1 lg:order-2 bg-white rounded-xl overflow-hidden shadow-lg border border-slate-200">
                <Image
                  src="/mockups/prescriptions.jpg"
                  alt="Prescriptions dashboard showing medication cards with dosage, frequency, and active status badges"
                  width={1280}
                  height={720}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </ScrollFadeIn>

          {/* Feature 3: Reminders — image left, text right */}
          <ScrollFadeIn>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-slate-200">
                <Image
                  src="/mockups/reminders.jpg"
                  alt="Medication reminders interface with add form and checklist of tracked reminders"
                  width={1280}
                  height={720}
                  className="w-full h-auto"
                />
              </div>
              <div>
                <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  <Bell className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  Never miss a dose or visit
                </h3>
                <p className="text-slate-500 leading-relaxed mb-4">
                  Create reminders for medications, upcoming appointments, or general health
                  tasks. Check them off when done, delete when no longer needed.
                  Simple and practical.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 flex-shrink-0" />
                    Medication, appointment, and general categories
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 flex-shrink-0" />
                    Toggle complete / incomplete with one click
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 flex-shrink-0" />
                    Full CRUD — create, edit, delete anytime
                  </li>
                </ul>
              </div>
            </div>
          </ScrollFadeIn>
        </div>
      </section>

      {/* ──────────── Security — Honest Copy ──────────── */}
      <section id="security" className="py-20 border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFadeIn>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">
                  Your data, protected
                </h2>
                <p className="text-slate-500 leading-relaxed mb-8">
                  We take security seriously — here is what we actually do today
                  to keep your information safe, and what{"'"}s still in progress.
                </p>

                <div className="space-y-5">
                  <div className="flex gap-4">
                    <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Lock className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-0.5">
                        Password-protected accounts
                      </h4>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        Every password is hashed with bcrypt before it touches the database.
                        Plain-text passwords are never stored or logged.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Database className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-0.5">
                        Encrypted database connections
                      </h4>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        All connections between the app and Supabase PostgreSQL
                        are TLS-encrypted. File uploads use private storage buckets
                        with row-level security policies.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <KeyRound className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-0.5">
                        Role-based access control
                      </h4>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        Patients, doctors, and admins see different dashboards.
                        Server-side session checks ensure you can only access
                        your own data.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: CTA card + development disclaimer */}
              <div className="space-y-5">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                  <h3 className="font-bold text-lg text-slate-900 mb-2">
                    Try it out — it{"'"}s free
                  </h3>
                  <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                    Create a patient account in 30 seconds. No credit card, no
                    hidden trial limits.
                  </p>
                  <Link
                    href="/signup"
                    className="w-full inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors gap-1.5"
                  >
                    Create an Account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <p className="text-sm text-amber-800 leading-relaxed">
                    <strong>Heads up:</strong> Medie Genie is under active development.
                    Features like the AI symptom chatbot, email notifications, and
                    Stripe payments are on the roadmap but not live yet. We{"'"}re
                    shipping updates weekly.
                  </p>
                </div>
              </div>
            </div>
          </ScrollFadeIn>
        </div>
      </section>

      {/* ──────────── Footer ──────────── */}
      <footer className="mt-auto border-t border-slate-100 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-indigo-600" />
            <span className="font-bold text-sm text-slate-900">Medie Genie</span>
          </div>
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Medie Genie. Built as an open-source project.
          </p>
        </div>
      </footer>
    </div>
  )
}
