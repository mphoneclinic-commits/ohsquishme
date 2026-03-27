'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/components/CartProvider'
import styles from './cart.module.css'

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
  const [checkoutPhone, setCheckoutPhone] = useState('')

  async function handleCheckout() {
    if (!checkoutEmail.trim()) {
      alert('Please enter your email')
      return
    }

    if (!checkoutPhone.trim()) {
      alert('Please enter your phone number')
      return
    }

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        email: checkoutEmail.trim(),
        phone: checkoutPhone.trim(),
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
    <main className={styles.page}>
      <h1 className={styles.title}>Your Cart</h1>
      <p className={styles.subtitle}>
        {itemCount} item{itemCount === 1 ? '' : 's'} in cart
      </p>

      {items.length === 0 ? (
        <div className={styles.emptyCard}>
          <p>Your cart is empty.</p>
          <Link href="/shop" className={styles.continueLink}>
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className={styles.layout}>
          <section className={styles.items}>
            {items.map((item) => (
              <article key={item.id} className={styles.itemCard}>
                <div>
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className={styles.image}
                    />
                  ) : (
                    <div className={styles.imagePlaceholder}>No image</div>
                  )}
                </div>

                <div>
                  <div className={styles.itemTop}>
                    <div>
                      <h2 className={styles.itemName}>{item.name}</h2>
                      <p className={styles.itemPrice}>
                        ${item.price.toFixed(2)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className={styles.removeButton}
                    >
                      Remove
                    </button>
                  </div>

                  <div className={styles.qtyRow}>
                    <span>Qty</span>

                    <button
                      type="button"
                      onClick={() => decreaseQty(item.id)}
                      className={styles.qtyButton}
                    >
                      -
                    </button>

                    <div className={styles.qtyValue}>{item.quantity}</div>

                    <button
                      type="button"
                      onClick={() => increaseQty(item.id)}
                      className={styles.qtyButton}
                    >
                      +
                    </button>

                    <div className={styles.lineTotal}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <aside className={styles.summary}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <strong>${subtotal.toFixed(2)}</strong>
            </div>

            <p className={styles.summaryText}>
              Shipping and payment will be added at checkout.
            </p>

            <div className={styles.formFields}>
              <input
                type="email"
                value={checkoutEmail}
                onChange={(e) => setCheckoutEmail(e.target.value)}
                placeholder="Email for order confirmation"
                className={styles.input}
              />

              <input
                type="tel"
                value={checkoutPhone}
                onChange={(e) => setCheckoutPhone(e.target.value)}
                placeholder="Phone number (e.g. 04xxxxxxx)"
                className={styles.input}
              />
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className={styles.primaryButton}
            >
              Checkout
            </button>

            <button
              type="button"
              onClick={clearCart}
              className={styles.secondaryButton}
            >
              Clear Cart
            </button>
          </aside>
        </div>
      )}
    </main>
  )
}