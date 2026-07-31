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
7. You have access to tools to book appointments, schedule lab tests (pathology/radiology), create reminders, check available doctors, check available lab services, and get emergency contacts. Use them when appropriate.
8. CRITICAL — BOOKING RULE 1: You MUST always call list_available_doctors first to get real doctor IDs from the system. NEVER invent, guess, or remember a doctorId from a previous session. Only use a doctorId that was returned by list_available_doctors in the current conversation. If you do not have a doctorId from list_available_doctors in this conversation, call that tool first before proposing any booking.
9. CRITICAL — BOOKING RULE 2: If the user requests an appointment, but does not explicitly provide the specific DATE, TIME, and REASON for the appointment, you MUST ask the user for the missing information BEFORE calling the book_appointment tool. Do not guess or use placeholders like 'Not specified'.
10. CRITICAL — LAB BOOKING RULE: Before scheduling a lab service, call list_lab_services first to obtain real service IDs and see whether HOME collection or LAB walk-in is supported. Ask for preferred date/time and visitType (and address if HOME) before proposing a schedule_lab_service call.`

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
      reason: { type: SchemaType.STRING, description: 'Explicit reason for the appointment provided by the user. Do not use placeholders.' },
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

const listLabServicesDecl: FunctionDeclaration = {
  name: 'list_lab_services',
  description: 'Queries available diagnostic lab tests and imaging services, optionally filtered by category (e.g. Hematology, Radiology).',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      category: { type: SchemaType.STRING, description: 'Optional medical specialty/category filter.' },
    }
  }
}

const scheduleLabServiceDecl: FunctionDeclaration = {
  name: 'schedule_lab_service',
  description: 'Proposes scheduling a pathology test or imaging scan for the patient. Requires user confirmation.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      serviceId: { type: SchemaType.STRING, description: 'Real database CUID of the lab service.' },
      serviceName: { type: SchemaType.STRING, description: 'Name of the lab test or scan being booked.' },
      visitType: { type: SchemaType.STRING, description: 'Either HOME or LAB.' },
      address: { type: SchemaType.STRING, description: 'Home sample collection address if visitType is HOME.' },
      scheduledAt: { type: SchemaType.STRING, description: 'ISO 8601 string representing the appointment date and time.' },
      notes: { type: SchemaType.STRING, description: 'Optional patient instructions or fasting notes.' },
    },
    required: ['serviceId', 'serviceName', 'visitType', 'scheduledAt'],
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
  let timezone: string = 'UTC'

  try {
    const body = await req.json()
    message = body.message
    sessionId = body.sessionId
    attachmentUrl = body.attachmentUrl
    if (body.timezone) timezone = body.timezone
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

    // Build Gemini chat history from DB messages, excluding tool call JSON payloads
    // to prevent malformed history that breaks the Gemini chat API.
    // DOCTOR_LIST_RESULT messages are converted to a structured model turn so IDs persist across turns.
    const historyExceptLast = history.slice(0, -1)
      .filter((msg) => {
        // Filter out TOOL_CALL_PENDING/ACTIONED JSON messages — these are internal state
        // and not valid Gemini chat history turns.
        try {
          const parsed = JSON.parse(msg.content)
          if (parsed.type === 'TOOL_CALL_PENDING' || parsed.type === 'TOOL_CALL_ACTIONED') return false
          // DOCTOR_LIST_RESULT is handled below — don't filter, keep for special processing
        } catch { /* Not JSON — keep it */ }
        return true
      })
      .map((msg) => {
        // Special handling: convert DOCTOR_LIST_RESULT to a plaintext model message
        // that includes the structured {id, name, specialty} data so the model can
        // reference real IDs in subsequent booking turns.
        try {
          const parsed = JSON.parse(msg.content)
          if (parsed.type === 'DOCTOR_LIST_RESULT') {
            const doctorLines = parsed.doctors.map((d: any) => `- ${d.name} (ID: ${d.id}, Specialty: ${d.specialty || 'General'})`).join('\n')
            return {
              role: 'model' as const,
              parts: [{ text: `I found these available doctors:\n${doctorLines}\n\nIMPORTANT: Use ONLY these exact IDs when booking.` }]
            }
          }
          if (parsed.type === 'LAB_LIST_RESULT') {
            const labLines = parsed.services.map((s: any) => `- ${s.name} (ID: ${s.id}, Category: ${s.category}, Home: ${s.homeVisitAvailable}, Lab: ${s.labVisitAvailable})`).join('\n')
            return {
              role: 'model' as const,
              parts: [{ text: `I found these available lab and diagnostic tests:\n${labLines}\n\nIMPORTANT: Use ONLY these exact IDs when calling schedule_lab_service.` }]
            }
          }
        } catch { /* Not JSON */ }
        return {
          role: msg.senderRole === 'PATIENT' ? 'user' as const : 'model' as const,
          parts: [{ text: msg.content }],
        }
      })

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
      systemInstruction: SYSTEM_PROMPT + `\n\nCURRENT SERVER TIME: ${new Date().toISOString()}\nUSER TIMEZONE: ${timezone}\nIMPORTANT: For any dateTime tool parameters, you MUST output the ISO string WITH the user's correct timezone offset (e.g. +05:30) so it matches their local time accurately. Never output 'Z' (UTC) unless the user is actually in UTC.`,
      tools: [{
        functionDeclarations: [
          createReminderDecl,
          listAvailableDoctorsDecl,
          bookAppointmentDecl,
          getEmergencyContactsDecl,
          findNearbyCareDecl,
          listLabServicesDecl,
          scheduleLabServiceDecl
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
          // STRICT: only role='doctor', never include patients/admins
          const whereClause: any = { role: 'doctor' }
          if (specialty) whereClause.specialty = { contains: specialty, mode: 'insensitive' }
          const doctors = await db.user.findMany({ 
            where: whereClause, 
            select: { id: true, name: true, specialty: true },
            orderBy: { name: 'asc' }
          })
          console.log('[list_available_doctors] Returning doctors:', JSON.stringify(doctors))
          
          // Save structured doctor list to DB so IDs persist across multi-turn conversations
          await db.chatMessage.create({
            data: {
              sessionId: chatSessionId,
              senderRole: 'AI',
              content: JSON.stringify({ type: 'DOCTOR_LIST_RESULT', doctors }),
              flagged: false,
            }
          })
          
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
        else if (call.name === 'list_lab_services') {
          const category = (call.args as any).category
          const whereClause: any = {}
          if (category && category !== 'All') {
            whereClause.category = { contains: category, mode: 'insensitive' }
          }
          const services = await db.labService.findMany({
            where: whereClause,
            select: { id: true, name: true, category: true, homeVisitAvailable: true, labVisitAvailable: true },
            orderBy: { name: 'asc' }
          })
          await db.chatMessage.create({
            data: {
              sessionId: chatSessionId,
              senderRole: 'AI',
              content: JSON.stringify({ type: 'LAB_LIST_RESULT', services }),
              flagged: false,
            }
          })
          const toolResult = await chat.sendMessage([{ functionResponse: { name: call.name, response: { services } } }])
          aiReplyText = toolResult.response.text()
        }
        // Handle mutation tools (require confirmation)
        else if (call.name === 'create_reminder' || call.name === 'book_appointment' || call.name === 'schedule_lab_service') {
          let errorMsg = null;
          if (call.name === 'create_reminder') {
            const dueDate = new Date((call.args as any).dueDate);
            if (isNaN(dueDate.getTime()) || dueDate < new Date()) {
              errorMsg = "I couldn't create the reminder because the specified date is in the past or invalid. Please provide a future date.";
            }
          } else if (call.name === 'book_appointment') {
            const doctorId = (call.args as any).doctorId;
            const dateTime = new Date((call.args as any).dateTime);
            
            // === DIAGNOSTIC LOGGING ===
            console.log('[book_appointment] RECEIVED FROM GEMINI:', JSON.stringify({
              doctorId,
              dateTime: (call.args as any).dateTime,
              reason: (call.args as any).reason,
              sessionId: chatSessionId
            }))
            
            // Log what list_available_doctors returned in this session
            const sessionMessages = await db.chatMessage.findMany({
              where: { sessionId: chatSessionId, senderRole: 'AI' },
              select: { content: true, createdAt: true },
              orderBy: { createdAt: 'asc' }
            })
            const listDoctorMessages = sessionMessages.filter(m => {
              try { return m.content.includes('"id"') && m.content.includes('"name"') } catch { return false }
            })
            console.log('[book_appointment] DOCTOR LIST MESSAGES IN SESSION:', JSON.stringify(listDoctorMessages.map(m => m.content.slice(0, 500))))
            // === END DIAGNOSTIC LOGGING ===
            
            if (isNaN(dateTime.getTime()) || dateTime < new Date()) {
              errorMsg = "I couldn't book the appointment because the specified date is in the past or invalid. Please provide a future date.";
            } else {
              // DB lookup with logging
              const doctor = await db.user.findUnique({ where: { id: doctorId } });
              console.log('[book_appointment] DB LOOKUP RESULT:', JSON.stringify({ 
                doctorId, 
                found: !!doctor, 
                role: doctor?.role, 
                name: doctor?.name 
              }))
              
              if (!doctor) {
                errorMsg = `I couldn't book the appointment because the doctor ID "${doctorId}" was not found in the database. Please first list available doctors and try again.`;
                console.log('[book_appointment] FAIL: doctor not found at all in DB for id:', doctorId)
              } else if (doctor.role !== 'doctor') {
                errorMsg = `I couldn't book the appointment because "${doctor.name}" is not registered as a doctor. Please choose from the available doctors list.`;
                console.log('[book_appointment] FAIL: user found but role is', doctor.role, 'not doctor')
              }
            }
          } else if (call.name === 'schedule_lab_service') {
            const scheduledAt = new Date((call.args as any).scheduledAt);
            const serviceId = (call.args as any).serviceId;
            if (isNaN(scheduledAt.getTime()) || scheduledAt < new Date()) {
              errorMsg = "I couldn't propose this test booking because the specified date is in the past or invalid. Please provide a future date.";
            } else {
              const service = await db.labService.findUnique({ where: { id: serviceId } });
              if (!service) {
                errorMsg = `I couldn't find lab service ID "${serviceId}". Please let me list available tests first!`;
              }
            }
          }

          if (errorMsg) {
            // Tell the model it failed, or just return the error to the user
            aiReplyText = errorMsg;
          } else {
            isPendingTool = true
            aiReplyText = JSON.stringify({ type: 'TOOL_CALL_PENDING', name: call.name, args: call.args })
          }
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
    const aiMessage = await db.chatMessage.create({
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
      isPendingTool,
      messageId: aiMessage.id
    })
  } catch (error: any) {
    console.error('Chat route error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
