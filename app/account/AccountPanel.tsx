'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './account.module.css'

type OrderRow = {
  id: string
  order_number: string | null
  receipt_token: string | null
  email: string | null
  total: number | string | null
  status: string | null
  created_at: string | null
  paid_at: string | null
  tracking_number: string | null
  courier: string | null
  packed_at: string | null
  shipped_at: string | null
  completed_at: string | null
  shipping_name: string | null
  shipping_phone: string | null
  shipping_address_line1: string | null
  shipping_address_line2: string | null
  shipping_suburb: string | null
  shipping_state: string | null
  shipping_postcode: string | null
}

type OrderItemRow = {
  id: string
  order_id: string
  name: string | null
  price: number | string | null
  quantity: number | null
}

type WholesaleRequestRow = {
  id: string
  status: string
  business_name: string
  created_at: string | null
}

function formatRole(role: string) {
  if (role === 'wholesale') return 'Wholesale'
  if (role === 'admin') return 'Admin'
  return 'Customer'
}

function formatCreatedAt(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatMoney(value: number | string | null) {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatStatus(status: string | null) {
  if (!status) return 'Unknown'
  return status.replaceAll('_', ' ')
}

function buildShippingText(order: OrderRow) {
  return [
    order.shipping_name,
    order.shipping_phone,
    order.shipping_address_line1,
    order.shipping_address_line2,
    order.shipping_suburb,
    order.shipping_state,
    order.shipping_postcode,
  ]
    .filter(Boolean)
    .join(', ')
}

function getOrderReference(order: OrderRow) {
  return order.order_number || `Order ${order.id.slice(0, 8)}`
}

export default function AccountPanel({
  email,
  role,
  createdAt,
  orders,
  orderItems,
  wholesaleRequest,
}: {
  email: string
  role: string
  createdAt: string | null
  orders: OrderRow[]
  orderItems: OrderItemRow[]
  wholesaleRequest: WholesaleRequestRow | null
}) {
  const router = useRouter()
  const [businessName, setBusinessName] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  async function handleWholesaleRequest(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setErrorMessage('')

    try {
      const res = await fetch('/api/account/wholesale-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          contact_name: contactName,
          phone,
          website,
          notes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to submit wholesale request')
        return
      }

      setMessage('Wholesale request submitted. We’ll review it shortly.')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const isWholesale = role === 'wholesale' || role === 'admin'
  const hasPendingRequest = wholesaleRequest?.status === 'pending'

  return (
    <section className={styles.accountStack}>
      <div className={styles.accountGrid}>
        <div className={styles.card}>
          <p className={styles.sectionEyebrow}>Signed in</p>
          <h2 className={styles.sectionTitle}>Account details</h2>

          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <span className={styles.infoLabel}>Email</span>
              <span className={styles.infoValue}>{email}</span>
            </div>

            <div className={styles.infoCard}>
              <span className={styles.infoLabel}>Role</span>
              <span className={styles.infoValue}>{formatRole(role)}</span>
            </div>

            <div className={styles.infoCard}>
              <span className={styles.infoLabel}>Member since</span>
              <span className={styles.infoValue}>
                {formatCreatedAt(createdAt)}
              </span>
            </div>
          </div>

          <div className={styles.actionRow}>
            {role === 'admin' ? (
              <a href="/admin" className={styles.primaryButtonLink}>
                Admin dashboard
              </a>
            ) : null}

            <button
              type="button"
              onClick={handleSignOut}
              className={styles.secondaryButton}
            >
              Sign out
            </button>
          </div>
        </div>

        <div className={styles.card}>
          <p className={styles.sectionEyebrow}>Wholesale</p>
          <h2 className={styles.sectionTitle}>Access status</h2>

          <div
            className={
              isWholesale ? styles.statusBadgeApproved : styles.statusBadgePending
            }
          >
            {isWholesale ? 'Wholesale access active' : 'Standard customer account'}
          </div>

          <p className={styles.bodyText}>
            {isWholesale
              ? 'Your account is approved for wholesale pricing. Eligible products across the shop will automatically show your wholesale rate.'
              : hasPendingRequest
                ? 'Your wholesale request is currently pending review.'
                : 'Want wholesale pricing? Submit a request below and we’ll review your account.'}
          </p>

          {!isWholesale && wholesaleRequest ? (
            <div className={styles.infoCard}>
              <span className={styles.infoLabel}>Latest request</span>
              <span className={styles.infoValue}>
                {wholesaleRequest.business_name} · {formatStatus(wholesaleRequest.status)}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {!isWholesale && !hasPendingRequest ? (
        <div className={styles.card}>
          <p className={styles.sectionEyebrow}>Wholesale request</p>
          <h2 className={styles.sectionTitle}>Apply for wholesale access</h2>

          <form onSubmit={handleWholesaleRequest} className={styles.form}>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Business name"
              required
              className={styles.input}
            />

            <div className={styles.twoCol}>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Contact name"
                className={styles.input}
              />

              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone"
                className={styles.input}
              />
            </div>

            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="Website / Instagram / store link"
              className={styles.input}
            />

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tell us a bit about your store or wholesale needs"
              className={styles.textarea}
            />

            <button
              type="submit"
              disabled={saving}
              className={styles.primaryButton}
            >
              {saving ? 'Submitting...' : 'Submit wholesale request'}
            </button>

            {message ? <div className={styles.successBox}>{message}</div> : null}
            {errorMessage ? (
              <div className={styles.errorBox}>{errorMessage}</div>
            ) : null}
          </form>
        </div>
      ) : null}

      <div className={styles.card}>
        <div className={styles.ordersHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Orders</p>
            <h2 className={styles.sectionTitle}>Order history</h2>
          </div>

          {orders.length === 0 ? null : (
            <Link href="/shop" className={styles.secondaryButtonLink}>
              Continue shopping
            </Link>
          )}
        </div>

        {orders.length === 0 ? (
          <div className={styles.emptyCard}>
            <p>No orders yet.</p>
            <Link href="/shop" className={styles.primaryButtonLink}>
              Start shopping
            </Link>
          </div>
        ) : (
          <div className={styles.orderList}>
            {orders.map((order, index) => {
              const items = orderItems.filter((item) => item.order_id === order.id)
              const shippingText = buildShippingText(order)
              const isOpenByDefault = index === 0

              return (
                <details
                  key={order.id}
                  className={styles.orderDisclosure}
                  open={isOpenByDefault}
                >
                  <summary className={styles.orderSummary}>
                    <div className={styles.orderSummaryLeft}>
                      <h3 className={styles.orderTitle}>
                        {getOrderReference(order)}
                      </h3>
                      <p className={styles.orderMeta}>
                        Placed at {formatCreatedAt(order.created_at)}
                      </p>
                      <span className={styles.orderHint}>
                        Click this order to expand or collapse
                      </span>
                    </div>

                    <div className={styles.orderSummaryRight}>
                      <span className={styles.orderStatus}>
                        {formatStatus(order.status)}
                      </span>
                      <strong className={styles.orderTotal}>
                        {formatMoney(order.total)}
                      </strong>
                      <span className={styles.orderChevron} aria-hidden="true">
                        ▾
                      </span>
                    </div>
                  </summary>

                  <div className={styles.orderBody}>
                    <div className={styles.orderActionRow}>
                      {order.receipt_token ? (
                        <Link
                          href={`/receipt/${order.receipt_token}`}
                          className={styles.secondaryButtonLink}
                          target="_blank"
                        >
                          View receipt
                        </Link>
                      ) : null}

                      {order.status === 'shipped' && order.tracking_number ? (
                        <a
                          href={`https://track.aftership.com/${order.courier || ''}/${order.tracking_number}`}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.primaryButtonLink}
                        >
                          Track package
                        </a>
                      ) : null}
                    </div>

                    {(order.courier || order.tracking_number) ? (
                      <div className={styles.orderInfoGrid}>
                        <div className={styles.infoCard}>
                          <span className={styles.infoLabel}>Courier</span>
                          <span className={styles.infoValue}>
                            {order.courier || '—'}
                          </span>
                        </div>

                        <div className={styles.infoCard}>
                          <span className={styles.infoLabel}>Tracking</span>
                          <span className={styles.infoValue}>
                            {order.tracking_number || '—'}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {shippingText ? (
                      <div className={styles.infoCard}>
                        <span className={styles.infoLabel}>Shipping details</span>
                        <span className={styles.infoValue}>{shippingText}</span>
                      </div>
                    ) : null}

                    <div className={styles.orderTimeline}>
                      <div className={styles.timelineItem}>
                        <strong>Placed</strong>
                        <span>{formatCreatedAt(order.created_at)}</span>
                      </div>

                      {order.packed_at ? (
                        <div className={styles.timelineItem}>
                          <strong>Packed</strong>
                          <span>{formatCreatedAt(order.packed_at)}</span>
                        </div>
                      ) : null}

                      {order.shipped_at ? (
                        <div className={styles.timelineItem}>
                          <strong>Shipped</strong>
                          <span>{formatCreatedAt(order.shipped_at)}</span>
                        </div>
                      ) : null}

                      {order.completed_at ? (
                        <div className={styles.timelineItem}>
                          <strong>Completed</strong>
                          <span>{formatCreatedAt(order.completed_at)}</span>
                        </div>
                      ) : null}
                    </div>

                    <div className={styles.orderItems}>
                      {items.map((item) => (
                        <div key={item.id} className={styles.orderItemRow}>
                          <div>
                            <div className={styles.orderItemName}>
                              {item.name || 'Unnamed item'}
                            </div>
                            <div className={styles.orderItemMeta}>
                              Qty {item.quantity || 0} × {formatMoney(item.price)}
                            </div>
                          </div>

                          <div className={styles.orderItemTotal}>
                            {formatMoney(
                              Number(item.price || 0) * Number(item.quantity || 0)
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={styles.orderEndCap}>
                      End of this order · click the order header above to collapse
                    </div>
                  </div>
                </details>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}