import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import CartProvider from '@/components/CartProvider'
import HeaderCartLink from '@/components/HeaderCartLink'
import styles from './layout.module.css'

export const metadata: Metadata = {
  title: 'Taba Squishies',
  description: 'Cute squishies for collectors, gifts, and wholesale orders.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <header className={styles.header}>
            <div className={styles.headerInner}>
              <Link href="/" className={styles.brand}>
                Taba Squishies
              </Link>

              <nav className={styles.nav}>
                <Link href="/" className={styles.navLink}>
                  Home
                </Link>
                <Link href="/shop" className={styles.navLink}>
                  Shop
                </Link>
                <Link href="/account" className={styles.navLink}>
                  Account
                </Link>
                <Link href="/admin/orders" className={styles.navLink}>
                  Admin Orders
                </Link>
                <Link href="/admin/products" className={styles.navLink}>
                  Admin Products
                </Link>
                <HeaderCartLink />
              </nav>
            </div>
          </header>

          {children}
        </CartProvider>
      </body>
    </html>
  )
}