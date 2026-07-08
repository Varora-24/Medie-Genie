'use client'

import React, { useState, useTransition } from 'react'
import { createReminder } from '@/lib/actions/reminders'
import { toast } from 'sonner'
import { Bell, Clock, FileText, Loader2, ArrowRight } from 'lucide-react'

export default function ReminderForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const type = formData.get('type') as string
    const scheduleTime = formData.get('scheduleTime') as string

    if (!title || !type || !scheduleTime) {
      toast.error('Please fill in all required fields.')
      return
    }

    startTransition(async () => {
      const result = await createReminder(formData)
      if (result?.error) {
        setError(result.error)
        toast.error(result.error)
      } else {
        toast.success('Reminder added successfully!')
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Bell className="h-5 w-5 text-indigo-500" />
        Add New Reminder
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-1">
            Reminder Title *
          </label>
          <div className="relative">
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="e.g. Take Amoxicillin"
              className="block w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white outline-none transition-all"
            />
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Bell className="h-4.5 w-4.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Type & Schedule Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-semibold text-slate-700 mb-1">
              Category *
            </label>
            <select
              id="type"
              name="type"
              required
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white outline-none transition-all"
            >
              <option value="MEDICATION">Medication</option>
              <option value="APPOINTMENT">Appointment</option>
              <option value="GENERAL">General Health</option>
            </select>
          </div>

          <div>
            <label htmlFor="scheduleTime" className="block text-sm font-semibold text-slate-700 mb-1">
              Schedule Date & Time *
            </label>
            <div className="relative">
              <input
                id="scheduleTime"
                name="scheduleTime"
                type="datetime-local"
                required
                min={new Date().toISOString().slice(0, 16)}
                className="block w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white outline-none transition-all"
              />
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Clock className="h-4.5 w-4.5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Details / Instructions */}
        <div>
          <label htmlFor="content" className="block text-sm font-semibold text-slate-700 mb-1">
            Instructions / Details (Optional)
          </label>
          <div className="relative">
            <textarea
              id="content"
              name="content"
              rows={3}
              placeholder="e.g. Take 1 capsule with food. Do not skip."
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
              Creating reminder...
            </>
          ) : (
            <>
              Save Reminder
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
