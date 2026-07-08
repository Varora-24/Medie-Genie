'use client'

import React, { useState, useTransition } from 'react'
import { bookAppointment } from '@/lib/actions/appointments'
import { toast } from 'sonner'
import { Calendar, User, FileText, Loader2, ArrowRight } from 'lucide-react'

interface Doctor {
  id: string
  name: string | null
  email: string
}

interface AppointmentFormProps {
  doctors: Doctor[]
}

export default function AppointmentForm({ doctors }: AppointmentFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const doctorId = formData.get('doctorId') as string
    const dateTime = formData.get('dateTime') as string
    const reason = formData.get('reason') as string

    if (!doctorId || !dateTime || !reason) {
      toast.error('Please fill in all fields.')
      return
    }

    startTransition(async () => {
      const result = await bookAppointment(formData)
      if (result?.error) {
        setError(result.error)
        toast.error(result.error)
      } else {
        toast.success('Appointment scheduled successfully!')
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-indigo-500" />
        Book an Appointment
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Doctor Selection */}
        <div>
          <label htmlFor="doctorId" className="block text-sm font-semibold text-slate-700 mb-1">
            Select Medical Specialist
          </label>
          <div className="relative">
            <select
              id="doctorId"
              name="doctorId"
              required
              defaultValue=""
              className="block w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white outline-none appearance-none transition-all"
            >
              <option value="" disabled>Choose a doctor...</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.name || doc.email}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <User className="h-4.5 w-4.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Date and Time */}
        <div>
          <label htmlFor="dateTime" className="block text-sm font-semibold text-slate-700 mb-1">
            Date & Time
          </label>
          <div className="relative">
            <input
              id="dateTime"
              name="dateTime"
              type="datetime-local"
              required
              min={new Date().toISOString().slice(0, 16)}
              className="block w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white outline-none transition-all"
            />
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Calendar className="h-4.5 w-4.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Reason for Appointment */}
        <div>
          <label htmlFor="reason" className="block text-sm font-semibold text-slate-700 mb-1">
            Reason for Visit
          </label>
          <div className="relative">
            <textarea
              id="reason"
              name="reason"
              required
              rows={3}
              placeholder="Briefly describe your symptoms or visit reason..."
              className="block w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white outline-none transition-all resize-none"
            />
            <div className="absolute top-3.5 left-3.5 pointer-events-none">
              <FileText className="h-4.5 w-4.5 text-slate-400" />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full justify-center items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400 transition-all cursor-pointer mt-2"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scheduling appointment...
            </>
          ) : (
            <>
              Schedule Appointment
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
