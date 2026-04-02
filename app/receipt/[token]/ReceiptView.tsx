'use client'

import Link from 'next/link'
import styles from './receipt.module.css'
import { formatDateTime } from '@/app/admin/utils'

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

function formatMoney(value: number | string | null) {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatAddress(order: OrderRow) {
  return [
    order.shipping_address_line1 || '',
    order.shipping_address_line2 || '',
    [order.shipping_suburb || '', order.shipping_state || '', order.shipping_postcode || '']
      .filter(Boolean)
      .join(' '),
  ]
    .filter(Boolean)
    .join(', ')
}

export default function ReceiptView({
  order,
  items,
}: {
  order: OrderRow
  items: OrderItemRow[]
}) {
  const address = formatAddress(order)

  return (
    <main className={styles.page}>
      <section className={styles.toolbar}>
        <Link href="/shop" className={styles.secondaryLink}>
          Continue shopping
        </Link>

        <button
          type="button"
          onClick={() => window.print()}
          className={styles.printButton}
        >
          Print receipt
        </button>
      </section>

      <section className={styles.card}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Payment receipt</p>
            <h1 className={styles.title}>OhSquishMe</h1>
            <p className={styles.tagline}>Cute, soft and oh so satisfying.</p>
            <p className={styles.metaLine}>ohsquishme@outlook.com</p>
          </div>

          <div className={styles.referenceBox}>
            <span className={styles.referenceLabel}>Receipt reference</span>
            <span className={styles.referenceValue}>
              {order.order_number || order.id.slice(0, 8)}
            </span>
            <span className={styles.referenceStatus}>
              Status: {order.status || 'paid'}
            </span>
          </div>
        </div>

        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <span className={styles.infoLabel}>Receipt issued</span>
            <span className={styles.infoValue}>
              {formatDateTime(order.paid_at || order.created_at)}
            </span>
          </div>

          <div className={styles.infoCard}>
            <span className={styles.infoLabel}>Customer</span>
            <span className={styles.infoValue}>{order.shipping_name || '—'}</span>
          </div>

          <div className={styles.infoCard}>
            <span className={styles.infoLabel}>Email</span>
            <span className={styles.infoValue}>{order.email || '—'}</span>
          </div>

          <div className={styles.infoCard}>
            <span className={styles.infoLabel}>Phone</span>
            <span className={styles.infoValue}>
              {order.shipping_phone || order.phone || '—'}
            </span>
          </div>

          <div className={styles.infoCardWide}>
            <span className={styles.infoLabel}>Shipping address</span>
            <span className={styles.infoValue}>{address || '—'}</span>
          </div>

          {order.delivery_notes ? (
            <div className={styles.infoCardWide}>
              <span className={styles.infoLabel}>Delivery notes</span>
              <span className={styles.infoValue}>{order.delivery_notes}</span>
            </div>
          ) : null}
        </div>

        <section className={styles.itemsSection}>
          <div className={styles.itemsHeader}>
            <span>Item</span>
            <span>Qty</span>
            <span>Price</span>
            <span>Total</span>
          </div>

          <div className={styles.itemsList}>
            {items.map((item) => (
              <div key={item.id} className={styles.itemRow}>
                <div className={styles.itemName}>{item.name || 'Unnamed item'}</div>
                <div>{item.quantity || 0}</div>
                <div>{formatMoney(item.price)}</div>
                <div>
                  {formatMoney(
                    Number(item.price || 0) * Number(item.quantity || 0)
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.totalBox}>
            <span>Total paid</span>
            <strong>{formatMoney(order.total)}</strong>
          </div>
        </section>

        <div className={styles.footerNote}>
          This document is a payment receipt for your order. Thank you for shopping with
          OhSquishMe.
        </div>
      </section>
    </main>
  )
}