'use client'

import { useState } from 'react'
import styles from './customer-detail.module.css'

const ROLE_OPTIONS = ['customer', 'wholesale', 'admin'] as const

export default function CustomerRoleForm({
  userId,
  currentRole,
}: {
  userId: string
  currentRole: string
}) {
  const [role, setRole] = useState(currentRole)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSave() {
    const confirmed = window.confirm(
      `Change this user's role to "${role}"?`
    )

    if (!confirmed) return

    setSaving(true)
    setMessage('')

    try {
      const res = await fetch(`/api/admin/customers/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Failed to update role')
        setSaving(false)
        return
      }

      setMessage('Role updated')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.roleForm}>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className={styles.input}
      >
        {ROLE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className={styles.primaryButton}
      >
        {saving ? 'Saving...' : 'Update Role'}
      </button>

      {message ? <div className={styles.message}>{message}</div> : null}
    </div>
  )
}