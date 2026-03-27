import { redirect } from 'next/navigation'
import AdminLoginForm from './AdminLoginForm'
import { getAdminAuthState } from '@/lib/auth'
import styles from './login.module.css'

export default async function AdminLoginPage() {
  const auth = await getAdminAuthState()

  if (auth.isLoggedIn && auth.isAdmin) {
    redirect('/admin/orders')
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Admin</p>

        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.description}>
          Only admin accounts can access the orders dashboard.
        </p>

        {auth.isLoggedIn && !auth.isAdmin ? (
          <div className={styles.errorBox}>
            You are signed in, but this account does not have admin access.
          </div>
        ) : null}

        <AdminLoginForm />
      </div>
    </main>
  )
}