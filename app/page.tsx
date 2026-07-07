import Link from 'next/link'
import { auth } from '@/auth'
import { 
  HeartPulse, 
  CalendarDays, 
  FileText, 
  MessageSquareCode, 
  BellRing, 
  ShieldCheck,
  ArrowRight,
  UserCheck
} from 'lucide-react'

export default async function LandingPage() {
  const session = await auth()
  const isLoggedIn = !!session?.user

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-7 w-7 text-indigo-600 animate-pulse" />
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Medie Genie
            </span>
          </div>

          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#security" className="hover:text-indigo-600 transition-colors">Security</a>
          </nav>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-sm text-slate-600">
                  Welcome, <strong className="text-slate-900">{session.user?.name}</strong>
                </span>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm hover:shadow transition-all gap-1.5"
                >
                  <UserCheck className="h-4 w-4" />
                  Dashboard
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm hover:shadow transition-all gap-1.5"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        {/* Soft Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 opacity-30 pointer-events-none blur-3xl bg-gradient-to-tr from-indigo-200 via-purple-100 to-sky-200"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 mb-6">
              <ShieldCheck className="h-3.5 w-3.5" /> HIPAA-Compliant & Secure Portal
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-none mb-6">
              Your AI-Powered <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent">
                Patient Portal
              </span>
            </h1>

            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Experience the next generation of healthcare administration. Medie Genie streamlines appointments, automates prescription renewals, stores records safely, and uses AI to answer health queries.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={isLoggedIn ? "/dashboard" : "/signup"}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md hover:shadow-lg transition-all gap-2"
              >
                {isLoggedIn ? "Go to Dashboard" : "Create Free Account"}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Core Modules / Features */}
      <section id="features" className="py-20 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">
              Healthcare Management Simplified
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Every tool you need to manage appointments, keep track of prescriptions, communicate securely with clinicians, and query symptoms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="group border border-slate-100 p-6 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <CalendarDays className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Smart Scheduling</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Book, reschedule, or cancel clinical appointments instantly with real-time slot availability.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group border border-slate-100 p-6 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Prescriptions & Records</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                View doctor prescriptions, download medical records, and request refills directly from your dashboard.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group border border-slate-100 p-6 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <MessageSquareCode className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">AI Symptom Chatbot</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Describe symptoms, receive intelligent triage advice, and know when to seek emergency care.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group border border-slate-100 p-6 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <BellRing className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Intelligent Reminders</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Stay on track with customizable notifications for pill schedules, follow-ups, and lab dates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 bg-slate-950 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-900/60 mb-6">
                <ShieldCheck className="h-3.5 w-3.5" /> Military-Grade Security
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                Your Health Data is Safe With Us
              </h2>

              <p className="text-slate-400 mb-8 leading-relaxed">
                At Medie Genie, patient privacy is our absolute priority. We employ end-to-end AES-256 encryption, multifactor credentials authentication, and strictly comply with HIPAA standards to ensure your medical history remains exclusively yours.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-900/60 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-sm font-medium text-slate-200">End-to-End Encrypted database connection</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-900/60 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-sm font-medium text-slate-200">HIPAA Compliant database hosting via Supabase</span>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full lg:max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <h3 className="font-bold text-xl mb-4 text-slate-100">Ready to get started?</h3>
              <p className="text-sm text-slate-400 mb-6">
                Join thousands of patients managing their health safely and efficiently.
              </p>
              <Link
                href="/signup"
                className="w-full inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-slate-950 bg-white hover:bg-slate-100 rounded-xl transition-all gap-1.5 shadow"
              >
                Create an Account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-indigo-600" />
            <span className="font-bold text-sm text-slate-900">Medie Genie</span>
          </div>
          <p className="text-xs text-slate-500 text-center sm:text-left">
            &copy; {new Date().getFullYear()} Medie Genie. All rights reserved. HIPAA Compliant.
          </p>
        </div>
      </footer>
    </div>
  )
}
