'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/components/CartProvider'
import styles from './shop.module.css'

type Product = {
  id: string
  name: string
  description: string | null
  price_retail: number
  stock: number
  image_url: string | null
  active: boolean
  created_at?: string | null
}

type SortMode = 'newest' | 'price_low' | 'price_high' | 'name'

function getCardDescription(description: string | null) {
  const text = (description || 'Cute squishy collectible.').trim()
  return text
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [search, setSearch] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('newest')
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({})

  const { addItem } = useCart()

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase products fetch error:', error)
      setErrorMessage(error.message)
      setProducts([])
      setLoading(false)
      return
    }

    setProducts((data || []) as Product[])
    setLoading(false)
  }

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()

    let list = products.filter((product) => {
      if (!q) return true

      return [product.name, product.description || '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    })

    if (sortMode === 'price_low') {
      list = [...list].sort((a, b) => Number(a.price_retail) - Number(b.price_retail))
    } else if (sortMode === 'price_high') {
      list = [...list].sort((a, b) => Number(b.price_retail) - Number(a.price_retail))
    } else if (sortMode === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    } else {
      list = [...list].sort((a, b) => {
        const aTime = new Date(a.created_at || 0).getTime()
        const bTime = new Date(b.created_at || 0).getTime()
        return bTime - aTime
      })
    }

    return list
  }, [products, search, sortMode])

  function handleQuickAdd(
    event: React.MouseEvent<HTMLButtonElement>,
    product: Product
  ) {
    event.preventDefault()
    event.stopPropagation()

    if (Number(product.stock || 0) <= 0) return

    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price_retail || 0),
      image_url: product.image_url,
      quantity: 1,
    })

    setAddedMap((current) => ({
      ...current,
      [product.id]: true,
    }))

    window.setTimeout(() => {
      setAddedMap((current) => ({
        ...current,
        [product.id]: false,
      }))
    }, 1200)
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Shop</p>
        <h1 className={styles.title}>Cute squishies, gifts and collectible favourites</h1>
        <p className={styles.subtitle}>
          Browse the latest Oh Squish Me range, with fast dispatch and easy checkout.
        </p>
      </section>

      <section className={styles.toolbar}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className={styles.input}
        />

        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className={styles.select}
        >
          <option value="newest">Newest</option>
          <option value="price_low">Price: low to high</option>
          <option value="price_high">Price: high to low</option>
          <option value="name">Name</option>
        </select>
      </section>

      {loading && <p className={styles.stateText}>Loading products...</p>}

      {!loading && errorMessage && (
        <p className={styles.error}>Error: {errorMessage}</p>
      )}

      {!loading && !errorMessage && filteredProducts.length === 0 && (
        <div className={styles.emptyCard}>
          <p>No matching products found.</p>
        </div>
      )}

      {!loading && !errorMessage && filteredProducts.length > 0 && (
        <div className={styles.grid}>
          {filteredProducts.map((product) => {
            const isOut = Number(product.stock || 0) <= 0
            const isLow = Number(product.stock || 0) > 0 && Number(product.stock || 0) <= 3
            const wasAdded = !!addedMap[product.id]

            return (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className={styles.card}
              >
                <div className={styles.imageArea}>
                  {isOut ? (
                    <span className={styles.outBadge}>Out of stock</span>
                  ) : isLow ? (
                    <span className={styles.lowBadge}>Low stock</span>
                  ) : null}

                  {product.image_url ? (
                    <div className={styles.imageWrap}>
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className={styles.image}
                      />
                    </div>
                  ) : (
                    <div className={styles.imagePlaceholder}>No image</div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardTop}>
                    <h2 className={styles.cardTitle}>{product.name}</h2>

                    <p className={styles.cardText}>
                      {getCardDescription(product.description)}
                    </p>
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.cardBottom}>
                      <p className={styles.price}>
                        ${Number(product.price_retail).toFixed(2)}
                      </p>

                      <span className={styles.cardLink}>
                        View product
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(event) => handleQuickAdd(event, product)}
                      disabled={isOut}
                      className={`${styles.quickAddButton} ${
                        wasAdded ? styles.quickAddButtonAdded : ''
                      } ${isOut ? styles.quickAddButtonDisabled : ''}`}
                    >
                      {isOut
                        ? 'Out of stock'
                        : wasAdded
                          ? 'Added to cart'
                          : 'Quick add'}
                    </button>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}