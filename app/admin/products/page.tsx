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

export default async function AdminProductsPage() {
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
            Failed to load products: {error.message}
          </div>
        </div>
      </main>
    )
  }

  const products = (data || []) as ProductRow[]

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
       
        <div className={styles.topBar}>
          <div>
            <p className={styles.eyebrow}>Admin</p>
            <h1 className={styles.title}>Products</h1>
          </div>
        </div>

        <ProductAdminList initialProducts={products} />
      </div>
    </main>
  )
}