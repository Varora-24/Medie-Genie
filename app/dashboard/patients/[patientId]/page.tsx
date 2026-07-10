import React from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getPatientNotes } from '@/lib/actions/notes'
import Link from 'next/link'
import { ChevronLeft, Lock } from 'lucide-react'
import NotesForm from './notes-form'
import PrescriptionForm from './prescription-form'

export default async function PatientFilePage({
  params
}: {
  params: { patientId: string }
}) {
  const session = await auth()
  
  if (!session?.user || (session.user as any).role !== 'doctor') {
    redirect('/dashboard')
  }

  // Will throw 403 error internally if the doctor does not have an appointment with this patient
  let notes: any[] = []
  let accessError = null
  
  try {
    notes = await getPatientNotes(params.patientId)
  } catch (err: any) {
    accessError = err.message
  }

  if (accessError) {
    return (
      <div className="p-8 text-center text-rose-600 font-medium">
        {accessError}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/patients" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Clinical Notes File
          </h1>
          <p className="text-sm text-slate-500 flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            End-to-end encrypted. Strictly non-patient-visible.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <NotesForm patientId={params.patientId} />
          <PrescriptionForm patientId={params.patientId} />
        </div>
        
        <div className="lg:col-span-2 space-y-4">
          {notes.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
              No clinical notes recorded yet.
            </div>
          ) : (
            notes.map(note => (
              <div key={note.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <span className="font-semibold text-slate-800 text-sm">
                    {note.authorName}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-mono bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {note.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
