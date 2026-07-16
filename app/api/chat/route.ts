import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, FunctionDeclaration, Schema, SchemaType } from '@google/generative-ai'
import db from '@/lib/db'
import { auth } from '@/auth'

// ── Rate Limiting (in-memory, per-user) ──────────────────────────────
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX = 15 // 15 messages per minute

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(userId) || []
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  rateLimitMap.set(userId, recent)
  if (recent.length >= RATE_LIMIT_MAX) return true
  recent.push(now)
  return false
}

// ── Emergency Detection ──────────────────────────────────────────────
const EMERGENCY_TERMS = [
  'chest pain', 'chest pressure', "can't breathe", 'cannot breathe',
  'cant breathe', 'difficulty breathing', 'hard to breathe', 'shortness of breath',
  'severe bleeding', 'uncontrollable bleeding', 'heavy bleeding', 'stroke',
  'sudden numbness', 'trouble speaking', 'suicidal', 'suicide', 'kill myself',
  'self-harm', 'self harm', 'want to die', 'end my life', 'unconscious',
  'lost consciousness', 'passed out', 'anaphylaxis', 'allergic reaction',
  'throat closing', 'throat swelling',
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
   - Signs of stroke
   - Suicidal thoughts
   - Loss of consciousness
   - Severe allergic reaction (anaphylaxis)
   When any emergency symptom is detected, begin your response with EXACTLY: "⚠️ EMERGENCY: Based on what you've described, please seek emergency medical care immediately. Call your local emergency services (e.g. 911) right now."
5. Be empathetic, clear, and concise. Use plain language, not medical jargon.
6. If asked about topics outside of health/medical, politely redirect to health-related questions.
7. You have access to tools to book appointments, create reminders, check available doctors, and get emergency contacts. Use them when appropriate.`

// ── Tool Declarations ────────────────────────────────────────────────
const createReminderDecl: FunctionDeclaration = {
  name: 'create_reminder',
  description: 'Proposes creating a reminder for the logged-in patient. Requires user confirmation.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING, description: 'Title of the reminder.' },
      type: { type: SchemaType.STRING, description: 'Type of the reminder (MEDICATION, APPOINTMENT, GENERAL).' },
      dueDate: { type: SchemaType.STRING, description: 'ISO 8601 string representing the due date and time.' },
    },
    required: ['title', 'type', 'dueDate'],
  }
}

const listAvailableDoctorsDecl: FunctionDeclaration = {
  name: 'list_available_doctors',
  description: 'Queries real doctor Users, optionally filtered by specialty.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      specialty: { type: SchemaType.STRING, description: 'Optional specialty to filter doctors by.' },
    }
  }
}

const bookAppointmentDecl: FunctionDeclaration = {
  name: 'book_appointment',
  description: 'Proposes an appointment to book with a doctor. Requires user confirmation.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      doctorId: { type: SchemaType.STRING, description: 'ID of the doctor to book with.' },
      dateTime: { type: SchemaType.STRING, description: 'ISO 8601 string of the appointment date and time.' },
      reason: { type: SchemaType.STRING, description: 'Reason for the appointment.' },
    },
    required: ['doctorId', 'dateTime', 'reason'],
  }
}

const getEmergencyContactsDecl: FunctionDeclaration = {
  name: 'get_emergency_contacts',
  description: 'Returns the patient\'s saved emergency contacts.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {}
  }
}

const findNearbyCareDecl: FunctionDeclaration = {
  name: 'find_nearby_care',
  description: 'Finds nearby hospitals, clinics, or pharmacies using OpenStreetMap.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      facilityType: { type: SchemaType.STRING, description: 'Type of facility to find (e.g. hospital, clinic, pharmacy). Defaults to hospital.' },
      address: { type: SchemaType.STRING, description: 'Address or location name to search near. If missing, defaults to a test location.' }
    }
  }
}

// ── POST Handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id

  if (isRateLimited(userId)) {
    return NextResponse.json(
      { error: 'You are sending messages too quickly. Please wait a moment and try again.' },
      { status: 429 }
    )
  }

  let message: string
  let sessionId: string | undefined
  let attachmentUrl: string | undefined
  try {
    const body = await req.json()
    message = body.message
    sessionId = body.sessionId
    attachmentUrl = body.attachmentUrl
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
  }

  const trimmedMessage = message.trim()
  const userMessageIsEmergency = userMessageContainsEmergency(trimmedMessage)

  try {
    let chatSessionId = sessionId
    if (!chatSessionId) {
      const title = trimmedMessage.length > 50 ? trimmedMessage.slice(0, 50) + '…' : trimmedMessage
      const newSession = await db.chatSession.create({ data: { patientId: userId, title } })
      chatSessionId = newSession.id
    } else {
      const existing = await db.chatSession.findUnique({ where: { id: chatSessionId } })
      if (!existing || existing.patientId !== userId) {
        return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
      }
    }

    // Save patient message
    await db.chatMessage.create({
      data: { sessionId: chatSessionId, senderRole: 'PATIENT', content: trimmedMessage, flagged: false, attachmentUrl },
    })

    // Fetch history
    const history = await db.chatMessage.findMany({
      where: { sessionId: chatSessionId },
      orderBy: { createdAt: 'asc' },
      take: 20,
      select: { senderRole: true, content: true },
    })

    const historyExceptLast = history.slice(0, -1).map((msg) => ({
      role: msg.senderRole === 'PATIENT' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }))

    // Build the current message parts
    const currentMessageParts: any[] = [{ text: trimmedMessage }]
    
    if (attachmentUrl) {
      try {
        const fileRes = await fetch(attachmentUrl, {
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          }
        })
        if (fileRes.ok) {
          const buffer = await fileRes.arrayBuffer()
          const base64 = Buffer.from(buffer).toString('base64')
          const mimeType = fileRes.headers.get('content-type') || 'application/octet-stream'
          currentMessageParts.push({
            inlineData: {
              data: base64,
              mimeType
            }
          })
        }
      } catch (err) {
        console.error('Failed to fetch attachment for Gemini:', err)
      }
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      systemInstruction: SYSTEM_PROMPT,
      tools: [{
        functionDeclarations: [
          createReminderDecl,
          listAvailableDoctorsDecl,
          bookAppointmentDecl,
          getEmergencyContactsDecl,
          findNearbyCareDecl
        ]
      }]
    })

    let aiReplyText = ''
    let isPendingTool = false

    try {
      const chat = model.startChat({
        history: historyExceptLast,
        generationConfig: { maxOutputTokens: 1024 },
      })

      const result = await chat.sendMessage(currentMessageParts)
      
      const functionCalls = result.response.functionCalls()
      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0]
        
        // Handle read-only tools
        if (call.name === 'list_available_doctors') {
          const specialty = (call.args as any).specialty
          const whereClause = specialty ? { role: 'doctor', specialty: { contains: specialty, mode: 'insensitive' } } : { role: 'doctor' }
          const doctors = await db.user.findMany({ where: whereClause as any, select: { id: true, name: true, specialty: true } })
          const toolResult = await chat.sendMessage([{ functionResponse: { name: call.name, response: { doctors } } }])
          aiReplyText = toolResult.response.text()
        } 
        else if (call.name === 'get_emergency_contacts') {
          const contacts = await db.emergencyContact.findMany({ where: { userId }, select: { name: true, relation: true, phone: true } })
          const toolResult = await chat.sendMessage([{ functionResponse: { name: call.name, response: { contacts } } }])
          aiReplyText = toolResult.response.text()
        }
        else if (call.name === 'find_nearby_care') {
          const type = (call.args as any).facilityType || 'hospital'
          const toolResult = await chat.sendMessage([{ functionResponse: { name: call.name, response: { note: `Please use the UI Find Care button to find a ${type}` } } }])
          aiReplyText = toolResult.response.text()
        }
        // Handle mutation tools (require confirmation)
        else if (call.name === 'create_reminder' || call.name === 'book_appointment') {
          isPendingTool = true
          aiReplyText = JSON.stringify({ type: 'TOOL_CALL_PENDING', name: call.name, args: call.args })
        }
      } else {
        aiReplyText = result.response.text()
      }
    } catch (apiError: any) {
      console.error('Gemini API error:', apiError)
      if (apiError.message?.includes('SAFETY')) {
         aiReplyText = "I apologize, but I cannot fulfill this request due to safety guidelines. Please consult a healthcare professional for medical advice."
      } else {
         return NextResponse.json({ error: 'The AI service is temporarily unavailable.', sessionId: chatSessionId }, { status: 502 })
      }
    }

    // Determine flagged status
    const aiStartsWithEmergency = !isPendingTool && aiReplyText.trim().startsWith(EMERGENCY_MARKER)
    let flagged = aiStartsWithEmergency

    if (userMessageIsEmergency && !aiStartsWithEmergency && !isPendingTool) {
      flagged = true
      aiReplyText = HARDCODED_SAFETY_PREFIX + aiReplyText
    }

    // Save AI response
    await db.chatMessage.create({
      data: {
        sessionId: chatSessionId,
        senderRole: 'AI',
        content: aiReplyText,
        flagged,
      },
    })

    await db.chatSession.update({
      where: { id: chatSessionId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({
      reply: aiReplyText,
      sessionId: chatSessionId,
      flagged,
      isPendingTool
    })
  } catch (error: any) {
    console.error('Chat route error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
