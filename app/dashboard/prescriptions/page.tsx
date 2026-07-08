import React from 'react'
import { getPrescriptions } from '@/lib/actions/prescriptions'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { FileSpreadsheet, Pill, Calendar, User, ClipboardList, Info } from 'lucide-react'

export default async function PrescriptionsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const role = (session.user as any).role || 'patient'
  const prescriptions = await getPrescriptions()

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8 text-indigo-600 animate-pulse" />
          Active Prescriptions
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-2xl">
          {role === 'doctor'
            ? 'Track and review the pharmaceutical prescriptions you have issued to your patients.'
            : 'View and track your active clinical prescriptions, dosages, and doctor guidelines.'}
        </p>
      </div>

      {prescriptions.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-md flex flex-col items-center justify-center min-h-[300px]">
          <Pill className="h-12 w-12 text-slate-300 mb-3 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-800">No prescriptions found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            {role === 'doctor'
              ? 'You have not issued any prescriptions to your patients yet.'
              : 'There are no active prescriptions registered in your medical file.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prescriptions.map((pres) => {
            const startDate = new Date(pres.startDate).toLocaleDateString()
            const endDate = new Date(pres.endDate).toLocaleDateString()
            const isActive = new Date(pres.endDate) >= new Date()

            return (
              <div
                key={pres.id}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
              >
                {/* Active/Expired Badge */}
                <div className="absolute top-4 right-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {isActive ? 'Active' : 'Expired'}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Medication title */}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Pill className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{pres.medication}</h3>
                      <p className="text-xs text-slate-400 font-medium">Prescription ID: {pres.id}</p>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold mb-0.5">DOSAGE</p>
                      <p className="text-slate-800 font-medium flex items-center gap-1.5">
                        <ClipboardList className="h-4 w-4 text-slate-400" />
                        {pres.dosage}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold mb-0.5">FREQUENCY</p>
                      <p className="text-slate-800 font-medium flex items-center gap-1.5">
                        <ClockIcon className="h-4 w-4 text-slate-400" />
                        {pres.frequency}
                      </p>
                    </div>
                  </div>

                  {/* Date range */}
                  <div className="text-sm">
                    <p className="text-xs text-slate-400 font-semibold mb-0.5">DURATION</p>
                    <p className="text-slate-800 font-medium flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {startDate} to {endDate}
                    </p>
                  </div>

                  {/* Doctor/Patient Name */}
                  <div className="text-sm">
                    <p className="text-xs text-slate-400 font-semibold mb-0.5">
                      {role === 'doctor' ? 'PATIENT' : 'PRESCRIBER'}
                    </p>
                    <p className="text-slate-800 font-medium flex items-center gap-1.5">
                      <User className="h-4 w-4 text-slate-400" />
                      {role === 'doctor'
                        ? pres.patient.name || pres.patient.email
                        : `Dr. ${pres.doctor.name || pres.doctor.email}`}
                    </p>
                  </div>

                  {/* Instructions */}
                  {pres.instructions && (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex gap-2.5">
                      <Info className="h-4.5 w-4.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-600 leading-relaxed">
                        <strong className="text-slate-700 block font-semibold mb-0.5">Instructions:</strong>
                        {pres.instructions}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
