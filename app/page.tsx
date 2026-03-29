import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import styles from './home.module.css'

export const dynamic = 'force-dynamic'

type ProductRow = {
  id: string
  name: string
  description: string | null
  price_retail: number
  image_url: string | null
  stock: number | null
  active: boolean
  created_at: string | null
}

function formatMoney(value: number | string | null) {
  return `$${Number(value || 0).toFixed(2)}`
}

export default async function HomePage() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(
      'id, name, description, price_retail, image_url, stock, active, created_at'
    )
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(4)

  const featuredProducts = ((error ? [] : data) || []) as ProductRow[]

  const heroProduct = featuredProducts[0] || null

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Oh Squish Me</p>

          <h1 className={styles.heroTitle}>
            Cute squishies, gift-ready picks and a cleaner shopping flow
          </h1>

          <p className={styles.heroText}>
            Browse adorable collectibles, check stock clearly, and move through
            checkout without clutter. Wholesale access is available for approved
            accounts.
          </p>

          <div className={styles.heroActions}>
            <Link href="/shop" className={styles.primaryLink}>
              Shop now
            </Link>

            <Link href="/account" className={styles.secondaryLink}>
              Account & wholesale
            </Link>
          </div>

          <div className={styles.heroPoints}>
            <div className={styles.pointCard}>
              <strong>Fast dispatch</strong>
              <span>Orders usually packed within 24 hours</span>
            </div>

            <div className={styles.pointCard}>
              <strong>Ships from Australia</strong>
              <span>Local handling and easier support</span>
            </div>

            <div className={styles.pointCard}>
              <strong>Wholesale ready</strong>
              <span>Apply through your customer account</span>
            </div>
          </div>
        </div>

        <div className={styles.heroVisual}>
          {heroProduct ? (
            <Link href={`/product/${heroProduct.id}`} className={styles.heroProductCard}>
              <div className={styles.heroImageArea}>
                {Number(heroProduct.stock || 0) <= 0 ? (
                  <span className={styles.outBadge}>Out of stock</span>
                ) : Number(heroProduct.stock || 0) <= 3 ? (
                  <span className={styles.lowBadge}>Low stock</span>
                ) : null}

                {heroProduct.image_url ? (
                  <img
                    src={heroProduct.image_url}
                    alt={heroProduct.name}
                    className={styles.heroImage}
                  />
                ) : (
                  <div className={styles.heroImagePlaceholder}>No image</div>
                )}
              </div>

              <div className={styles.heroProductBody}>
                <h2 className={styles.heroProductTitle}>{heroProduct.name}</h2>
                <p className={styles.heroProductText}>
                  {heroProduct.description || 'Cute collectible squishy.'}
                </p>
                <div className={styles.heroProductBottom}>
                  <strong className={styles.heroProductPrice}>
                    {formatMoney(heroProduct.price_retail)}
                  </strong>
                  <span className={styles.heroProductCta}>View product</span>
                </div>
              </div>
            </Link>
          ) : (
            <div className={styles.heroImagePlaceholder}>Oh Squish Me</div>
          )}
        </div>
      </section>

      <section className={styles.trustStrip}>
        <div className={styles.trustItem}>
          <strong>Secure checkout</strong>
          <span>Stripe-powered payment flow</span>
        </div>

        <div className={styles.trustItem}>
          <strong>Order updates</strong>
          <span>Email and shipping progress where available</span>
        </div>

        <div className={styles.trustItem}>
          <strong>Clear stock signals</strong>
          <span>See low stock and sold out status before checkout</span>
        </div>
      </section>

      <section className={styles.featureSection}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Featured</p>
            <h2 className={styles.sectionTitle}>Fresh picks from the shop</h2>
          </div>

          <Link href="/shop" className={styles.inlineLink}>
            View all products
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <div className={styles.emptyCard}>
            No active products are showing yet.
          </div>
        ) : (
          <div className={styles.productGrid}>
            {featuredProducts.map((product) => {
              const isOut = Number(product.stock || 0) <= 0
              const isLow =
                Number(product.stock || 0) > 0 && Number(product.stock || 0) <= 3

              return (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className={styles.productCard}
                >
                  <div className={styles.productImageArea}>
                    {isOut ? (
                      <span className={styles.outBadge}>Out of stock</span>
                    ) : isLow ? (
                      <span className={styles.lowBadge}>Low stock</span>
                    ) : null}

                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className={styles.productImage}
                      />
                    ) : (
                      <div className={styles.productImagePlaceholder}>No image</div>
                    )}
                  </div>

                  <div className={styles.productBody}>
                    <h3 className={styles.productTitle}>{product.name}</h3>
                    <p className={styles.productText}>
                      {product.description || 'Cute collectible squishy.'}
                    </p>

                    <div className={styles.productBottom}>
                      <strong className={styles.productPrice}>
                        {formatMoney(product.price_retail)}
                      </strong>
                      <span className={styles.productCta}>View product</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section className={styles.splitSection}>
        <div className={styles.infoPanel}>
          <p className={styles.sectionEyebrow}>Store experience</p>
          <h2 className={styles.sectionTitle}>Simple, consistent and easier to trust</h2>
          <p className={styles.panelText}>
            The storefront and admin now use the same product language — cleaner
            cards, clearer stock signals, and less visual clutter. That makes the
            whole system easier to manage and easier to shop.
          </p>

          <div className={styles.infoList}>
            <div className={styles.infoListItem}>
              Consistent product image presentation
            </div>
            <div className={styles.infoListItem}>
              Matching low stock / out of stock badges
            </div>
            <div className={styles.infoListItem}>
              Cleaner flow from product to cart to checkout
            </div>
          </div>
        </div>

        <div className={styles.infoPanel}>
          <p className={styles.sectionEyebrow}>Wholesale</p>
          <h2 className={styles.sectionTitle}>Apply for wholesale pricing</h2>
          <p className={styles.panelText}>
            Approved wholesale accounts can access wholesale pricing across eligible
            products. Apply through your account and we’ll review your request.
          </p>

          <div className={styles.panelActions}>
            <Link href="/account" className={styles.primaryLink}>
              Apply via account
            </Link>

            <Link href="/shop" className={styles.secondaryLink}>
              Browse products
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}