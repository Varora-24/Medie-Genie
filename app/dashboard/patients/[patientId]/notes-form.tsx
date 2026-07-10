'use client'

import React, { useState, useTransition } from 'react'
import { addDoctorNote } from '@/lib/actions/notes'
import { toast } from 'sonner'
import { FilePlus2, Loader2 } from 'lucide-react'

export default function NotesForm({ patientId }: { patientId: string }) {
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    startTransition(async () => {
      const res = await addDoctorNote(patientId, content)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Clinical note encrypted and saved successfully')
        setContent('')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center gap-2 text-slate-800 font-bold mb-2 border-b border-slate-100 pb-3">
        <FilePlus2 className="h-5 w-5 text-indigo-600" />
        New Clinical Note
      </div>
      
      <textarea
        required
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isPending}
        placeholder="Enter clinical observations, diagnoses, or internal notes here. Content will be encrypted before saving to the database."
        className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono placeholder:font-sans"
      />
      
      <button
        type="submit"
        disabled={isPending || !content.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Encrypt & Save Note'}
      </button>
    </form>
  )
}
