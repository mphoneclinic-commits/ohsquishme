import type { ReactNode } from 'react'
import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import HeaderNavSwitcher from '@/components/HeaderNavSwitcher'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireAdmin()

  const { count } = await supabaseAdmin
    .from('wholesale_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <>
      
      {children}
    </>
  )
}