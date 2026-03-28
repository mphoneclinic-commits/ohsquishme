import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/auth'
import OrderStatusForm from './OrderStatusForm'
import AdminSubnav from '@/components/AdminSubnav'
import styles from './orders.module.css'

export const dynamic = 'force-dynamic'

type OrderRow = {
  id: string
  email: string | null
  phone: string | null
  total: number | string | null
  status: string | null
  created_at: string | null
  paid_at: string | null
  stripe_session_id: string | null
}

type OrderItemRow = {
  id: string
  order_id: string
  product_id: string | null
  name: string | null
  price: number | string | null
  quantity: number | null
}

function formatMoney(value: number | string | null) {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const STATUS_OPTIONS = [
  'pending',
  'awaiting_payment',
  'paid',
  'payment_failed',
  'stock_issue',
  'packed',
  'shipped',
  'completed',
  'cancelled',
]

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string
    status?: string
  }>
}) {
  await requireAdmin()

  const params = (await searchParams) || {}
  const q = (params.q || '').trim().toLowerCase()
  const statusFilter = (params.status || '').trim().toLowerCase()

  const { data: ordersData, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select(
      'id, email, phone, total, status, created_at, paid_at, stripe_session_id'
    )
    .order('created_at', { ascending: false })

  if (ordersError) {
    throw new Error(`Failed to load orders: ${ordersError.message}`)
  }

  const orders = (ordersData || []) as OrderRow[]
  const orderIds = orders.map((order) => order.id)

  let items: OrderItemRow[] = []

  if (orderIds.length > 0) {
    const { data: itemsData, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('id, order_id, product_id, name, price, quantity')
      .in('order_id', orderIds)

    if (itemsError) {
      throw new Error(`Failed to load order items: ${itemsError.message}`)
    }

    items = (itemsData || []) as OrderItemRow[]
  }

  const itemsByOrderId = new Map<string, OrderItemRow[]>()

  for (const item of items) {
    const existing = itemsByOrderId.get(item.order_id) || []
    existing.push(item)
    itemsByOrderId.set(item.order_id, existing)
  }

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter
      ? (order.status || '').toLowerCase() === statusFilter
      : true

    const haystack = [
      order.id,
      order.email || '',
      order.phone || '',
      order.status || '',
      formatMoney(order.total),
      ...(itemsByOrderId.get(order.id) || []).map((item) => item.name || ''),
    ]
      .join(' ')
      .toLowerCase()

    const matchesQuery = q ? haystack.includes(q) : true

    return matchesStatus && matchesQuery
  })

  const counts = {
    all: orders.length,
    paid: orders.filter((o) => o.status === 'paid').length,
    packed: orders.filter((o) => o.status === 'packed').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    stock_issue: orders.filter((o) => o.status === 'stock_issue').length,
    payment_failed: orders.filter((o) => o.status === 'payment_failed').length,
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <AdminSubnav />

        <div className={styles.topBar}>
          <div>
            <p className={styles.eyebrow}>Admin</p>
            <h1 className={styles.title}>Orders Dashboard</h1>
          </div>
        </div>

        <section className={styles.summaryGrid}>
          <SummaryCard label="All Orders" value={counts.all} />
          <SummaryCard label="Paid" value={counts.paid} />
          <SummaryCard label="Packed" value={counts.packed} />
          <SummaryCard label="Shipped" value={counts.shipped} />
          <SummaryCard label="Stock Issues" value={counts.stock_issue} />
          <SummaryCard label="Payment Failed" value={counts.payment_failed} />
        </section>

        <form method="GET" className={styles.filterForm}>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by email, phone, order id, item name..."
            className={styles.input}
          />

          <select
            name="status"
            defaultValue={statusFilter}
            className={styles.select}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <button type="submit" className={styles.primaryButton}>
            Apply
          </button>
        </form>

        {filteredOrders.length === 0 ? (
          <div className={styles.emptyCard}>No matching orders found.</div>
        ) : (
          <section className={styles.orderList}>
            {filteredOrders.map((order) => {
              const orderItems = itemsByOrderId.get(order.id) || []
              const itemCount = orderItems.reduce(
                (sum, item) => sum + Number(item.quantity || 0),
                0
              )

              return (
                <article key={order.id} className={styles.orderCard}>
                  <div className={styles.orderTop}>
                    <div>
                      <div className={styles.orderHeadingRow}>
                        <h2 className={styles.orderTitle}>
                          Order {order.id.slice(0, 8)}
                        </h2>

                        <span className={styles.statusBadge}>
                          {order.status || 'unknown'}
                        </span>
                      </div>

                      <div className={styles.infoGrid}>
                        <InfoRow label="Customer Email" value={order.email || '—'} />
                        <InfoRow label="Phone" value={order.phone || '—'} />
                        <InfoRow label="Total" value={formatMoney(order.total)} />
                        <InfoRow label="Created" value={formatDate(order.created_at)} />
                        <InfoRow label="Paid At" value={formatDate(order.paid_at)} />
                        <InfoRow label="Items" value={String(itemCount)} />
                        <InfoRow
                          label="Stripe Session"
                          value={order.stripe_session_id || '—'}
                        />
                      </div>
                    </div>

                    <OrderStatusForm
                      orderId={order.id}
                      currentStatus={order.status || 'pending'}
                      statusOptions={STATUS_OPTIONS}
                    />
                  </div>

                  <div className={styles.lineItemsSection}>
                    <h3 className={styles.lineItemsTitle}>Line Items</h3>

                    {orderItems.length === 0 ? (
                      <p className={styles.mutedText}>No items found.</p>
                    ) : (
                      <div className={styles.lineItemsList}>
                        {orderItems.map((item) => (
                          <div key={item.id} className={styles.lineItem}>
                            <div className={styles.lineItemMain}>
                              <div className={styles.lineItemName}>
                                {item.name || 'Unnamed item'}
                              </div>
                              <div className={styles.lineItemSubtext}>
                                Product ID: {item.product_id || '—'}
                              </div>
                            </div>

                            <div className={styles.lineItemCell}>
                              Qty: {item.quantity || 0}
                            </div>
                            <div className={styles.lineItemCell}>
                              {formatMoney(item.price)}
                            </div>
                            <div className={styles.lineItemCell}>
                              {formatMoney(
                                Number(item.price || 0) * Number(item.quantity || 0)
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </section>
        )}
      </div>
    </main>
  )
}

function SummaryCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryLabel}>{label}</div>
      <div className={styles.summaryValue}>{value}</div>
    </div>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className={styles.infoCard}>
      <div className={styles.infoLabel}>{label}</div>
      <div className={styles.infoValue}>{value}</div>
    </div>
  )
}