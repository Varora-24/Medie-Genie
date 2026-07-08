'use server'

import db from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function getDoctors() {
  try {
    return await db.user.findMany({
      where: { role: 'doctor' },
      select: { id: true, name: true, email: true },
    })
  } catch (error) {
    console.error('Error fetching doctors:', error)
    return []
  }
}

export async function getAppointments() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = (session.user as any).id
  const role = (session.user as any).role

  try {
    return await db.appointment.findMany({
      where: role === 'doctor' ? { doctorId: userId } : { patientId: userId },
      include: {
        doctor: { select: { name: true, email: true } },
        patient: { select: { name: true, email: true } },
      },
      orderBy: { dateTime: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return []
  }
}

export async function bookAppointment(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  const userId = (session.user as any).id

  const doctorId = formData.get('doctorId') as string
  const dateTimeStr = formData.get('dateTime') as string
  const reason = formData.get('reason') as string

  if (!doctorId || !dateTimeStr || !reason) {
    return { error: 'All fields are required.' }
  }

  try {
    await db.appointment.create({
      data: {
        patientId: userId,
        doctorId,
        dateTime: new Date(dateTimeStr),
        reason,
        status: 'PENDING',
      },
    })
    revalidatePath('/dashboard/appointments')
    return { success: true }
  } catch (error: any) {
    console.error('Error booking appointment:', error)
    return { error: error.message || 'Failed to book appointment.' }
  }
}

export async function cancelAppointment(id: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  const userId = (session.user as any).id
  const role = (session.user as any).role

  try {
    const appointment = await db.appointment.findUnique({ where: { id } })
    if (!appointment) return { error: 'Appointment not found.' }

    // Check ownership
    if (appointment.patientId !== userId && appointment.doctorId !== userId && role !== 'admin') {
      return { error: 'Unauthorized to cancel this appointment.' }
    }

    await db.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })
    revalidatePath('/dashboard/appointments')
    return { success: true }
  } catch (error: any) {
    console.error('Error cancelling appointment:', error)
    return { error: error.message || 'Failed to cancel appointment.' }
  }
}
