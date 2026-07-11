'use server'

import db from './db'
import bcrypt from 'bcryptjs'
import { signIn, signOut, auth } from '@/auth'
import { AuthError } from 'next-auth'
import { SignupSchema, LoginSchema } from './auth-schemas'

export async function signUpAction(prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const validatedFields = SignupSchema.safeParse({ name, email, password })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      if (existingUser.authProvider === 'google') {
        return {
          error: { email: ['An account with this email already exists. Please continue with Google instead.'] },
        }
      }
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
        role: 'patient',
        authProvider: 'credentials',
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

export async function googleLoginAction() {
  await signIn('google', { redirectTo: '/dashboard' })
}

export async function logoutAction() {
  await signOut({ redirectTo: '/' })
}

export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  const userId = (session.user as any).id
  
  const name = formData.get('name') as string
  const specialty = formData.get('specialty') as string

  if (!name || name.trim() === '') {
    return { error: 'Name cannot be empty' }
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: { 
        name,
        specialty: specialty || null
      }
    })
    
    // We ideally would update the session, but NextAuth v5 session strategy is JWT 
    // so it might take a re-login to reflect name everywhere if it's cached in JWT, 
    // but we can revalidate the current paths.
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings')
    
    return { success: true }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { error: 'Failed to update profile' }
  }
}
