'use client'

import Link from 'next/link'

export default function ProductCard({ product }: any) {
  return (
    <Link href={`/product/${product.id}`}>
      <div style={{ border: '1px solid #ddd', padding: 10 }}>
        <img src={product.image_url} style={{ width: '100%' }} />
        <h3>{product.name}</h3>
        <p>${product.price_retail}</p>
      </div>
    </Link>
  )
}