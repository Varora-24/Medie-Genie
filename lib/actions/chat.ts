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
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return []
  }
}
