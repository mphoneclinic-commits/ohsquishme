'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './account.module.css'

type OrderRow = {
  id: string
  email: string | null
  total: number | string | null
  status: string | null
  created_at: string | null
  paid_at: string | null
}

type OrderItemRow = {
  id: string
  order_id: string
  name: string | null
  price: number | string | null
  quantity: number | null
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

export default function AccountPanel({
  email,
  role,
  createdAt,
  orders,
  orderItems,
}: {
  email: string
  role: string
  createdAt: string | null
  orders: OrderRow[]
  orderItems: OrderItemRow[]
}) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  const isWholesale = role === 'wholesale' || role === 'admin'

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
              <span className={styles.infoValue}>{formatCreatedAt(createdAt)}</span>
            </div>
          </div>

          <div className={styles.actionRow}>
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
              ? 'Your account is approved for wholesale pricing.'
              : 'If you want wholesale pricing, contact us and we can review your account for wholesale access.'}
          </p>
        </div>
      </div>

      <div className={styles.card}>
        <p className={styles.sectionEyebrow}>Orders</p>
        <h2 className={styles.sectionTitle}>Order history</h2>

        {orders.length === 0 ? (
          <p className={styles.bodyText}>
            No orders found for this account yet.
          </p>
        ) : (
          <div className={styles.orderList}>
            {orders.map((order) => {
              const items = orderItems.filter((item) => item.order_id === order.id)

              return (
                <article key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div>
                      <h3 className={styles.orderTitle}>
                        Order {order.id.slice(0, 8)}
                      </h3>
                      <p className={styles.orderMeta}>
                        Placed {formatCreatedAt(order.created_at)}
                      </p>
                    </div>

                    <div className={styles.orderHeaderRight}>
                      <span className={styles.orderStatus}>
                        {formatStatus(order.status)}
                      </span>
                      <strong className={styles.orderTotal}>
                        {formatMoney(order.total)}
                      </strong>
                    </div>
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
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}