'use client'

import React, { useState, useTransition } from 'react'
import { approveDoctorApplication, rejectDoctorApplication } from '@/lib/doctor-application-actions'
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function ApplicationsList({ initialApplications, adminId }: { initialApplications: any[], adminId: string }) {
  const router = useRouter()
  const [filter, setFilter] = useState('PENDING')
  const [isPending, startTransition] = useTransition()
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  
  // Store temp passwords mapped by application ID
  const [tempPasswords, setTempPasswords] = useState<Record<string, string>>({})

  const filteredApps = initialApplications.filter(app => app.status === filter)

  const handleApprove = (appId: string) => {
    startTransition(async () => {
      const res = await approveDoctorApplication(appId, adminId)
      if (res.error) {
        toast.error(res.error)
      } else if (res.success && res.tempPassword) {
        setTempPasswords(prev => ({ ...prev, [appId]: res.tempPassword }))
        toast.success('Doctor approved and account created!')
        router.refresh()
      }
    })
  }

  const handleReject = (appId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection.')
      return
    }

    startTransition(async () => {
      const res = await rejectDoctorApplication(appId, adminId, rejectionReason)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Application rejected.')
        setRejectingId(null)
        setRejectionReason('')
        router.refresh()
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
      <div className="flex space-x-2 mb-6 border-b border-slate-100 pb-4">
        {['PENDING', 'APPROVED', 'REJECTED'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === status 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredApps.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            No applications found with status: {filter}
          </div>
        ) : (
          filteredApps.map((app) => (
            <div key={app.id} className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-lg">{app.fullName}</h3>
                    {app.status === 'PENDING' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1"/> Pending</span>}
                    {app.status === 'APPROVED' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3 mr-1"/> Approved</span>}
                    {app.status === 'REJECTED' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><XCircle className="w-3 h-3 mr-1"/> Rejected</span>}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-slate-600 mt-2">
                    <div><strong>Email:</strong> {app.email}</div>
                    <div><strong>Phone:</strong> {app.phone}</div>
                    <div><strong>Specialty:</strong> {app.specialty}</div>
                    <div><strong>License:</strong> {app.licenseNumber}</div>
                    <div><strong>Experience:</strong> {app.yearsExperience} years</div>
                    <div className="sm:col-span-2"><strong>Qualifications:</strong> {app.qualifications}</div>
                    {app.message && <div className="sm:col-span-2"><strong>Message:</strong> {app.message}</div>}
                    {app.rejectionReason && <div className="sm:col-span-2 text-rose-600 mt-2"><strong>Rejection Reason:</strong> {app.rejectionReason}</div>}
                  </div>
                </div>

                {app.status === 'PENDING' && (
                  <div className="flex flex-col gap-2 min-w-[140px]">
                    {rejectingId === app.id ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          placeholder="Reason for rejection..."
                          className="text-sm border border-slate-200 rounded-lg p-2 resize-none"
                          rows={2}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(app.id)}
                            disabled={isPending}
                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 rounded-lg transition-colors text-center disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => { setRejectingId(null); setRejectionReason(''); }}
                            className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold py-2 rounded-lg transition-colors text-center"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApprove(app.id)}
                          disabled={isPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve'}
                        </button>
                        <button
                          onClick={() => setRejectingId(app.id)}
                          disabled={isPending}
                          className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                )}
                
                {app.status === 'APPROVED' && tempPasswords[app.id] && (
                  <div className="min-w-[200px] bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-sm">
                    <p className="font-semibold text-emerald-800 mb-1">Account Created!</p>
                    <p className="text-emerald-700 text-xs mb-2">Share this temporary password with the doctor securely. It will only be shown once.</p>
                    <div className="bg-white px-3 py-2 rounded-lg border border-emerald-100 font-mono text-emerald-900 text-center tracking-wider font-bold">
                      {tempPasswords[app.id]}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
