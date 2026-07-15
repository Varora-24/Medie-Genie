'use server'

import db from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function getReminders() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = (session.user as any).id

  try {
    return await db.reminder.findMany({
      where: { userId },
      orderBy: { scheduleTime: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching reminders:', error)
    return []
  }
}

export async function getDueReminders() {
  const session = await auth()
  if (!session?.user) return []
  const userId = (session.user as any).id

  try {
    return await db.reminder.findMany({
      where: { 
        userId,
        isCompleted: false,
        scheduleTime: { lte: new Date() }
      },
      orderBy: { scheduleTime: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching due reminders:', error)
    return []
  }
}

export async function createReminder(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  const userId = (session.user as any).id

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const type = formData.get('type') as string
  const scheduleTimeStr = formData.get('scheduleTime') as string

  if (!title || !type || !scheduleTimeStr) {
    return { error: 'Title, Type, and Schedule Time are required.' }
  }

  try {
    await db.reminder.create({
      data: {
        userId,
        title,
        content,
        type,
        scheduleTime: new Date(scheduleTimeStr),
        isCompleted: false,
      },
    })
    revalidatePath('/dashboard/reminders')
    return { success: true }
  } catch (error: any) {
    console.error('Error creating reminder:', error)
    return { error: error.message || 'Failed to create reminder.' }
  }
}

export async function toggleReminderComplete(id: string, isCompleted: boolean) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  const userId = (session.user as any).id

  try {
    const reminder = await db.reminder.findUnique({ where: { id } })
    if (!reminder) return { error: 'Reminder not found.' }
    if (reminder.userId !== userId) return { error: 'Unauthorized.' }

    await db.reminder.update({
      where: { id },
      data: { isCompleted },
    })
    revalidatePath('/dashboard/reminders')
    return { success: true }
  } catch (error: any) {
    console.error('Error toggling reminder status:', error)
    return { error: error.message || 'Failed to update reminder.' }
  }
}

export async function deleteReminder(id: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  const userId = (session.user as any).id

  try {
    const reminder = await db.reminder.findUnique({ where: { id } })
    if (!reminder) return { error: 'Reminder not found.' }
    if (reminder.userId !== userId) return { error: 'Unauthorized.' }

    await db.reminder.delete({ where: { id } })
    revalidatePath('/dashboard/reminders')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting reminder:', error)
    return { error: error.message || 'Failed to delete reminder.' }
  }
}
