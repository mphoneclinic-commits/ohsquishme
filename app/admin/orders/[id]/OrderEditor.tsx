'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './order-edit.module.css'

type OrderRow = {
  id: string
  email: string | null
  phone: string | null
  total: number | string | null
  status: string | null
  internal_note: string | null
  shipping_name: string | null
  shipping_phone: string | null
  shipping_address: string | null
  tracking_number: string | null
  refund_status: string | null
}

type OrderItemRow = {
  id: string
  order_id: string
  name: string | null
  price: number | string | null
  quantity: number | null
}

const STATUS_OPTIONS = [
  'pending',
  'awaiting_payment',
  'paid',
  'payment_failed',
  'stock_issue',
  'packed',
  'shipped',
  'completed',
  'cancelled',
]

function formatMoney(value: number | string | null) {
  return `$${Number(value || 0).toFixed(2)}`
}

export default function OrderEditor({
  order,
  items,
}: {
  order: OrderRow
  items: OrderItemRow[]
}) {
  const [form, setForm] = useState({
    email: order.email || '',
    phone: order.phone || '',
    status: order.status || 'pending',
    internal_note: order.internal_note || '',
    shipping_name: order.shipping_name || '',
    shipping_phone: order.shipping_phone || '',
    shipping_address: order.shipping_address || '',
    tracking_number: order.tracking_number || '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSave() {
    setSaving(true)
    setMessage('')

    try {
      const res = await fetch(`/api/admin/orders/${order.id}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Failed to save order')
        setSaving(false)
        return
      }

      setMessage('Order updated')
    } finally {
      setSaving(false)
    }
  }

  async function handleRefund(restock: boolean) {
    const confirmed = window.confirm(
      `Refund this order${restock ? ' and restock items' : ''}?`
    )
    if (!confirmed) return

    setSaving(true)
    setMessage('')

    try {
      const res = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restock,
          reason: 'Admin initiated refund',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Refund failed')
        setSaving(false)
        return
      }

      setMessage('Refund processed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.layout}>
      <div className={styles.topRow}>
        <div>
          <p className={styles.eyebrow}>Admin</p>
          <h1 className={styles.title}>Edit Order {order.id.slice(0, 8)}</h1>
        </div>

        <Link href="/admin/orders" className={styles.secondaryLink}>
          Back to Orders
        </Link>
      </div>

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Order details</h2>

        <div className={styles.formGrid}>
          <input
            className={styles.input}
            value={form.email}
            onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
            placeholder="Customer email"
          />
          <input
            className={styles.input}
            value={form.phone}
            onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
            placeholder="Customer phone"
          />
          <select
            className={styles.input}
            value={form.status}
            onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <input
            className={styles.input}
            value={form.tracking_number}
            onChange={(e) =>
              setForm((c) => ({ ...c, tracking_number: e.target.value }))
            }
            placeholder="Tracking number"
          />
          <input
            className={styles.input}
            value={form.shipping_name}
            onChange={(e) =>
              setForm((c) => ({ ...c, shipping_name: e.target.value }))
            }
            placeholder="Shipping name"
          />
          <input
            className={styles.input}
            value={form.shipping_phone}
            onChange={(e) =>
              setForm((c) => ({ ...c, shipping_phone: e.target.value }))
            }
            placeholder="Shipping phone"
          />
          <textarea
            className={styles.textarea}
            value={form.shipping_address}
            onChange={(e) =>
              setForm((c) => ({ ...c, shipping_address: e.target.value }))
            }
            placeholder="Shipping address"
          />
          <textarea
            className={styles.textarea}
            value={form.internal_note}
            onChange={(e) =>
              setForm((c) => ({ ...c, internal_note: e.target.value }))
            }
            placeholder="Internal note"
          />
        </div>

        <div className={styles.actionRow}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={styles.primaryButton}
          >
            {saving ? 'Saving...' : 'Save Order'}
          </button>

          <button
            type="button"
            onClick={() => handleRefund(false)}
            disabled={saving}
            className={styles.warningButton}
          >
            Refund
          </button>

          <button
            type="button"
            onClick={() => handleRefund(true)}
            disabled={saving}
            className={styles.dangerButton}
          >
            Refund + Restock
          </button>
        </div>

        {message ? <div className={styles.message}>{message}</div> : null}
      </div>

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Line items</h2>
        <div className={styles.itemList}>
          {items.map((item) => (
            <div key={item.id} className={styles.itemRow}>
              <div>{item.name || 'Unnamed item'}</div>
              <div>Qty {item.quantity || 0}</div>
              <div>{formatMoney(item.price)}</div>
              <div>
                {formatMoney(Number(item.price || 0) * Number(item.quantity || 0))}
              </div>
            </div>
          ))}
          <div className={styles.totalRow}>
            <strong>Total</strong>
            <strong>{formatMoney(order.total)}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}