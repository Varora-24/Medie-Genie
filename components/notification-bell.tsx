'use client'

import React, { useEffect, useState, useTransition, useRef } from 'react'
import { Bell, CheckCircle2, AlertCircle } from 'lucide-react'
import { getDueReminders, toggleReminderComplete } from '@/lib/actions/reminders'
import { toast } from 'sonner'
import Link from 'next/link'

export default function NotificationBell() {
  const [dueReminders, setDueReminders] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  // Use a ref for notifiedIds so it doesn't trigger re-renders or depend on stale closures
  const notifiedIds = useRef<Set<string>>(new Set())

  const fetchReminders = async () => {
    const reminders = await getDueReminders()
    setDueReminders(reminders)

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        reminders.forEach((r) => {
          if (!notifiedIds.current.has(r.id)) {
            new Notification('Reminder Due', {
              body: `${r.title}\n${r.content || ''}`,
              icon: '/favicon.ico',
            })
            notifiedIds.current.add(r.id)
          }
        })
      }
    }
  }

  useEffect(() => {
    // Request permission on mount if default
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }

    // Initial fetch
    fetchReminders()

    // Poll every 60 seconds
    const interval = setInterval(() => {
      fetchReminders()
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const handleMarkComplete = (id: string) => {
    startTransition(async () => {
      const res = await toggleReminderComplete(id, true)
      if (res.success) {
        toast.success('Reminder marked as complete')
        setDueReminders((prev) => prev.filter((r) => r.id !== id))
      } else {
        toast.error(res.error || 'Failed to complete reminder')
      }
    })
  }

  const overdueCount = dueReminders.length

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
      >
        <Bell className="h-5.5 w-5.5" />
        {overdueCount > 0 && (
          <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
            {overdueCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-slate-200 z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800">Due Reminders</h3>
            <span className="text-xs font-semibold text-rose-600 bg-rose-100 px-2 py-1 rounded-full">
              {overdueCount} pending
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {dueReminders.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400 mb-2 opacity-50" />
                <p className="text-sm font-medium">All caught up!</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {dueReminders.map((reminder) => (
                  <li key={reminder.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <AlertCircle className="h-4 w-4 text-rose-500" />
                          <p className="text-sm font-bold text-slate-800 line-clamp-1">{reminder.title}</p>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">
                          {new Date(reminder.scheduleTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleMarkComplete(reminder.id)}
                      disabled={isPending}
                      className="w-full mt-2 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Mark Complete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
            <Link 
              href="/dashboard/reminders" 
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View All Reminders
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
