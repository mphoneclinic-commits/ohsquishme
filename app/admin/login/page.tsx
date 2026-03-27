import { redirect } from 'next/navigation'
import { isAdminFromRequest } from '@/lib/auth'

export default async function AdminPage() {
  const adminUser = await isAdminFromRequest()

  if (!adminUser) {
    redirect('/admin/login')
  }

  redirect('/admin/orders')
}