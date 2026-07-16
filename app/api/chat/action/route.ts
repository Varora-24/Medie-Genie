import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { auth } from '@/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ── Rate Limiting (in-memory, per-user) ──────────────────────────────
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX = 15 // 15 requests per minute

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(userId) || []
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  rateLimitMap.set(userId, recent)
  if (recent.length >= RATE_LIMIT_MAX) return true
  recent.push(now)
  return false
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // CRITICAL SECURITY REQUIREMENT: Derive the acting patient's `id` strictly from the current server-side session at confirmation time.
  const userId = (session.user as any).id

  if (isRateLimited(userId)) {
    return NextResponse.json(
      { error: 'You are sending requests too quickly. Please wait a moment and try again.' },
      { status: 429 }
    )
  }

  try {
    const { messageId, sessionId, toolName, args } = await req.json()

    if (!messageId || !sessionId || !toolName || !args) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Verify session ownership
    const chatSession = await db.chatSession.findUnique({ where: { id: sessionId } })
    if (!chatSession || chatSession.patientId !== userId) {
      return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 })
    }

    // Idempotency check: verify the message hasn't been actioned yet
    const msg = await db.chatMessage.findUnique({ where: { id: messageId } })
    if (!msg) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }
    try {
      const parsed = JSON.parse(msg.content)
      if (parsed.type !== 'TOOL_CALL_PENDING') {
        return NextResponse.json({ error: 'This action has already been processed.' }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid message content' }, { status: 400 })
    }

    let resultMessage = ''

    if (toolName === 'create_reminder') {
      const { title, type, dueDate } = args
      
      const parsedDate = new Date(dueDate)
      if (isNaN(parsedDate.getTime()) || parsedDate < new Date()) {
         return NextResponse.json({ error: 'The requested date is in the past or invalid. Please request a future date.' }, { status: 400 })
      }

      await db.reminder.create({
        data: {
          userId,
          title,
          type,
          scheduleTime: parsedDate
        }
      })
      resultMessage = 'Successfully created the reminder.'
    } else if (toolName === 'book_appointment') {
      const { doctorId, dateTime, reason } = args
      
      const parsedDate = new Date(dateTime)
      if (isNaN(parsedDate.getTime()) || parsedDate < new Date()) {
         return NextResponse.json({ error: 'The requested date is in the past or invalid. Please request a future date.' }, { status: 400 })
      }
      
      // Verify doctor exists
      const doctor = await db.user.findUnique({ where: { id: doctorId, role: 'doctor' } })
      if (!doctor) {
         return NextResponse.json({ error: 'Doctor not found.' }, { status: 404 })
      }

      await db.appointment.create({
        data: {
          patientId: userId,
          doctorId,
          dateTime: parsedDate,
          reason,
          status: 'PENDING'
        }
      })
      resultMessage = 'Successfully booked the appointment.'
    } else {
      return NextResponse.json({ error: 'Invalid tool name' }, { status: 400 })
    }

    // Update the message in the DB so it's no longer pending
    await db.chatMessage.update({
      where: { id: messageId },
      data: { content: JSON.stringify({ type: 'TOOL_CALL_ACTIONED', name: toolName, args }) }
    })

    // Send the result to Gemini so it can generate a final response
    const history = await db.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 20,
      select: { senderRole: true, content: true },
    })

    // Filter out the JSON tool call from history if needed, or pass it as model
    const historyExceptLast = history.map((msg) => ({
      role: msg.senderRole === 'PATIENT' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }))

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' })

    let aiReplyText = ''
    try {
      const chat = model.startChat({
        history: historyExceptLast,
        generationConfig: { maxOutputTokens: 1024 },
      })

      // Send the tool response
      const toolResult = await chat.sendMessage([{ functionResponse: { name: toolName, response: { success: true, message: resultMessage } } }])
      aiReplyText = toolResult.response.text()
    } catch (apiError) {
      console.error('Gemini API error during tool confirmation:', apiError)
      aiReplyText = "✅ Action completed successfully."
    }

    // Save final AI response
    await db.chatMessage.create({
      data: {
        sessionId,
        senderRole: 'AI',
        content: aiReplyText,
        flagged: false,
      },
    })

    return NextResponse.json({ success: true, reply: aiReplyText })
  } catch (error: any) {
    console.error('Action route error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
