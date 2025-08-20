import { NextResponse } from 'next/server'

type MedicalRecord = {
  id: string
  date: string
  doctor: string
  diagnosis: string
  treatment: string
}

let medicalRecords: MedicalRecord[] = [
  {
    id: '1',
    date: '2023-05-15',
    doctor: 'Dr. Smith',
    diagnosis: 'Common Cold',
    treatment: 'Rest and fluids'
  },
  {
    id: '2',
    date: '2023-04-02',
    doctor: 'Dr. Johnson',
    diagnosis: 'Sprained Ankle',
    treatment: 'RICE method and pain medication'
  }
]

export async function GET() {
  return NextResponse.json(medicalRecords)
}

export async function POST(request: Request) {
  const record: MedicalRecord = await request.json()
  record.id = (medicalRecords.length + 1).toString()
  medicalRecords.push(record)
  return NextResponse.json(record, { status: 201 })
}

