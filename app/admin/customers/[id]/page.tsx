import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import AdminSubnav from '@/components/AdminSubnav'
import CustomerRoleForm from './CustomerRoleForm'
import styles from './customer-detail.module.css'

export const dynamic = 'force-dynamic'

type ProfileRow = {
  id: string
  email: string | null
  role: string
  created_at: string | null
}

type OrderRow = {
  id: string
  email: string | null
  total: number | string | null
  status: string | null
  created_at: string | null
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatMoney(value: number | string | null) {
  return `$${Number(value || 0).toFixed(2)}`
}

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()

  const { id } = await params

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role, created_at')
    .eq('id', id)
    .single()

  if (profileError || !profile) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <AdminSubnav />
          <div className={styles.errorCard}>
            {profileError?.message || 'Customer not found'}
          </div>
        </div>
      </main>
    )
  }

  let orders: OrderRow[] = []

  if (profile.email) {
    const { data: ordersData } = await supabaseAdmin
      .from('orders')
      .select('id, email, total, status, created_at')
      .eq('email', profile.email)
      .order('created_at', { ascending: false })

    orders = (ordersData || []) as OrderRow[]
  }

  const typedProfile = profile as ProfileRow

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <AdminSubnav />

        <div className={styles.topRow}>
          <div>
            <p className={styles.eyebrow}>Admin</p>
            <h1 className={styles.title}>Customer Details</h1>
          </div>

          <Link href="/admin/customers" className={styles.secondaryLink}>
            Back to Customers
          </Link>
        </div>

        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Account</h2>
          </div>

          <div className={styles.infoGrid}>
            <InfoCard label="Email" value={typedProfile.email || '—'} />
            <InfoCard label="Role" value={typedProfile.role} />
            <InfoCard label="Created" value={formatDate(typedProfile.created_at)} />
            <InfoCard label="User ID" value={typedProfile.id} mono />
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Role Controls</h2>
          </div>

          <CustomerRoleForm
            userId={typedProfile.id}
            currentRole={typedProfile.role}
          />
        </section>

        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Orders</h2>
          </div>

          {orders.length === 0 ? (
            <p className={styles.muted}>No orders found for this customer.</p>
          ) : (
            <div className={styles.orderList}>
              {orders.map((order) => (
                <div key={order.id} className={styles.orderCard}>
                  <div>
                    <div className={styles.orderTitle}>
                      Order {order.id.slice(0, 8)}
                    </div>
                    <div className={styles.orderMeta}>
                      {formatDate(order.created_at)}
                    </div>
                  </div>

                  <div className={styles.orderRight}>
                    <span className={styles.orderStatus}>{order.status || 'unknown'}</span>
                    <strong>{formatMoney(order.total)}</strong>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className={styles.secondaryLink}
                    >
                      Open Order
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function InfoCard({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className={styles.infoCard}>
      <div className={styles.infoLabel}>{label}</div>
      <div className={`${styles.infoValue} ${mono ? styles.mono : ''}`}>
        {value}
      </div>
    </div>
  )
}