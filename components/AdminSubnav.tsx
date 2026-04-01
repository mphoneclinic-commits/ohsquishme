'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AdminLogoutButton from './AdminLogoutButton'
import styles from './AdminSubnav.module.css'

export default function AdminSubnav() {
  const pathname = usePathname()
  const [pendingWholesaleCount, setPendingWholesaleCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    async function loadPendingCount() {
      try {
        const res = await fetch('/api/admin/wholesale/pending-count', {
          method: 'GET',
          cache: 'no-store',
        }).catch(() => null)

        if (!active || !res) {
          setPendingWholesaleCount(0)
          return
        }

        const data = await res.json().catch(() => null)

        if (!res.ok) {
          if (res.status !== 401) {
            console.error(
              'Failed to load pending wholesale count:',
              data?.error || `HTTP ${res.status}`
            )
          }
          setPendingWholesaleCount(0)
          return
        }

        setPendingWholesaleCount(Number(data?.count || 0))
      } catch (error) {
        console.error('Failed to load pending wholesale count:', error)
        if (active) setPendingWholesaleCount(0)
      }
    }

    loadPendingCount()

    const channel = supabase
      .channel('admin-wholesale-badge')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wholesale_requests',
        },
        async () => {
          await loadPendingCount()
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [])

  const isDashboard = pathname === '/admin'
  const isOrders =
    pathname === '/admin/orders' || pathname.startsWith('/admin/orders/')
  const isProducts =
    pathname === '/admin/products' || pathname.startsWith('/admin/products/')
  const isWholesale =
    pathname === '/admin/wholesale' || pathname.startsWith('/admin/wholesale/')
  const isCustomers =
    pathname === '/admin/customers' || pathname.startsWith('/admin/customers/')
  const isActivity =
    pathname === '/admin/activity' || pathname.startsWith('/admin/activity/')

  return (
    <nav className={styles.wrap} aria-label="Admin navigation">
      <div className={styles.inner}>
        <div className={styles.tabs}>
          <Link
            href="/admin"
            className={`${styles.tab} ${styles.tabDashboard} ${
              isDashboard ? styles.tabDashboardActive : ''
            }`}
          >
            Dashboard
          </Link>

          <Link
            href="/admin/orders"
            className={`${styles.tab} ${styles.tabPrimary} ${
              isOrders ? styles.tabActive : ''
            }`}
          >
            Orders
          </Link>

          <Link
            href="/admin/products"
            className={`${styles.tab} ${styles.tabPrimary} ${
              isProducts ? styles.tabActive : ''
            }`}
          >
            Products
          </Link>

          <Link
            href="/admin/wholesale"
            className={`${styles.tab} ${styles.tabPrimary} ${
              isWholesale ? styles.tabActive : ''
            }`}
          >
            <span>Wholesale</span>
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
            className={`${styles.tab} ${styles.tabPrimary} ${
              isCustomers ? styles.tabActive : ''
            }`}
          >
            Customers
          </Link>

          <Link
            href="/admin/activity"
            className={`${styles.tab} ${styles.tabMeta} ${
              isActivity ? styles.tabMetaActive : ''
            }`}
          >
            Activity
          </Link>
        </div>

        <div className={styles.divider} />

        <div className={styles.actions}>
<Link
  href="/shop"
  className={`${styles.tab} ${styles.tabUtility}`}
>
  View Shop
</Link>

          <AdminLogoutButton className={`${styles.tab} ${styles.tabUtility}`} />
        </div>
      </div>
    </nav>
  )
}