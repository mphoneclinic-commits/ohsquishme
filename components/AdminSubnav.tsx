'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AdminLogoutButton from './AdminLogoutButton'
import styles from './AdminSubnav.module.css'

export default function AdminSubnav({
  pendingWholesaleCount = 0,
}: {
  pendingWholesaleCount?: number
}) {
  const pathname = usePathname()

  const isOrders =
    pathname === '/admin/orders' || pathname.startsWith('/admin/orders/')
  const isProducts =
    pathname === '/admin/products' || pathname.startsWith('/admin/products/')
  const isWholesale =
    pathname === '/admin/wholesale' || pathname.startsWith('/admin/wholesale/')
  const isCustomers =
    pathname === '/admin/customers' || pathname.startsWith('/admin/customers/')

  return (
    <nav className={styles.wrap}>
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
            {pendingWholesaleCount > 0 ? (
              <span
                className={`${styles.badge} ${
                  isWholesale ? styles.badgeActive : ''
                }`}
              >
                {pendingWholesaleCount}
              </span>
            ) : null}
          </Link>

          <Link
            href="/admin/customers"
            className={`${styles.tab} ${isCustomers ? styles.tabActive : ''}`}
          >
            Customers
          </Link>
        </div>

        <div className={styles.actions}>
          <Link href="/shop" className={styles.tab}>
            View Store
          </Link>
          <AdminLogoutButton className={styles.tab} />
        </div>
      </div>
    </nav>
  )
}