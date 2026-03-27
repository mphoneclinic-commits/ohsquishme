'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/components/CartProvider'
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
    <div className={styles.layout}>
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
        <h1 className={styles.title}>{product.name}</h1>
        <p className={styles.price}>
          ${Number(product.price_retail).toFixed(2)}
        </p>
        <p className={styles.description}>
          {product.description || 'No description yet.'}
        </p>
        <p className={styles.stock}>
          <strong>Stock:</strong> {product.stock}
        </p>

        {product.stock > 0 ? (
          <button
            type="button"
            onClick={handleAddToCart}
            className={styles.primaryButton}
          >
            {added ? 'Added' : 'Add to Cart'}
          </button>
        ) : (
          <button type="button" disabled className={styles.disabledButton}>
            Out of Stock
          </button>
        )}
      </div>
    </div>
  </main>
)
   
}