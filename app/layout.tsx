import './globals.css'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Fredoka, Inter } from 'next/font/google'
import CartProvider from '@/components/CartProvider'
import AuthProvider from '@/components/AuthProvider'
import HeaderNavSwitcher from '@/components/HeaderNavSwitcher'
import HeaderScrollShell from '@/components/HeaderScrollShell'
import styles from './layout.module.css'
import BackToTopButton from '@/components/BackToTopButton'

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-brand',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Oh Squish Me',
  description: 'Cute squishies for collectors, gifts, and wholesale orders.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} ${inter.variable}`}>
        <AuthProvider>
          <CartProvider>
            <HeaderScrollShell>
              <header className={styles.header}>
                <div className={styles.headerInner}>
                  <Link href="/" className={styles.brand}>
                    <div className={styles.logoWrap}>
                      <Image
                        src="/logo.png"
                        alt="Oh Squish Me logo"
                        width={68}
                        height={68}
                        className={styles.logo}
                        priority
                      />
                    </div>

                    <div className={styles.brandText}>
                      <span className={styles.brandTitle}>Oh Squish Me</span>
                      <span className={styles.brandSub}>
                        cute squishies & gifts
                      </span>
                    </div>
                  </Link>

                  <HeaderNavSwitcher />
                </div>
              </header>
            </HeaderScrollShell>

            {children}
    <BackToTopButton />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}