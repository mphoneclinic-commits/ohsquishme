'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      style={{
        textDecoration: 'none',
        border: '1px solid #d9ccd3',
        background: '#fff',
        borderRadius: 12,
        padding: '12px 14px',
        cursor: 'pointer',
      }}
    >
      Sign out
    </button>
  )
}