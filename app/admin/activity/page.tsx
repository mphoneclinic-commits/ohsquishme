import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import styles from './activity.module.css'

export const dynamic = 'force-dynamic'

type ActivityRow = {
  id: string
  created_at: string | null
  admin_user_id: string | null
  event_type: string
  entity_type: string
  entity_id: string
  summary: string
  details: Record<string, unknown> | null
}

function formatDateTime(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatEventType(value: string) {
  return value.replaceAll('_', ' ')
}

function formatEntityType(value: string) {
  return value.replaceAll('_', ' ')
}

export default async function AdminActivityPage() {
  await requireAdmin()

  const { data, error } = await supabaseAdmin
    .from('admin_activity_logs')
    .select(
      'id, created_at, admin_user_id, event_type, entity_type, entity_id, summary, details'
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.errorCard}>
            Failed to load activity: {error.message}
          </div>
        </div>
      </main>
    )
  }

  const rows = (data || []) as ActivityRow[]

  const total = rows.length
  const stockCount = rows.filter((row) => row.entity_type === 'product').length
  const orderCount = rows.filter((row) => row.entity_type === 'order').length
  const wholesaleCount = rows.filter(
    (row) =>
      row.entity_type === 'wholesale_request' || row.entity_type === 'customer'
  ).length

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.topBar}>
          <div>
            <p className={styles.eyebrow}>Admin</p>
            <h1 className={styles.title}>Activity</h1>
            <p className={styles.subtitle}>
              Recent admin actions across stock, orders, and wholesale.
            </p>
          </div>
        </div>

        <section className={styles.summaryGrid}>
          <SummaryCard label="Recent Events" value={total} />
          <SummaryCard label="Stock Activity" value={stockCount} />
          <SummaryCard label="Order Activity" value={orderCount} />
          <SummaryCard label="Wholesale Activity" value={wholesaleCount} />
        </section>

        {rows.length === 0 ? (
          <div className={styles.emptyCard}>No admin activity recorded yet.</div>
        ) : (
          <section className={styles.list}>
            {rows.map((row) => (
              <article key={row.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.badges}>
                    <span className={styles.eventBadge}>
                      {formatEventType(row.event_type)}
                    </span>
                    <span className={styles.entityBadge}>
                      {formatEntityType(row.entity_type)}
                    </span>
                  </div>

                  <div className={styles.dateText}>
                    {formatDateTime(row.created_at)}
                  </div>
                </div>

                <h2 className={styles.summary}>{row.summary}</h2>

                <div className={styles.metaGrid}>
                  <InfoCard label="Entity ID" value={row.entity_id} mono />
                  <InfoCard
                    label="Admin User"
                    value={row.admin_user_id || '—'}
                    mono
                  />
                </div>

                {row.details ? (
                  <details className={styles.detailsBox}>
                    <summary className={styles.detailsSummary}>
                      View details
                    </summary>
                    <pre className={styles.detailsPre}>
                      {JSON.stringify(row.details, null, 2)}
                    </pre>
                  </details>
                ) : null}
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