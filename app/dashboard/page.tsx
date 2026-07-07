import React from 'react'
import { auth } from '@/auth'
import { 
  CalendarDays, 
  FileCheck2, 
  HeartHandshake, 
  Activity, 
  TrendingUp, 
  UserSquare2
} from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()
  const role = (session?.user as any).role || 'patient'
  const userName = session?.user?.name || 'User'

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        {/* Soft Background Accent circles */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 h-64 w-64 rounded-full bg-white/5 pointer-events-none"></div>
        <div className="absolute right-32 bottom-0 translate-y-16 h-36 w-36 rounded-full bg-white/5 pointer-events-none"></div>

        <div className="relative">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">Welcome Back, {userName}!</h2>
          <p className="text-indigo-100 max-w-xl text-sm leading-relaxed">
            {role === 'patient' && "Your medical details are secure and updated. Check your prescriptions, join clinical telehealth visits, or view recommendations."}
            {role === 'doctor' && "Review patient appointments for today, write medical prescriptions, and log clinical history reports."}
            {role === 'admin' && "Manage portal accounts database status, coordinate appointments scheduling tables, and check payments stats."}
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      {role === 'patient' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 bg-indigo-50 rounded-xl text-indigo-600 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Next Appointment</p>
              <p className="text-sm font-bold text-slate-800">None Scheduled</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 bg-purple-50 rounded-xl text-purple-600 flex items-center justify-center flex-shrink-0">
              <FileCheck2 className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Prescriptions</p>
              <p className="text-sm font-bold text-slate-800">0 Medications</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 bg-emerald-50 rounded-xl text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Activity className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent Triage Result</p>
              <p className="text-sm font-bold text-slate-800">Healthy & Secure</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty States / Placeholder Information Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Today's Activities & Updates
          </h3>

          <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50">
            <HeartHandshake className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h4 className="font-semibold text-slate-700 mb-1">All quiet for now</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              When doctors upload prescription files or book telemedicine slots, they will appear in this feed.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
            <UserSquare2 className="h-5 w-5 text-indigo-600" />
            Account Information
          </h3>

          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Authentication method</span>
              <strong className="text-slate-800 font-semibold">Email + Hashed Pwd</strong>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Session status</span>
              <strong className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Active
              </strong>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Assigned portal role</span>
              <strong className="text-slate-800 font-semibold uppercase">{role}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
