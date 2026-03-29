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
        const { count, error } = await supabase
          .from('wholesale_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')

        if (!active) return

        if (error) {
          console.error('Failed to load pending wholesale count:', error)
          setPendingWholesaleCount(0)
          return
        }

        setPendingWholesaleCount(count ?? 0)
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

  const isOrders =
    pathname === '/admin/orders' || pathname.startsWith('/admin/orders/')
  const isProducts =
    pathname === '/admin/products' || pathname.startsWith('/admin/products/')
  const isWholesale =
    pathname === '/admin/wholesale' || pathname.startsWith('/admin/wholesale/')
  const isCustomers =
    pathname === '/admin/customers' || pathname.startsWith('/admin/customers/')
  const isStorefront =
    pathname === '/admin/storefront' || pathname.startsWith('/admin/storefront/')

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
          <Link
            href="/admin/storefront"
            className={`${styles.tab} ${isStorefront ? styles.tabActive : ''}`}
          >
            View Store
          </Link>
          <AdminLogoutButton className={styles.tab} />
        </div>
      </div>
    </nav>
  )
}