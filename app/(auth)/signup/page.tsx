'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signUpAction, googleLoginAction } from '@/lib/auth-actions'
import { HeartPulse, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function SignupPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({})

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const res = await signUpAction(null, formData)
      
      if (res?.error) {
        setErrors(res.error)
        
        // Show toasts for specific errors
        if ('global' in res.error && res.error.global) {
          toast.error(res.error.global[0])
        } else {
          toast.error('Please correct the validation errors below.')
        }
      } else if (res?.success) {
        toast.success('Account created successfully! Redirecting to login...')
        setTimeout(() => {
          router.push('/login')
        }, 1500)
      }
    })
  }

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
          Create your account
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-8 py-10 shadow-lg rounded-3xl border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="John Doe"
                  className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all outline-none"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-rose-600">{errors.name[0]}</p>
              )}
            </div>

            {/* Email Address */}
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

            {/* Password */}
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

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isPending}
                className="flex w-full justify-center items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400 transition-all cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Sign Up
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

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
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign up with Google
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
