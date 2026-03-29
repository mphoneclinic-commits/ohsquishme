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
    setItemQuantity,
    increaseQty,
    decreaseQty,
    removeItem,
    clearCart,
  } = useCart()

  const [checkoutEmail, setCheckoutEmail] = useState('')
  const [checkoutPhone, setCheckoutPhone] = useState('')

  const [shippingName, setShippingName] = useState('')
  const [shippingPhone, setShippingPhone] = useState('')
  const [shippingAddressLine1, setShippingAddressLine1] = useState('')
  const [shippingAddressLine2, setShippingAddressLine2] = useState('')
  const [shippingSuburb, setShippingSuburb] = useState('')
  const [shippingState, setShippingState] = useState('')
  const [shippingPostcode, setShippingPostcode] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')

  async function handleCheckout() {
    if (!checkoutEmail.trim()) {
      alert('Please enter your email')
      return
    }

    if (!checkoutPhone.trim()) {
      alert('Please enter your phone number')
      return
    }

    if (!shippingName.trim()) {
      alert('Please enter the shipping name')
      return
    }

    if (!shippingPhone.trim()) {
      alert('Please enter the shipping phone number')
      return
    }

    if (!shippingAddressLine1.trim()) {
      alert('Please enter address line 1')
      return
    }

    if (!shippingSuburb.trim()) {
      alert('Please enter the suburb')
      return
    }

    if (!shippingState.trim()) {
      alert('Please enter the state')
      return
    }

    if (!shippingPostcode.trim()) {
      alert('Please enter the postcode')
      return
    }

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        email: checkoutEmail.trim(),
        phone: checkoutPhone.trim(),
        shipping_name: shippingName.trim(),
        shipping_phone: shippingPhone.trim(),
        shipping_address_line1: shippingAddressLine1.trim(),
        shipping_address_line2: shippingAddressLine2.trim(),
        shipping_suburb: shippingSuburb.trim(),
        shipping_state: shippingState.trim(),
        shipping_postcode: shippingPostcode.trim(),
        delivery_notes: deliveryNotes.trim(),
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

                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const value = e.target.value

                        if (value === '') {
                          setItemQuantity(item.id, 1)
                          return
                        }

                        const nextQty = Math.max(1, Math.floor(Number(value) || 1))
                        setItemQuantity(item.id, nextQty)
                      }}
                      className={styles.qtyInput}
                    />

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
                placeholder="Phone number"
                className={styles.input}
              />

              <input
                type="text"
                value={shippingName}
                onChange={(e) => setShippingName(e.target.value)}
                placeholder="Shipping full name"
                className={styles.input}
              />

              <input
                type="tel"
                value={shippingPhone}
                onChange={(e) => setShippingPhone(e.target.value)}
                placeholder="Shipping phone"
                className={styles.input}
              />

              <input
                type="text"
                value={shippingAddressLine1}
                onChange={(e) => setShippingAddressLine1(e.target.value)}
                placeholder="Address line 1"
                className={styles.input}
              />

              <input
                type="text"
                value={shippingAddressLine2}
                onChange={(e) => setShippingAddressLine2(e.target.value)}
                placeholder="Address line 2 (optional)"
                className={styles.input}
              />

              <input
                type="text"
                value={shippingSuburb}
                onChange={(e) => setShippingSuburb(e.target.value)}
                placeholder="Suburb"
                className={styles.input}
              />

              <div className={styles.twoCol}>
                <input
                  type="text"
                  value={shippingState}
                  onChange={(e) => setShippingState(e.target.value)}
                  placeholder="State"
                  className={styles.input}
                />

                <input
                  type="text"
                  value={shippingPostcode}
                  onChange={(e) => setShippingPostcode(e.target.value)}
                  placeholder="Postcode"
                  className={styles.input}
                />
              </div>

              <textarea
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Delivery notes (optional)"
                className={styles.textarea}
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