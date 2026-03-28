'use client'

import { usePathname } from 'next/navigation'
import HeaderNav from '@/components/HeaderNav'
import AdminSubnav from '@/components/AdminSubnav'

export default function HeaderNavSwitcher() {
  const pathname = usePathname()
  const isAdminPage = pathname.startsWith('/admin')

  if (isAdminPage) {
    return <AdminSubnav />
  }

  return <HeaderNav />
}