import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const { text } = await generateText({
      model: openai('gpt-4o'),
      prompt: `User: ${message}\nAI: `,
      system: "You are a helpful medical assistant for Medi-Genie, an all-in-one medical services application. Provide concise and accurate information about medical topics, appointments, prescriptions, and general health advice. If asked about specific medical conditions or treatments, always advise the user to consult with a healthcare professional for personalized medical advice.",
    })

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error('Error in chatbot API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

