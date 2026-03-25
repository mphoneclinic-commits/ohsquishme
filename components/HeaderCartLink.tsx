'use client'

import Link from 'next/link'
import { useCart } from '@/components/CartProvider'

export default function HeaderCartLink() {
  const { itemCount } = useCart()

  return (
    <Link
      href="/cart"
      style={{
        textDecoration: 'none',
        padding: '10px 14px',
        border: '1px solid #111',
        borderRadius: 999,
        fontWeight: 600,
      }}
    >
      Cart ({itemCount})
    </Link>
  )
}