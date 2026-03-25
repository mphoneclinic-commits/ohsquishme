'use client'

import Link from 'next/link'

export default function Navbar() {
  return (
    <nav style={{ display: 'flex', gap: 20, padding: 20 }}>
      <Link href="/">Home</Link>
      <Link href="/shop">Shop</Link>
      <Link href="/cart">Cart</Link>
      <Link href="/account">Account</Link>
    </nav>
  )
}