'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import styles from './cancel.module.css'

function CancelContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.iconWrap}>
          <div className={styles.icon}>!</div>
        </div>

        <p className={styles.eyebrow}>Checkout not completed</p>
        <h1 className={styles.title}>Your checkout was cancelled</h1>
        <p className={styles.subtitle}>
          No worries — your items were not charged and you can come back when you’re ready.
        </p>

        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <span className={styles.infoLabel}>What this means</span>
            <span className={styles.infoValue}>
              Your payment did not go through and your checkout session was not completed.
            </span>
          </div>

          <div className={styles.infoCard}>
            <span className={styles.infoLabel}>What to do next</span>
            <span className={styles.infoValue}>
              Return to your cart, review your details, and try checkout again whenever you’re ready.
            </span>
          </div>

          {orderId ? (
            <div className={styles.infoCard}>
              <span className={styles.infoLabel}>Order reference</span>
              <span className={styles.infoMono}>{orderId}</span>
            </div>
          ) : null}
        </div>

        <div className={styles.actionRow}>
          <Link href="/cart" className={styles.primaryLink}>
            Return to cart
          </Link>

          <Link href="/shop" className={styles.secondaryLink}>
            Back to shop
          </Link>
        </div>

        <div className={styles.helpBox}>
          <strong>Having trouble checking out?</strong>
          <p>
            Double-check your shipping details, payment method, and item availability,
            then try again. If the issue keeps happening, test with a different card or browser.
          </p>
        </div>
      </section>
    </main>
  )
}

export default function CheckoutCancelPage() {
  return (
    <Suspense fallback={<main className={styles.page}>Loading checkout...</main>}>
      <CancelContent />
    </Suspense>
  )
}