import { NextResponse } from 'next/server'

type Appointment = {
  id: string
  date: string
  time: string
  doctorName: string
  patientName: string
  reason: string
}

let appointments: Appointment[] = [
  {
    id: '1',
    date: '2023-06-15',
    time: '10:00',
    doctorName: 'Dr. Smith',
    patientName: 'John Doe',
    reason: 'General Checkup'
  },
  {
    id: '2',
    date: '2023-06-22',
    time: '14:00',
    doctorName: 'Dr. Johnson',
    patientName: 'Jane Doe',
    reason: 'Dental Cleaning'
  }
]

export async function GET() {
  return NextResponse.json(appointments)
}

export async function POST(request: Request) {
  const appointment: Appointment = await request.json()
  appointment.id = (appointments.length + 1).toString()
  appointments.push(appointment)
  return NextResponse.json(appointment, { status: 201 })
}

