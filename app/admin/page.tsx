import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { formatDateTime } from '@/app/admin/utils'
import styles from './admin-home.module.css'

export const dynamic = 'force-dynamic'

type OrderRow = {
  id: string
  email: string | null
  status: string | null
  total: number | string | null
  created_at: string | null
  paid_at: string | null
  refunded_at?: string | null
  shipping_name: string | null
  tracking_number: string | null
  courier: string | null
  stripe_session_id?: string | null
  refund_status?: string | null
}

type ProductRow = {
  id: string
  name: string | null
  stock: number | null
  active: boolean | null
}

type WholesaleRequestRow = {
  id: string
  business_name: string | null
  email: string | null
  created_at: string | null
  status: string | null
}

function formatMoney(value: number | string | null) {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatStatus(value: string | null) {
  if (!value) return 'unknown'
  return value.replaceAll('_', ' ')
}

function hoursSince(value: string | null) {
  if (!value) return null
  const created = new Date(value).getTime()
  const now = Date.now()
  return Math.floor((now - created) / (1000 * 60 * 60))
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function startOfWeek(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function isThisWeek(value: string | null, weekStart: Date, now: Date) {
  if (!value) return false
  const date = new Date(value)
  return date >= weekStart && date <= now
}

export default async function AdminHomePage() {
  await requireAdmin()

  const now = new Date()
  const weekStart = startOfWeek(now)

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const [
    { data: orderData },
    { data: lowStockData },
    { data: wholesalePendingData },
  ] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select(
        'id, email, status, total, created_at, paid_at, refunded_at, shipping_name, tracking_number, courier, stripe_session_id, refund_status'
      )
      .order('created_at', { ascending: false })
      .limit(120),

    supabaseAdmin
      .from('products')
      .select('id, name, stock, active')
      .eq('active', true)
      .gt('stock', 0)
      .lte('stock', 3)
      .order('stock', { ascending: true })
      .limit(10),

    supabaseAdmin
      .from('wholesale_requests')
      .select('id, business_name, email, created_at, status')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const orders = ((orderData || []) as OrderRow[]).map((order) => {
    const ageHours = hoursSince(order.created_at)
    const isOverdue =
      ['pending', 'paid', 'awaiting_payment', 'packed'].includes(
        order.status || ''
      ) && ageHours !== null && ageHours >= 24

    const created = order.created_at ? new Date(order.created_at) : null
    const today = created ? isSameDay(created, now) : false
    const thisWeek = created ? isThisWeek(order.created_at, weekStart, now) : false

    return {
      ...order,
      ageHours,
      isOverdue,
      today,
      thisWeek,
    }
  })

  const ordersToProcess = orders.filter((order) =>
    ['pending', 'paid', 'awaiting_payment'].includes(order.status || '')
  )

  const packedOrders = orders.filter((order) => order.status === 'packed')

  const failedPayments = orders.filter(
    (order) =>
      order.status === 'cancelled' ||
      (order.status === 'pending' && !order.paid_at && !!order.stripe_session_id)
  )

  const recentRefunds = orders.filter(
    (order) =>
      order.refund_status === 'refunded' &&
      !!order.refunded_at &&
      new Date(order.refunded_at) >= yesterday
  )

  const overdueOrders = [...orders]
    .filter((order) => order.isOverdue)
    .sort((a, b) => Number(b.ageHours || 0) - Number(a.ageHours || 0))
    .slice(0, 8)

  const todaysOrders = orders.filter((order) => order.today).slice(0, 8)

  const thisWeeksOrders = orders.filter((order) => order.thisWeek).slice(0, 8)

  const lowStockProducts = (lowStockData || []) as ProductRow[]
  const pendingWholesale = (wholesalePendingData || []) as WholesaleRequestRow[]

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.topBar}>
          <div>
            <p className={styles.eyebrow}>Admin</p>
            <h1 className={styles.title}>Operations Dashboard</h1>
            <p className={styles.subtitle}>
              Priorities, exceptions and today’s workload in one place.
            </p>
          </div>
        </div>

        <section className={styles.summaryGrid}>
          <DashboardCard
            label="Orders to process"
            value={ordersToProcess.length}
            link="/admin/orders?status=pending"
            tone="urgent"
            helper="New, paid or awaiting payment"
          />

          <DashboardCard
            label="Packed orders"
            value={packedOrders.length}
            link="/admin/orders?status=packed"
            helper="Ready for shipping"
          />

          <DashboardCard
            label="Overdue orders"
            value={overdueOrders.length}
            link="/admin/orders?priority=overdue"
            tone="urgent"
            helper="24h+ without completion"
          />

          <DashboardCard
            label="Low stock"
            value={lowStockProducts.length}
            link="/admin/products?filter=low-stock"
            tone="warning"
            helper="3 or fewer remaining"
          />

          <DashboardCard
            label="Wholesale pending"
            value={pendingWholesale.length}
            link="/admin/wholesale?status=pending"
            helper="Waiting for review"
          />

          <DashboardCard
            label="Refunds (24h)"
            value={recentRefunds.length}
            link="/admin/orders?filter=refunded"
            helper="Recently refunded"
          />

          <DashboardCard
            label="Failed / cancelled"
            value={failedPayments.length}
            link="/admin/orders?filter=failed"
            tone="warning"
            helper="Need review"
          />

          <DashboardCard
            label="Today’s orders"
            value={todaysOrders.length}
            link="/admin/orders?range=today"
            helper="Created today"
          />
        </section>

        <section className={styles.quickLinks}>
          <Link href="/admin/orders" className={styles.link}>
            Manage Orders →
          </Link>
          <Link href="/admin/products" className={styles.link}>
            Manage Products →
          </Link>
          <Link href="/admin/wholesale" className={styles.link}>
            Wholesale Requests →
          </Link>
          <Link href="/admin/activity" className={styles.link}>
            Activity Logs →
          </Link>
        </section>

        <section className={styles.panelGrid}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>Priority</p>
                <h2 className={styles.panelTitle}>Overdue orders</h2>
              </div>
              <Link href="/admin/orders?priority=overdue" className={styles.inlineLink}>
                Open overdue
              </Link>
            </div>

            {overdueOrders.length === 0 ? (
              <div className={styles.emptyState}>No overdue orders right now.</div>
            ) : (
              <div className={styles.list}>
                {overdueOrders.map((order) => (
                  <OrderRowCard
                    key={order.id}
                    order={order}
                    href={`/admin/orders/${order.id}`}
                    showUrgency
                  />
                ))}
              </div>
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>Today</p>
                <h2 className={styles.panelTitle}>Today’s orders</h2>
              </div>
              <Link href="/admin/orders?range=today" className={styles.inlineLink}>
                View today
              </Link>
            </div>

            {todaysOrders.length === 0 ? (
              <div className={styles.emptyState}>No orders created today.</div>
            ) : (
              <div className={styles.list}>
                {todaysOrders.map((order) => (
                  <OrderRowCard
                    key={order.id}
                    order={order}
                    href={`/admin/orders/${order.id}`}
                  />
                ))}
              </div>
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>This week</p>
                <h2 className={styles.panelTitle}>This week’s newest orders</h2>
              </div>
              <Link href="/admin/orders?range=week" className={styles.inlineLink}>
                View week
              </Link>
            </div>

            {thisWeeksOrders.length === 0 ? (
              <div className={styles.emptyState}>No orders this week.</div>
            ) : (
              <div className={styles.list}>
                {thisWeeksOrders.map((order) => (
                  <OrderRowCard
                    key={order.id}
                    order={order}
                    href={`/admin/orders/${order.id}`}
                  />
                ))}
              </div>
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>Exceptions</p>
                <h2 className={styles.panelTitle}>Failed / cancelled payments</h2>
              </div>
              <Link href="/admin/orders?filter=failed" className={styles.inlineLink}>
                Review failures
              </Link>
            </div>

            {failedPayments.length === 0 ? (
              <div className={styles.emptyState}>No failed or cancelled payments to review.</div>
            ) : (
              <div className={styles.list}>
                {failedPayments.slice(0, 8).map((order) => (
                  <OrderRowCard
                    key={order.id}
                    order={order}
                    href={`/admin/orders/${order.id}`}
                    tone="warning"
                  />
                ))}
              </div>
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>Inventory risk</p>
                <h2 className={styles.panelTitle}>Low stock products</h2>
              </div>
              <Link href="/admin/products?filter=low-stock" className={styles.inlineLink}>
                Open products
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className={styles.emptyState}>No low stock products right now.</div>
            ) : (
              <div className={styles.list}>
                {lowStockProducts.map((product) => (
                  <Link
                    key={product.id}
                    href="/admin/products?filter=low-stock"
                    className={styles.rowCard}
                  >
                    <div className={styles.rowTop}>
                      <div>
                        <div className={styles.rowTitle}>
                          {product.name || 'Unnamed product'}
                        </div>
                        <div className={styles.rowMeta}>Inventory watchlist</div>
                      </div>

                      <div className={styles.rowRight}>
                        <span className={styles.warningPill}>
                          {Number(product.stock || 0)} left
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>Wholesale queue</p>
                <h2 className={styles.panelTitle}>Pending wholesale requests</h2>
              </div>
              <Link href="/admin/wholesale?status=pending" className={styles.inlineLink}>
                Review wholesale
              </Link>
            </div>

            {pendingWholesale.length === 0 ? (
              <div className={styles.emptyState}>No wholesale requests pending.</div>
            ) : (
              <div className={styles.list}>
                {pendingWholesale.map((request) => (
                  <Link
                    key={request.id}
                    href="/admin/wholesale?status=pending"
                    className={styles.rowCard}
                  >
                    <div className={styles.rowTop}>
                      <div>
                        <div className={styles.rowTitle}>
                          {request.business_name || 'Unnamed business'}
                        </div>
                        <div className={styles.rowMeta}>
                          {request.email || 'No email'}
                        </div>
                      </div>

                      <div className={styles.rowRight}>
                        <span className={styles.statusPill}>pending</span>
                      </div>
                    </div>

                    <div className={styles.rowBottom}>
                      <span>{formatDateTime(request.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className={`${styles.panel} ${styles.fullWidth}`}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>Exceptions</p>
                <h2 className={styles.panelTitle}>Recent refunds (24h)</h2>
              </div>
              <Link href="/admin/orders?filter=refunded" className={styles.inlineLink}>
                Review refunds
              </Link>
            </div>

            {recentRefunds.length === 0 ? (
              <div className={styles.emptyState}>No refunds in the last 24 hours.</div>
            ) : (
              <div className={styles.list}>
                {recentRefunds.slice(0, 8).map((order) => (
                  <OrderRowCard
                    key={order.id}
                    order={order}
                    href={`/admin/orders/${order.id}`}
                    tone="refund"
                  />
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  )
}

function DashboardCard({
  label,
  value,
  link,
  tone,
  helper,
}: {
  label: string
  value: number
  link: string
  tone?: 'urgent' | 'warning'
  helper?: string
}) {
  return (
    <Link
      href={link}
      className={`${styles.summaryCard} ${
        tone === 'urgent'
          ? styles.summaryCardUrgent
          : tone === 'warning'
            ? styles.summaryCardWarning
            : ''
      }`}
    >
      <div className={styles.summaryLabel}>{label}</div>
      <div className={styles.summaryValue}>{value}</div>
      {helper ? <div className={styles.summaryHelper}>{helper}</div> : null}
    </Link>
  )
}

function OrderRowCard({
  order,
  href,
  showUrgency,
  tone,
}: {
  order: OrderRow & {
    ageHours?: number | null
    isOverdue?: boolean
  }
  href: string
  showUrgency?: boolean
  tone?: 'warning' | 'refund'
}) {
  return (
    <Link
      href={href}
      className={`${styles.rowCard} ${
        showUrgency && order.isOverdue ? styles.rowCardUrgent : ''
      } ${tone === 'warning' ? styles.rowCardWarning : ''} ${
        tone === 'refund' ? styles.rowCardRefund : ''
      }`}
    >
      <div className={styles.rowTop}>
        <div>
          <div className={styles.rowTitle}>Order {order.id.slice(0, 8)}</div>
          <div className={styles.rowMeta}>
            {order.shipping_name || order.email || 'No customer name'}
          </div>
        </div>

        <div className={styles.rowRight}>
          <span
            className={
              tone === 'refund'
                ? styles.refundPill
                : tone === 'warning'
                  ? styles.warningPill
                  : styles.statusPill
            }
          >
            {tone === 'refund' ? 'refunded' : formatStatus(order.status)}
          </span>
          <strong>{formatMoney(order.total)}</strong>
        </div>
      </div>

      <div className={styles.rowBottom}>
        <span>{formatDateTime(order.created_at)}</span>
        {showUrgency && order.isOverdue ? (
          <span className={styles.urgentText}>{order.ageHours}h old</span>
        ) : order.tracking_number ? (
          <span>{order.courier || 'Tracking'} added</span>
        ) : null}
      </div>
    </Link>
  )
}