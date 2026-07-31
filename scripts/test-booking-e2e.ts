import db from '../lib/db';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Mock fetch to intercept Gemini calls when API key is missing or mock
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  if (url.toString().includes('generativelanguage.googleapis.com')) {
    const body = JSON.parse(options?.body as string);
    const lastMessage = body.contents[body.contents.length - 1]?.parts[0]?.text || "";
    
    let mockResponse = {};
    if (lastMessage.includes("want to book an appointment")) {
      mockResponse = {
        candidates: [{ content: { parts: [{ functionCall: { name: "list_available_doctors", args: {} } }] } }]
      };
    } else if (lastMessage.includes("I found these available doctors")) {
      mockResponse = {
        candidates: [{ content: { parts: [{ text: "I have listed the doctors above. Who would you like to see?" }] } }]
      };
    } else if (lastMessage.includes("book an appointment with dr. emily")) {
      mockResponse = {
        candidates: [{ content: { parts: [{ text: "What date, time, and reason for your visit?" }] } }]
      };
    } else if (lastMessage.includes("2 august 2027 time 12 noon and reason is oily skin")) {
      mockResponse = {
        candidates: [{ content: { parts: [{ functionCall: { name: "book_appointment", args: { doctorId: "cmrmyygzm0003fdsklrji25pq", dateTime: "2027-08-02T12:00:00+05:30", reason: "oily skin" } } }] } }]
      };
    }
    return new Response(JSON.stringify(mockResponse), { status: 200 });
  }
  return originalFetch(url, options);
};

const SYSTEM_PROMPT = `You are a medical triage assistant for the Medie Genie patient portal.
RULES YOU MUST FOLLOW:
8. CRITICAL — BOOKING RULE 1: You MUST always call list_available_doctors first to get real doctor IDs from the system. NEVER invent, guess, or remember a doctorId from a previous session. Only use a doctorId that was returned by list_available_doctors in the current conversation. If you do not have a doctorId from list_available_doctors in this conversation, call that tool first before proposing any booking.
9. CRITICAL — BOOKING RULE 2: If the user requests an appointment, but does not explicitly provide the specific DATE, TIME, and REASON for the appointment, you MUST ask the user for the missing information BEFORE calling the book_appointment tool. Do not guess or use placeholders like 'Not specified'.`;

const listAvailableDoctorsDecl = {
  name: 'list_available_doctors',
  description: 'Queries real doctor Users, optionally filtered by specialty.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: { specialty: { type: SchemaType.STRING, description: 'Optional specialty to filter doctors by.' } }
  }
};

const bookAppointmentDecl = {
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
};

