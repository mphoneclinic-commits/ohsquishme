'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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
    <main
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '40px 24px',
      }}
    >
      <h1 style={{ fontSize: '2.4rem', marginBottom: 12 }}>Shop</h1>
      <p style={{ marginTop: 0, marginBottom: 24 }}>
        Browse the latest Taba Squishies collection.
      </p>

      {loading && <p>Loading products...</p>}

      {!loading && errorMessage && (
        <p style={{ color: 'crimson' }}>Error: {errorMessage}</p>
      )}

      {!loading && !errorMessage && products.length === 0 && (
        <p>No active products found.</p>
      )}

      {!loading && !errorMessage && products.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 18,
          }}
        >
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              style={{
                display: 'block',
                border: '1px solid #eadce3',
                borderRadius: 16,
                padding: 14,
                textDecoration: 'none',
                background: '#fff',
              }}
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    objectFit: 'cover',
                    borderRadius: 12,
                    marginBottom: 12,
                    background: '#f4f4f4',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    borderRadius: 12,
                    marginBottom: 12,
                    background: '#f0edf0',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#7a6f76',
                  }}
                >
                  No image
                </div>
              )}

              <h2
                style={{
                  fontSize: 18,
                  margin: '0 0 8px',
                }}
              >
                {product.name}
              </h2>

              <p style={{ margin: 0, fontWeight: 700 }}>
                ${Number(product.price_retail).toFixed(2)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}