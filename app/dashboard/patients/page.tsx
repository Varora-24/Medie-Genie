import React from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getDoctorPatients } from '@/lib/actions/notes'
import Link from 'next/link'
import { Users, FileText, ChevronRight } from 'lucide-react'

export default async function PatientsDirectoryPage() {
  const session = await auth()
  
  if (!session?.user || (session.user as any).role !== 'doctor') {
    redirect('/dashboard')
  }

  const patients = await getDoctorPatients()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Users className="h-8 w-8 text-indigo-600" />
          My Patients
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-2xl">
          View your assigned patients and manage clinical notes. Private notes are heavily encrypted.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {patients.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            You have no patients assigned yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {patients.map(patient => (
              <Link 
                key={patient.id} 
                href={`/dashboard/patients/${patient.id}`}
                className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                    {patient.name?.charAt(0).toUpperCase() || 'P'}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">{patient.name || 'Unnamed Patient'}</div>
                    <div className="text-sm text-slate-500">{patient.email}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm">
                  <FileText className="h-4 w-4" />
                  View File
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
