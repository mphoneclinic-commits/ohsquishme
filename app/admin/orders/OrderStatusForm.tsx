'use client'

import { useState } from 'react'

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
    <div
      style={{
        minWidth: 220,
        display: 'grid',
        gap: 10,
      }}
    >
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 12,
          border: '1px solid #d9ccd3',
          background: '#fff',
        }}
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
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 12,
          border: '1px solid #111',
          background: '#111',
          color: '#fff',
          cursor: saving ? 'wait' : 'pointer',
          opacity: saving ? 0.75 : 1,
        }}
      >
        {saving ? 'Saving...' : 'Update Status'}
      </button>

      {message ? (
        <div
          style={{
            fontSize: 13,
            color: message === 'Saved' ? '#1d6f42' : '#b42318',
          }}
        >
          {message}
        </div>
      ) : null}
    </div>
  )
}