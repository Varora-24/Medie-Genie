import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  // In a real application, you would validate the credentials against your database
  if (email === 'admin@example.com' && password === 'password') {
    // Generate a token (in a real app, use a proper JWT library)
    const token = 'mock_token_' + Math.random().toString(36).substr(2)
    return NextResponse.json({ token })
  } else {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
}

