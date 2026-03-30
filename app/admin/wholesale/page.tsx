import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import styles from './wholesale.module.css'
import WholesaleAdminPanel from './WholesaleAdminPanel'

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

type WholesaleAccountRow = {
  id: string
  email: string | null
  role: string
  created_at: string | null
}

export default async function AdminWholesalePage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string
    status?: string
  }>
}) {
  await requireAdmin()

  const params = (await searchParams) || {}
  const initialQuery = (params.q || '').trim()
  const initialStatusFilter = (params.status || '').trim().toLowerCase()

  const { data: requestsData, error: requestsError } = await supabaseAdmin
    .from('wholesale_requests')
    .select(
      'id, user_id, email, business_name, contact_name, phone, website, notes, status, created_at'
    )
    .order('created_at', { ascending: false })

  if (requestsError) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.errorCard}>
            Failed to load wholesale requests: {requestsError.message}
          </div>
        </div>
      </main>
    )
  }

  const { data: accountsData, error: accountsError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role, created_at')
    .in('role', ['wholesale', 'admin'])
    .order('created_at', { ascending: false })

  if (accountsError) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.errorCard}>
            Failed to load wholesale accounts: {accountsError.message}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <WholesaleAdminPanel
          requests={(requestsData || []) as WholesaleRequestRow[]}
          accounts={(accountsData || []) as WholesaleAccountRow[]}
          initialQuery={initialQuery}
          initialStatusFilter={initialStatusFilter}
        />
      </div>
    </main>
  )
}