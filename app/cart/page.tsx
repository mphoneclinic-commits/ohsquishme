'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/components/CartProvider'

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    increaseQty,
    decreaseQty,
    removeItem,
    clearCart,
  } = useCart()

const [checkoutEmail, setCheckoutEmail] = useState('')


async function handleCheckout() {
  if (!checkoutEmail.trim()) {
    alert('Please enter your email')
    return
  }

  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items,
      email: checkoutEmail.trim(),
    }),
  })

  const data = await res.json()

  if (!res.ok || data.error) {
    alert(data.error || 'Checkout failed')
    return
  }

  if (data.url) {
    window.location.href = data.url
  }
}
  return (
    <main
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '40px 24px',
      }}
    >
      <h1 style={{ fontSize: '2.4rem', marginBottom: 12 }}>Your Cart</h1>
      <p style={{ marginTop: 0, marginBottom: 24 }}>
        {itemCount} item{itemCount === 1 ? '' : 's'} in cart
      </p>

      {items.length === 0 ? (
        <div
          style={{
            border: '1px solid #eadce3',
            borderRadius: 16,
            background: '#fff',
            padding: 24,
          }}
        >
          <p style={{ marginTop: 0 }}>Your cart is empty.</p>
          <Link
            href="/shop"
            style={{
              display: 'inline-block',
              marginTop: 12,
              padding: '12px 16px',
              border: '1px solid #111',
              borderRadius: 10,
              textDecoration: 'none',
            }}
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 320px',
            gap: 24,
            alignItems: 'start',
          }}
        >
          <section
            style={{
              display: 'grid',
              gap: 16,
            }}
          >
            {items.map((item) => (
              <article
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '96px minmax(0, 1fr)',
                  gap: 16,
                  border: '1px solid #eadce3',
                  borderRadius: 16,
                  background: '#fff',
                  padding: 16,
                }}
              >
                <div>
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      style={{
                        width: 96,
                        height: 96,
                        objectFit: 'cover',
                        borderRadius: 12,
                        background: '#f3f3f3',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: 12,
                        background: '#f0edf0',
                        display: 'grid',
                        placeItems: 'center',
                        color: '#7a6f76',
                      }}
                    >
                      No image
                    </div>
                  )}
                </div>

                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      alignItems: 'start',
                    }}
                  >
                    <div>
                      <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>
                        {item.name}
                      </h2>
                      <p style={{ margin: 0, fontWeight: 700 }}>
                        ${item.price.toFixed(2)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      style={{
                        border: '1px solid #d8c5ce',
                        background: '#fff',
                        borderRadius: 10,
                        padding: '8px 10px',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>Qty</span>

                    <button
                      type="button"
                      onClick={() => decreaseQty(item.id)}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        border: '1px solid #d8c5ce',
                        background: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      -
                    </button>

                    <div
                      style={{
                        minWidth: 36,
                        textAlign: 'center',
                        fontWeight: 700,
                      }}
                    >
                      {item.quantity}
                    </div>

                    <button
                      type="button"
                      onClick={() => increaseQty(item.id)}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        border: '1px solid #d8c5ce',
                        background: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      +
                    </button>

                    <div style={{ marginLeft: 'auto', fontWeight: 700 }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <aside
            style={{
              border: '1px solid #eadce3',
              borderRadius: 16,
              background: '#fff',
              padding: 20,
              position: 'sticky',
              top: 24,
            }}
          >
            <h2 style={{ marginTop: 0 }}>Order Summary</h2>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <span>Subtotal</span>
              <strong>${subtotal.toFixed(2)}</strong>
            </div>

            <p style={{ color: '#6f6268', fontSize: 14, lineHeight: 1.6 }}>
              Shipping and payment will be added at checkout.
            </p>
<input
  type="email"
  value={checkoutEmail}
  onChange={(e) => setCheckoutEmail(e.target.value)}
  placeholder="Email for order confirmation"
  style={{
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #d8c5ce',
    marginTop: 12,
    marginBottom: 12,
  }}
/>

   <button
  type="button"
  onClick={handleCheckout}
  style={{
    width: '100%',
    padding: '14px 16px',
    borderRadius: 10,
    border: '1px solid #111',
    background: '#111',
    color: '#fff',
    cursor: 'pointer',
    marginTop: 12,
  }}
>
  Checkout
</button>

            <button
              type="button"
              onClick={clearCart}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid #d8c5ce',
                background: '#fff',
                cursor: 'pointer',
                marginTop: 10,
              }}
            >
              Clear Cart
            </button>
          </aside>
        </div>
      )}
    </main>
  )
}