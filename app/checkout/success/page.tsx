'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCart } from '@/components/CartProvider'
import { supabase } from '@/lib/supabase'
import styles from './success.module.css'

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')

  const { clearCart } = useCart()
  const [cleared, setCleared] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string>('')

  useEffect(() => {
    if (!cleared) {
      clearCart()
      setCleared(true)
    }
  }, [clearCart, cleared])

  useEffect(() => {
    let active = true

    async function loadOrderNumber() {
      if (!orderId) return

      const { data, error } = await supabase
        .from('orders')
        .select('order_number')
        .eq('id', orderId)
        .single()

      if (!active) return
      if (error) return

      setOrderNumber(String(data?.order_number || ''))
    }

    loadOrderNumber()

    return () => {
      active = false
    }
  }, [orderId])

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

        {orderNumber ? (
          <section className={styles.referenceHero}>
            <div className={styles.referenceLabel}>Order reference</div>
            <div className={styles.referenceValue}>{orderNumber}</div>
            <p className={styles.referenceHelp}>
              Save this reference in case you need help with your order.
            </p>
          </section>
        ) : null}

        <section className={styles.infoGrid}>
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
              You’ll receive updates using the notification method you selected at
              checkout.
            </span>
          </div>

          <div className={styles.infoCard}>
            <span className={styles.infoLabel}>Need wholesale pricing?</span>
            <span className={styles.infoValue}>
              You can apply through your account if you’d like access to wholesale
              pricing.
            </span>
          </div>
        </section>

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
            If you do not see your order in your account straight away, give it a
            moment and refresh the page. Order confirmation and shipping updates can
            take a short time to appear.
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