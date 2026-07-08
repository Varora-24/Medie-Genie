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
