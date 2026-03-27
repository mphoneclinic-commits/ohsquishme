import Link from 'next/link'
import styles from './home.module.css'

export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Taba Squishies</p>

        <h1 className={styles.title}>
          Cute squishies for collectors, gifts, and wholesale orders
        </h1>

        <p className={styles.description}>
          Shop retail drops, browse collectible designs, and apply for
          wholesale access for your store.
        </p>

        <div className={styles.actions}>
          <Link href="/shop" className={styles.primaryButton}>
            Shop Now
          </Link>

          <Link href="/account" className={styles.secondaryButton}>
            Wholesale / Account
          </Link>
        </div>
      </section>
    </main>
  )
}