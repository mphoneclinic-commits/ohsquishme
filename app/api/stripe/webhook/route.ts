import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Missing STRIPE_WEBHOOK_SECRET' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    const body = await req.text()

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)

    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.order_id
        const sessionId = session.id

        if (!orderId) {
          console.error('checkout.session.completed missing metadata.order_id')
          break
        }

        const { error } = await supabase
          .from('orders')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            stripe_session_id: sessionId,
          })
          .eq('id', orderId)

        if (error) {
          console.error('Failed to mark order paid:', error)
          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          )
        }

        break
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.order_id

        if (!orderId) {
          console.error(
            'checkout.session.async_payment_succeeded missing metadata.order_id'
          )
          break
        }

        const { error } = await supabase
          .from('orders')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
          })
          .eq('id', orderId)

        if (error) {
          console.error('Failed to mark async payment paid:', error)
          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          )
        }

        break
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.order_id

        if (!orderId) {
          console.error(
            'checkout.session.async_payment_failed missing metadata.order_id'
          )
          break
        }

        const { error } = await supabase
          .from('orders')
          .update({
            status: 'payment_failed',
          })
          .eq('id', orderId)

        if (error) {
          console.error('Failed to mark async payment failed:', error)
          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          )
        }

        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}