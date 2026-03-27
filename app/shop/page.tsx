'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import styles from './shop.module.css'

type Product = {
  id: string
  name: string
  description: string | null
  price_retail: number
  image_url: string | null
  active: boolean
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

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

    setProducts(data || [])
    setLoading(false)
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Shop</h1>
      <p className={styles.subtitle}>
        Browse the latest Taba Squishies collection.
      </p>

      {loading && <p>Loading products...</p>}

      {!loading && errorMessage && (
        <p className={styles.error}>Error: {errorMessage}</p>
      )}

      {!loading && !errorMessage && products.length === 0 && (
        <p>No active products found.</p>
      )}

      {!loading && !errorMessage && products.length > 0 && (
        <div className={styles.grid}>
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className={styles.card}
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className={styles.image}
                />
              ) : (
                <div className={styles.imagePlaceholder}>No image</div>
              )}

              <h2 className={styles.cardTitle}>{product.name}</h2>

              <p className={styles.price}>
                ${Number(product.price_retail).toFixed(2)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}