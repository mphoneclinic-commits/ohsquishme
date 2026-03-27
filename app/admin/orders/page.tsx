import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/auth'
import OrderStatusForm from './OrderStatusForm'
import AdminLogoutButton from './AdminLogoutButton'

export const dynamic = 'force-dynamic'

type OrderRow = {
  id: string
  email: string | null
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
    .select('id, email, total, status, created_at, paid_at, stripe_session_id')
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
    <main
      style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '32px 24px 56px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 24,
        }}
      >
        <div>
          <p
            style={{
              margin: '0 0 8px',
              fontSize: 13,
              textTransform: 'uppercase',
              letterSpacing: 1.4,
              color: '#7a6f76',
            }}
          >
            Admin
          </p>
          <h1 style={{ margin: 0, fontSize: '2.2rem' }}>Orders Dashboard</h1>
        </div>

     <div
  style={{
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  }}
>
  <Link
    href="/shop"
    style={{
      textDecoration: 'none',
      border: '1px solid #d9ccd3',
      background: '#fff',
      borderRadius: 12,
      padding: '12px 14px',
    }}
  >
    View Store
  </Link>

  <AdminLogoutButton />
</div>


      </div>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 22,
        }}
      >
        <SummaryCard label="All Orders" value={counts.all} />
        <SummaryCard label="Paid" value={counts.paid} />
        <SummaryCard label="Packed" value={counts.packed} />
        <SummaryCard label="Shipped" value={counts.shipped} />
        <SummaryCard label="Stock Issues" value={counts.stock_issue} />
        <SummaryCard label="Payment Failed" value={counts.payment_failed} />
      </section>

      <form
        method="GET"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 220px auto',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by email, order id, item name..."
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 12,
            border: '1px solid #d9ccd3',
            background: '#fff',
          }}
        />

        <select
          name="status"
          defaultValue={statusFilter}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 12,
            border: '1px solid #d9ccd3',
            background: '#fff',
          }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <button
          type="submit"
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid #111',
            background: '#111',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Apply
        </button>
      </form>

      {filteredOrders.length === 0 ? (
        <div
          style={{
            border: '1px solid #eadce3',
            borderRadius: 18,
            background: '#fff',
            padding: 24,
          }}
        >
          No matching orders found.
        </div>
      ) : (
        <section
          style={{
            display: 'grid',
            gap: 18,
          }}
        >
          {filteredOrders.map((order) => {
            const orderItems = itemsByOrderId.get(order.id) || []
            const itemCount = orderItems.reduce(
              (sum, item) => sum + Number(item.quantity || 0),
              0
            )

            return (
              <article
                key={order.id}
                style={{
                  border: '1px solid #eadce3',
                  borderRadius: 18,
                  background: '#fff',
                  padding: 20,
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) auto',
                    gap: 18,
                    alignItems: 'start',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 10,
                        alignItems: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <h2 style={{ margin: 0, fontSize: 20 }}>
                        Order {order.id.slice(0, 8)}
                      </h2>

                      <span
                        style={{
                          display: 'inline-block',
                          padding: '6px 10px',
                          borderRadius: 999,
                          background: '#f5ecf1',
                          border: '1px solid #eadce3',
                          fontSize: 13,
                          textTransform: 'capitalize',
                        }}
                      >
                        {order.status || 'unknown'}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: 10,
                        marginBottom: 16,
                      }}
                    >
                      <InfoRow label="Customer Email" value={order.email || '—'} />
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

                <div
                  style={{
                    marginTop: 18,
                    borderTop: '1px solid #f0e5ea',
                    paddingTop: 16,
                  }}
                >
                  <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Line Items</h3>

                  {orderItems.length === 0 ? (
                    <p style={{ margin: 0, color: '#7a6f76' }}>No items found.</p>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gap: 10,
                      }}
                    >
                      {orderItems.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 1fr) 100px 100px 120px',
                            gap: 12,
                            padding: '12px 14px',
                            borderRadius: 12,
                            background: '#fff8fb',
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.name || 'Unnamed item'}
                            </div>
                            <div style={{ fontSize: 13, color: '#7a6f76' }}>
                              Product ID: {item.product_id || '—'}
                            </div>
                          </div>

                          <div>Qty: {item.quantity || 0}</div>
                          <div>{formatMoney(item.price)}</div>
                          <div>
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
    <div
      style={{
        border: '1px solid #eadce3',
        background: '#fff',
        borderRadius: 16,
        padding: 18,
      }}
    >
      <div style={{ fontSize: 13, color: '#7a6f76', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
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
    <div
      style={{
        border: '1px solid #f0e5ea',
        borderRadius: 12,
        padding: '10px 12px',
        background: '#fffdfd',
      }}
    >
      <div style={{ fontSize: 12, color: '#7a6f76', marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontSize: 14,
          wordBreak: 'break-word',
        }}
      >
        {value}
      </div>
    </div>
  )
}