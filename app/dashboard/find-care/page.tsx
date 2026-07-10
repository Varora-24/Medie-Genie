import React from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import FacilityFinder from './facility-finder'
import { MapPin } from 'lucide-react'

export default async function FindCarePage({
  searchParams,
}: {
  searchParams: Promise<{ emergency?: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const resolvedSearchParams = await searchParams
  const isEmergency = resolvedSearchParams.emergency === 'true'

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <MapPin className="h-8 w-8 text-indigo-600" />
          Find Medical Care
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-2xl">
          Locate nearby hospitals, clinics, pharmacies, and diagnostic laboratories based on your current location.
        </p>
      </div>

      <FacilityFinder isEmergency={isEmergency} />
    </div>
  )
}
