import React from 'react'
import { getDoctors, getAppointments } from '@/lib/actions/appointments'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AppointmentForm from './appointment-form'
import AppointmentList from './appointment-list'
import { Calendar } from 'lucide-react'

export default async function AppointmentsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const role = (session.user as any).role || 'patient'
  const doctors = await getDoctors()
  const appointments = await getAppointments()

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Calendar className="h-8 w-8 text-indigo-600 animate-pulse" />
          Clinical Appointments
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-2xl">
          {role === 'doctor'
            ? 'Manage your scheduled patient consultations, reviews, and clinical hours.'
            : 'Schedule and review your virtual or in-person sessions with our clinical specialists.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form (only for patients/admins) */}
        {role !== 'doctor' && (
          <div className="lg:col-span-5">
            <AppointmentForm doctors={doctors} />
          </div>
        )}

        {/* Right Column: List */}
        <div className={role === 'doctor' ? 'lg:col-span-12' : 'lg:col-span-7'}>
          <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              Scheduled Sessions
            </h2>
            <AppointmentList initialAppointments={appointments as any} userRole={role} />
          </div>
        </div>
      </div>
    </div>
  )
}
