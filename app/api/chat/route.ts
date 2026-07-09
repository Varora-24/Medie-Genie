import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import db from '@/lib/db'
import { auth } from '@/auth'

// ── Rate Limiting (in-memory, per-user) ──────────────────────────────
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX = 15 // 15 messages per minute

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(userId) || []
  // Keep only timestamps within the window
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  rateLimitMap.set(userId, recent)

  if (recent.length >= RATE_LIMIT_MAX) {
    return true
  }
  recent.push(now)
  return false
}

// ── Emergency Detection ──────────────────────────────────────────────
const EMERGENCY_TERMS = [
  'chest pain',
  'chest pressure',
  "can't breathe",
  'cannot breathe',
  'cant breathe',
  'difficulty breathing',
  'hard to breathe',
  'shortness of breath',
  'severe bleeding',
  'uncontrollable bleeding',
  'heavy bleeding',
  'stroke',
  'sudden numbness',
  'trouble speaking',
  'suicidal',
  'suicide',
  'kill myself',
  'self-harm',
  'self harm',
  'want to die',
  'end my life',
  'unconscious',
  'lost consciousness',
  'passed out',
  'anaphylaxis',
  'allergic reaction',
  'throat closing',
  'throat swelling',
]

function userMessageContainsEmergency(message: string): boolean {
  const lower = message.toLowerCase()
  return EMERGENCY_TERMS.some((term) => lower.includes(term))
}

const EMERGENCY_MARKER = '⚠️ EMERGENCY'
const HARDCODED_SAFETY_PREFIX =
  '⚠️ EMERGENCY: Based on what you\'ve described, this could be a medical emergency. Please seek emergency medical care immediately. Call your local emergency services (e.g. 911) right now. Do not wait.\n\n---\n\n'

// ── System Prompt ────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a medical triage assistant for the Medie Genie patient portal.

RULES YOU MUST FOLLOW:
1. NEVER diagnose a condition definitively. Only discuss possible general causes and suggest next steps.
2. NEVER recommend specific drug dosages or prescription medications. You may mention drug classes in general terms only.
3. ALWAYS recommend seeing a real doctor for anything beyond general guidance.
4. For ANY of the following symptoms, you MUST tell the user to seek emergency care IMMEDIATELY by calling their local emergency services (e.g. 911):
   - Chest pain or pressure
   - Difficulty breathing or shortness of breath
   - Severe or uncontrollable bleeding
   - Signs of stroke (sudden numbness, confusion, trouble speaking, severe headache)
   - Suicidal thoughts or self-harm ideation
   - Loss of consciousness
   - Severe allergic reaction (anaphylaxis)
   When any emergency symptom is detected, begin your response with EXACTLY: "⚠️ EMERGENCY: Based on what you've described, please seek emergency medical care immediately. Call your local emergency services (e.g. 911) right now."
5. Be empathetic, clear, and concise. Use plain language, not medical jargon.
6. If asked about topics outside of health/medical, politely redirect to health-related questions.`

// ── POST Handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id

  // 2. Rate limit check
  if (isRateLimited(userId)) {
    return NextResponse.json(
      {
        error:
          'You are sending messages too quickly. Please wait a moment and try again (limit: 15 messages per minute).',
      },
      { status: 429 }
    )
  }

  // 3. Parse body
  let message: string
  let sessionId: string | undefined
  try {
    const body = await req.json()
    message = body.message
    sessionId = body.sessionId
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
  }

  const trimmedMessage = message.trim()

  // 4. Check if user's message contains emergency terms (backup safety check)
  const userMessageIsEmergency = userMessageContainsEmergency(trimmedMessage)

  try {
    // 5. Create or retrieve session
    let chatSessionId = sessionId
    if (!chatSessionId) {
      const title = trimmedMessage.length > 50 ? trimmedMessage.slice(0, 50) + '…' : trimmedMessage
      const newSession = await db.chatSession.create({
        data: { patientId: userId, title },
      })
      chatSessionId = newSession.id
    } else {
      // Verify ownership
      const existing = await db.chatSession.findUnique({ where: { id: chatSessionId } })
      if (!existing || existing.patientId !== userId) {
        return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
      }
    }

    // 6. Save patient message
    await db.chatMessage.create({
      data: {
        sessionId: chatSessionId,
        senderRole: 'PATIENT',
        content: trimmedMessage,
        flagged: false,
      },
    })

    // 7. Build conversation history (last 20 messages for context window)
    const history = await db.chatMessage.findMany({
      where: { sessionId: chatSessionId },
      orderBy: { createdAt: 'asc' },
      take: 20,
      select: { senderRole: true, content: true },
    })

    // Convert history to Gemini format. (Ignore the current patient message we just saved, we'll send it as the prompt)
    // Wait, if we just saved it, it's in the `history`. Let's pop it off, or just pass history except the last one, and send the last one as the main message.
    // Actually, `chat.sendMessage(msg)` takes the history up to the message, then the new message.
    const historyExceptLast = history.slice(0, -1).map((msg) => ({
      role: msg.senderRole === 'PATIENT' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }))

    // 8. Call Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    })

    let aiReplyText: string
    try {
      const chat = model.startChat({
        history: historyExceptLast,
        generationConfig: {
          maxOutputTokens: 1024,
        },
      })

      const result = await chat.sendMessage(trimmedMessage)
      aiReplyText = result.response.text()
    } catch (apiError: any) {
      console.error('Gemini API error:', apiError)

      // Handle Gemini safety blocks specifically (if it throws due to safety filters)
      if (apiError.message?.includes('SAFETY')) {
         aiReplyText = "I apologize, but I cannot fulfill this request due to safety guidelines. Please consult a healthcare professional for medical advice."
      } else {
         return NextResponse.json(
           {
             error: 'The AI service is temporarily unavailable. Please try again in a moment.',
             sessionId: chatSessionId,
           },
           { status: 502 }
         )
      }
    }

    // 9. Determine flagged status
    //    Primary: does the AI response start with the emergency marker?
    const aiStartsWithEmergency = aiReplyText.trim().startsWith(EMERGENCY_MARKER)
    let flagged = aiStartsWithEmergency

    //    Backup: user's message contains emergency terms but AI didn't flag it
    if (userMessageIsEmergency && !aiStartsWithEmergency) {
      flagged = true
      aiReplyText = HARDCODED_SAFETY_PREFIX + aiReplyText
    }

    // 10. Save AI response
    await db.chatMessage.create({
      data: {
        sessionId: chatSessionId,
        senderRole: 'AI',
        content: aiReplyText,
        flagged,
      },
    })

    // Update session timestamp
    await db.chatSession.update({
      where: { id: chatSessionId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({
      reply: aiReplyText,
      sessionId: chatSessionId,
      flagged,
    })
  } catch (error: any) {
    console.error('Chat route error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
