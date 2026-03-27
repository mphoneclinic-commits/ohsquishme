import { redirect } from 'next/navigation'
import { getAdminAuthState } from '@/lib/auth'

export default async function AdminPage() {
  const auth = await getAdminAuthState()

  if (!auth.isLoggedIn) {
    redirect('/admin/login')
  }

  if (!auth.isAdmin) {
    redirect('/')
  }

  redirect('/admin/orders')
}