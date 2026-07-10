'use server'

import db from '@/lib/db'
import { auth } from '@/auth'

export async function getPrescriptions() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = (session.user as any).id
  const role = (session.user as any).role

  try {
    return await db.prescription.findMany({
      where: role === 'doctor' ? { doctorId: userId } : { patientId: userId },
      include: {
        doctor: { select: { name: true, email: true } },
        patient: { select: { name: true, email: true } },
      },
      orderBy: { startDate: 'desc' },
    })
  } catch (error) {
    console.error('Error fetching prescriptions:', error)
    return []
  }
}

export async function createPrescription(patientId: string, medication: string, dosage: string, frequency: string, instructions: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  
  const doctorId = (session.user as any).id
  const userRole = (session.user as any).role
  
  if (userRole !== 'doctor') {
    return { error: 'Forbidden: Doctor access required' }
  }

  const { verifyDoctorAccess } = await import('@/lib/actions/notes')

  try {
    await verifyDoctorAccess(doctorId, patientId)
  } catch (err: any) {
    return { error: err.message }
  }

  try {
    await db.prescription.create({
      data: {
        patientId,
        doctorId,
        medication,
        dosage,
        frequency,
        instructions,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)) // default 1 month
      }
    })

    const { revalidatePath } = await import('next/cache')
    revalidatePath(`/dashboard/patients/${patientId}`)
    revalidatePath('/dashboard/prescriptions')
    return { success: true }
  } catch (err) {
    console.error('Error creating prescription:', err)
    return { error: 'Failed to create prescription' }
  }
}
