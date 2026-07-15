'use client'

import React, { useState, useTransition, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { submitDoctorApplication } from '@/lib/doctor-application-actions'
import { HeartPulse, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

function ApplicationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({})
  const [isSuccess, setIsSuccess] = useState(false)

  // Pre-fill from Google if available
  const defaultName = searchParams.get('name') || ''
  const defaultEmail = searchParams.get('email') || ''

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})
    
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await submitDoctorApplication(null, formData)

      if (res?.error) {
        const errorObj = res.error as any
        setErrors(errorObj)
        if (errorObj.global) {
          toast.error(errorObj.global[0])
        } else if (errorObj.email && errorObj.email[0].includes('pending application')) {
          toast.error(errorObj.email[0])
        } else {
          toast.error('Please check your inputs and try again.')
        }
      } else if (res?.success) {
        setIsSuccess(true)
        toast.success('Application submitted successfully!')
      }
    })
  }

  if (isSuccess) {
    return (
      <div className="bg-white px-6 py-10 sm:px-10 shadow-lg rounded-3xl border border-slate-100 text-center max-w-md mx-auto">
        <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Application Received</h3>
        <p className="text-slate-600 mb-6 leading-relaxed">
          Your application to join Medie Genie as a doctor is currently under review.
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 mb-6">
          If you have any questions, please contact us at<br/>
          <a href="mailto:officialvansh626@gmail.com" className="font-semibold text-indigo-600 hover:underline mt-1 inline-block">
            officialvansh626@gmail.com
          </a>
        </div>
        <Link href="/" className="inline-flex justify-center items-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow hover:bg-indigo-500 transition-all">
          Return Home
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
      <div className="bg-white px-6 py-8 sm:px-10 shadow-lg rounded-3xl border border-slate-100">
        <div className="mb-6 rounded-lg bg-indigo-50 p-4 border border-indigo-100 text-sm text-indigo-800">
          <p>Please fill out this application to be verified as a medical professional on our platform. All fields are required unless marked optional.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                defaultValue={defaultName}
                required
                className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all outline-none"
              />
              {errors.fullName && <p className="mt-1 text-xs text-rose-600">{errors.fullName[0]}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={defaultEmail}
                required
                className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all outline-none"
              />
              {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email[0]}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all outline-none"
              />
              {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone[0]}</p>}
            </div>

            <div>
              <label htmlFor="specialty" className="block text-sm font-semibold text-slate-700">Specialty (e.g. Cardiology)</label>
              <input
                id="specialty"
                name="specialty"
                type="text"
                required
                className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all outline-none"
              />
              {errors.specialty && <p className="mt-1 text-xs text-rose-600">{errors.specialty[0]}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="licenseNumber" className="block text-sm font-semibold text-slate-700">Medical License Number</label>
              <input
                id="licenseNumber"
                name="licenseNumber"
                type="text"
                required
                className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all outline-none"
              />
              {errors.licenseNumber && <p className="mt-1 text-xs text-rose-600">{errors.licenseNumber[0]}</p>}
            </div>

            <div>
              <label htmlFor="yearsExperience" className="block text-sm font-semibold text-slate-700">Years of Experience</label>
              <input
                id="yearsExperience"
                name="yearsExperience"
                type="number"
                min="0"
                required
                className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all outline-none"
              />
              {errors.yearsExperience && <p className="mt-1 text-xs text-rose-600">{errors.yearsExperience[0]}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="qualifications" className="block text-sm font-semibold text-slate-700">Qualifications & Degrees</label>
            <input
              id="qualifications"
              name="qualifications"
              type="text"
              placeholder="e.g. MD, PhD, Board Certified..."
              required
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all outline-none"
            />
            {errors.qualifications && <p className="mt-1 text-xs text-rose-600">{errors.qualifications[0]}</p>}
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-semibold text-slate-700">Additional Message (Optional)</label>
            <textarea
              id="message"
              name="message"
              rows={3}
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all outline-none resize-none"
            ></textarea>
            {errors.message && <p className="mt-1 text-xs text-rose-600">{errors.message[0]}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full justify-center items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400 transition-all cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
          
          <div className="text-center mt-4">
             <Link href="/login" className="text-sm text-slate-500 hover:text-indigo-600 font-medium">
               &larr; Back to login
             </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ApplyDoctorPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center gap-2 mb-4 justify-center">
          <HeartPulse className="h-10 w-10 text-indigo-600 animate-pulse" />
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Medie Genie
          </span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Doctor Application
        </h2>
      </div>

      <Suspense fallback={
        <div className="flex w-full justify-center items-center h-32 mt-8">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }>
        <ApplicationForm />
      </Suspense>
    </div>
  )
}
