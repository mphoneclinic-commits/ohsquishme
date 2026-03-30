import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import ProductAdminList from './ProductAdminList'
import styles from './products.module.css'

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

type StockAdjustmentRow = {
  id: string
  product_id: string
  admin_user_id: string | null
  delta: number
  reason: string | null
  created_at: string | null
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string
    filter?: string
  }>
}) {
  await requireAdmin()

  const params = (await searchParams) || {}
  const initialQuery = (params.q || '').trim()
  const initialFilter = (params.filter || '').trim().toLowerCase()

  const { data: productsData, error: productsError } = await supabaseAdmin
    .from('products')
    .select(
      'id, name, description, price_retail, price_wholesale, stock, image_url, active, created_at'
    )
    .order('created_at', { ascending: false })

  if (productsError) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.errorCard}>
            Failed to load products: {productsError.message}
          </div>
        </div>
      </main>
    )
  }

  const products = (productsData || []) as ProductRow[]
  const productIds = products.map((product) => product.id)

  let stockAdjustments: StockAdjustmentRow[] = []

  if (productIds.length > 0) {
    const { data: adjustmentsData, error: adjustmentsError } = await supabaseAdmin
      .from('stock_adjustments')
      .select('id, product_id, admin_user_id, delta, reason, created_at')
      .in('product_id', productIds)
      .order('created_at', { ascending: false })

    if (!adjustmentsError) {
      stockAdjustments = (adjustmentsData || []) as StockAdjustmentRow[]
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.topBar}>
          <div>
            <p className={styles.eyebrow}>Admin</p>
            <h1 className={styles.title}>Products</h1>
          </div>
        </div>

        <ProductAdminList
          initialProducts={products}
          stockAdjustments={stockAdjustments}
          initialQuery={initialQuery}
          initialFilter={initialFilter}
        />
      </div>
    </main>
  )
}