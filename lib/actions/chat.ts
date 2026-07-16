'use server'

import db from '@/lib/db'
import { auth } from '@/auth'

export async function getChatSessions() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = (session.user as any).id

  try {
    return await db.chatSession.findMany({
      where: { patientId: userId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
  } catch (error) {
    console.error('Error fetching chat sessions:', error)
    return []
  }
}

export async function getChatMessages(sessionId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = (session.user as any).id

  try {
    // Verify ownership
    const chatSession = await db.chatSession.findUnique({
      where: { id: sessionId },
    })
    if (!chatSession || chatSession.patientId !== userId) {
      return []
    }

    return await db.chatMessage.findMany({
      where: { sessionId },
      select: {
        id: true,
        senderRole: true,
        content: true,
        flagged: true,
        attachmentUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return []
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://huednspoofanbpkiumvf.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function uploadChatAttachment(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  const userId = (session.user as any).id

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) {
    return { error: 'Valid file is required.' }
  }

  // File size validation (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'File size exceeds 5MB limit.' }
  }

  // File type validation based on mime type
  if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
    return { error: 'Only JPG, PNG, WEBP, and PDF files are allowed.' }
  }

  try {
    const fileExtension = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'dat'
    const uniqueFilename = `${userId}/${Date.now()}.${fileExtension}`
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/chat-attachments/${uniqueFilename}`

    const arrayBuffer = await file.arrayBuffer()
    
    // Server-side magic bytes validation could go here if extremely strict, 
    // but verifying mime-type from FormData is usually adequate for general protection alongside standard constraints.
    // To strictly verify magic bytes for JPEG: 
    // const bytes = new Uint8Array(arrayBuffer.slice(0, 4));
    // if (file.type === 'image/jpeg' && (bytes[0] !== 0xFF || bytes[1] !== 0xD8 || bytes[2] !== 0xFF)) { return { error: 'Invalid JPEG' } }

    const buffer = Buffer.from(arrayBuffer)

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': file.type,
      },
      body: buffer,
    })

    if (!uploadResponse.ok) {
      const errorMsg = await uploadResponse.text()
      console.error('Supabase upload failed:', errorMsg)
      return { error: `Failed to upload file to storage.` }
    }

    const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/chat-attachments/${uniqueFilename}`
    return { success: true, url: fileUrl }
  } catch (error: any) {
    console.error('Error uploading chat attachment:', error)
    return { error: error.message || 'Failed to upload chat attachment.' }
  }
}
