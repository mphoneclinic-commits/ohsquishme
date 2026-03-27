import './globals.css'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Fredoka, Inter } from 'next/font/google'
import CartProvider from '@/components/CartProvider'
import HeaderCartLink from '@/components/HeaderCartLink'
import styles from './layout.module.css'

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-brand',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Oh Squish Me',
  description: 'Cute squishies for collectors, gifts, and wholesale orders.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} ${inter.variable}`}>
        <CartProvider>
          <header className={styles.header}>
            <div className={styles.headerInner}>
              <Link href="/" className={styles.brand}>
                <div className={styles.logoWrap}>
                 <Image
  src="/logo.png"
  alt="Oh Squish Me logo"
  width={200}
  height={200}
  className={styles.logo}
  priority
/>
                </div>

                <div className={styles.brandText}>
                  <span className={styles.brandTitle}>Oh Squish Me</span>
                  <span className={styles.brandSub}>
                    cute squishies & gifts
                  </span>
                </div>
              </Link>

              <nav className={styles.nav}>
                <div className={styles.navGroup}>
                  <Link href="/" className={styles.navLink}>
                    Home
                  </Link>
                  <Link href="/shop" className={styles.navLink}>
                    Shop
                  </Link>
                  <Link href="/account" className={styles.navLink}>
                    Account
                  </Link>
                </div>

                <div className={styles.navDivider} />

                <div className={styles.navGroup}>
                  <Link href="/admin/orders" className={styles.adminLink}>
                    Admin Orders
                  </Link>
                  <Link href="/admin/products" className={styles.adminLink}>
                    Admin Products
                  </Link>
                  <HeaderCartLink />
                </div>
              </nav>
            </div>
          </header>

          {children}
        </CartProvider>
      </body>
    </html>
  )
}