'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './order-edit.module.css'
import { formatDateTime } from '@/app/admin/utils'

type OrderRow = {
  id: string
  order_number: string | null
  email: string | null
  phone: string | null
  total: number | string | null
  status: string | null
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
  'closed',
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
  const router = useRouter()

  const [form, setForm] = useState({
    email: order.email || '',
    phone: order.phone || '',
    status: order.status || 'pending',
    internal_note: order.internal_note || '',
    shipping_name: order.shipping_name || '',
    shipping_phone: order.shipping_phone || '',
    shipping_address_line1: order.shipping_address_line1 || '',
    shipping_address_line2: order.shipping_address_line2 || '',
    shipping_suburb: order.shipping_suburb || '',
    shipping_state: order.shipping_state || '',
    shipping_postcode: order.shipping_postcode || '',
    delivery_notes: order.delivery_notes || '',
    courier: order.courier || '',
    tracking_number: order.tracking_number || '',
  })

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSave(nextForm = form, successMessage = 'Order updated') {
    setSaving(true)
    setMessage('')

    try {
      const res = await fetch(`/api/admin/orders/${order.id}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextForm),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Failed to save order')
        return
      }

      setMessage(successMessage)
    } finally {
      setSaving(false)
    }
  }

  async function handleQuickStatus(
    nextStatus: 'packed' | 'shipped' | 'completed' | 'closed'
  ) {
    const nextForm = {
      ...form,
      status: nextStatus,
    }

    setForm(nextForm)
    await handleSave(nextForm, `Order marked ${nextStatus}`)
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
        return
      }

      setMessage('Refund processed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteOrder() {
    const confirmed = window.confirm(
      'Delete this order permanently? This will remove the order record and cannot be undone.'
    )
    if (!confirmed) return

    setSaving(true)
    setMessage('')

    try {
      const res = await fetch(`/api/admin/orders/${order.id}/delete`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Failed to delete order')
        return
      }

      router.push('/admin/orders')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.layout}>
      <div className={styles.topRow}>
        <div>
          <p className={styles.eyebrow}>Admin</p>
          <h1 className={styles.title}>
            {order.order_number || `Edit Order ${order.id.slice(0, 8)}`}
          </h1>
        </div>
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
            value={form.courier}
            onChange={(e) =>
              setForm((c) => ({ ...c, courier: e.target.value }))
            }
            placeholder="Courier"
          />

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

          <input
            className={styles.input}
            value={form.shipping_address_line1}
            onChange={(e) =>
              setForm((c) => ({
                ...c,
                shipping_address_line1: e.target.value,
              }))
            }
            placeholder="Address line 1"
          />

          <input
            className={styles.input}
            value={form.shipping_address_line2}
            onChange={(e) =>
              setForm((c) => ({
                ...c,
                shipping_address_line2: e.target.value,
              }))
            }
            placeholder="Address line 2"
          />

          <input
            className={styles.input}
            value={form.shipping_suburb}
            onChange={(e) =>
              setForm((c) => ({ ...c, shipping_suburb: e.target.value }))
            }
            placeholder="Suburb"
          />

          <input
            className={styles.input}
            value={form.shipping_state}
            onChange={(e) =>
              setForm((c) => ({ ...c, shipping_state: e.target.value }))
            }
            placeholder="State"
          />

          <input
            className={styles.input}
            value={form.shipping_postcode}
            onChange={(e) =>
              setForm((c) => ({ ...c, shipping_postcode: e.target.value }))
            }
            placeholder="Postcode"
          />

          <textarea
            className={styles.textarea}
            value={form.delivery_notes}
            onChange={(e) =>
              setForm((c) => ({ ...c, delivery_notes: e.target.value }))
            }
            placeholder="Delivery notes"
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

        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <span className={styles.infoLabel}>Packed at</span>
            <span className={styles.infoValue}>
              {formatDateTime(order.packed_at)}
            </span>
          </div>

          <div className={styles.infoCard}>
            <span className={styles.infoLabel}>Shipped at</span>
            <span className={styles.infoValue}>
              {formatDateTime(order.shipped_at)}
            </span>
          </div>

          <div className={styles.infoCard}>
            <span className={styles.infoLabel}>Completed at</span>
            <span className={styles.infoValue}>
              {formatDateTime(order.completed_at)}
            </span>
          </div>
        </div>

        <div className={styles.actionRow}>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className={styles.primaryButton}
          >
            {saving ? 'Saving...' : 'Save Order'}
          </button>

          <button
            type="button"
            onClick={() => handleQuickStatus('packed')}
            disabled={saving}
            className={styles.secondaryButton}
          >
            Mark Packed
          </button>

          <button
            type="button"
            onClick={() => handleQuickStatus('shipped')}
            disabled={saving}
            className={styles.secondaryButton}
          >
            Mark Shipped
          </button>

          <button
            type="button"
            onClick={() => handleQuickStatus('completed')}
            disabled={saving}
            className={styles.secondaryButton}
          >
            Mark Completed
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

          <button
            type="button"
            onClick={() => handleQuickStatus('closed')}
            disabled={saving}
            className={styles.secondaryButton}
          >
            Mark Closed
          </button>

          <button
            type="button"
            onClick={handleDeleteOrder}
            disabled={saving}
            className={styles.deleteButton}
          >
            Delete Order
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
                {formatMoney(
                  Number(item.price || 0) * Number(item.quantity || 0)
                )}
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