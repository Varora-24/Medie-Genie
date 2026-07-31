require("dotenv").config();
const { PrismaClient } = require("./node_modules/@prisma/client");
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const db = new PrismaClient();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `You are Genie Assist, a helpful AI health assistant for the Medie Genie patient portal...` // Will pull from route.ts in real test

async function runTest() {
  const patientId = "cmrlul0870000kz04ochvqj2r";
  
  // 1. Create a new ChatSession
  const session = await db.chatSession.create({
    data: { patientId, title: "E2E Booking Test" }
  });
  const chatSessionId = session.id;
  console.log(`[TEST] Created chat session: ${chatSessionId}`);

  const runTurn = async (userText) => {
    console.log(`\n=== USER TURN: "${userText}" ===`);
    
    // Save user msg
    await db.chatMessage.create({
      data: { sessionId: chatSessionId, senderRole: 'PATIENT', content: userText, flagged: false }
    });

    // Get history
    const history = await db.chatMessage.findMany({
      where: { sessionId: chatSessionId },
      orderBy: { createdAt: 'asc' },
      select: { senderRole: true, content: true }
    });

    const historyExceptLast = history.slice(0, -1)
      .filter(msg => {
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed.type === 'TOOL_CALL_PENDING' || parsed.type === 'TOOL_CALL_ACTIONED') return false;
        } catch { }
        return true;
      })
      .map(msg => {
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed.type === 'DOCTOR_LIST_RESULT') {
            const doctorLines = parsed.doctors.map(d => `- ${d.name} (ID: ${d.id}, Specialty: ${d.specialty || 'General'})`).join('\n');
            return { role: 'model', parts: [{ text: `I found these available doctors:\n${doctorLines}\n\nIMPORTANT: Use ONLY these exact IDs when booking.` }] };
          }
        } catch { }
        return { role: msg.senderRole === 'PATIENT' ? 'user' : 'model', parts: [{ text: msg.content }] };
      });

    // We need the route.ts tools and system prompt. Let's just use dynamic import to get the exact ones if possible, but route.ts is ESM Next.js.
    // I'll just copy the exact ones for the test.
  }

  await runTurn("want to book an appointment");
}
runTest().catch(e => console.error(e));
