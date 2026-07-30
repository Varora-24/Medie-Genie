import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const SYSTEM_PROMPT = `You are a medical triage assistant for the Medie Genie patient portal.
RULES YOU MUST FOLLOW:
1. NEVER diagnose definitively.
7. You have access to tools to book appointments.

CURRENT SERVER TIME: ${new Date().toISOString()}
Use this time as the reference for any relative dates like "tomorrow" or "next week".`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: 'gemini-3.1-flash-lite',
  systemInstruction: SYSTEM_PROMPT,
  tools: [{
    functionDeclarations: [{
      name: 'book_appointment',
      description: 'Proposes an appointment to book with a doctor.',
      parameters: {
        type: 'OBJECT',
        properties: {
          doctorId: { type: 'STRING' },
          dateTime: { type: 'STRING', description: 'ISO 8601 string of the appointment date and time.' },
          reason: { type: 'STRING' },
        },
        required: ['doctorId', 'dateTime', 'reason'],
      }
    }]
  }]
});

async function run() {
  const chat = model.startChat({});
  console.log("Current Server Time:", new Date().toISOString());
  console.log("Sending: 'book an appointment for a checkup tomorrow with doctor id 123'");
  const result = await chat.sendMessage("book an appointment for a checkup tomorrow with doctor id 123");
  const calls = result.response.functionCalls();
  if (calls && calls.length > 0) {
    console.log("Tool Call Name:", calls[0].name);
    console.log("Tool Call Args:", JSON.stringify(calls[0].args, null, 2));
  } else {
    console.log("No tool call. Text:", result.response.text());
  }
}
run().catch(console.error);
