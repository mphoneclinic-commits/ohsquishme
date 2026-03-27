'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginForm() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setErrorMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setErrorMessage(error.message)
      setSaving(false)
      return
    }

    router.push('/admin/orders')
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'grid',
        gap: 12,
      }}
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Admin email"
        autoComplete="email"
        required
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 12,
          border: '1px solid #d9ccd3',
          background: '#fff',
        }}
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        autoComplete="current-password"
        required
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 12,
          border: '1px solid #d9ccd3',
          background: '#fff',
        }}
      />

      <button
        type="submit"
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
        {saving ? 'Signing in...' : 'Sign in'}
      </button>

      {errorMessage ? (
        <div style={{ fontSize: 13, color: '#b42318' }}>{errorMessage}</div>
      ) : null}
    </form>
  )
}