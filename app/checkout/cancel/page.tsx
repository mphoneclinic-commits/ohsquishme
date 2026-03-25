import Link from 'next/link'

export default function CheckoutCancelPage() {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <h1>Checkout cancelled</h1>
      <p>Your payment was not completed. Your cart is still there.</p>
      <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
        <Link href="/cart" style={{ textDecoration: 'none', border: '1px solid #111', padding: '12px 16px', borderRadius: 10 }}>
          Back to Cart
        </Link>
        <Link href="/shop" style={{ textDecoration: 'none', border: '1px solid #111', padding: '12px 16px', borderRadius: 10 }}>
          Keep Shopping
        </Link>
      </div>
    </main>
  )
}