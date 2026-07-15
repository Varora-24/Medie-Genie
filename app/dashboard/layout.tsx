import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { logoutAction } from '@/lib/auth-actions'
import {
  HeartPulse,
  LayoutDashboard,
  Calendar,
  FileSpreadsheet,
  Bot,
  Bell,
  Users,
  Settings,
  LogOut,
  User,
  CreditCard
} from 'lucide-react'
import NotificationBell from '@/components/notification-bell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const role = (session.user as any).role || 'patient'
  const userName = session.user.name || 'User'
  const userEmail = session.user.email || ''

  // Build role-specific navigation links
  const getNavLinks = (userRole: string) => {
    switch (userRole) {
      case 'admin':
        return [
          { name: 'Console Logs', href: '/dashboard', icon: LayoutDashboard },
          { name: 'User Directory', href: '/dashboard/users', icon: Users },
          { name: 'Financials', href: '/dashboard/payments', icon: CreditCard },
          { name: 'Account Settings', href: '/dashboard/profile', icon: Settings },
        ]
      case 'doctor':
        return [
          { name: 'Doctor Console', href: '/dashboard', icon: LayoutDashboard },
          { name: 'My Schedule', href: '/dashboard/appointments', icon: Calendar },
          { name: 'Patient Prescriptions', href: '/dashboard/prescriptions', icon: FileSpreadsheet },
          { name: 'Upload Records', href: '/dashboard/records', icon: Users },
        ]
      case 'patient':
      default:
        return [
          { name: 'Portal Home', href: '/dashboard', icon: LayoutDashboard },
          { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
          { name: 'My Prescriptions', href: '/dashboard/prescriptions', icon: FileSpreadsheet },
          { name: 'Medical History', href: '/dashboard/records', icon: Users },
          { name: 'AI Symptom Chat', href: '/dashboard/chat', icon: Bot },
          { name: 'Meds Reminders', href: '/dashboard/reminders', icon: Bell },
        ]
    }
  }

  const navLinks = getNavLinks(role)

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex-shrink-0">
        {/* Header/Logo */}
        <div className="h-16 flex items-center px-6 gap-2 bg-slate-950 border-b border-slate-800 flex-shrink-0">
          <HeartPulse className="h-6 w-6 text-indigo-500 animate-pulse" />
          <span className="font-extrabold text-lg text-white tracking-tight">Medie Genie</span>
        </div>

        {/* User Badge */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-indigo-900/80 text-indigo-300 flex items-center justify-center font-bold border border-indigo-700/50">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{userName}</p>
            <p className="text-xs text-indigo-400 capitalize truncate font-medium">{role} account</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Icon className="h-4.5 w-4.5 text-slate-400" />
                {link.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-slate-800 flex-shrink-0">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header/Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile Logo fallback */}
            <div className="md:hidden flex items-center gap-1.5">
              <HeartPulse className="h-5.5 w-5.5 text-indigo-600 animate-pulse" />
              <span className="font-bold text-sm text-slate-900">Medie Genie</span>
            </div>
            <h1 className="hidden md:block font-bold text-lg text-slate-800 capitalize">{role} Workspace</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-700">{userName}</p>
              <p className="text-[10px] text-slate-400 font-medium">{userEmail}</p>
            </div>
            {role === 'patient' && <NotificationBell />}
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
