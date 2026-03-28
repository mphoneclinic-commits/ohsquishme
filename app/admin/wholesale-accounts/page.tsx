import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import AdminSubnav from '@/components/AdminSubnav'
import styles from './wholesale-accounts.module.css'

export const dynamic = 'force-dynamic'

type ProfileRow = {
  id: string
  email: string | null
  role: string
  created_at: string | null
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default async function AdminWholesaleAccountsPage() {
  await requireAdmin()

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role, created_at')
    .in('role', ['wholesale', 'admin'])
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <AdminSubnav />
          <div className={styles.errorCard}>
            Failed to load wholesale accounts: {error.message}
          </div>
        </div>
      </main>
    )
  }

  const accounts = (data || []) as ProfileRow[]

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <AdminSubnav />

        <div className={styles.topBar}>
          <div>
            <p className={styles.eyebrow}>Admin</p>
            <h1 className={styles.title}>Wholesale Accounts</h1>
          </div>
        </div>

        {accounts.length === 0 ? (
          <div className={styles.emptyCard}>No wholesale accounts found.</div>
        ) : (
          <section className={styles.accountList}>
            {accounts.map((account) => (
              <article key={account.id} className={styles.accountCard}>
                <div className={styles.accountGrid}>
                  <InfoRow label="Email" value={account.email || '—'} />
                  <InfoRow label="Role" value={account.role} />
                  <InfoRow label="Member since" value={formatDate(account.created_at)} />
                  <InfoRow label="User ID" value={account.id} />
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
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