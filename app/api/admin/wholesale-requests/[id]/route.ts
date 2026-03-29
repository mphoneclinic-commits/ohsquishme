import { NextResponse } from 'next/server'
import { isAdminFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendWholesaleDecisionNotification } from '@/lib/notifications'

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

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { data: requestRow, error: requestError } = await supabaseAdmin
      .from('wholesale_requests')
      .select(
        `
        id,
        user_id,
        email,
        business_name,
        phone,
        status
      `
      )
      .eq('id', id)
      .single()

    if (requestError || !requestRow) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const nextStatus = action === 'approve' ? 'approved' : 'rejected'

    const { error: updateRequestError } = await supabaseAdmin
      .from('wholesale_requests')
      .update({ status: nextStatus })
      .eq('id', id)

    if (updateRequestError) {
      return NextResponse.json(
        { error: updateRequestError.message },
        { status: 500 }
      )
    }

    if (action === 'approve') {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'wholesale' })
        .eq('id', requestRow.user_id)

      if (profileError) {
        return NextResponse.json(
          { error: profileError.message },
          { status: 500 }
        )
      }
    }

    await sendWholesaleDecisionNotification({
      userId: requestRow.user_id,
      email: requestRow.email,
      phone: requestRow.phone,
      businessName: requestRow.business_name,
      status: nextStatus,
    })

    return NextResponse.json({
      success: true,
      request: {
        ...requestRow,
        status: nextStatus,
      },
    })
  } catch (error) {
    console.error('Wholesale request update error:', error)
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    )
  }
}