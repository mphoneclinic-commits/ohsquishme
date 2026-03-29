import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    const cookieStore = cookies()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            cookie: cookieStore.toString(),
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // check role via admin client
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { count, error } = await supabaseAdmin
      .from('wholesale_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ count: count ?? 0 })
  } catch (error) {
    console.error('Pending wholesale count error:', error)
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    )
  }
}