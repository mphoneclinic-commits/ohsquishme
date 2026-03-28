import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendWholesaleRequestAlerts } from '@/lib/notifications/sendWholesaleRequestAlerts'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const businessName = String(body?.business_name || '').trim()
    const contactName = String(body?.contact_name || '').trim()
    const phone = String(body?.phone || '').trim()
    const website = String(body?.website || '').trim()
    const notes = String(body?.notes || '').trim()

    if (!businessName) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      )
    }

    const { data: existing } = await supabaseAdmin
      .from('wholesale_requests')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'You already have a pending wholesale request' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('wholesale_requests')
      .insert({
        user_id: user.id,
        email: user.email ?? null,
        business_name: businessName,
        contact_name: contactName || null,
        phone: phone || null,
        website: website || null,
        notes: notes || null,
        status: 'pending',
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    try {
      await sendWholesaleRequestAlerts({
        email: user.email ?? '',
        businessName,
        contactName: contactName || null,
        phone: phone || null,
        website: website || null,
        notes: notes || null,
      })
    } catch (alertError) {
      console.error('Wholesale request alerts failed:', alertError)
    }

    return NextResponse.json({ request: data })
  } catch (error) {
    console.error('Wholesale request error:', error)
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    )
  }
}