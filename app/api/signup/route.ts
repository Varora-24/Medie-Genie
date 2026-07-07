import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import bcrypt from 'bcryptjs'
import { SignupSchema } from '@/lib/auth-schemas'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedFields = SignupSchema.safeParse(body)

    if (!validatedFields.success) {
      return NextResponse.json(
        { 
          message: 'Validation failed', 
          errors: validatedFields.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    const { name, email, password, role } = validatedFields.data

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { 
          message: 'User already exists', 
          errors: { email: ['Email already in use'] } 
        },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    })

    return NextResponse.json(
      { 
        message: 'User created successfully', 
        user 
      },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
