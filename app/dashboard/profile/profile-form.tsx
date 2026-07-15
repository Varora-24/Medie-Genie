'use client'

import React, { useTransition } from 'react'
import { updateProfile } from '@/lib/auth-actions'
import { toast } from 'sonner'
import { Save, Loader2, User } from 'lucide-react'

interface ProfileFormProps {
  initialName: string
  initialEmail: string
  initialPhone: string
  initialDateOfBirth: string
  initialSpecialty: string
  role: string
}

export default function ProfileForm({ initialName, initialEmail, initialPhone, initialDateOfBirth, initialSpecialty, role }: ProfileFormProps) {
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

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Email Address
        </label>
        <div className="relative">
          <input
            type="email"
            value={initialEmail}
            disabled
            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <input
              type="tel"
              name="phone"
              defaultValue={initialPhone}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Date of Birth
          </label>
          <div className="relative">
            <input
              type="date"
              name="dateOfBirth"
              defaultValue={initialDateOfBirth}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
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
