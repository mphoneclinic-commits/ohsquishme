import { Suspense } from 'react'
import SuccessContent from './SuccessContent'

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>Loading...</main>}>
      <SuccessContent />
    </Suspense>
  )
}