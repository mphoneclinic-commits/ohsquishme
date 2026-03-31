'use client'

import { useMemo, useState } from 'react'
import styles from './customers.module.css'
import { formatDateTime, formatDate, formatTime, formatRelativeTime } from '@/app/admin/utils'

type ProfileRow = {
  id: string
  email: string | null
  role: string
  created_at: string | null
}

export default function CustomerAdminList({
  initialCustomers,
}: {
  initialCustomers: ProfileRow[]
}) {
  const [query, setQuery] = useState('')
  const [customers, setCustomers] = useState(initialCustomers)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers

    return customers.filter((customer) =>
      [customer.email || '', customer.role || '', customer.id].join(' ').toLowerCase().includes(q)
    )
  }, [customers, query])

  return (
    <div className={styles.layout}>
      <div className={styles.topBar}>
        <div>
          <p className={styles.eyebrow}>Admin</p>
          <h1 className={styles.title}>Customers</h1>
        </div>
      </div>

      <div className={styles.card}>
        <input
          className={styles.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email, role, or user ID"
        />
      </div>

      <div className={styles.list}>
        {filtered.map((customer) => (
          <div key={customer.id} className={styles.card}>
            <div className={styles.grid}>
              <Info label="Email" value={customer.email || '—'} />
              <Info label="Role" value={customer.role} />
              <Info label="Created" value={formatDate(customer.created_at)} />
              <Info label="User ID" value={customer.id} mono />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Info({
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
      <div className={`${styles.infoValue} ${mono ? styles.mono : ''}`}>{value}</div>
    </div>
  )
}