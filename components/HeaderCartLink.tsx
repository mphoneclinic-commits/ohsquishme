'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useCart } from '@/components/CartProvider'
import styles from '@/app/layout.module.css'

export default function HeaderCartLink() {
  const { itemCount } = useCart()
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    if (itemCount <= 0) return

    setPulse(true)

    const timer = window.setTimeout(() => {
      setPulse(false)
    }, 320)

    return () => window.clearTimeout(timer)
  }, [itemCount])

  return (
    <Link
      href="/cart"
      className={`${styles.cartLink} ${pulse ? styles.cartLinkPulse : ''}`}
    >
      Cart ({itemCount})
    </Link>
  )
}