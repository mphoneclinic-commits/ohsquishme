'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './wholesale.module.css'
import { formatDateTime, formatDate, formatTime, formatRelativeTime } from '@/app/admin/utils'


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

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

function normalizeStatusFilter(value: string): StatusFilter {
  if (value === 'pending') return 'pending'
  if (value === 'approved') return 'approved'
  if (value === 'rejected') return 'rejected'
  return 'all'
}

export default function WholesaleAdminPanel({
  requests,
  accounts,
  initialQuery = '',
  initialStatusFilter = 'all',
}: {
  requests: WholesaleRequestRow[]
  accounts: WholesaleAccountRow[]
  initialQuery?: string
  initialStatusFilter?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [requestRows, setRequestRows] = useState(requests)
  const [accountRows, setAccountRows] = useState(accounts)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [query, setQuery] = useState(initialQuery)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    normalizeStatusFilter(initialStatusFilter)
  )
  const [toast, setToast] = useState('')

  useEffect(() => {
    const nextQuery = searchParams.get('q') || ''
    const nextStatus = normalizeStatusFilter(searchParams.get('status') || 'all')

    if (nextQuery !== query) {
      setQuery(nextQuery)
    }

    if (nextStatus !== statusFilter) {
      setStatusFilter(nextStatus)
    }
  }, [searchParams])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())

      const trimmedQuery = query.trim()

      if (trimmedQuery) {
        params.set('q', trimmedQuery)
      } else {
        params.delete('q')
      }

      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      } else {
        params.delete('status')
      }

      const next = params.toString()
      const current = searchParams.toString()

      if (next !== current) {
        router.replace(next ? `${pathname}?${next}` : pathname, {
          scroll: false,
        })
      }
    }, 250)

    return () => window.clearTimeout(timer)
  }, [query, statusFilter, pathname, router, searchParams])

  useEffect(() => {
    const supabase = createClient()

    const wholesaleRequestsChannel = supabase
      .channel('admin-wholesale-requests-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wholesale_requests',
        },
        async () => {
          const { data, error } = await supabase
            .from('wholesale_requests')
            .select(
              'id, user_id, email, business_name, contact_name, phone, website, notes, status, created_at'
            )
            .order('created_at', { ascending: false })

          if (error) {
            console.error('Failed to refresh wholesale requests:', error)
            return
          }

          setRequestRows((data || []) as WholesaleRequestRow[])
        }
      )
      .subscribe()

    const profilesChannel = supabase
      .channel('admin-wholesale-accounts-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, email, role, created_at')
            .in('role', ['wholesale', 'admin'])
            .order('created_at', { ascending: false })

          if (error) {
            console.error('Failed to refresh wholesale accounts:', error)
            return
          }

          setAccountRows((data || []) as WholesaleAccountRow[])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(wholesaleRequestsChannel)
      supabase.removeChannel(profilesChannel)
    }
  }, [])

  const filteredRequests = useMemo(() => {
    const q = query.trim().toLowerCase()

    return requestRows.filter((request) => {
      const matchesStatus =
        statusFilter === 'all' ? true : request.status === statusFilter

      const haystack = [
        request.business_name,
        request.email || '',
        request.contact_name || '',
        request.phone || '',
        request.website || '',
        request.notes || '',
        request.user_id,
        request.status,
      ]
        .join(' ')
        .toLowerCase()

      const matchesQuery = q ? haystack.includes(q) : true
      return matchesStatus && matchesQuery
    })
  }, [requestRows, query, statusFilter])

  const pendingRequests = useMemo(
    () => filteredRequests.filter((request) => request.status === 'pending'),
    [filteredRequests]
  )

  const processedRequests = useMemo(
    () => filteredRequests.filter((request) => request.status !== 'pending'),
    [filteredRequests]
  )

  const filteredAccounts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return accountRows

    return accountRows.filter((account) =>
      [account.email || '', account.role, account.id]
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [accountRows, query])

  function showToast(text: string) {
    setToast(text)
    window.setTimeout(() => setToast(''), 2000)
  }

  async function handleRequestAction(id: string, action: 'approve' | 'reject') {
    setBusyId(id)

    try {
      const res = await fetch(`/api/admin/wholesale-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        alert(data?.error || `Failed to ${action} request`)
        return
      }

      if (action === 'approve') {
        showToast('Request approved')
      } else {
        showToast('Request rejected')
      }
    } finally {
      setBusyId(null)
    }
  }

  async function handleDowngrade(userId: string) {
    const confirmed = window.prompt(
      'Type REMOVE to confirm removing wholesale access'
    )
    if (confirmed !== 'REMOVE') return

    setBusyId(userId)

    try {
      const res = await fetch(`/api/admin/customers/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'customer' }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        alert(data?.error || 'Failed to update role')
        return
      }

      setAccountRows((current) =>
        current.filter((account) => account.id !== userId)
      )

      setRequestRows((current) =>
        current.filter(
          (request) => !(request.user_id === userId && request.status === 'approved')
        )
      )

      showToast('Wholesale access removed')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDeleteRequest(requestId: string) {
    const confirmed = window.prompt(
      'Type DELETE to confirm removing this request'
    )
    if (confirmed !== 'DELETE') return

    setBusyId(requestId)

    try {
      const res = await fetch(`/api/admin/wholesale-requests/${requestId}`, {
        method: 'DELETE',
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        alert(data?.error || 'Failed to delete request')
        return
      }

      setRequestRows((current) =>
        current.filter((request) => request.id !== requestId)
      )

      showToast('Request deleted')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className={styles.layout}>
      <div className={styles.topBar}>
        <div>
          <p className={styles.eyebrow}>Admin</p>
          <h1 className={styles.title}>Wholesale</h1>
          <p className={styles.subtitle}>
            Review incoming requests and manage approved wholesale access.
          </p>
        </div>
      </div>

      <section className={styles.summaryGrid}>
        <SummaryCard
          label="Pending Requests"
          value={requestRows.filter((r) => r.status === 'pending').length}
        />
        <SummaryCard label="Approved Accounts" value={accountRows.length} />
        <SummaryCard
          label="Processed Requests"
          value={requestRows.filter((r) => r.status !== 'pending').length}
        />
      </section>

      <section className={styles.filterBar}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search business, email, phone, notes, user ID..."
          className={styles.input}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(normalizeStatusFilter(e.target.value))}
          className={styles.select}
        >
          <option value="all">All request statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Pending Requests</h2>
        </div>

        {pendingRequests.length === 0 ? (
          <div className={styles.emptyCard}>No pending wholesale requests.</div>
        ) : (
          <div className={styles.requestList}>
            {pendingRequests.map((request) => {
            const isBusy = busyId === request.id

              return (
                <article key={request.id} className={styles.requestCard}>
                  <div className={styles.requestHeader}>
                    <div>
                      <h3 className={styles.requestTitle}>
                        {request.business_name}
                      </h3>
                      <p className={styles.requestMeta}>
                        Submitted {formatDate(request.created_at)}
                      </p>
                    </div>

                    <span className={styles.statusPending}>pending</span>
                  </div>

                  <div className={styles.infoGrid}>
                    <InfoCard label="Email" value={request.email || '—'} />
                    <InfoCard
                      label="Contact"
                      value={request.contact_name || '—'}
                    />
                    <InfoCard label="Phone" value={request.phone || '—'} />
                    <InfoCard label="Website" value={request.website || '—'} />
                    <InfoCard label="User ID" value={request.user_id} mono />
                  </div>

                  {request.notes ? (
                    <div className={styles.notesBox}>
                      <div className={styles.notesLabel}>Notes</div>
                      <div className={styles.notesText}>{request.notes}</div>
                    </div>
                  ) : null}

                  <div className={styles.actionRow}>
                    <button
                      type="button"
                      onClick={() =>
                        handleRequestAction(request.id, 'approve')
                      }
                      disabled={isBusy}
                      className={styles.approveButton}
                    >
                      {isBusy ? 'Working...' : 'Approve'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleRequestAction(request.id, 'reject')
                      }
                      disabled={isBusy}
                      className={styles.rejectButton}
                    >
                      {isBusy ? 'Working...' : 'Reject'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Approved Accounts</h2>
        </div>

        {filteredAccounts.length === 0 ? (
          <div className={styles.emptyCard}>
            No approved wholesale accounts found.
          </div>
        ) : (
          <div className={styles.accountList}>
            {filteredAccounts.map((account) => {
              const isBusy = busyId === account.id

              return (
                <article key={account.id} className={styles.accountCard}>
                  <div className={styles.accountHeader}>
                    <div>
                      <h3 className={styles.accountTitle}>
                        {account.email || 'No email'}
                      </h3>
                      <p className={styles.accountMeta}>
                        Created {formatDate(account.created_at)}
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

                  <div className={styles.infoGrid}>
                    <InfoCard label="Email" value={account.email || '—'} />
                    <InfoCard label="Role" value={account.role} />
                    <InfoCard
                      label="Created"
                      value={formatDate(account.created_at)}
                    />
                    <InfoCard label="User ID" value={account.id} mono />
                  </div>

                  {account.role === 'wholesale' ? (
                    <div className={styles.actionRow}>
                      <button
                        type="button"
                        onClick={() => handleDowngrade(account.id)}
                        disabled={isBusy}
                        className={styles.rejectButton}
                      >
                        {isBusy ? 'Working...' : 'Remove Wholesale Access'}
                      </button>
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        )}
      </section>

      {processedRequests.length > 0 ? (
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Processed Requests</h2>
          </div>

          <div className={styles.requestList}>
            {processedRequests.map((request) => {
              const isBusy = busyId === request.id

              return (
                <article key={request.id} className={styles.requestCard}>
                  <div className={styles.requestHeader}>
                    <div>
                      <h3 className={styles.requestTitle}>
                        {request.business_name}
                      </h3>
                      <p className={styles.requestMeta}>
                        Submitted {formatDate(request.created_at)}
                      </p>
                    </div>

                    <span
                      className={
                        request.status === 'approved'
                          ? styles.statusApproved
                          : styles.statusRejected
                      }
                    >
                      {request.status}
                    </span>
                  </div>

                  <div className={styles.infoGrid}>
                    <InfoCard label="Email" value={request.email || '—'} />
                    <InfoCard
                      label="Contact"
                      value={request.contact_name || '—'}
                    />
                    <InfoCard label="Phone" value={request.phone || '—'} />
                    <InfoCard label="Website" value={request.website || '—'} />
                  </div>

                  <div className={styles.actionRow}>
                    {request.status === 'approved' ? (
                      <button
                        type="button"
                        onClick={() => handleDowngrade(request.user_id)}
                        disabled={isBusy}
                        className={styles.rejectButton}
                      >
                        {isBusy ? 'Working...' : 'Remove Wholesale Access'}
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => handleDeleteRequest(request.id)}
                      disabled={isBusy}
                      className={styles.deleteButton}
                    >
                      {isBusy ? 'Working...' : 'Delete Request'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </div>
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