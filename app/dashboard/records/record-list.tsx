'use client'

import React from 'react'
import { FileText, Calendar, User, ExternalLink, ShieldCheck, ClipboardList, BookOpen } from 'lucide-react'

interface MedicalRecord {
  id: string
  patientId: string
  doctorId: string
  type: string
  title: string
  description: string | null
  fileUrl: string | null
  recordDate: Date
  doctor: { name: string | null; email: string }
  patient: { name: string | null; email: string }
}

interface RecordListProps {
  records: MedicalRecord[]
  userRole: 'patient' | 'doctor' | 'admin'
}

export default function RecordList({ records, userRole }: RecordListProps) {
  const getTypeBadgeStyle = (type: string) => {
    switch (type.toUpperCase()) {
      case 'LAB_RESULT':
        return {
          label: 'Lab Result',
          color: 'bg-blue-50 text-blue-700 border-blue-100',
          icon: ClipboardList,
        }
      case 'DIAGNOSIS':
        return {
          label: 'Diagnosis',
          color: 'bg-purple-50 text-purple-700 border-purple-100',
          icon: ShieldCheck,
        }
      case 'IMMUNIZATION':
        return {
          label: 'Immunization',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          icon: ShieldCheck,
        }
      case 'REFERRAL':
      default:
        return {
          label: 'Referral',
          color: 'bg-amber-50 text-amber-700 border-amber-100',
          icon: BookOpen,
        }
    }
  }

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-md flex flex-col items-center justify-center min-h-[300px]">
        <FileText className="h-12 w-12 text-slate-300 mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-800">No medical files uploaded</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          {userRole === 'doctor'
            ? 'There are no medical documents submitted by or for your patients yet.'
            : 'Keep all your medical reports, lab results, and immunization files safely stored in one secure place.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {records.map((rec) => {
        const { label, color, icon: TypeIcon } = getTypeBadgeStyle(rec.type)
        const displayDate = new Date(rec.recordDate).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })

        const displayPartner =
          userRole === 'doctor'
            ? `Patient: ${rec.patient.name || rec.patient.email}`
            : `Practitioner: Dr. ${rec.doctor.name || rec.doctor.email}`

        return (
          <div
            key={rec.id}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md"
          >
            <div className="space-y-2 min-w-0 flex-1">
              {/* Type and Title */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}
                >
                  <TypeIcon className="h-3 w-3" />
                  {label}
                </span>
                <span className="text-xs text-slate-400 font-medium">ID: {rec.id}</span>
              </div>

              {/* Title */}
              <h3 className="font-bold text-slate-800 text-base truncate">{rec.title}</h3>

              {/* Date & Partner */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>{displayDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>{displayPartner}</span>
                </div>
              </div>

              {/* Description */}
              {rec.description && (
                <p className="text-xs text-slate-500 line-clamp-2 pl-4 border-l border-slate-200">
                  {rec.description}
                </p>
              )}
            </div>

            {/* View File Button */}
            {rec.fileUrl && (
              <a
                href={rec.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all cursor-pointer flex-shrink-0 self-end sm:self-center bg-white shadow-sm"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Document
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}
