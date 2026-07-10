import React from 'react'
import { auth } from '@/auth'
import Link from 'next/link'
import { 
  CalendarDays, 
  FileCheck2, 
  HeartHandshake, 
  Activity, 
  TrendingUp, 
  UserSquare2,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Navigation
} from 'lucide-react'
import { getAppointments } from '@/lib/actions/appointments'
import { getDoctorPatients } from '@/lib/actions/notes'

export default async function DashboardPage() {
  const session = await auth()
  const role = (session?.user as any).role || 'patient'
  const userName = session?.user?.name || 'User'
  
  let appointments: any[] = []
  let patients: any[] = []
  if (role === 'doctor') {
    appointments = await getAppointments()
    patients = await getDoctorPatients()
  }

  const pendingAppointments = appointments.filter((a: any) => a.status === 'PENDING')
  const upcomingAppointments = appointments.filter((a: any) => a.status === 'CONFIRMED' && new Date(a.dateTime) >= new Date())
  const todayAppointments = upcomingAppointments.filter((a: any) => {
    const aptDate = new Date(a.dateTime)
    const today = new Date()
    return aptDate.toDateString() === today.toDateString()
  })

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

      {/* Doctor Metrics Row */}
      {role === 'doctor' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 bg-indigo-50 rounded-xl text-indigo-600 flex items-center justify-center flex-shrink-0">
              <Users className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Patients</p>
              <p className="text-sm font-bold text-slate-800">{patients.length}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 bg-emerald-50 rounded-xl text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Upcoming Appointments</p>
              <p className="text-sm font-bold text-slate-800">{upcomingAppointments.length}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 bg-amber-50 rounded-xl text-amber-600 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Requests</p>
              <p className="text-sm font-bold text-slate-800">{pendingAppointments.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Doctor Agenda */}
          {role === 'doctor' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-indigo-600" />
                  Today's Agenda
                </h3>
                <Link href="/dashboard/appointments" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  Manage all &rarr;
                </Link>
              </div>

              {todayAppointments.length > 0 ? (
                <div className="space-y-3">
                  {todayAppointments.map((apt: any) => (
                    <div key={apt.id} className="flex items-start justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="font-semibold text-slate-800">{apt.patient.name}</div>
                        <div className="text-sm text-slate-500 line-clamp-1">{apt.reason}</div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-medium text-indigo-600">{new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50">
                  <CheckCircle2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <h4 className="font-semibold text-slate-600 mb-1">No appointments today</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Enjoy your day or catch up on patient notes.
                  </p>
                </div>
              )}

              {/* Pending Action Alerts */}
              {pendingAppointments.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    Action Required
                  </h4>
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-amber-900 text-sm">You have {pendingAppointments.length} pending appointment request(s)</div>
                      <div className="text-xs text-amber-700 mt-0.5">Review them before they expire.</div>
                    </div>
                    <Link href="/dashboard/appointments" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm">
                      Review Now
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Patient Activities Placeholder */}
          {role === 'patient' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
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
          )}
        </div>

        <div className="space-y-6">
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
          
          {/* Quick Links for Doctors */}
          {role === 'doctor' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col">
              <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                <Navigation className="h-5 w-5 text-indigo-600" />
                Quick Links
              </h3>
              <div className="space-y-2">
                <Link href="/dashboard/patients" className="block w-full px-4 py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 text-slate-700 hover:text-indigo-700 text-sm font-medium rounded-xl transition-colors">
                  View Patient Roster
                </Link>
                <Link href="/dashboard/settings" className="block w-full px-4 py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 text-slate-700 hover:text-indigo-700 text-sm font-medium rounded-xl transition-colors">
                  Edit Profile & Specialty
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
