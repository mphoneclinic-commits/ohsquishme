import { supabaseAdmin } from '@/lib/supabaseAdmin'
import ProductAdminList from './ProductAdminList'

export default async function TestPage() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')

  if (error) {
    return <div>DB ERROR: {error.message}</div>
  }

  return <ProductAdminList initialProducts={data || []} />
}