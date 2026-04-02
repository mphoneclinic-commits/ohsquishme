import nodemailer from 'nodemailer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendOrderSMS } from './sms/sendOrderSMS'

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

type SendSMSArgs = {
  to: string
  message: string
  orderId?: string | null
  userId?: string | null
  eventType: string
}

type SendEmailArgs = {
  to: string
  subject: string
  text: string
  html?: string | null
  orderId?: string | null
  userId?: string | null
  eventType: string
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

function getSmtpTransporter() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const secure =
    String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465

  if (!host || !user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  })
}

function getFromEmail() {
  return process.env.NOTIFY_FROM_EMAIL || process.env.SMTP_FROM || null
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function textToHtml(text: string) {
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2d2428;white-space:pre-line;">${escapeHtml(
    text
  )}</div>`
}

function getOrderReference(orderId: string, orderNumber?: string | null) {
  return orderNumber?.trim() || orderId.slice(0, 8)
}

export async function sendSMS({
  to,
  message,
  orderId = null,
  userId = null,
  eventType,
}: SendSMSArgs) {
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
    return false
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
        errorText: data?.error || data?.message || `HTTP ${res.status}`,
      })
      return false
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

    return true
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
    return false
  }
}

export async function sendEmail({
  to,
  subject,
  text,
  html = null,
  orderId = null,
  userId = null,
  eventType,
}: SendEmailArgs) {
  const from = getFromEmail()
  const transporter = getSmtpTransporter()

  if (!from || !transporter) {
    await logNotification({
      orderId,
      userId,
      channel: 'email',
      eventType,
      recipient: to,
      status: 'failed',
      message: text,
      errorText:
        'Missing SMTP_HOST / SMTP_USER / SMTP_PASS / NOTIFY_FROM_EMAIL or SMTP_FROM configuration',
    })
    return false
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html: html || textToHtml(text),
    })

    await logNotification({
      orderId,
      userId,
      channel: 'email',
      eventType,
      recipient: to,
      status: 'sent',
      message: text,
    })

    return true
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
    return false
  }
}

export async function sendOrderPlacedNotification(args: {
  orderId: string
  orderNumber?: string | null
  email?: string | null
  phone?: string | null
  shippingName?: string | null
  notifySms?: boolean
  notifyEmail?: boolean
}) {
  const orderRef = getOrderReference(args.orderId, args.orderNumber)
  const name = args.shippingName?.trim() || 'there'

  const sms = `Hi ${name}, thanks for your order with Oh Squish Me. We’ve received order ${orderRef} and are processing it now 💖`

  const emailText = `Hi ${name},

Thanks for your order with Oh Squish Me.

We’ve received your order ${orderRef} and it is now being processed.

We’ll send another update when it moves through packing and shipping.

Thank you for supporting Oh Squish Me 💕`

  const result = {
    smsSent: false,
    emailSent: false,
  }

  if (args.notifySms && args.phone?.trim()) {
    result.smsSent = await sendSMS({
      to: args.phone.trim(),
      message: sms,
      orderId: args.orderId,
      eventType: 'order_placed',
    })
  }

  if (args.notifyEmail && args.email?.trim()) {
    result.emailSent = await sendEmail({
      to: args.email.trim(),
      subject: `Order ${orderRef} confirmed`,
      text: emailText,
      orderId: args.orderId,
      eventType: 'order_placed',
    })
  }

  return result
}

export async function sendOrderShippedNotification(args: {
  orderId: string
  orderNumber?: string | null
  email?: string | null
  phone?: string | null
  shippingName?: string | null
  courier?: string | null
  trackingNumber?: string | null
  notifySms?: boolean
  notifyEmail?: boolean
}) {
  const orderRef = getOrderReference(args.orderId, args.orderNumber)
  const name = args.shippingName?.trim() || 'there'
  const courierText = args.courier?.trim() ? ` via ${args.courier.trim()}` : ''
  const trackingText = args.trackingNumber?.trim()
    ? ` Tracking: ${args.trackingNumber.trim()}.`
    : ''

  const sms = `Hi ${name}, your Oh Squish Me order ${orderRef} has shipped${courierText}.${trackingText}`

  const emailText = `Hi ${name},

Your Oh Squish Me order ${orderRef} has shipped${courierText}.${trackingText}

Thank you for your order.`

  const result = {
    smsSent: false,
    emailSent: false,
  }

  if (args.notifySms !== false && args.phone?.trim()) {
    result.smsSent = await sendSMS({
      to: args.phone.trim(),
      message: sms,
      orderId: args.orderId,
      eventType: 'order_shipped',
    })
  }

  if (args.notifyEmail !== false && args.email?.trim()) {
    result.emailSent = await sendEmail({
      to: args.email.trim(),
      subject: `Your order ${orderRef} has shipped`,
      text: emailText,
      orderId: args.orderId,
      eventType: 'order_shipped',
    })
  }

  return result
}

export async function sendOrderCompletedNotification(args: {
  orderId: string
  orderNumber?: string | null
  email?: string | null
  phone?: string | null
  shippingName?: string | null
  notifySms?: boolean
  notifyEmail?: boolean
}) {
  const orderRef = getOrderReference(args.orderId, args.orderNumber)
  const name = args.shippingName?.trim() || 'there'

  const sms = `Hi ${name}, your Oh Squish Me order ${orderRef} is now completed. Thank you!`

  const emailText = `Hi ${name},

Your Oh Squish Me order ${orderRef} is now completed.

Thank you for shopping with us.`

  const result = {
    smsSent: false,
    emailSent: false,
  }

  if (args.notifySms !== false && args.phone?.trim()) {
    result.smsSent = await sendSMS({
      to: args.phone.trim(),
      message: sms,
      orderId: args.orderId,
      eventType: 'order_completed',
    })
  }

  if (args.notifyEmail !== false && args.email?.trim()) {
    result.emailSent = await sendEmail({
      to: args.email.trim(),
      subject: `Your order ${orderRef} is completed`,
      text: emailText,
      orderId: args.orderId,
      eventType: 'order_completed',
    })
  }

  return result
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

  const result = {
    smsSent: false,
    emailSent: false,
  }

  if (args.phone?.trim()) {
    result.smsSent = await sendSMS({
      to: args.phone.trim(),
      message: sms,
      userId: args.userId,
      eventType: approved ? 'wholesale_approved' : 'wholesale_rejected',
    })
  }

  if (args.email?.trim()) {
    result.emailSent = await sendEmail({
      to: args.email.trim(),
      subject: approved
        ? 'Your wholesale request was approved'
        : 'Your wholesale request update',
      text: emailText,
      userId: args.userId,
      eventType: approved ? 'wholesale_approved' : 'wholesale_rejected',
    })
  }

  return result
}