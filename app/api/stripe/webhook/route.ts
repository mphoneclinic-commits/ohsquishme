import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  sendAdminNewOrderNotification,
  sendOrderPlacedNotification,
} from '@/lib/notifications'

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
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.order_id
        const sessionId = session.id

        if (!orderId) {
          console.error('Missing metadata.order_id in Stripe session')
          break
        }

        const { data, error } = await supabaseAdmin.rpc('process_paid_order', {
          target_order_id: orderId,
          target_session_id: sessionId,
        })

        if (error) {
          console.error('process_paid_order RPC error:', error)
          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          )
        }

        if (data?.ok === false) {
          console.error('process_paid_order returned failure:', data)

          await supabaseAdmin
            .from('orders')
            .update({
              status: 'stock_issue',
              stripe_session_id: sessionId,
            })
            .eq('id', orderId)

          return NextResponse.json(
            { error: data.reason || 'Stock processing failed' },
            { status: 409 }
          )
        }

        const { data: order, error: orderError } = await supabaseAdmin
          .from('orders')
          .select(
            'id, email, phone, shipping_name, total, sms_sent_at, email_sent_at, notify_sms, notify_email'
          )
          .eq('id', orderId)
          .single()

        if (orderError || !order) {
          console.error('Failed to load order for notifications:', orderError)
          break
        }

        const shouldSendSms =
          order.notify_sms === true &&
          !!order.phone?.trim() &&
          !order.sms_sent_at

        const shouldSendEmail =
          order.notify_email === true &&
          !!order.email?.trim() &&
          !order.email_sent_at

        if (shouldSendSms || shouldSendEmail) {
          try {
            await sendOrderPlacedNotification({
              orderId: order.id,
              email: order.email,
              phone: order.phone,
              shippingName: order.shipping_name,
              notifySms: shouldSendSms,
              notifyEmail: shouldSendEmail,
            })

            await supabaseAdmin
              .from('orders')
              .update({
                sms_sent_at: shouldSendSms ? new Date().toISOString() : order.sms_sent_at,
                email_sent_at: shouldSendEmail
                  ? new Date().toISOString()
                  : order.email_sent_at,
              })
              .eq('id', orderId)
          } catch (notificationError) {
            console.error('Order placed notification failed:', notificationError)
          }
        }

        try {
          await sendAdminNewOrderNotification({
            orderId: order.id,
            customerEmail: order.email,
            customerPhone: order.phone,
            shippingName: order.shipping_name,
            total: order.total,
          })
        } catch (adminNotificationError) {
          console.error(
            'Admin new order notification failed:',
            adminNotificationError
          )
        }

        break
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.order_id

        if (!orderId) {
          console.error('Missing metadata.order_id in async failure event')
          break
        }

        const { error } = await supabaseAdmin
          .from('orders')
          .update({
            status: 'payment_failed',
          })
          .eq('id', orderId)

        if (error) {
          console.error('Failed to mark payment_failed:', error)
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