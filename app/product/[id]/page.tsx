'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/components/CartProvider'
import { useAuthRole } from '@/components/AuthProvider'
import { getEffectivePrice } from '@/lib/pricing'
import styles from './product.module.css'

type Product = {
  id: string
  name: string
  description: string | null
  price_retail: number
  price_wholesale: number
  stock: number
  image_url: string | null
  active: boolean
}

export default function ProductPage() {
  const params = useParams()
  const productId = Array.isArray(params.id) ? params.id[0] : params.id

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [added, setAdded] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const { addItem } = useCart()
  const { role, isWholesale, loading: loadingRole } = useAuthRole()

  useEffect(() => {
    if (!productId || typeof productId !== 'string') {
      setErrorMessage('Invalid product ID.')
      setLoading(false)
      return
    }

    fetchProductAndRelated(productId)
  }, [productId])

  async function fetchProductAndRelated(id: string) {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Product fetch error:', error)
      setErrorMessage(error.message)
      setProduct(null)
      setLoading(false)
      return
    }

    setProduct(data as Product)

    const { data: relatedData, error: relatedError } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .neq('id', id)
      .limit(3)

    if (relatedError) {
      console.error('Related products fetch error:', relatedError)
      setRelatedProducts([])
    } else {
      setRelatedProducts((relatedData || []) as Product[])
    }

    setLoading(false)
  }

  const effectivePrice = product ? getEffectivePrice(product, role) : 0

  const stockMessage = useMemo(() => {
    if (!product) return ''
    if (product.stock <= 0) return 'Out of stock'
    if (product.stock <= 3) return `Only ${product.stock} left`
    return 'In stock'
  }, [product])

  function decreaseQty() {
    setQuantity((current) => Math.max(1, current - 1))
  }

  function increaseQty() {
    if (!product) return
    setQuantity((current) => Math.min(product.stock || 1, current + 1))
  }

  function handleAddToCart() {
    if (!product || product.stock <= 0) return

    addItem({
      id: product.id,
      name: product.name,
      price: effectivePrice,
      image_url: product.image_url,
      quantity,
    })

    setAdded(true)
    window.setTimeout(() => setAdded(false), 1200)
  }

  if (loading || loadingRole) {
    return <main className={styles.page}>Loading product...</main>
  }

  if (errorMessage) {
    return (
      <main className={styles.page}>
        <p className={styles.error}>Error: {errorMessage}</p>
      </main>
    )
  }

  if (!product) {
    return (
      <main className={styles.page}>
        <p>Product not found.</p>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <section className={styles.layout}>
        <div className={styles.imageWrap}>
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className={styles.image}
            />
          ) : (
            <div className={styles.imagePlaceholder}>No image</div>
          )}
        </div>

        <div className={styles.content}>
          <p className={styles.eyebrow}>Oh Squish Me</p>

          <h1 className={styles.title}>{product.name}</h1>

          <div className={styles.priceRow}>
            <p className={styles.price}>${effectivePrice.toFixed(2)}</p>
            <span
              className={
                product.stock > 0 ? styles.stockBadgeIn : styles.stockBadgeOut
              }
            >
              {stockMessage}
            </span>
          </div>

          {isWholesale ? (
            <div className={styles.wholesaleNote}>Wholesale pricing active</div>
          ) : null}

          <p className={styles.description}>
            {product.description || 'No description yet.'}
          </p>

          <div className={styles.trustGrid}>
            <div className={styles.trustCard}>
              <strong>Fast dispatch</strong>
              <span>Usually packed within 24 hours</span>
            </div>
            <div className={styles.trustCard}>
              <strong>Ships from Australia</strong>
              <span>Local handling and support</span>
            </div>
            <div className={styles.trustCard}>
              <strong>Cute gift-ready item</strong>
              <span>Great for collecting or gifting</span>
            </div>
          </div>

          {product.stock > 0 ? (
            <div className={styles.buyBox}>
              <div className={styles.quantityRow}>
                <span className={styles.quantityLabel}>Quantity</span>

                <div className={styles.qtyControl}>
                  <button
                    type="button"
                    onClick={decreaseQty}
                    className={styles.qtyButton}
                  >
                    -
                  </button>
                  <div className={styles.qtyValue}>{quantity}</div>
                  <button
                    type="button"
                    onClick={increaseQty}
                    className={styles.qtyButton}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className={styles.primaryButton}
              >
                {added
                  ? 'Added to cart'
                  : `Add ${quantity} to cart · $${(
                      effectivePrice * quantity
                    ).toFixed(2)}`}
              </button>

              <p className={styles.micro}>
                Ships from Australia · Fast dispatch
              </p>
            </div>
          ) : (
            <button type="button" disabled className={styles.disabledButton}>
              Out of Stock
            </button>
          )}
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className={styles.relatedSection}>
          <div className={styles.relatedHeader}>
            <h2 className={styles.relatedTitle}>You might also like</h2>
            <p className={styles.relatedText}>
              More cute picks from the collection.
            </p>
          </div>

          <div className={styles.relatedGrid}>
            {relatedProducts.map((item) => {
              const relatedPrice = getEffectivePrice(item, role)

              return (
                <Link
                  key={item.id}
                  href={`/product/${item.id}`}
                  className={styles.relatedCard}
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className={styles.relatedImage}
                    />
                  ) : (
                    <div className={styles.relatedImagePlaceholder}>No image</div>
                  )}

                  <h3 className={styles.relatedName}>{item.name}</h3>
                  <p className={styles.relatedPrice}>
                    ${relatedPrice.toFixed(2)}
                  </p>
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}
    </main>
  )
}