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

  const wholesaleCount = accounts.filter((a) => a.role === 'wholesale').length
  const adminCount = accounts.filter((a) => a.role === 'admin').length

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <AdminSubnav />

        <div className={styles.topBar}>
          <div>
            <p className={styles.eyebrow}>Admin</p>
            <h1 className={styles.title}>Wholesale Accounts</h1>
            <p className={styles.subtitle}>
              View accounts with wholesale or admin pricing access.
            </p>
          </div>
        </div>

        <section className={styles.summaryGrid}>
          <SummaryCard label="Total Access Accounts" value={accounts.length} />
          <SummaryCard label="Wholesale" value={wholesaleCount} />
          <SummaryCard label="Admin" value={adminCount} />
        </section>

        {accounts.length === 0 ? (
          <div className={styles.emptyCard}>No wholesale accounts found.</div>
        ) : (
          <section className={styles.accountList}>
            {accounts.map((account) => (
              <article key={account.id} className={styles.accountCard}>
                <div className={styles.accountHeader}>
                  <div>
                    <h2 className={styles.accountTitle}>
                      {account.email || 'No email'}
                    </h2>
                    <p className={styles.accountMeta}>
                      Member since {formatDate(account.created_at)}
                    </p>
                  </div>

                  <span
                    className={
                      account.role === 'admin'
                        ? styles.roleAdmin
                        : styles.roleWholesale
                    }
                  >
                    {account.role}
                  </span>
                </div>

                <div className={styles.accountGrid}>
                  <InfoRow label="Email" value={account.email || '—'} />
                  <InfoRow label="Role" value={account.role} />
                  <InfoRow
                    label="Member since"
                    value={formatDate(account.created_at)}
                  />
                  <InfoRow label="User ID" value={account.id} mono />
                </div>
              </article>
            ))}
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