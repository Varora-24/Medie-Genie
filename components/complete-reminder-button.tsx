'use client'

import React, { useTransition } from 'react'
import { toggleReminderComplete } from '@/lib/actions/reminders'
import { toast } from 'sonner'
import { CheckCircle2, Loader2 } from 'lucide-react'

export default function CompleteReminderButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  const handleComplete = () => {
    startTransition(async () => {
      const res = await toggleReminderComplete(id, true)
      if (res.success) {
        toast.success('Reminder marked as complete')
      } else {
        toast.error(res.error || 'Failed to complete reminder')
      }
    })
  }

  return (
    <button
      onClick={handleComplete}
      disabled={isPending}
      className="p-2 text-slate-400 hover:text-emerald-600 bg-white hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200 hover:border-emerald-200 shadow-sm disabled:opacity-50"
      title="Mark Complete"
    >
      {isPending ? <Loader2 className="h-5 w-5 animate-spin text-emerald-600" /> : <CheckCircle2 className="h-5 w-5" />}
    </button>
  )
}
