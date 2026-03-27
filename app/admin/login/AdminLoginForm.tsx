'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './login.module.css'

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
    <form onSubmit={handleSubmit} className={styles.form}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Admin email"
        autoComplete="email"
        required
        className={styles.input}
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        autoComplete="current-password"
        required
        className={styles.input}
      />

      <button
        type="submit"
        disabled={saving}
        className={`${styles.primaryButton} ${
          saving ? styles.primaryButtonDisabled : ''
        }`}
      >
        {saving ? 'Signing in...' : 'Sign in'}
      </button>

      {errorMessage ? <div className={styles.error}>{errorMessage}</div> : null}
    </form>
  )
}