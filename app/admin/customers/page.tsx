import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

import CustomerAdminList from './CustomerAdminList'
import styles from './customers.module.css'

export const dynamic = 'force-dynamic'

type ProfileRow = {
  id: string
  email: string | null
  role: string
  created_at: string | null
}

export default async function AdminCustomersPage() {
  await requireAdmin()

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          
          <div className={styles.errorCard}>
            Failed to load customers: {error.message}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
     
        <CustomerAdminList initialCustomers={(data || []) as ProfileRow[]} />
      </div>
    </main>
  )
}