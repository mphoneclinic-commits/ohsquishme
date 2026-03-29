import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import AccountAuthCard from './AccountAuthCard'
import AccountPanel from './AccountPanel'
import styles from './account.module.css'

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
  paid_at: string | null
  tracking_number: string | null
  courier: string | null
  packed_at: string | null
  shipped_at: string | null
  completed_at: string | null
  shipping_name: string | null
  shipping_phone: string | null
  shipping_address_line1: string | null
  shipping_address_line2: string | null
  shipping_suburb: string | null
  shipping_state: string | null
  shipping_postcode: string | null
}

type OrderItemRow = {
  id: string
  order_id: string
  name: string | null
  price: number | string | null
  quantity: number | null
}

type WholesaleRequestRow = {
  id: string
  status: string
  business_name: string
  created_at: string | null
}

export default async function AccountPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: ProfileRow | null = null
  let orders: OrderRow[] = []
  let orderItems: OrderItemRow[] = []
  let wholesaleRequest: WholesaleRequestRow | null = null

  if (user) {
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        email,
        role,
        created_at
      `)
      .eq('id', user.id)
      .single()

    profile = (profileData as ProfileRow | null) ?? null

    const { data: wholesaleData } = await supabaseAdmin
      .from('wholesale_requests')
      .select('id, status, business_name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    wholesaleRequest = (wholesaleData as WholesaleRequestRow | null) ?? null

    if (user.email) {
      const { data: ordersData } = await supabaseAdmin
        .from('orders')
        .select(`
          id,
          email,
          total,
          status,
          created_at,
          paid_at,
          tracking_number,
          courier,
          packed_at,
          shipped_at,
          completed_at,
          shipping_name,
          shipping_phone,
          shipping_address_line1,
          shipping_address_line2,
          shipping_suburb,
          shipping_state,
          shipping_postcode
        `)
        .eq('email', user.email)
        .order('created_at', { ascending: false })

      orders = (ordersData as OrderRow[] | null) ?? []

      const orderIds = orders.map((order) => order.id)

      if (orderIds.length > 0) {
        const { data: itemsData } = await supabaseAdmin
          .from('order_items')
          .select('id, order_id, name, price, quantity')
          .in('order_id', orderIds)

        orderItems = (itemsData as OrderItemRow[] | null) ?? []
      }
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Account</p>
          <h1 className={styles.title}>Your account</h1>
          <p className={styles.subtitle}>
            Sign in to manage your account, review orders, and check your wholesale status.
          </p>
        </section>

        {user ? (
          <AccountPanel
            email={user.email ?? profile?.email ?? ''}
            role={profile?.role ?? 'customer'}
            createdAt={profile?.created_at ?? null}
            orders={orders}
            orderItems={orderItems}
            wholesaleRequest={wholesaleRequest}
          />
        ) : (
          <AccountAuthCard />
        )}
      </div>
    </main>
  )
}