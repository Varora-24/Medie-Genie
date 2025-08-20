import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // In a real application, this would connect to an emergency service API
  // For demonstration, we'll simulate a successful SOS send
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

  return NextResponse.json({ 
    message: "SOS sent successfully. Help is on the way.",
    estimatedArrivalTime: "10 minutes"
  }, { status: 200 })
}

