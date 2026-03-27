'use client'

import { useState } from 'react'
import styles from './orders.module.css'

export default function OrderStatusForm({
  orderId,
  currentStatus,
  statusOptions,
}: {
  orderId: string
  currentStatus: string
  statusOptions: string[]
}) {
  const [status, setStatus] = useState(currentStatus)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSave() {
    setSaving(true)
    setMessage('')

    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    const data = await res.json()

    if (!res.ok) {
      setMessage(data.error || 'Failed to update order')
      setSaving(false)
      return
    }

    setMessage('Saved')
    setSaving(false)
  }

  return (
    <div className={styles.statusForm}>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className={styles.select}
      >
        {statusOptions.map((option) => (
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
        {saving ? 'Saving...' : 'Update Status'}
      </button>

      {message ? (
        <div
          className={
            message === 'Saved'
              ? styles.statusMessageSuccess
              : styles.statusMessageError
          }
        >
          {message}
        </div>
      ) : null}
    </div>
  )
}