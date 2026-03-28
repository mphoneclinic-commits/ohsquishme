'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AdminLogoutButton from './AdminLogoutButton'
import styles from './AdminSubnav.module.css'

export default function AdminSubnav() {
  const pathname = usePathname()

  const isOrders = pathname === '/admin/orders'
  const isProducts = pathname === '/admin/products'
  const isWholesale = pathname === '/admin/wholesale'

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <div className={styles.tabs}>
          <Link
            href="/admin/orders"
            className={`${styles.tab} ${isOrders ? styles.tabActive : ''}`}
          >
            Orders
          </Link>

          <Link
            href="/admin/products"
            className={`${styles.tab} ${isProducts ? styles.tabActive : ''}`}
          >
            Products
          </Link>

          <Link
            href="/admin/wholesale"
            className={`${styles.tab} ${isWholesale ? styles.tabActive : ''}`}
          >
            Wholesale
          </Link>
        </div>

        <div className={styles.actions}>
          <Link href="/shop" className={styles.tab}>
            View Store
          </Link>
          <AdminLogoutButton className={styles.tab} />
        </div>
      </div>
    </div>
  )
}