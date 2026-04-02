import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import ReceiptView from './ReceiptView'

type OrderRow = {
  id: string
  order_number: string | null
  receipt_token: string
  email: string | null
  phone: string | null
  total: number | string | null
  status: string | null
  created_at: string | null
  paid_at: string | null
  shipping_name: string | null
  shipping_phone: string | null
  shipping_address_line1: string | null
  shipping_address_line2: string | null
  shipping_suburb: string | null
  shipping_state: string | null
  shipping_postcode: string | null
  delivery_notes: string | null
}

type OrderItemRow = {
  id: string
  order_id: string
  name: string | null
  price: number | string | null
  quantity: number | null
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      order_number,
      receipt_token,
      email,
      phone,
      total,
      status,
      created_at,
      paid_at,
      shipping_name,
      shipping_phone,
      shipping_address_line1,
      shipping_address_line2,
      shipping_suburb,
      shipping_state,
      shipping_postcode,
      delivery_notes
    `)
    .eq('receipt_token', token)
    .single()

  if (orderError || !order) {
    notFound()
  }

  const { data: items, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('id, order_id, name, price, quantity')
    .eq('order_id', order.id)

  if (itemsError) {
    notFound()
  }

  return (
    <ReceiptView
      order={order as OrderRow}
      items={(items || []) as OrderItemRow[]}
    />
  )
}