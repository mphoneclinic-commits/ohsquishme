import { supabaseAdmin } from '@/lib/supabaseAdmin'

type LogNotificationArgs = {
  orderId?: string | null
  userId?: string | null
  channel: 'sms' | 'email'
  eventType: string
  recipient?: string | null
  status: 'sent' | 'failed'
  message?: string | null
  errorText?: string | null
}

async function logNotification({
  orderId = null,
  userId = null,
  channel,
  eventType,
  recipient = null,
  status,
  message = null,
  errorText = null,
}: LogNotificationArgs) {
  await supabaseAdmin.from('notification_logs').insert({
    order_id: orderId,
    user_id: userId,
    channel,
    event_type: eventType,
    recipient,
    status,
    message,
    error_text: errorText,
  })
}

export async function sendSMS({
  to,
  message,
  orderId = null,
  userId = null,
  eventType,
}: {
  to: string
  message: string
  orderId?: string | null
  userId?: string | null
  eventType: string
}) {
  const apiKey = process.env.CRAZYTEL_API_KEY
  const from = process.env.CRAZYTEL_FROM

  if (!apiKey || !from) {
    await logNotification({
      orderId,
      userId,
      channel: 'sms',
      eventType,
      recipient: to,
      status: 'failed',
      message,
      errorText: 'Missing CRAZYTEL_API_KEY or CRAZYTEL_FROM',
    })
    return
  }

  try {
    const res = await fetch('https://sms.crazytel.net.au/api/v1/sms/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        from,
        message,
      }),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      await logNotification({
        orderId,
        userId,
        channel: 'sms',
        eventType,
        recipient: to,
        status: 'failed',
        message,
        errorText: data?.error || `HTTP ${res.status}`,
      })
      return
    }

    await logNotification({
      orderId,
      userId,
      channel: 'sms',
      eventType,
      recipient: to,
      status: 'sent',
      message,
    })
  } catch (error) {
    await logNotification({
      orderId,
      userId,
      channel: 'sms',
      eventType,
      recipient: to,
      status: 'failed',
      message,
      errorText: error instanceof Error ? error.message : 'Unknown SMS error',
    })
  }
}

export async function sendEmail({
  to,
  subject,
  text,
  orderId = null,
  userId = null,
  eventType,
}: {
  to: string
  subject: string
  text: string
  orderId?: string | null
  userId?: string | null
  eventType: string
}) {
  const resendApiKey = process.env.RESEND_API_KEY
  const from = process.env.NOTIFY_FROM_EMAIL

  if (!resendApiKey || !from) {
    await logNotification({
      orderId,
      userId,
      channel: 'email',
      eventType,
      recipient: to,
      status: 'failed',
      message: text,
      errorText: 'Missing RESEND_API_KEY or NOTIFY_FROM_EMAIL',
    })
    return
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
      }),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      await logNotification({
        orderId,
        userId,
        channel: 'email',
        eventType,
        recipient: to,
        status: 'failed',
        message: text,
        errorText: data?.message || `HTTP ${res.status}`,
      })
      return
    }

    await logNotification({
      orderId,
      userId,
      channel: 'email',
      eventType,
      recipient: to,
      status: 'sent',
      message: text,
    })
  } catch (error) {
    await logNotification({
      orderId,
      userId,
      channel: 'email',
      eventType,
      recipient: to,
      status: 'failed',
      message: text,
      errorText: error instanceof Error ? error.message : 'Unknown email error',
    })
  }
}

export async function sendOrderShippedNotification(args: {
  orderId: string
  email?: string | null
  phone?: string | null
  shippingName?: string | null
  courier?: string | null
  trackingNumber?: string | null
}) {
  const shortOrderId = args.orderId.slice(0, 8)
  const name = args.shippingName?.trim() || 'there'
  const courierText = args.courier?.trim() ? ` via ${args.courier.trim()}` : ''
  const trackingText = args.trackingNumber?.trim()
    ? ` Tracking: ${args.trackingNumber.trim()}.`
    : ''

  const sms = `Hi ${name}, your Oh Squish Me order ${shortOrderId} has shipped${courierText}.${trackingText}`
  const emailText = `Hi ${name},

Your Oh Squish Me order ${shortOrderId} has shipped${courierText}.${trackingText}

Thank you for your order.`

  if (args.phone?.trim()) {
    await sendSMS({
      to: args.phone.trim(),
      message: sms,
      orderId: args.orderId,
      eventType: 'order_shipped',
    })
  }

  if (args.email?.trim()) {
    await sendEmail({
      to: args.email.trim(),
      subject: `Your order ${shortOrderId} has shipped`,
      text: emailText,
      orderId: args.orderId,
      eventType: 'order_shipped',
    })
  }
}

export async function sendOrderCompletedNotification(args: {
  orderId: string
  email?: string | null
  phone?: string | null
  shippingName?: string | null
}) {
  const shortOrderId = args.orderId.slice(0, 8)
  const name = args.shippingName?.trim() || 'there'

  const sms = `Hi ${name}, your Oh Squish Me order ${shortOrderId} is now completed. Thank you!`
  const emailText = `Hi ${name},

Your Oh Squish Me order ${shortOrderId} is now completed.

Thank you for shopping with us.`

  if (args.phone?.trim()) {
    await sendSMS({
      to: args.phone.trim(),
      message: sms,
      orderId: args.orderId,
      eventType: 'order_completed',
    })
  }

  if (args.email?.trim()) {
    await sendEmail({
      to: args.email.trim(),
      subject: `Your order ${shortOrderId} is completed`,
      text: emailText,
      orderId: args.orderId,
      eventType: 'order_completed',
    })
  }
}

export async function sendWholesaleDecisionNotification(args: {
  userId: string
  email?: string | null
  phone?: string | null
  businessName?: string | null
  status: 'approved' | 'rejected'
}) {
  const business = args.businessName?.trim() || 'your business'
  const approved = args.status === 'approved'

  const sms = approved
    ? `Good news — your Oh Squish Me wholesale request for ${business} has been approved.`
    : `Your Oh Squish Me wholesale request for ${business} was not approved at this time.`

  const emailText = approved
    ? `Hi,

Your wholesale request for ${business} has been approved.

You can now access wholesale pricing on eligible products.`
    : `Hi,

Your wholesale request for ${business} was not approved at this time.`

  if (args.phone?.trim()) {
    await sendSMS({
      to: args.phone.trim(),
      message: sms,
      userId: args.userId,
      eventType: approved ? 'wholesale_approved' : 'wholesale_rejected',
    })
  }

  if (args.email?.trim()) {
    await sendEmail({
      to: args.email.trim(),
      subject: approved
        ? 'Your wholesale request was approved'
        : 'Your wholesale request update',
      text: emailText,
      userId: args.userId,
      eventType: approved ? 'wholesale_approved' : 'wholesale_rejected',
    })
  }
}