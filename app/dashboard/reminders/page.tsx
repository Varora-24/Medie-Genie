import React from 'react'
import { getReminders } from '@/lib/actions/reminders'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import ReminderForm from './reminder-form'
import ReminderList from './reminder-list'
import { Bell } from 'lucide-react'

export default async function RemindersPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const reminders = await getReminders()

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Bell className="h-8 w-8 text-indigo-600 animate-pulse" />
          Medication & Clinical Reminders
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-2xl">
          Set up customizable alerts to track your daily medications, active prescriptions, and upcoming doctor consultations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-5">
          <ReminderForm />
        </div>

        {/* Right Column: List */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              Tracked Reminders
            </h2>
            <ReminderList reminders={reminders as any} />
          </div>
        </div>
      </div>
    </div>
  )
}
