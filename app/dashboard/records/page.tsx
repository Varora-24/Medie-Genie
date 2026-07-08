import React from 'react'
import { getMedicalRecords } from '@/lib/actions/records'
import { getDoctors } from '@/lib/actions/appointments'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import RecordForm from './record-form'
import RecordList from './record-list'
import { FolderHeart } from 'lucide-react'

export default async function MedicalRecordsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const role = (session.user as any).role || 'patient'
  const doctors = await getDoctors()
  const records = await getMedicalRecords()

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <FolderHeart className="h-8 w-8 text-indigo-600 animate-pulse" />
          Medical History & Records
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-2xl">
          {role === 'doctor'
            ? 'Access and review secure medical files, lab tests, and referral letters for your patients.'
            : 'Access, upload, and review your secure medical files, diagnostic reports, and clinical records.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form (only for patients/admins) */}
        {role !== 'doctor' && (
          <div className="lg:col-span-5">
            <RecordForm doctors={doctors} />
          </div>
        )}

        {/* Right Column: List */}
        <div className={role === 'doctor' ? 'lg:col-span-12' : 'lg:col-span-7'}>
          <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              Saved Documents
            </h2>
            <RecordList records={records as any} userRole={role} />
          </div>
        </div>
      </div>
    </div>
  )
}
