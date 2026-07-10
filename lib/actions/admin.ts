'use server'

import db from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs' // We need this to hash passwords. I'll check if it's installed.

export async function getUsers(query?: string, roleFilter?: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  
  const userRole = (session.user as any).role
  if (userRole !== 'admin') {
    throw new Error('Forbidden: Admin access required')
  }

  try {
    const whereClause: any = {}
    
    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } }
      ]
    }
    
    if (roleFilter && roleFilter !== 'all') {
      whereClause.role = roleFilter
    }

    const users = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return users
  } catch (error) {
    console.error('Error fetching users:', error)
    throw new Error('Failed to fetch users')
  }
}

export async function createStaffAccount(data: any) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  
  const userRole = (session.user as any).role
  if (userRole !== 'admin') {
    throw new Error('Forbidden: Admin access required')
  }

  const { name, email, password, role } = data

  if (!email || !password || !role) {
    return { error: 'Missing required fields' }
  }

  if (role !== 'doctor' && role !== 'admin') {
    return { error: 'Invalid role for staff creation' }
  }

  try {
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return { error: 'Email already exists' }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      }
    })

    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (error) {
    console.error('Error creating staff account:', error)
    return { error: 'Failed to create account' }
  }
}
