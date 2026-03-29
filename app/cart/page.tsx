'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useCart } from '@/components/CartProvider'
import styles from './cart.module.css'

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, '')
}

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

  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const estimatedShippingText = useMemo(() => {
    if (subtotal >= 80) return 'Shipping calculated at checkout'
    return 'Shipping calculated at checkout'
  }, [subtotal])

  async function handleCheckout() {
    setErrorMessage('')

    const email = checkoutEmail.trim()
    const phone = normalizePhone(checkoutPhone.trim())
    const shipName = shippingName.trim()
    const shipPhone = normalizePhone(shippingPhone.trim())
    const line1 = shippingAddressLine1.trim()
    const suburb = shippingSuburb.trim()
    const state = shippingState.trim()
    const postcode = shippingPostcode.trim()

    if (items.length === 0) {
      setErrorMessage('Your cart is empty.')
      return
    }

    if (!email) {
      setErrorMessage('Please enter your email.')
      return
    }

    if (!phone) {
      setErrorMessage('Please enter your phone number.')
      return
    }

    if (!shipName) {
      setErrorMessage('Please enter the shipping name.')
      return
    }

    if (!shipPhone) {
      setErrorMessage('Please enter the shipping phone number.')
      return
    }

    if (!line1) {
      setErrorMessage('Please enter address line 1.')
      return
    }

    if (!suburb) {
      setErrorMessage('Please enter the suburb.')
      return
    }

    if (!state) {
      setErrorMessage('Please enter the state.')
      return
    }

    if (!postcode) {
      setErrorMessage('Please enter the postcode.')
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          email,
          phone,
          shipping_name: shipName,
          shipping_phone: shipPhone,
          shipping_address_line1: line1,
          shipping_address_line2: shippingAddressLine2.trim(),
          shipping_suburb: suburb,
          shipping_state: state,
          shipping_postcode: postcode,
          delivery_notes: deliveryNotes.trim(),
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setErrorMessage(data?.error || 'Checkout failed')
        return
      }

      if (data?.url) {
        window.location.href = data.url
        return
      }

      setErrorMessage('Checkout session could not be created.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unexpected checkout error'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Cart</p>
        <h1 className={styles.title}>Checkout</h1>
        <p className={styles.subtitle}>
          Review your items, enter shipping details, and continue securely to payment.
        </p>
      </section>

      {items.length === 0 ? (
        <section className={styles.emptyCard}>
          <h2 className={styles.emptyTitle}>Your cart is empty</h2>
          <p className={styles.emptyText}>
            Add something cute to your cart and come back when you’re ready.
          </p>
          <Link href="/shop" className={styles.primaryLink}>
            Browse the shop
          </Link>
        </section>
      ) : (
        <div className={styles.layout}>
          <section className={styles.leftColumn}>
            <div className={styles.card}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>Items</p>
                  <h2 className={styles.sectionTitle}>
                    Your cart ({itemCount} item{itemCount === 1 ? '' : 's'})
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={clearCart}
                  className={styles.secondaryButton}
                >
                  Clear cart
                </button>
              </div>

              <div className={styles.itemList}>
                {items.map((item) => (
                  <article key={item.id} className={styles.itemCard}>
                    <div className={styles.itemImageWrap}>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className={styles.itemImage}
                        />
                      ) : (
                        <div className={styles.itemImagePlaceholder}>No image</div>
                      )}
                    </div>

                    <div className={styles.itemContent}>
                      <div className={styles.itemTop}>
                        <div>
                          <h3 className={styles.itemName}>{item.name}</h3>
                          <p className={styles.itemPrice}>
                            {formatMoney(Number(item.price || 0))}
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

                      <div className={styles.itemBottom}>
                        <div className={styles.qtyControl}>
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

                              const nextQty = Math.max(
                                1,
                                Math.floor(Number(value) || 1)
                              )
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
                        </div>

                        <div className={styles.lineTotal}>
                          {formatMoney(Number(item.price || 0) * Number(item.quantity || 0))}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>Delivery</p>
                  <h2 className={styles.sectionTitle}>Contact and shipping details</h2>
                </div>
              </div>

              <div className={styles.formGrid}>
                <input
                  type="email"
                  value={checkoutEmail}
                  onChange={(e) => setCheckoutEmail(e.target.value)}
                  placeholder="Email for order updates"
                  className={styles.input}
                />

                <input
                  type="tel"
                  value={checkoutPhone}
                  onChange={(e) => setCheckoutPhone(e.target.value)}
                  placeholder="Mobile number"
                  className={styles.input}
                />

                <input
                  type="text"
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  placeholder="Full name"
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

                <div className={styles.threeCol}>
                  <input
                    type="text"
                    value={shippingSuburb}
                    onChange={(e) => setShippingSuburb(e.target.value)}
                    placeholder="Suburb"
                    className={styles.input}
                  />

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
            </div>
          </section>

          <aside className={styles.rightColumn}>
            <div className={styles.summaryCard}>
              <p className={styles.sectionEyebrow}>Summary</p>
              <h2 className={styles.sectionTitle}>Order summary</h2>

              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span>Items</span>
                  <strong>{itemCount}</strong>
                </div>

                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <strong>{formatMoney(subtotal)}</strong>
                </div>

                <div className={styles.summaryRow}>
                  <span>Shipping</span>
                  <span>{estimatedShippingText}</span>
                </div>
              </div>

              <div className={styles.totalRow}>
                <span>Total</span>
                <strong>{formatMoney(subtotal)}</strong>
              </div>

              <div className={styles.trustBox}>
                <div className={styles.trustItem}>Secure Stripe checkout</div>
                <div className={styles.trustItem}>Fast dispatch from Australia</div>
                <div className={styles.trustItem}>Order updates by email and SMS</div>
              </div>

              {errorMessage ? (
                <div className={styles.errorBox}>{errorMessage}</div>
              ) : null}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={saving}
                className={styles.primaryButton}
              >
                {saving ? 'Redirecting...' : 'Continue to payment'}
              </button>

              <Link href="/shop" className={styles.secondaryLink}>
                Continue shopping
              </Link>
            </div>
          </aside>
        </div>
      )}
    </main>
  )
}