import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { name, email, password } = await request.json()

  // In a real application, you would validate the input and create a new user in your database
  if (name && email && password) {
    // Simulating a successful signup
    return NextResponse.json({ message: 'Signup successful' }, { status: 201 })
  } else {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
}

