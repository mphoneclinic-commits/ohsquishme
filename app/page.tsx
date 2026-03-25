import Link from 'next/link'

export default function HomePage() {
  return (
    <main
      style={{
        padding: '48px 24px',
        maxWidth: 1200,
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <section style={{ padding: '40px 0' }}>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          Taba Squishies
        </p>

        <h1
          style={{
            fontSize: '3rem',
            lineHeight: 1.1,
            margin: '12px 0 16px',
          }}
        >
          Cute squishies for collectors, gifts, and wholesale orders
        </h1>

        <p
          style={{
            fontSize: '1.1rem',
            maxWidth: 700,
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          Shop retail drops, browse collectible designs, and apply for
          wholesale access for your store.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link
            href="/shop"
            style={{
              padding: '12px 18px',
              borderRadius: 10,
              border: '1px solid #111',
              textDecoration: 'none',
            }}
          >
            Shop Now
          </Link>

          <Link
            href="/account"
            style={{
              padding: '12px 18px',
              borderRadius: 10,
              border: '1px solid #111',
              textDecoration: 'none',
            }}
          >
            Wholesale / Account
          </Link>
        </div>
      </section>
    </main>
  )
}