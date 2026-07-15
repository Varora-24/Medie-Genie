'use client'

import React, { useState, useTransition, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { loginAction, googleLoginAction } from '@/lib/auth-actions'
import { HeartPulse, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({})
  const [activeTab, setActiveTab] = useState<'patient' | 'doctor' | 'admin'>('patient')

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'CredentialsAccountExists') {
      toast.error('An account with this email already exists. Please log in with email and password instead.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await loginAction(null, formData)

      if (res?.error) {
        setErrors(res.error)
        if ('global' in res.error && res.error.global) {
          toast.error(res.error.global[0])
        } else {
          toast.error('Invalid credentials. Please check your inputs.')
        }
      } else if (res?.success) {
        toast.success('Successfully logged in!')
        router.refresh()
        setTimeout(() => {
          router.push('/dashboard')
        }, 800)
      }
    })
  }

  return (
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center gap-2 mb-4 justify-center">
          <HeartPulse className="h-10 w-10 text-indigo-600 animate-pulse" />
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Medie Genie
          </span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Sign in to your account
        </h2>
        {activeTab === 'patient' && (
          <p className="mt-2 text-sm text-slate-600">
            New to Medie Genie?{' '}
            <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Create an account
            </Link>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-6 py-8 sm:px-10 shadow-lg rounded-3xl border border-slate-100">
          {/* Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-8">
            <button
              onClick={() => setActiveTab('patient')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                activeTab === 'patient' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Patient
            </button>
            <button
              onClick={() => setActiveTab('doctor')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                activeTab === 'doctor' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Doctor
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                activeTab === 'admin' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin
            </button>
          </div>

          {(activeTab === 'doctor' || activeTab === 'admin') && (
            <div className="mb-6 rounded-lg bg-indigo-50 p-4 border border-indigo-100 text-sm text-indigo-800">
              {activeTab === 'doctor' ? (
                <p>New doctors must apply and be approved. <Link href="/apply-doctor" className="font-semibold underline text-indigo-700 hover:text-indigo-900">Apply here</Link> to get started.</p>
              ) : (
                <p>Admin accounts are not self-service. Contact <a href="mailto:officialvansh626@gmail.com" className="font-semibold underline">officialvansh626@gmail.com</a> with your details to request access.</p>
              )}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="john@example.com"
                  className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all outline-none"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-600">{errors.email[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all outline-none"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-600">{errors.password[0]}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="flex w-full justify-center items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400 transition-all cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {activeTab !== 'admin' && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-slate-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <form action={googleLoginAction}>
                  <input type="hidden" name="intent" value={activeTab} />
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Sign in with Google
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 px-6 lg:px-8">
      <Suspense fallback={
        <div className="flex w-full justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
