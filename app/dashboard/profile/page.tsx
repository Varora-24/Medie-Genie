import React from 'react'
import { auth } from '@/auth'
import db from '@/lib/db'
import { redirect } from 'next/navigation'
import ProfileForm from './profile-form'
import { Settings } from 'lucide-react'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const userId = (session.user as any).id
  const role = (session.user as any).role || 'patient'

  // Fetch fresh user data from DB
  const user = await db.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Settings className="h-8 w-8 text-indigo-600" />
          Account Settings
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-2xl">
          Manage your personal profile and account preferences.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">
          Profile Information
        </h2>
        
        <ProfileForm 
          initialName={user.name || ''} 
          initialEmail={user.email || ''}
          initialPhone={user.phone || ''}
          initialDateOfBirth={user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : ''}
          initialSpecialty={user.specialty || ''} 
          role={role} 
        />
      </div>
    </div>
  )
}
