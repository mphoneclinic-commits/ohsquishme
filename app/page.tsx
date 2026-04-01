'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/components/CartProvider'
import styles from './home.module.css'

type Product = {
  id: string
  name: string
  price_retail: number
  image_url: string | null
  stock: number
  active?: boolean
  description?: string | null
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({})
  const { addItem } = useCart()

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(4)

    if (error) {
      console.error('Failed to load featured products:', error)
      setProducts([])
      return
    }

    setProducts((data || []) as Product[])
  }

  function handleAdd(product: Product) {
    if (product.stock <= 0) return

    addItem({
      id: product.id,
      name: product.name,
      price: product.price_retail,
      image_url: product.image_url,
      quantity: 1,
    })

    setAddedMap((current) => ({ ...current, [product.id]: true }))

    window.setTimeout(() => {
      setAddedMap((current) => ({ ...current, [product.id]: false }))
    }, 1200)
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <h1>Oh Squish Me 💖</h1>
        <p>Cute, soft &amp; oh-so-satisfying</p>

        <div className={styles.heroActions}>
          <Link href="/shop" className={styles.cta}>
            Shop Now
          </Link>

          <Link href="/about" className={styles.ctaSecondary}>
            About Me
          </Link>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Featured Squishies</h2>

        <div className={styles.grid}>
          {products.map((product) => {
            const added = addedMap[product.id]
            const isOut = product.stock <= 0
            const isLow = product.stock > 0 && product.stock <= 3

            return (
              <div key={product.id} className={styles.card}>
                <Link href={`/product/${product.id}`} className={styles.cardLinkWrap}>
                  <div className={styles.imageArea}>
                    {isOut ? (
                      <span className={styles.outBadge}>Out of stock</span>
                    ) : isLow ? (
                      <span className={styles.lowBadge}>Low stock</span>
                    ) : null}

                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} />
                    ) : (
                      <div className={styles.imagePlaceholder}>No image</div>
                    )}
                  </div>

                  <h3>{product.name}</h3>
                  <p>${product.price_retail.toFixed(2)}</p>
                </Link>

                <button
                  type="button"
                  onClick={() => handleAdd(product)}
                  disabled={isOut}
                  className={`${styles.addBtn} ${
                    added ? styles.added : ''
                  } ${isOut ? styles.addDisabled : ''}`}
                >
                  {isOut ? 'Out of stock' : added ? 'Added ✓' : 'Add to cart'}
                </button>
              </div>
            )
          })}
        </div>

        <Link href="/shop" className={styles.link}>
          View all products →
        </Link>
      </section>

      <section className={styles.about}>
        <div className={styles.aboutInner}>
          <h2>From one mumma to another 💖</h2>

          <p>
            I’m a proud new mum building Oh Squish Me between nap times and late
            nights. What started as a small idea quickly became something I
            genuinely fell in love with.
          </p>

          <p>
            Every squishy is handmade with care to bring comfort, fun, and a
            little moment of calm.
          </p>

          <Link href="/about" className={styles.ctaSecondary}>
            Read my story →
          </Link>
        </div>
      </section>
    </main>
  )
}