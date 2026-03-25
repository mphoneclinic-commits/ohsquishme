'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/components/CartProvider'

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
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [added, setAdded] = useState(false)

  const { addItem } = useCart()

  useEffect(() => {
    if (!productId || typeof productId !== 'string') {
      setErrorMessage('Invalid product ID.')
      setLoading(false)
      return
    }

    fetchProduct(productId)
  }, [productId])

  async function fetchProduct(id: string) {
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

    setProduct(data)
    setLoading(false)
  }

  function handleAddToCart() {
    if (!product) return

    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price_retail),
      image_url: product.image_url,
    })

    setAdded(true)
    window.setTimeout(() => setAdded(false), 1200)
  }

  if (loading) {
    return <main style={{ padding: 24 }}>Loading product...</main>
  }

  if (errorMessage) {
    return (
      <main style={{ padding: 24 }}>
        <p style={{ color: 'crimson' }}>Error: {errorMessage}</p>
      </main>
    )
  }

  if (!product) {
    return (
      <main style={{ padding: 24 }}>
        <p>Product not found.</p>
      </main>
    )
  }

  return (
    <main
      style={{
        padding: '40px 24px',
        maxWidth: 1100,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 32,
        }}
      >
        <div>
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              style={{
                width: '100%',
                borderRadius: 16,
                background: '#fff',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                aspectRatio: '1 / 1',
                borderRadius: 16,
                background: '#eee',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              No image
            </div>
          )}
        </div>

        <div>
          <h1 style={{ fontSize: '2.2rem', marginTop: 0 }}>{product.name}</h1>
          <p style={{ fontSize: '1.5rem', marginBottom: 12 }}>
            ${Number(product.price_retail).toFixed(2)}
          </p>
          <p style={{ lineHeight: 1.7 }}>
            {product.description || 'No description yet.'}
          </p>
          <p>
            <strong>Stock:</strong> {product.stock}
          </p>

          <button
            type="button"
            onClick={handleAddToCart}
            style={{
              marginTop: 16,
              padding: '14px 18px',
              borderRadius: 10,
              border: '1px solid #111',
              background: '#111',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {added ? 'Added' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </main>
  )
}