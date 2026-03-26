'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    try {
      localStorage.removeItem('taba-cart')
      window.dispatchEvent(new Event('storage'))
    } catch (error) {
      console.error('Failed to clear cart', error)
    }
  }, [])

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <h1>Thanks, your payment was submitted</h1>
      <p>We’ve received your checkout and are processing your order.</p>
      {sessionId ? <p>Session: {sessionId}</p> : null}

      <div style={{ marginTop: 20 }}>
        <Link
          href="/shop"
          style={{
            textDecoration: 'none',
            border: '1px solid #111',
            padding: '12px 16px',
            borderRadius: 10,
          }}
        >
          Continue Shopping
        </Link>
      </div>
    </main>
  )
}