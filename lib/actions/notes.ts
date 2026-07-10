'use server'

import db from '@/lib/db'
import { auth } from '@/auth'
import { encryptNote, decryptNote } from '@/lib/encryption'
import { revalidatePath } from 'next/cache'

async function verifyDoctorAccess(doctorId: string, patientId: string) {
  // Check if doctor has any appointment with this patient
  const appointment = await db.appointment.findFirst({
    where: {
      doctorId,
      patientId
    }
  })

  if (!appointment) {
    throw new Error('Unauthorized: No clinical relationship with this patient')
  }
}

export async function getDoctorPatients() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  
  const userId = (session.user as any).id
  const userRole = (session.user as any).role
  
  if (userRole !== 'doctor') {
    throw new Error('Forbidden: Doctor access required')
  }

  // Find all unique patients this doctor has appointments with
  const appointments = await db.appointment.findMany({
    where: { doctorId: userId },
    select: { patient: { select: { id: true, name: true, email: true } } }
  })

  // Deduplicate
  const patientMap = new Map()
  appointments.forEach(a => {
    patientMap.set(a.patient.id, a.patient)
  })

  return Array.from(patientMap.values())
}

export async function getPatientNotes(patientId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  
  const doctorId = (session.user as any).id
  const userRole = (session.user as any).role
  
  if (userRole !== 'doctor' && userRole !== 'admin') {
    throw new Error('Forbidden: Clinical access required')
  }

  if (userRole === 'doctor') {
    await verifyDoctorAccess(doctorId, patientId)
  }

  const notes = await db.doctorNote.findMany({
    where: { patientId },
    include: { doctor: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  })

  // Decrypt notes server-side before sending to client
  return notes.map(note => {
    try {
      const plaintext = decryptNote(note.encryptedContent, note.iv)
      return {
        id: note.id,
        content: plaintext,
        createdAt: note.createdAt,
        authorName: note.doctor.name || 'Unknown Doctor'
      }
    } catch (err) {
      console.error('Failed to decrypt note', note.id)
      return {
        id: note.id,
        content: '[ENCRYPTED DATA CORRUPTED OR KEY INVALID]',
        createdAt: note.createdAt,
        authorName: note.doctor.name || 'Unknown Doctor'
      }
    }
  })
}

export async function addDoctorNote(patientId: string, content: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  
  const doctorId = (session.user as any).id
  const userRole = (session.user as any).role
  
  if (userRole !== 'doctor') {
    return { error: 'Forbidden: Doctor access required' }
  }

  try {
    await verifyDoctorAccess(doctorId, patientId)
  } catch (err: any) {
    return { error: err.message }
  }

  try {
    const { encryptedContent, iv } = encryptNote(content)
    
    await db.doctorNote.create({
      data: {
        patientId,
        doctorId,
        encryptedContent,
        iv
      }
    })

    revalidatePath(`/dashboard/patients/${patientId}`)
    return { success: true }
  } catch (err) {
    console.error('Error adding note:', err)
    return { error: 'Failed to securely save note' }
  }
}
