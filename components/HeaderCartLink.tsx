'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useCart } from '@/components/CartProvider'
import styles from './MiniCart.module.css'
import headerStyles from '@/app/layout.module.css'

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`
}

export default function HeaderCartLink() {
  const pathname = usePathname()
  const {
    items,
    itemCount,
    subtotal,
    increaseQty,
    decreaseQty,
    removeItem,
    clearCart,
  } = useCart()

  const [open, setOpen] = useState(false)
  const [pulse, setPulse] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (itemCount <= 0) return

    setPulse(true)
    const timer = window.setTimeout(() => setPulse(false), 320)
    return () => window.clearTimeout(timer)
  }, [itemCount])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`${headerStyles.cartLink} ${pulse ? headerStyles.cartLinkPulse : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Cart with ${itemCount} item${itemCount === 1 ? '' : 's'}`}
      >
        <span className={headerStyles.cartIcon} aria-hidden="true">
          🛒
        </span>

        <span className={headerStyles.cartText}>Cart</span>

        <span className={headerStyles.cartCount}>{itemCount}</span>
      </button>

      {open ? (
        <div className={styles.panel} role="dialog" aria-label="Mini cart">
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Mini cart</p>
              <h3 className={styles.title}>
                {itemCount} item{itemCount === 1 ? '' : 's'}
              </h3>
            </div>

            {items.length > 0 ? (
              <button
                type="button"
                onClick={clearCart}
                className={styles.clearButton}
              >
                Clear
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>Your cart is empty.</p>
              <Link href="/shop" className={styles.secondaryLink}>
                Browse shop
              </Link>
            </div>
          ) : (
            <>
              <div className={styles.itemList}>
                {items.map((item) => (
                  <article key={item.id} className={styles.itemCard}>
                    <div className={styles.imageWrap}>
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

                    <div className={styles.itemContent}>
                      <div className={styles.itemTop}>
                        <div className={styles.itemInfo}>
                          <h4 className={styles.itemName}>{item.name}</h4>
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

                          <span className={styles.qtyValue}>{item.quantity}</span>

                          <button
                            type="button"
                            onClick={() => increaseQty(item.id)}
                            className={styles.qtyButton}
                          >
                            +
                          </button>
                        </div>

                        <div className={styles.lineTotal}>
                          {formatMoney(
                            Number(item.price || 0) * Number(item.quantity || 0)
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className={styles.summary}>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <strong>{formatMoney(subtotal)}</strong>
                </div>

                <p className={styles.note}>
                  Shipping and final total are calculated at checkout.
                </p>
              </div>

              <div className={styles.actions}>
                <Link href="/cart" className={styles.secondaryLink}>
                  View cart
                </Link>

                <Link href="/cart" className={styles.primaryLink}>
                  Checkout
                </Link>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}