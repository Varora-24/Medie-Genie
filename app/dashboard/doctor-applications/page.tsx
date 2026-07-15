import React from 'react'
import { auth } from '@/auth'
import db from '@/lib/db'
import { redirect } from 'next/navigation'
import ApplicationsList from './ApplicationsList'

export default async function DoctorApplicationsPage() {
  const session = await auth()
  const role = (session?.user as any)?.role

  if (role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch all applications ordered by newest first
  const applications = await db.doctorApplication.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Doctor Applications</h2>
          <p className="text-slate-500 text-sm mt-1">
            Review and manage new doctor registration requests.
          </p>
        </div>
      </div>

      <ApplicationsList initialApplications={applications} adminId={(session?.user as any).id} />
    </div>
  )
}
