import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function getAdminAuthState() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      user: null,
      isLoggedIn: false,
      isAdmin: false,
    }
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      user,
      isLoggedIn: true,
      isAdmin: false,
    }
  }

  return {
    user,
    isLoggedIn: true,
    isAdmin: profile.role === 'admin',
  }
}

export async function requireAdmin() {
  const auth = await getAdminAuthState()

  if (!auth.isLoggedIn) {
    redirect('/admin/login')
  }

  if (!auth.isAdmin) {
    redirect('/')
  }

  return auth.user
}

export async function isAdminFromRequest() {
  const auth = await getAdminAuthState()

  if (!auth.isLoggedIn || !auth.isAdmin) {
    return null
  }

  return auth.user
}