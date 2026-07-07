'use server'

import db from './db'
import bcrypt from 'bcryptjs'
import { signIn, signOut } from '@/auth'
import { AuthError } from 'next-auth'
import { SignupSchema, LoginSchema } from './auth-schemas'

export async function signUpAction(prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string

  const validatedFields = SignupSchema.safeParse({ name, email, password, role })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return {
        error: { email: ['Email already in use'] },
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    })

    return { success: true }
  } catch (err: any) {
    return {
      error: { global: ['Something went wrong. Please try again.'] },
    }
  }
}

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const validatedFields = LoginSchema.safeParse({ email, password })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    // NextAuth v5 credentials sign in
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: { global: ['Invalid email or password.'] } }
        default:
          return { error: { global: ['Something went wrong.'] } }
      }
    }
    throw error
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: '/' })
}
