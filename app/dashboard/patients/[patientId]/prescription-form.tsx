'use client'

import React, { useState, useTransition } from 'react'
import { createPrescription } from '@/lib/actions/prescriptions'
import { toast } from 'sonner'
import { Pill, Loader2, Send } from 'lucide-react'

export default function PrescriptionForm({ patientId }: { patientId: string }) {
  const [isPending, startTransition] = useTransition()
  
  const [medication, setMedication] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('')
  const [instructions, setInstructions] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!medication.trim() || !dosage.trim() || !frequency.trim()) return

    startTransition(async () => {
      const result = await createPrescription(patientId, medication, dosage, frequency, instructions)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Prescription issued successfully.')
        setMedication('')
        setDosage('')
        setFrequency('')
        setInstructions('')
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mt-6">
      <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
        <Pill className="h-5 w-5 text-indigo-600" />
        Write Prescription
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
            Medication Name
          </label>
          <input
            type="text"
            required
            value={medication}
            onChange={e => setMedication(e.target.value)}
            placeholder="e.g. Amoxicillin"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Dosage
            </label>
            <input
              type="text"
              required
              value={dosage}
              onChange={e => setDosage(e.target.value)}
              placeholder="e.g. 500mg"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Frequency
            </label>
            <input
              type="text"
              required
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              placeholder="e.g. Twice daily"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
            Instructions (Optional)
          </label>
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder="Additional instructions for the patient..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow min-h-[80px] resize-y"
          />
        </div>

        <button
          type="submit"
          disabled={isPending || !medication.trim() || !dosage.trim() || !frequency.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isPending ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Send className="h-4.5 w-4.5" />}
          Issue Prescription
        </button>
      </form>
    </div>
  )
}
