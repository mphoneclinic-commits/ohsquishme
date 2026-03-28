'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'

type UserRole = 'guest' | 'customer' | 'wholesale' | 'admin'

type AuthContextType = {
  role: UserRole
  isWholesale: boolean
  isAuthenticated: boolean
  loading: boolean
  refreshRole: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('guest')
  const [loading, setLoading] = useState(true)

  async function refreshRole() {
    const supabase = createClient()

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setRole('guest')
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile?.role) {
        setRole('customer')
        setLoading(false)
        return
      }

      const nextRole =
        profile.role === 'wholesale' || profile.role === 'admin'
          ? profile.role
          : 'customer'

      setRole(nextRole)
    } catch (error) {
      console.error('Failed to refresh auth role', error)
      setRole('guest')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const supabase = createClient()

    refreshRole()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshRole()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextType>(
    () => ({
      role,
      isWholesale: role === 'wholesale' || role === 'admin',
      isAuthenticated: role !== 'guest',
      loading,
      refreshRole,
    }),
    [role, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthRole() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuthRole must be used inside AuthProvider')
  }

  return context
}