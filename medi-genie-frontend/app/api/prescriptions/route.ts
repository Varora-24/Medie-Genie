import { NextResponse } from 'next/server'

type Prescription = {
  id: string
  medication: string
  dosage: string
  frequency: string
  refillsLeft: number
}

let prescriptions: Prescription[] = [
  {
    id: '1',
    medication: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Once daily',
    refillsLeft: 3
  },
  {
    id: '2',
    medication: 'Metformin',
    dosage: '500mg',
    frequency: 'Twice daily',
    refillsLeft: 5
  }
]

export async function GET() {
  return NextResponse.json(prescriptions)
}

export async function POST(request: Request) {
  const prescription: Prescription = await request.json()
  prescription.id = (prescriptions.length + 1).toString()
  prescriptions.push(prescription)
  return NextResponse.json(prescription, { status: 201 })
}

