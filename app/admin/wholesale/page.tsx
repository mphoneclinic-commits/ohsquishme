import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import AdminSubnav from '@/components/AdminSubnav'
import WholesaleRequestList from './WholesaleRequestList'
import styles from './wholesale.module.css'

export const dynamic = 'force-dynamic'

type WholesaleRequestRow = {
  id: string
  user_id: string
  email: string | null
  business_name: string
  contact_name: string | null
  phone: string | null
  website: string | null
  notes: string | null
  status: string
  created_at: string | null
}

export default async function AdminWholesalePage() {
  await requireAdmin()

  const { data, error } = await supabaseAdmin
    .from('wholesale_requests')
    .select(
      'id, user_id, email, business_name, contact_name, phone, website, notes, status, created_at'
    )
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <AdminSubnav />
          <div className={styles.errorCard}>
            Failed to load wholesale requests: {error.message}
          </div>
        </div>
      </main>
    )
  }

  const requests = (data || []) as WholesaleRequestRow[]

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <AdminSubnav />

        <div className={styles.topBar}>
          <div>
            <p className={styles.eyebrow}>Admin</p>
            <h1 className={styles.title}>Wholesale Requests</h1>
          </div>
        </div>

        <WholesaleRequestList initialRequests={requests} />
      </div>
    </main>
  )
}