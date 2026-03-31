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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return initialCustomers

    return initialCustomers.filter((customer) =>
      [customer.email || '', customer.role || '', customer.id]
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [initialCustomers, query])

  const customerCount = initialCustomers.filter((c) => c.role === 'customer').length
  const wholesaleCount = initialCustomers.filter((c) => c.role === 'wholesale').length
  const adminCount = initialCustomers.filter((c) => c.role === 'admin').length

  return (
    <div className={styles.layout}>
      <div className={styles.topBar}>
        <div>
          <p className={styles.eyebrow}>Admin</p>
          <h1 className={styles.title}>Customers</h1>
          <p className={styles.subtitle}>
            Search and review customer, wholesale, and admin accounts.
          </p>
        </div>
      </div>

      <section className={styles.summaryGrid}>
        <SummaryCard label="Total Accounts" value={initialCustomers.length} />
        <SummaryCard label="Customers" value={customerCount} />
        <SummaryCard label="Wholesale" value={wholesaleCount} />
        <SummaryCard label="Admins" value={adminCount} />
      </section>

      <div className={styles.card}>
        <input
          className={styles.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email, role, or user ID"
        />
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.emptyCard}>No matching accounts found.</div>
        ) : (
          filtered.map((customer) => (
         <article key={customer.id} className={styles.card}>
  <div className={styles.accountHeader}>
    <div>
      <h2 className={styles.accountTitle}>{customer.email || 'No email'}</h2>
      <p className={styles.accountMeta}>
        Created {formatDate(customer.created_at)}
      </p>
    </div>

    <span
      className={
        customer.role === 'admin'
          ? styles.roleAdmin
          : customer.role === 'wholesale'
          ? styles.roleWholesale
          : styles.roleCustomer
      }
    >
      {customer.role}
    </span>
  </div>

  <div className={styles.grid}>
    <Info label="Email" value={customer.email || '—'} />
    <Info label="Role" value={customer.role} />
    <Info label="Created" value={formatDate(customer.created_at)} />
    <Info label="User ID" value={customer.id} mono />
  </div>

  <div className={styles.actionRow}>
    <a href={`/admin/customers/${customer.id}`} className={styles.secondaryLink}>
      Open Customer
    </a>
  </div>
</article>
          ))
        )}
      </div>
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
      <div className={`${styles.infoValue} ${mono ? styles.mono : ''}`}>
        {value}
      </div>
    </div>
  )
}