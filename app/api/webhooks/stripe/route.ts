import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2026-06-24.dahlia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const bodyText = await req.text()
  const sig = req.headers.get('stripe-signature')

  let event: Stripe.Event

  try {
    if (!sig) throw new Error('Missing stripe signature')
    event = stripe.webhooks.constructEvent(bodyText, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const paymentId = session.metadata?.paymentId
    const appointmentId = session.metadata?.appointmentId

    if (paymentId && appointmentId) {
      try {
        // Run as a transaction to ensure idempotency and atomic updates
        await db.$transaction(async (tx) => {
          const currentPayment = await tx.payment.findUnique({
            where: { id: paymentId }
          })

          // Idempotency check: don't process if already completed
          if (currentPayment && currentPayment.status !== 'COMPLETED') {
            await tx.payment.update({
              where: { id: paymentId },
              data: {
                status: 'COMPLETED',
                providerPaymentId: session.payment_intent as string
              }
            })

            // Update appointment status
            await tx.appointment.update({
              where: { id: appointmentId },
              data: { status: 'CONFIRMED' }
            })
          }
        })
      } catch (dbError) {
        console.error('Database error updating payment:', dbError)
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ received: true })
}
