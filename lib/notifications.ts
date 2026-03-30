import nodemailer from 'nodemailer'
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

type BrandEmailArgs = {
  preheader?: string
  heading: string
  intro?: string
  body: string[]
  accentLabel?: string
  accentValue?: string
  outro?: string
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

function buildBrandEmail({
  preheader = '',
  heading,
  intro,
  body,
  accentLabel,
  accentValue,
  outro,
}: BrandEmailArgs) {
  const safeHeading = escapeHtml(heading)
  const safeIntro = intro ? escapeHtml(intro) : ''
  const safeBody = body
    .map(
      (line) =>
        `<p style="margin:0 0 14px;color:#4b3b42;font-size:15px;line-height:1.7;">${escapeHtml(
          line
        )}</p>`
    )
    .join('')
  const safeAccentLabel = accentLabel ? escapeHtml(accentLabel) : ''
  const safeAccentValue = accentValue ? escapeHtml(accentValue) : ''
  const safeOutro = outro ? escapeHtml(outro) : ''
  const safePreheader = escapeHtml(preheader)

  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${safePreheader}
    </div>
    <div style="margin:0;padding:24px;background:#fff7fa;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #f1dce5;border-radius:22px;overflow:hidden;box-shadow:0 10px 24px rgba(30,18,24,0.06);">
        <tr>
          <td style="padding:28px 28px 18px;background:linear-gradient(135deg,#fff1f6,#fff9fb);border-bottom:1px solid #f4e2ea;">
            <div style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:#a86b84;margin-bottom:10px;">
              Oh Squish Me
            </div>
            <h1 style="margin:0;font-family:Arial,sans-serif;font-size:28px;line-height:1.15;color:#d63384;">
              ${safeHeading}
            </h1>
            ${
              safeIntro
                ? `<p style="margin:12px 0 0;color:#6b5962;font-size:15px;line-height:1.7;">${safeIntro}</p>`
                : ''
            }
          </td>
        </tr>

        ${
          safeAccentLabel && safeAccentValue
            ? `
        <tr>
          <td style="padding:18px 28px 0;">
            <div style="border:1px solid #f1dce5;background:#fff9fc;border-radius:16px;padding:14px 16px;">
              <div style="font-family:Arial,sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:1.2px;color:#8a6d79;margin-bottom:6px;">
                ${safeAccentLabel}
              </div>
              <div style="font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#2d2428;">
                ${safeAccentValue}
              </div>
            </div>
          </td>
        </tr>
        `
            : ''
        }

        <tr>
          <td style="padding:22px 28px 12px;font-family:Arial,sans-serif;">
            ${safeBody}
          </td>
        </tr>

        <tr>
          <td style="padding:8px 28px 28px;font-family:Arial,sans-serif;">
            ${
              safeOutro
                ? `<p style="margin:0;color:#5f4d55;font-size:15px;line-height:1.7;">${safeOutro}</p>`
                : ''
            }
            <p style="margin:18px 0 0;color:#7a6f76;font-size:13px;line-height:1.6;">
              Cute, soft &amp; oh-so-satisfying 🎀
            </p>
          </td>
        </tr>
      </table>
    </div>
  `
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
        errorText: data?.error || data?.message || `HTTP ${res.status}`,
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
  html = null,
  orderId = null,
  userId = null,
  eventType,
}: SendEmailArgs) {
  const from = process.env.NOTIFY_FROM_EMAIL
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
        'Missing SMTP_HOST / SMTP_USER / SMTP_PASS / NOTIFY_FROM_EMAIL configuration',
    })
    return
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

export async function sendOrderPlacedNotification(args: {
  orderId: string
  email?: string | null
  phone?: string | null
  shippingName?: string | null
  notifySms?: boolean
  notifyEmail?: boolean
}) {
  const shortOrderId = args.orderId.slice(0, 8)
  const name = args.shippingName?.trim() || 'there'

  const sms = `Hi ${name}, thanks for your order with Oh Squish Me. We’ve received order ${shortOrderId} and are processing it now 💖`

  const emailText = `Hi ${name},

Thanks for your order with Oh Squish Me.

We’ve received your order ${shortOrderId} and it is now being processed.

We’ll send another update when it moves through packing and shipping.

Thank you for supporting Oh Squish Me 💕`

  const emailHtml = buildBrandEmail({
    preheader: `We’ve received your order ${shortOrderId}`,
    heading: 'Your order is confirmed 💖',
    intro: `Thanks for your order, ${name}.`,
    accentLabel: 'Order reference',
    accentValue: shortOrderId,
    body: [
      'We’ve received your payment and your order is now being processed.',
      'We’ll send another update as it moves through packing and shipping.',
      'Thank you for supporting Oh Squish Me.',
    ],
    outro: 'With love, Oh Squish Me',
  })

  if (args.notifySms === true && args.phone?.trim()) {
    await sendSMS({
      to: args.phone.trim(),
      message: sms,
      orderId: args.orderId,
      eventType: 'order_placed',
    })
  }

  if (args.notifyEmail === true && args.email?.trim()) {
    await sendEmail({
      to: args.email.trim(),
      subject: `Order ${shortOrderId} confirmed`,
      text: emailText,
      html: emailHtml,
      orderId: args.orderId,
      eventType: 'order_placed',
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
  notifySms?: boolean
  notifyEmail?: boolean
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

  const emailHtml = buildBrandEmail({
    preheader: `Your order ${shortOrderId} has shipped`,
    heading: 'Your order is on the way 🎀',
    intro: `Hi ${name}, great news — your order has shipped${courierText}.`,
    accentLabel: 'Order reference',
    accentValue: shortOrderId,
    body: [
      args.trackingNumber?.trim()
        ? `Tracking number: ${args.trackingNumber.trim()}`
        : 'Your parcel is now on its way.',
      'Thank you again for supporting Oh Squish Me.',
    ],
    outro: 'Keep an eye out for your delivery.',
  })

  if (args.notifySms === true && args.phone?.trim()) {
    await sendSMS({
      to: args.phone.trim(),
      message: sms,
      orderId: args.orderId,
      eventType: 'order_shipped',
    })
  }

  if (args.notifyEmail === true && args.email?.trim()) {
    await sendEmail({
      to: args.email.trim(),
      subject: `Your order ${shortOrderId} has shipped`,
      text: emailText,
      html: emailHtml,
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
  notifySms?: boolean
  notifyEmail?: boolean
}) {
  const shortOrderId = args.orderId.slice(0, 8)
  const name = args.shippingName?.trim() || 'there'

  const sms = `Hi ${name}, your Oh Squish Me order ${shortOrderId} is now completed. Thank you!`

  const emailText = `Hi ${name},

Your Oh Squish Me order ${shortOrderId} is now completed.

Thank you for shopping with us.`

  const emailHtml = buildBrandEmail({
    preheader: `Your order ${shortOrderId} is now completed`,
    heading: 'Order completed 🌸',
    intro: `Hi ${name}, your order is now complete.`,
    accentLabel: 'Order reference',
    accentValue: shortOrderId,
    body: [
      'Thank you for shopping with Oh Squish Me.',
      'We hope your new squishies bring you lots of cute, soft and satisfying moments.',
    ],
    outro: 'Thank you again for your support.',
  })

  if (args.notifySms === true && args.phone?.trim()) {
    await sendSMS({
      to: args.phone.trim(),
      message: sms,
      orderId: args.orderId,
      eventType: 'order_completed',
    })
  }

  if (args.notifyEmail === true && args.email?.trim()) {
    await sendEmail({
      to: args.email.trim(),
      subject: `Your order ${shortOrderId} is completed`,
      text: emailText,
      html: emailHtml,
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

  const emailHtml = buildBrandEmail({
    preheader: approved
      ? 'Your wholesale request has been approved'
      : 'Your wholesale request has been reviewed',
    heading: approved ? 'Wholesale approved 💕' : 'Wholesale request update',
    intro: approved
      ? `Good news — your request for ${business} has been approved.`
      : `Your request for ${business} was not approved at this time.`,
    accentLabel: 'Business',
    accentValue: business,
    body: approved
      ? ['You can now access wholesale pricing on eligible products.']
      : ['You’re welcome to reach out again in future if your needs change.'],
    outro: 'Thanks for your interest in Oh Squish Me.',
  })

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
      html: emailHtml,
      userId: args.userId,
      eventType: approved ? 'wholesale_approved' : 'wholesale_rejected',
    })
  }
}

export async function sendAdminNewOrderNotification(args: {
  orderId: string
  customerEmail?: string | null
  customerPhone?: string | null
  shippingName?: string | null
  total?: number | string | null
}) {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL?.trim()

  if (!adminEmail) {
    return
  }

  const shortOrderId = args.orderId.slice(0, 8)
  const totalText = `$${Number(args.total || 0).toFixed(2)}`

  const text = `New paid order received.

Order: ${shortOrderId}
Customer: ${args.shippingName || '—'}
Email: ${args.customerEmail || '—'}
Phone: ${args.customerPhone || '—'}
Total: ${totalText}`

  const html = buildBrandEmail({
    preheader: `New paid order ${shortOrderId}`,
    heading: 'New paid order received',
    accentLabel: 'Order reference',
    accentValue: shortOrderId,
    body: [
      `Customer: ${args.shippingName || '—'}`,
      `Email: ${args.customerEmail || '—'}`,
      `Phone: ${args.customerPhone || '—'}`,
      `Total: ${totalText}`,
    ],
    outro: 'Open the admin dashboard to process it.',
  })

  await sendEmail({
    to: adminEmail,
    subject: `New paid order ${shortOrderId}`,
    text,
    html,
    orderId: args.orderId,
    eventType: 'admin_new_order',
  })
}