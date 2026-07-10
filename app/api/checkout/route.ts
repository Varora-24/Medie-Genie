import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import db from '@/lib/db'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2026-06-24.dahlia',
})

// Hardcoded consultation fee for now
const CONSULTATION_FEE_USD = 50.00

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = (session.user as any).id

    const body = await req.json()
    const { appointmentId } = body

    if (!appointmentId) {
      return NextResponse.json({ error: 'appointmentId is required' }, { status: 400 })
    }

    // Verify appointment belongs to user and is PENDING
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId }
    })

    if (!appointment || appointment.patientId !== userId) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    if (appointment.status !== 'PENDING') {
      return NextResponse.json({ error: 'Appointment is not in PENDING state' }, { status: 400 })
    }

    // Check if there is already a pending payment
    let payment = await db.payment.findFirst({
      where: {
        appointmentId,
        status: 'PENDING'
      }
    })

    if (!payment) {
      // Create new payment record
      payment = await db.payment.create({
        data: {
          patientId: userId,
          appointmentId: appointmentId,
          amount: CONSULTATION_FEE_USD,
          currency: 'USD',
          status: 'PENDING',
          provider: 'STRIPE'
        }
      })
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard/appointments?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/appointments?canceled=true`,
      customer_email: session.user.email || undefined,
      metadata: {
        paymentId: payment.id,
        appointmentId: appointmentId
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Medie Genie Telemedicine Consultation',
              description: `Appointment Reason: ${appointment.reason}`
            },
            unit_amount: Math.round(CONSULTATION_FEE_USD * 100), // Stripe expects cents
          },
          quantity: 1,
        }
      ]
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
