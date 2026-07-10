import React from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getUsers } from '@/lib/actions/admin'
import UserDirectory from './user-directory'
import { ShieldCheck } from 'lucide-react'

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: { q?: string; role?: string }
}) {
  const session = await auth()
  
  // Strict admin check
  if (!session?.user || (session.user as any).role !== 'admin') {
    redirect('/dashboard')
  }

  const query = searchParams.q || ''
  const roleFilter = searchParams.role || 'all'

  const users = await getUsers(query, roleFilter)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-indigo-600" />
          User Directory
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-2xl">
          Manage system access, view registered patients, and securely provision new clinical and administrative accounts.
        </p>
      </div>

      <UserDirectory initialUsers={users as any} />
    </div>
  )
}
