import { NextResponse } from 'next/server'
import { isAdminFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

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
    const action = String(body?.action || '').trim()

    if (!id) {
      return NextResponse.json({ error: 'Missing request id' }, { status: 400 })
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { data: requestRow, error: requestError } = await supabaseAdmin
      .from('wholesale_requests')
      .select('id, user_id, status')
      .eq('id', id)
      .single()

    if (requestError || !requestRow) {
      return NextResponse.json(
        { error: requestError?.message || 'Request not found' },
        { status: 404 }
      )
    }

    if (requestRow.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request has already been processed' },
        { status: 400 }
      )
    }

    const nextStatus = action === 'approve' ? 'approved' : 'rejected'

    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from('wholesale_requests')
      .update({ status: nextStatus })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    if (action === 'approve') {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'wholesale' })
        .eq('id', requestRow.user_id)

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ request: updatedRequest })
  } catch (error) {
    console.error('Wholesale request admin action error:', error)
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    )
  }
}