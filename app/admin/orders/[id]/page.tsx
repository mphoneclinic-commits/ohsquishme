import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import OrderEditor from './OrderEditor'
import styles from './order-edit.module.css'

export const dynamic = 'force-dynamic'

type OrderRow = {
  id: string
  email: string | null
  phone: string | null
  total: number | string | null
  status: string | null
  created_at: string | null
  paid_at: string | null
  stripe_session_id: string | null
  internal_note: string | null
  shipping_name: string | null
  shipping_phone: string | null
  shipping_address_line1: string | null
  shipping_address_line2: string | null
  shipping_suburb: string | null
  shipping_state: string | null
  shipping_postcode: string | null
  delivery_notes: string | null
  courier: string | null
  tracking_number: string | null
  refund_status: string | null
  refunded_at: string | null
  packed_at: string | null
  shipped_at: string | null
  completed_at: string | null
}

type OrderItemRow = {
  id: string
  order_id: string
  name: string | null
  price: number | string | null
  quantity: number | null
}

export default async function AdminOrderEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select(
      `
      id,
      email,
      phone,
      total,
      status,
      created_at,
      paid_at,
      stripe_session_id,
      internal_note,
      shipping_name,
      shipping_phone,
      shipping_address_line1,
      shipping_address_line2,
      shipping_suburb,
      shipping_state,
      shipping_postcode,
      delivery_notes,
      courier,
      tracking_number,
      refund_status,
      refunded_at,
      packed_at,
      shipped_at,
      completed_at
    `
    )
    .eq('id', id)
    .single()

  if (orderError || !order) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.errorCard}>
            {orderError?.message || 'Order not found'}
          </div>
        </div>
      </main>
    )
  }

  const { data: items, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('id, order_id, name, price, quantity')
    .eq('order_id', id)

  if (itemsError) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.errorCard}>
            {itemsError.message || 'Failed to load order items'}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <OrderEditor
          order={order as OrderRow}
          items={(items || []) as OrderItemRow[]}
        />
      </div>
    </main>
  )
}