import { NextResponse } from 'next/server'

type Payment = {
  id: string
  date: string
  description: string
  amount: number
}

let payments: Payment[] = [
  {
    id: '1',
    date: '2023-06-01',
    description: 'Consultation Fee',
    amount: 150
  },
  {
    id: '2',
    date: '2023-05-15',
    description: 'Lab Tests',
    amount: 200
  }
]

export async function GET() {
  return NextResponse.json(payments)
}

export async function POST(request: Request) {
  const payment: Payment = await request.json()
  payment.id = (payments.length + 1).toString()
  payments.push(payment)
  return NextResponse.json(payment, { status: 201 })
}

