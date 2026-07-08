'use client'

import React, { useState, useTransition } from 'react'
import { uploadMedicalRecord } from '@/lib/actions/records'
import { toast } from 'sonner'
import { Upload, User, FileText, Loader2, ArrowRight, FileCheck } from 'lucide-react'

interface Doctor {
  id: string
  name: string | null
  email: string
}

interface RecordFormProps {
  doctors: Doctor[]
}

export default function RecordForm({ doctors }: RecordFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setFileName(file ? file.name : null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const type = formData.get('type') as string
    const recordDate = formData.get('recordDate') as string
    const doctorId = formData.get('doctorId') as string
    const file = formData.get('file') as File | null

    if (!title || !type || !recordDate || !doctorId || !file || file.size === 0) {
      toast.error('Please fill in all fields and select a file.')
      return
    }

    startTransition(async () => {
      const result = await uploadMedicalRecord(formData)
      if (result?.error) {
        setError(result.error)
        toast.error(result.error)
      } else {
        toast.success('Medical record uploaded and saved successfully!')
        setFileName(null)
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Upload className="h-5 w-5 text-indigo-500" />
        Upload Medical Document
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-1">
            Document Title
          </label>
          <div className="relative">
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="e.g. Annual Blood Panel Report"
              className="block w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white outline-none transition-all"
            />
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <FileText className="h-4.5 w-4.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Type & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-semibold text-slate-700 mb-1">
              Document Type
            </label>
            <select
              id="type"
              name="type"
              required
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white outline-none transition-all"
            >
              <option value="LAB_RESULT">Lab Result</option>
              <option value="DIAGNOSIS">Diagnosis Report</option>
              <option value="IMMUNIZATION">Immunization Record</option>
              <option value="REFERRAL">Referral Letter</option>
            </select>
          </div>

          <div>
            <label htmlFor="recordDate" className="block text-sm font-semibold text-slate-700 mb-1">
              Record Date
            </label>
            <input
              id="recordDate"
              name="recordDate"
              type="date"
              required
              max={new Date().toISOString().split('T')[0]}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white outline-none transition-all"
            />
          </div>
        </div>

        {/* Doctor Selection */}
        <div>
          <label htmlFor="doctorId" className="block text-sm font-semibold text-slate-700 mb-1">
            Associated Practitioner
          </label>
          <div className="relative">
            <select
              id="doctorId"
              name="doctorId"
              required
              defaultValue=""
              className="block w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white outline-none appearance-none transition-all"
            >
              <option value="" disabled>Choose doctor...</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.name || doc.email}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <User className="h-4.5 w-4.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* File Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Choose Document File (PDF, Images)
          </label>
          <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-4 transition-colors flex flex-col items-center justify-center bg-slate-50 cursor-pointer">
            <input
              id="file"
              name="file"
              type="file"
              required
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {fileName ? (
              <div className="flex flex-col items-center gap-1 text-slate-700">
                <FileCheck className="h-8 w-8 text-emerald-500" />
                <span className="text-sm font-bold truncate max-w-[250px]">{fileName}</span>
                <span className="text-xs text-slate-400">Click or drag to change file</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-slate-400">
                <Upload className="h-8 w-8 text-slate-300" />
                <span className="text-sm font-semibold">Select PDF or Image</span>
                <span className="text-xs">Max size: 10MB</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-1">
            Description/Notes (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            placeholder="Add any notes about this medical document..."
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white outline-none transition-all resize-none"
          />
        </div>

        {error && (
          <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full justify-center items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400 transition-all cursor-pointer mt-2"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading to Supabase...
            </>
          ) : (
            <>
              Upload Document
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
