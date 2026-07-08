'use client'

import React, { useTransition } from 'react'
import { toggleReminderComplete, deleteReminder } from '@/lib/actions/reminders'
import { toast } from 'sonner'
import { Bell, Pill, Calendar, Clock, Trash2, CheckCircle2, Circle } from 'lucide-react'

interface Reminder {
  id: string
  userId: string
  title: string
  content: string | null
  type: string
  scheduleTime: Date
  isCompleted: boolean
}

interface ReminderListProps {
  reminders: Reminder[]
}

export default function ReminderList({ reminders }: ReminderListProps) {
  const [isPending, startTransition] = useTransition()

  const handleToggle = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const result = await toggleReminderComplete(id, !currentStatus)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(!currentStatus ? 'Marked as completed!' : 'Marked as active.')
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return

    startTransition(async () => {
      const result = await deleteReminder(id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Reminder deleted successfully.')
      }
    })
  }

  const getCategoryStyle = (type: string) => {
    switch (type.toUpperCase()) {
      case 'MEDICATION':
        return {
          label: 'Medication',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          icon: Pill,
        }
      case 'APPOINTMENT':
        return {
          label: 'Appointment',
          color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
          icon: Calendar,
        }
      case 'GENERAL':
      default:
        return {
          label: 'General',
          color: 'bg-amber-50 text-amber-700 border-amber-100',
          icon: Bell,
        }
    }
  }

  if (reminders.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-md flex flex-col items-center justify-center min-h-[300px]">
        <Bell className="h-12 w-12 text-slate-300 mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-800">No reminders set</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Set active reminders for taking pills, clinical visits, or other health tracking needs.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reminders.map((rem) => {
        const { label, color, icon: CatIcon } = getCategoryStyle(rem.type)
        const displayDateTime = new Date(rem.scheduleTime).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })

        return (
          <div
            key={rem.id}
            className={`bg-white rounded-2xl p-5 shadow-sm border flex items-start gap-4 transition-all hover:shadow-md ${
              rem.isCompleted ? 'opacity-60 border-slate-100' : 'border-slate-100'
            }`}
          >
            {/* Toggle checkbox */}
            <button
              onClick={() => handleToggle(rem.id, rem.isCompleted)}
              disabled={isPending}
              className="mt-1 text-slate-400 hover:text-indigo-600 transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50"
            >
              {rem.isCompleted ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-500 fill-emerald-50" />
              ) : (
                <Circle className="h-6 w-6 text-slate-300 hover:text-indigo-400" />
              )}
            </button>

            {/* Content */}
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${color}`}
                >
                  <CatIcon className="h-3 w-3" />
                  {label}
                </span>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-300" />
                  {displayDateTime}
                </span>
              </div>

              <h3
                className={`font-bold text-base text-slate-800 truncate ${
                  rem.isCompleted ? 'line-through text-slate-400' : ''
                }`}
              >
                {rem.title}
              </h3>

              {rem.content && (
                <p
                  className={`text-sm text-slate-500 leading-relaxed ${
                    rem.isCompleted ? 'line-through text-slate-300' : ''
                  }`}
                >
                  {rem.content}
                </p>
              )}
            </div>

            {/* Delete button */}
            <button
              onClick={() => handleDelete(rem.id)}
              disabled={isPending}
              title="Delete Reminder"
              className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-100 disabled:opacity-50 flex-shrink-0"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
