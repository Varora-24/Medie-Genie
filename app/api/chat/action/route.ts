import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { auth } from '@/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // CRITICAL SECURITY REQUIREMENT: Derive the acting patient's `id` strictly from the current server-side session at confirmation time.
  const userId = (session.user as any).id

  try {
    const { sessionId, toolName, args } = await req.json()

    if (!sessionId || !toolName || !args) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Verify session ownership
    const chatSession = await db.chatSession.findUnique({ where: { id: sessionId } })
    if (!chatSession || chatSession.patientId !== userId) {
      return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 })
    }

    let resultMessage = ''

    if (toolName === 'create_reminder') {
      const { title, type, dueDate } = args
      await db.reminder.create({
        data: {
          userId,
          title,
          type,
          scheduleTime: new Date(dueDate)
        }
      })
      resultMessage = 'Successfully created the reminder.'
    } else if (toolName === 'book_appointment') {
      const { doctorId, dateTime, reason } = args
      
      // Verify doctor exists
      const doctor = await db.user.findUnique({ where: { id: doctorId, role: 'doctor' } })
      if (!doctor) {
         return NextResponse.json({ error: 'Doctor not found.' }, { status: 404 })
      }

      await db.appointment.create({
        data: {
          patientId: userId,
          doctorId,
          dateTime: new Date(dateTime),
          reason,
          status: 'PENDING'
        }
      })
      resultMessage = 'Successfully booked the appointment.'
    } else {
      return NextResponse.json({ error: 'Invalid tool name' }, { status: 400 })
    }

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
