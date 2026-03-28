import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import styles from './storefront.module.css'

export const dynamic = 'force-dynamic'

type ProductRow = {
  id: string
  name: string | null
  description: string | null
  price_retail: number | string | null
  price_wholesale: number | string | null
  stock: number | null
  image_url: string | null
  active: boolean | null
  created_at: string | null
}

function formatMoney(value: number | string | null) {
  return `$${Number(value || 0).toFixed(2)}`
}

export default async function AdminStorefrontPage() {
  await requireAdmin()

  const { data, error } = await supabaseAdmin
    .from('products')
    .select(
      'id, name, description, price_retail, price_wholesale, stock, image_url, active, created_at'
    )
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.errorCard}>
            Failed to load storefront preview: {error.message}
          </div>
        </div>
      </main>
    )
  }

  const products = (data || []) as ProductRow[]

  const activeCount = products.filter((p) => !!p.active).length
  const inactiveCount = products.filter((p) => !p.active).length
  const outOfStockCount = products.filter((p) => Number(p.stock || 0) <= 0).length

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.topBar}>
          <div>
            <p className={styles.eyebrow}>Admin</p>
            <h1 className={styles.title}>Store Preview</h1>
            <p className={styles.subtitle}>
              Preview the storefront from an admin view without using the customer shop page.
            </p>
          </div>
        </div>

        <section className={styles.summaryGrid}>
          <SummaryCard label="Total Products" value={products.length} />
          <SummaryCard label="Active" value={activeCount} />
          <SummaryCard label="Inactive" value={inactiveCount} />
          <SummaryCard label="Out of Stock" value={outOfStockCount} />
        </section>

        <section className={styles.previewGrid}>
          {products.length === 0 ? (
            <div className={styles.emptyCard}>No products found.</div>
          ) : (
            products.map((product) => (
              <article key={product.id} className={styles.card}>
                <div className={styles.imageWrap}>
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name || 'Product image'}
                      className={styles.image}
                    />
                  ) : (
                    <div className={styles.imagePlaceholder}>No image</div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>{product.name || 'Untitled product'}</h2>
                    <span
                      className={
                        product.active ? styles.activeBadge : styles.inactiveBadge
                      }
                    >
                      {product.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <p className={styles.cardText}>
                    {product.description || 'No description yet.'}
                  </p>

                  <div className={styles.metaGrid}>
                    <MetaCard label="Retail" value={formatMoney(product.price_retail)} />
                    <MetaCard label="Wholesale" value={formatMoney(product.price_wholesale)} />
                    <MetaCard label="Stock" value={String(Number(product.stock || 0))} />
                  </div>

                  <div className={styles.actionRow}>
                    <Link
                      href={`/product/${product.id}`}
                      className={styles.secondaryLink}
                      target="_blank"
                    >
                      Open Public Product
                    </Link>

                    <Link
                      href={`/admin/products`}
                      className={styles.primaryLink}
                    >
                      Edit in Products
                    </Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  )
}

function SummaryCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryLabel}>{label}</div>
      <div className={styles.summaryValue}>{value}</div>
    </div>
  )
}

function MetaCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className={styles.metaCard}>
      <div className={styles.metaLabel}>{label}</div>
      <div className={styles.metaValue}>{value}</div>
    </div>
  )
}