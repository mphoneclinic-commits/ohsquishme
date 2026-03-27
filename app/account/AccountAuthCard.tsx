'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './account.module.css'

type Mode = 'sign_in' | 'sign_up'

export default function AccountAuthCard() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<Mode>('sign_in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setErrorMessage('')

    try {
      if (!email.trim()) {
        setErrorMessage('Email is required')
        setSaving(false)
        return
      }

      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters')
        setSaving(false)
        return
      }

      if (mode === 'sign_up' && password !== confirmPassword) {
        setErrorMessage('Passwords do not match')
        setSaving(false)
        return
      }

      if (mode === 'sign_in') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) {
          setErrorMessage(error.message)
          setSaving(false)
          return
        }

        router.refresh()
        return
      }

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })

      if (error) {
        setErrorMessage(error.message)
        setSaving(false)
        return
      }

      setMessage(
        'Account created. If email confirmation is enabled, check your inbox before signing in.'
      )
      setMode('sign_in')
      setConfirmPassword('')
      setPassword('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={styles.card}>
      <div className={styles.modeTabs}>
        <button
          type="button"
          onClick={() => setMode('sign_in')}
          className={`${styles.modeButton} ${
            mode === 'sign_in' ? styles.modeButtonActive : ''
          }`}
        >
          Sign in
        </button>

        <button
          type="button"
          onClick={() => setMode('sign_up')}
          className={`${styles.modeButton} ${
            mode === 'sign_up' ? styles.modeButtonActive : ''
          }`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          required
          className={styles.input}
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete={
            mode === 'sign_in' ? 'current-password' : 'new-password'
          }
          required
          className={styles.input}
        />

        {mode === 'sign_up' ? (
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            autoComplete="new-password"
            required
            className={styles.input}
          />
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className={styles.primaryButton}
        >
          {saving
            ? 'Please wait...'
            : mode === 'sign_in'
            ? 'Sign in'
            : 'Create account'}
        </button>

        {message ? <div className={styles.successBox}>{message}</div> : null}
        {errorMessage ? <div className={styles.errorBox}>{errorMessage}</div> : null}
      </form>

      <div className={styles.helpBox}>
        <strong>Wholesale access</strong>
        <p>
          Create a normal account first. Wholesale pricing is enabled after your
          account is approved and your role is changed to wholesale.
        </p>
      </div>
    </section>
  )
}