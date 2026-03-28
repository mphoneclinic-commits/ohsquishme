import Link from 'next/link'
import styles from './success.module.css'

export default function CheckoutSuccessPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.card}>
          <div className={styles.iconWrap}>
            <div className={styles.icon}>✓</div>
          </div>

          <p className={styles.eyebrow}>Order received</p>
          <h1 className={styles.title}>Thank you for your order</h1>
          <p className={styles.subtitle}>
            Your payment went through and your order is now being processed.
          </p>

          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <strong>Order confirmation</strong>
              <span>
                If you entered your email or phone, you should receive your
                confirmation shortly.
              </span>
            </div>

            <div className={styles.infoCard}>
              <strong>Dispatch</strong>
              <span>Most orders are packed within 24 hours.</span>
            </div>

            <div className={styles.infoCard}>
              <strong>Need help?</strong>
              <span>
                Contact us if you need to update your order or ask a question.
              </span>
            </div>
          </div>

          <div className={styles.actionRow}>
            <Link href="/shop" className={styles.primaryButton}>
              Continue shopping
            </Link>

            <Link href="/account" className={styles.secondaryButton}>
              View account
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}