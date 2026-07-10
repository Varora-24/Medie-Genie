'use client'

import React, { useTransition } from 'react'
import { cancelAppointment, updateAppointmentStatus } from '@/lib/actions/appointments'
import { toast } from 'sonner'
import { Calendar, User, Clock, Trash2, CheckCircle2, XCircle, AlertCircle, CreditCard } from 'lucide-react'

interface Appointment {
  id: string
  patientId: string
  doctorId: string
  dateTime: Date
  status: string
  reason: string
  doctor: { name: string | null; email: string }
  patient: { name: string | null; email: string }
}

interface AppointmentListProps {
  initialAppointments: Appointment[]
  userRole: 'patient' | 'doctor' | 'admin'
}

export default function AppointmentList({ initialAppointments, userRole }: AppointmentListProps) {
  const [isPending, startTransition] = useTransition()
  const [isPaying, setIsPaying] = React.useState<string | null>(null)

  const handlePay = async (appointmentId: string) => {
    setIsPaying(appointmentId)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Payment initialization failed')
        setIsPaying(null)
      }
    } catch (err) {
      toast.error('Network error during checkout')
      setIsPaying(null)
    }
  }

  const handleCancel = (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return

    startTransition(async () => {
      const result = await cancelAppointment(id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Appointment cancelled successfully.')
      }
    })
  }

  const handleUpdateStatus = (id: string, newStatus: string) => {
    startTransition(async () => {
      const result = await updateAppointmentStatus(id, newStatus)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Appointment marked as ${newStatus.toLowerCase()}.`)
      }
    })
  }

  const getStatusStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          icon: CheckCircle2,
        }
      case 'CANCELLED':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-100',
          icon: XCircle,
        }
      case 'PENDING':
      default:
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-100',
          icon: AlertCircle,
        }
    }
  }

  if (initialAppointments.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-md flex flex-col items-center justify-center min-h-[300px]">
        <Calendar className="h-12 w-12 text-slate-300 mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-800">No appointments scheduled</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          {userRole === 'doctor'
            ? "You don't have any appointments booked with patients yet."
            : 'Book a new session with one of our medical experts to get started.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {initialAppointments.map((appt) => {
        const { bg, icon: StatusIcon } = getStatusStyle(appt.status)
        const displayDate = new Date(appt.dateTime).toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
        const displayTime = new Date(appt.dateTime).toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        })

        const displayPartner =
          userRole === 'doctor'
            ? `Patient: ${appt.patient.name || appt.patient.email}`
            : `Dr. ${appt.doctor.name || appt.doctor.email}`

        return (
          <div
            key={appt.id}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md"
          >
            <div className="space-y-2 min-w-0">
              {/* Partner name */}
              <div className="flex items-center gap-2 font-bold text-slate-800 text-base">
                <User className="h-4.5 w-4.5 text-indigo-500 flex-shrink-0" />
                <span className="truncate">{displayPartner}</span>
              </div>

              {/* Date/Time */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>{displayDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>{displayTime}</span>
                </div>
              </div>

              {/* Reason */}
              <div className="text-sm text-slate-600 pl-6 border-l-2 border-indigo-100 italic">
                "{appt.reason}"
              </div>
            </div>

            {/* Actions & Status */}
            <div className="flex items-center gap-3 self-end sm:self-center">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${bg}`}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {appt.status}
              </span>

              {appt.status.toUpperCase() !== 'CANCELLED' && appt.status.toUpperCase() !== 'COMPLETED' && (
                <button
                  onClick={() => handleCancel(appt.id)}
                  disabled={isPending || isPaying === appt.id}
                  title="Cancel Appointment"
                  className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-100 disabled:opacity-50"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              )}
            </div>
            
            {/* Doctor Actions */}
            {userRole === 'doctor' && appt.status.toUpperCase() === 'PENDING' && (
              <div className="w-full sm:w-auto mt-2 sm:mt-0 flex gap-2 justify-end">
                <button
                  onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')}
                  disabled={isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                >
                  Confirm
                </button>
                <button
                  onClick={() => handleUpdateStatus(appt.id, 'CANCELLED')}
                  disabled={isPending}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                >
                  Decline
                </button>
              </div>
            )}
            
            {userRole === 'doctor' && appt.status.toUpperCase() === 'CONFIRMED' && (
              <div className="w-full sm:w-auto mt-2 sm:mt-0 flex justify-end">
                <button
                  onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                  disabled={isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                >
                  Mark Completed
                </button>
              </div>
            )}
            {/* Pay Now Button row below actions on mobile, or inline on desktop */}
            {userRole === 'patient' && appt.status.toUpperCase() === 'PENDING' && (
              <div className="w-full sm:w-auto mt-2 sm:mt-0 flex justify-end">
                <button
                  onClick={() => handlePay(appt.id)}
                  disabled={isPaying === appt.id}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-200"
                >
                  <CreditCard className="h-4 w-4" />
                  {isPaying === appt.id ? 'Processing...' : 'Pay Now'}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
