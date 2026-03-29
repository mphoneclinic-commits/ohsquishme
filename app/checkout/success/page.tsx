'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCart } from '@/components/CartProvider'
import styles from './success.module.css'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const { clearCart } = useCart()
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    if (!cleared) {
      clearCart()
      setCleared(true)
    }
  }, [clearCart, cleared])

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.iconWrap}>
          <div className={styles.icon}>✓</div>
        </div>

        <p className={styles.eyebrow}>Order confirmed</p>
        <h1 className={styles.title}>Thanks for your order</h1>
        <p className={styles.subtitle}>
          Your payment was successful and your order is now being processed.
        </p>

        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <span className={styles.infoLabel}>What happens next</span>
            <span className={styles.infoValue}>
              We’ll prepare your order and send updates as it moves through packing
              and shipping.
            </span>
          </div>

          <div className={styles.infoCard}>
            <span className={styles.infoLabel}>Order updates</span>
            <span className={styles.infoValue}>
              You’ll receive order updates by email, and shipping details where available.
            </span>
          </div>

          <div className={styles.infoCard}>
            <span className={styles.infoLabel}>Need wholesale pricing?</span>
            <span className={styles.infoValue}>
              You can apply through your account if you’d like access to wholesale pricing.
            </span>
          </div>

          {sessionId ? (
            <div className={styles.infoCard}>
              <span className={styles.infoLabel}>Session reference</span>
              <span className={styles.infoMono}>{sessionId}</span>
            </div>
          ) : null}
        </div>

        <div className={styles.actionRow}>
          <Link href="/account" className={styles.primaryLink}>
            View my account
          </Link>

          <Link href="/shop" className={styles.secondaryLink}>
            Continue shopping
          </Link>
        </div>

        <div className={styles.helpBox}>
          <strong>Heads up</strong>
          <p>
            If you do not see your order in your account straight away, give it a moment
            and refresh the page. Order confirmation and shipping updates can take a short
            time to appear.
          </p>
        </div>
      </section>
    </main>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<main className={styles.page}>Loading confirmation...</main>}>
      <SuccessContent />
    </Suspense>
  )
}