export async function sendOrderSMS({
  phone,
  orderId,
}: {
  phone: string
  orderId: string
}) {
  const apiKey = process.env.CRAZYTEL_API_KEY
  const from = process.env.CRAZYTEL_FROM

  if (!apiKey || !from) {
    throw new Error('Missing Crazytel config')
  }

  const message = `Thanks for your order with OhSquishMe! We've received your payment and are processing it now. Order ID: ${orderId.slice(0, 8)}`

  const res = await fetch('https://sms.crazytel.net.au/api/v1/sms/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: phone,
      from,
      message,
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.message || 'SMS failed')
  }

  return data
}