import { NextResponse } from 'next/server'

type Reminder = {
  id: string
  medication: string
  time: string
  isActive: boolean
}

let reminders: Reminder[] = [
  {
    id: '1',
    medication: 'Lisinopril',
    time: '08:00',
    isActive: true
  },
  {
    id: '2',
    medication: 'Metformin',
    time: '09:00',
    isActive: true
  }
]

export async function GET() {
  return NextResponse.json(reminders)
}

export async function POST(request: Request) {
  const reminder: Reminder = await request.json()
  reminder.id = (reminders.length + 1).toString()
  reminders.push(reminder)
  return NextResponse.json(reminder, { status: 201 })
}

export async function PUT(request: Request) {
  const updatedReminder: Reminder = await request.json()
  const index = reminders.findIndex(r => r.id === updatedReminder.id)
  if (index !== -1) {
    reminders[index] = updatedReminder
    return NextResponse.json(updatedReminder)
  }
  return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
}

