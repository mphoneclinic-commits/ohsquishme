'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import HeaderCartLink from '@/components/HeaderCartLink'
import styles from '@/app/layout.module.css'

export default function HeaderNav() {
  const pathname = usePathname()

  const isHome = pathname === '/'
  const isShop = pathname === '/shop' || pathname.startsWith('/product/')
  const isAccount = pathname === '/account'

  return (
    <nav className={styles.nav}>
      <div className={styles.navGroup}>
        <Link
          href="/"
          className={`${styles.navLink} ${isHome ? styles.navLinkActive : ''}`}
        >
          Home
        </Link>

        <Link
          href="/shop"
          className={`${styles.navLink} ${isShop ? styles.navLinkActive : ''}`}
        >
          Shop
        </Link>

        <Link
          href="/account"
          className={`${styles.navLink} ${isAccount ? styles.navLinkActive : ''}`}
        >
          Account
        </Link>

        <HeaderCartLink />
      </div>
    </nav>
  )
}