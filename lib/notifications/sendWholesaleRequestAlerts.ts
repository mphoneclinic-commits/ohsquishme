type WholesaleAlertArgs = {
  email: string
  businessName: string
  contactName?: string | null
  phone?: string | null
  website?: string | null
  notes?: string | null
}

export async function sendWholesaleRequestAlerts({
  email,
  businessName,
  contactName,
  phone,
  website,
  notes,
}: WholesaleAlertArgs) {
  await sendWholesaleRequestSMS({
    email,
    businessName,
    contactName,
    phone,
    website,
    notes,
  })
}

async function sendWholesaleRequestSMS({
  email,
  businessName,
  contactName,
  phone,
  website,
  notes,
}: {
  email: string
  businessName: string
  contactName?: string | null
  phone?: string | null
  website?: string | null
  notes?: string | null
}) {
  const apiKey = process.env.CRAZYTEL_API_KEY
  const from = process.env.CRAZYTEL_FROM
  const toRaw = process.env.CRAZYTEL_NOTIFY_TO

  if (!apiKey || !from || !toRaw) {
    throw new Error('Missing Crazytel SMS config')
  }

  const recipients = toRaw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (recipients.length === 0) {
    throw new Error('No valid Crazytel recipients configured')
  }

  const message =
    `New wholesale request: ${businessName}. ` +
    `Email: ${email}. ` +
    `Contact: ${contactName || '-'}. ` +
    `Phone: ${phone || '-'}. ` +
    `Website: ${website || '-'}. ` +
    `Notes: ${notes || '-'}`

  await Promise.all(
    recipients.map(async (to) => {
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
        throw new Error(data?.message || `Wholesale request SMS failed for ${to}`)
      }
    })
  )
}