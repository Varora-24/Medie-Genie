import { NextResponse } from 'next/server'

type VideoAppointment = {
  id: string
  doctorId: string
  patientId: string
  date: string
  time: string
}

let videoAppointments: VideoAppointment[] = []

export async function GET() {
  return NextResponse.json(videoAppointments)
}

export async function POST(request: Request) {
  const appointment: VideoAppointment = await request.json()
  appointment.id = (videoAppointments.length + 1).toString()
  videoAppointments.push(appointment)
  return NextResponse.json(appointment, { status: 201 })
}

