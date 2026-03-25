import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import CartProvider from '@/components/CartProvider'
import HeaderCartLink from '@/components/HeaderCartLink'

export const metadata: Metadata = {
  title: 'Taba Squishies',
  description: 'Cute squishies for collectors, gifts, and wholesale orders.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <header
            style={{
              borderBottom: '1px solid #eadce3',
              background: '#fff',
            }}
          >
            <div
              style={{
                maxWidth: 1200,
                margin: '0 auto',
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <Link
                href="/"
                style={{
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 20,
                }}
              >
                Taba Squishies
              </Link>

              <nav
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <Link href="/" style={{ textDecoration: 'none' }}>
                  Home
                </Link>
                <Link href="/shop" style={{ textDecoration: 'none' }}>
                  Shop
                </Link>
                <Link href="/account" style={{ textDecoration: 'none' }}>
                  Account
                </Link>
                <HeaderCartLink />
              </nav>
            </div>
          </header>

          {children}
        </CartProvider>
      </body>
    </html>
  )
}