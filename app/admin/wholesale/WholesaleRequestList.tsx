'use client'

import { useState } from 'react'
import styles from './wholesale.module.css'

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

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function WholesaleRequestList({
  initialRequests,
}: {
  initialRequests: WholesaleRequestRow[]
}) {
  const [requests, setRequests] = useState(initialRequests)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setBusyId(id)

    try {
      const res = await fetch(`/api/admin/wholesale-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || `Failed to ${action} request`)
        setBusyId(null)
        return
      }

      setRequests((current) =>
        current.map((request) =>
          request.id === id
            ? { ...request, status: data.request.status }
            : request
        )
      )
    } finally {
      setBusyId(null)
    }
  }

  if (requests.length === 0) {
    return <div className={styles.emptyCard}>No wholesale requests yet.</div>
  }

  return (
    <section className={styles.requestList}>
      {requests.map((request) => {
        const isPending = request.status === 'pending'
        const isBusy = busyId === request.id

        return (
          <article key={request.id} className={styles.requestCard}>
            <div className={styles.requestHeader}>
              <div>
                <h2 className={styles.requestTitle}>{request.business_name}</h2>
                <p className={styles.requestMeta}>
                  Submitted {formatDate(request.created_at)}
                </p>
              </div>

              <span
                className={
                  request.status === 'approved'
                    ? styles.statusApproved
                    : request.status === 'rejected'
                    ? styles.statusRejected
                    : styles.statusPending
                }
              >
                {request.status}
              </span>
            </div>

            <div className={styles.infoGrid}>
              <InfoRow label="Email" value={request.email || '—'} />
              <InfoRow label="Contact" value={request.contact_name || '—'} />
              <InfoRow label="Phone" value={request.phone || '—'} />
              <InfoRow label="Website" value={request.website || '—'} />
              <InfoRow label="User ID" value={request.user_id} />
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
                onClick={() => handleAction(request.id, 'approve')}
                disabled={!isPending || isBusy}
                className={styles.approveButton}
              >
                {isBusy ? 'Working...' : 'Approve'}
              </button>

              <button
                type="button"
                onClick={() => handleAction(request.id, 'reject')}
                disabled={!isPending || isBusy}
                className={styles.rejectButton}
              >
                {isBusy ? 'Working...' : 'Reject'}
              </button>
            </div>
          </article>
        )
      })}
    </section>
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