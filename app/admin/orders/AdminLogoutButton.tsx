'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './orders.module.css'

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
      className={styles.logoutButton}
    >
      Sign out
    </button>
  )
}