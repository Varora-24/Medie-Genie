'use server'

import db from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function getEmergencyContacts() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const userId = (session.user as any).id

  const contacts = await db.emergencyContact.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
  return contacts
}

export async function addEmergencyContact(data: { name: string; relation: string; phone: string }) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const userId = (session.user as any).id

  const count = await db.emergencyContact.count({ where: { userId } })
  if (count >= 5) {
    throw new Error('Maximum of 5 emergency contacts allowed')
  }

  await db.emergencyContact.create({
    data: {
      userId,
      name: data.name,
      relation: data.relation,
      phone: data.phone,
    },
  })

  revalidatePath('/dashboard/emergency-contacts')
  revalidatePath('/dashboard')
}

export async function updateEmergencyContact(id: string, data: { name: string; relation: string; phone: string }) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const userId = (session.user as any).id

  const contact = await db.emergencyContact.findUnique({ where: { id } })
  if (!contact || contact.userId !== userId) {
    throw new Error('Not found or unauthorized')
  }

  await db.emergencyContact.update({
    where: { id },
    data: {
      name: data.name,
      relation: data.relation,
      phone: data.phone,
    },
  })

  revalidatePath('/dashboard/emergency-contacts')
  revalidatePath('/dashboard')
}

export async function deleteEmergencyContact(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const userId = (session.user as any).id

  const contact = await db.emergencyContact.findUnique({ where: { id } })
  if (!contact || contact.userId !== userId) {
    throw new Error('Not found or unauthorized')
  }

  await db.emergencyContact.delete({ where: { id } })

  revalidatePath('/dashboard/emergency-contacts')
  revalidatePath('/dashboard')
}
