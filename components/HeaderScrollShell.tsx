'use client'

import { useEffect, useState, type ReactNode } from 'react'
import styles from '@/app/layout.module.css'

export default function HeaderScrollShell({
  children,
}: {
  children: ReactNode
}) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div className={scrolled ? styles.headerScrolled : ''}>
      {children}
    </div>
  )
}