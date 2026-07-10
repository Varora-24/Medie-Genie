'use client'

import React, { useTransition } from 'react'
import { updateProfile } from '@/lib/auth-actions'
import { toast } from 'sonner'
import { Save, Loader2, User } from 'lucide-react'

interface ProfileFormProps {
  initialName: string
  initialSpecialty: string
  role: string
}

export default function ProfileForm({ initialName, initialSpecialty, role }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Profile updated successfully.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Full Name
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            name="name"
            defaultValue={initialName}
            required
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {role === 'doctor' && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Medical Specialty
          </label>
          <input
            type="text"
            name="specialty"
            defaultValue={initialSpecialty}
            placeholder="e.g. Cardiology, General Practice"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <p className="mt-2 text-xs text-slate-500">
            This will be visible to patients when they book appointments.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-sm"
      >
        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
        Save Changes
      </button>
    </form>
  )
}
