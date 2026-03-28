import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { isAdminFromRequest } from '@/lib/auth'

const ALLOWED_STATUSES = new Set([
  'pending',
  'awaiting_payment',
  'paid',
  'payment_failed',
  'stock_issue',
  'packed',
  'shipped',
  'completed',
  'cancelled',
])

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await isAdminFromRequest()

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const status = String(body?.status || '').trim()

    if (!id) {
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 })
    }

    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin order status update error:', error)
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    )
  }
}