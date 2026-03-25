'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { addToCart } from '@/lib/cart'

export default function ProductPage({ params }: any) {
  const [product, setProduct] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .single()

    const { data: userData } = await supabase.auth.getUser()

    setProduct(data)
    setUser(userData?.user)
  }

  if (!product) return <div>Loading...</div>

  const price =
    user?.user_metadata?.role === 'wholesale'
      ? product.price_wholesale
      : product.price_retail

  return (
    <div>
      <img src={product.image_url} width={300} />
      <h1>{product.name}</h1>
      <p>${price}</p>

      <button onClick={() => addToCart(product)}>
        Add to Cart
      </button>
    </div>
  )
}