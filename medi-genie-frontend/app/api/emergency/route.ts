import { NextResponse } from 'next/server'

type EmergencyContact = {
  id: string
  name: string
  phoneNumber: string
  relation: string
}

let emergencyContacts: EmergencyContact[] = [
  {
    id: '1',
    name: 'John Doe',
    phoneNumber: '123-456-7890',
    relation: 'Father'
  },
  {
    id: '2',
    name: 'Jane Doe',
    phoneNumber: '098-765-4321',
    relation: 'Mother'
  }
]

export async function GET() {
  return NextResponse.json(emergencyContacts)
}

export async function POST(request: Request) {
  const contact: EmergencyContact = await request.json()
  contact.id = (emergencyContacts.length + 1).toString()
  emergencyContacts.push(contact)
  return NextResponse.json(contact, { status: 201 })
}

