'use client'

import Link from 'next/link'
import { useCart } from '@/components/CartProvider'
import styles from '@/app/layout.module.css'

export default function HeaderCartLink() {
  const { itemCount } = useCart()

  return (
    <Link href="/cart" className={styles.cartLink}>
      Cart ({itemCount})
    </Link>
  )
}