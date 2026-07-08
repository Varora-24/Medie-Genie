'use server'

import db from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://huednspoofanbpkiumvf.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function getMedicalRecords() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = (session.user as any).id
  const role = (session.user as any).role

  try {
    return await db.medicalRecord.findMany({
      where: role === 'doctor' ? { doctorId: userId } : { patientId: userId },
      include: {
        doctor: { select: { name: true, email: true } },
        patient: { select: { name: true, email: true } },
      },
      orderBy: { recordDate: 'desc' },
    })
  } catch (error) {
    console.error('Error fetching medical records:', error)
    return []
  }
}

export async function uploadMedicalRecord(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  const userId = (session.user as any).id

  const title = formData.get('title') as string
  const type = formData.get('type') as string
  const description = formData.get('description') as string
  const recordDateStr = formData.get('recordDate') as string
  const doctorId = formData.get('doctorId') as string
  const file = formData.get('file') as File | null

  if (!title || !type || !recordDateStr || !doctorId || !file || file.size === 0) {
    return { error: 'All fields including a valid file are required.' }
  }

  try {
    // 1. Upload file to Supabase Storage via REST API
    const fileExtension = file.name.split('.').pop() || 'dat'
    const uniqueFilename = `${userId}_${Date.now()}.${fileExtension}`
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/medical-records/${uniqueFilename}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: buffer,
    })

    if (!uploadResponse.ok) {
      const errorMsg = await uploadResponse.text()
      console.error('Supabase upload failed:', errorMsg)
      return { error: `Failed to upload file to storage: ${errorMsg}` }
    }

    const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/medical-records/${uniqueFilename}`

    // 2. Create database entry
    await db.medicalRecord.create({
      data: {
        patientId: userId,
        doctorId,
        type,
        title,
        description,
        fileUrl,
        recordDate: new Date(recordDateStr),
      },
    })

    revalidatePath('/dashboard/records')
    return { success: true }
  } catch (error: any) {
    console.error('Error uploading medical record:', error)
    return { error: error.message || 'Failed to upload medical record.' }
  }
}
