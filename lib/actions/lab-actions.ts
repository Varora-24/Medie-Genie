'use server'

import db from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function getLabServices(category?: string) {
  const where: any = {}
  if (category && category !== 'All') {
    where.category = category
  }
  return await db.labService.findMany({
    where,
    orderBy: { name: 'asc' },
  })
}

export async function getPatientLabBookings() {
  const session = await auth()
  if (!session?.user?.id) return []

  return await db.labBooking.findMany({
    where: { patientId: session.user.id },
    include: { service: true },
    orderBy: { scheduledAt: 'desc' },
  })
}

export async function createLabBooking({
  serviceId,
  visitType,
  address,
  scheduledAt,
  notes,
}: {
  serviceId: string
  visitType: 'HOME' | 'LAB'
  address?: string
  scheduledAt: string
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized. Please sign in.' }
  }

  try {
    const parsedDate = new Date(scheduledAt)
    if (isNaN(parsedDate.getTime()) || parsedDate < new Date()) {
      return { success: false, error: 'Invalid or past date specified for booking.' }
    }

    const service = await db.labService.findUnique({
      where: { id: serviceId },
    })
    if (!service) {
      return { success: false, error: 'Lab service not found.' }
    }

    if (visitType === 'HOME' && !service.homeVisitAvailable) {
      return { success: false, error: 'Home visit is not available for this service.' }
    }
    if (visitType === 'LAB' && !service.labVisitAvailable) {
      return { success: false, error: 'Lab visit is not available for this service.' }
    }
    if (visitType === 'HOME' && !address?.trim()) {
      return { success: false, error: 'An address is required for home sample collection.' }
    }

    const booking = await db.labBooking.create({
      data: {
        patientId: session.user.id,
        serviceId,
        visitType,
        address: visitType === 'HOME' ? address : null,
        scheduledAt: parsedDate,
        notes,
        status: 'CONFIRMED', // Immediately confirmed or pending as needed
      },
      include: { service: true },
    })

    revalidatePath('/dashboard/lab-services')
    revalidatePath('/dashboard')
    return { success: true, booking }
  } catch (error: any) {
    console.error('Error creating lab booking:', error)
    return { success: false, error: error.message || 'An unexpected error occurred.' }
  }
}

export async function getAllLabBookings() {
  const session = await auth()
  if ((session?.user as any)?.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  return await db.labBooking.findMany({
    include: {
      service: true,
      patient: { select: { name: true, email: true, phone: true } },
    },
    orderBy: { scheduledAt: 'desc' },
  })
}

export async function updateLabBookingStatus(bookingId: string, status: string) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'admin') {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const updated = await db.labBooking.update({
      where: { id: bookingId },
      data: { status },
    })
    revalidatePath('/dashboard/manage-labs')
    revalidatePath('/dashboard')
    return { success: true, booking: updated }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update status' }
  }
}

export async function createLabService({
  name,
  category,
  description,
  homeVisitAvailable,
  labVisitAvailable,
}: {
  name: string
  category: string
  description?: string
  homeVisitAvailable: boolean
  labVisitAvailable: boolean
}) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'admin') {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const created = await db.labService.create({
      data: {
        name,
        category,
        description,
        homeVisitAvailable,
        labVisitAvailable,
      },
    })
    revalidatePath('/dashboard/manage-labs')
    revalidatePath('/dashboard/lab-services')
    return { success: true, service: created }
  } catch (error: any) {
    return { success: false, error: 'Failed to create service' }
  }
}

export async function deleteLabService(id: string) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'admin') {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    await db.labService.delete({ where: { id } })
    revalidatePath('/dashboard/manage-labs')
    revalidatePath('/dashboard/lab-services')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Failed to delete service' }
  }
}