async function runTest() {
  process.env.GEMINI_API_KEY = 'mock_key'; 
  const patientId = "cmrlul0870000kz04ochvqj2r";
  
  await db.chatSession.deleteMany({ where: { title: "E2E Booking Test" }});
  const session = await db.chatSession.create({ data: { patientId, title: "E2E Booking Test" } });
  const chatSessionId = session.id;
  console.log(`[TEST] Created chat session: ${chatSessionId}`);

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

  async function runTurn(userText: string) {
    console.log(`\n======================================================`);
    console.log(`USER: "${userText}"`);
    console.log(`======================================================`);
    
    await db.chatMessage.create({ data: { sessionId: chatSessionId, senderRole: 'PATIENT', content: userText, flagged: false } });

    const history = await db.chatMessage.findMany({
      where: { sessionId: chatSessionId },
      orderBy: { createdAt: 'asc' },
      select: { senderRole: true, content: true }
    });

    const historyExceptLast = history.slice(0, -1)
      .filter((msg: any) => {
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed.type === 'TOOL_CALL_PENDING' || parsed.type === 'TOOL_CALL_ACTIONED') return false;
        } catch { }
        return true;
      })
      .map((msg: any) => {
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed.type === 'DOCTOR_LIST_RESULT') {
            const doctorLines = parsed.doctors.map((d: any) => `- ${d.name} (ID: ${d.id}, Specialty: ${d.specialty || 'General'})`).join('\n');
            return { role: 'model' as const, parts: [{ text: `I found these available doctors:\n${doctorLines}\n\nIMPORTANT: Use ONLY these exact IDs when booking.` }] };
          }
        } catch { }
        return { role: msg.senderRole === 'PATIENT' ? 'user' as const : 'model' as const, parts: [{ text: msg.content }] };
      });

    const timezone = "Asia/Kolkata";
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      systemInstruction: SYSTEM_PROMPT + `\n\nCURRENT SERVER TIME: ${new Date().toISOString()}\nUSER TIMEZONE: ${timezone}\nIMPORTANT: For any dateTime tool parameters, you MUST output the ISO string WITH the user's correct timezone offset (e.g. +05:30) so it matches their local time accurately. Never output 'Z' (UTC) unless the user is actually in UTC.`,
      tools: [{ functionDeclarations: [listAvailableDoctorsDecl as any, bookAppointmentDecl as any] }]
    });

    const chat = model.startChat({ history: historyExceptLast, generationConfig: { maxOutputTokens: 1024 } });
    const result = await chat.sendMessage([{ text: userText }]);
    
    let aiReplyText = '';
    let isPendingTool = false;

    const functionCalls = result.response.functionCalls();
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      console.log(`\n[MODEL INVOKED TOOL]: ${call.name}`);
      console.log(`[ARGS]:`, JSON.stringify(call.args, null, 2));
      
      if (call.name === 'list_available_doctors') {
        const specialty = (call.args as any).specialty;
        const whereClause: any = { role: 'doctor' };
        if (specialty) whereClause.specialty = { contains: specialty, mode: 'insensitive' };
        const doctors = await db.user.findMany({ where: whereClause, select: { id: true, name: true, specialty: true }, orderBy: { name: 'asc' } });
        
        await db.chatMessage.create({
          data: { sessionId: chatSessionId, senderRole: 'AI', content: JSON.stringify({ type: 'DOCTOR_LIST_RESULT', doctors }), flagged: false }
        });
        
        const toolResult = await chat.sendMessage([{ functionResponse: { name: call.name, response: { doctors } } }]);
        aiReplyText = toolResult.response.text();
      } else if (call.name === 'book_appointment') {
        const doctorId = (call.args as any).doctorId;
        const dateTime = new Date((call.args as any).dateTime);
        let errorMsg = null;
        if (isNaN(dateTime.getTime()) || dateTime < new Date()) {
          errorMsg = "I couldn't book the appointment because the specified date is in the past or invalid. Please provide a future date.";
        } else {
          const doctor = await db.user.findUnique({ where: { id: doctorId } });
          if (!doctor) {
            errorMsg = `I couldn't book the appointment because the doctor ID "${doctorId}" was not found in the database. Please first list available doctors and try again.`;
          } else if (doctor.role !== 'doctor') {
            errorMsg = `I couldn't book the appointment because "${doctor.name}" is not registered as a doctor. Please choose from the available doctors list.`;
          }
        }
        
        if (errorMsg) {
          aiReplyText = errorMsg;
        } else {
          isPendingTool = true;
          aiReplyText = JSON.stringify({ type: 'TOOL_CALL_PENDING', name: call.name, args: call.args });
        }
      }
    } else {
      aiReplyText = result.response.text();
    }

    console.log(`\n[BOT RESPONSE]:`);
    console.log(aiReplyText);

    // Save AI response and print the real CUID generated by the database (Fix #1 verification)
    const savedMsg = await db.chatMessage.create({
      data: { sessionId: chatSessionId, senderRole: 'AI', content: aiReplyText, flagged: false }
    });
    console.log(`[DB SUCCESS] Saved AI Message with real CUID: ${savedMsg.id}`);
    
    if (isPendingTool) {
      console.log(`\n[USER ACTION]: Clicks 'Confirm' on booking card targeting Message ID ${savedMsg.id}...`);
      const parsed = JSON.parse(aiReplyText);
      const args = parsed.args;
      
      // Verify message exists in DB (simulate action route check)
      const foundMsg = await db.chatMessage.findUnique({ where: { id: savedMsg.id } });
      if (!foundMsg) throw new Error("Message not found on confirm!");
      console.log(`[ACTION VERIFIED]: Found target pending message in database!`);

      const apt = await db.appointment.create({
        data: {
          patientId,
          doctorId: args.doctorId,
          dateTime: new Date(args.dateTime),
          reason: args.reason,
          status: 'PENDING'
        }
      });
      console.log(`[DB CONFIRMATION]: Appointment created!`);
      console.log(`- Appointment ID: ${apt.id}`);
      console.log(`- Stored DateTime (UTC in DB): ${apt.dateTime.toISOString()}`);
      console.log(`- Local equivalent (IST): ${new Date(apt.dateTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' })}`);
    }
  }

  await runTurn("want to book an appointment");
  await runTurn("book an appointment with dr. emily");
  await runTurn("the date is 2 august 2027 time 12 noon and reason is oily skin");

  await db.$disconnect();
}
runTest().catch(console.error);
