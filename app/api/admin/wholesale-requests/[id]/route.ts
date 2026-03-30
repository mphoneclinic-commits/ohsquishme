import { NextResponse } from 'next/server'
import { isAdminFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendWholesaleDecisionNotification } from '@/lib/notifications'
import { logAdminActivity } from '@/lib/adminActivity'

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

    const { data: requestRow, error } = await supabaseAdmin
      .from('wholesale_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !requestRow) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const nextStatus = action === 'approve' ? 'approved' : 'rejected'

    // ✅ idempotent (no duplicate actions)
    if (requestRow.status === nextStatus) {
      return NextResponse.json({ success: true, request: requestRow })
    }

    // ✅ race condition protection
    const { error: updateError } = await supabaseAdmin
      .from('wholesale_requests')
      .update({ status: nextStatus })
      .eq('id', id)
      .eq('status', requestRow.status)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    if (action === 'approve') {
      await supabaseAdmin
        .from('profiles')
        .update({ role: 'wholesale' })
        .eq('id', requestRow.user_id)
    }

    if (action === 'reject') {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', requestRow.user_id)
        .single()

      if (profile?.role === 'wholesale') {
        await supabaseAdmin
          .from('profiles')
          .update({ role: 'customer' })
          .eq('id', requestRow.user_id)
      }
    }

    await sendWholesaleDecisionNotification({
      userId: requestRow.user_id,
      email: requestRow.email,
      phone: requestRow.phone,
      businessName: requestRow.business_name,
      status: nextStatus,
    })

    await logAdminActivity({
      adminUserId: adminUser.id,
      eventType:
        nextStatus === 'approved'
          ? 'wholesale_request_approved'
          : 'wholesale_request_rejected',
      entityType: 'wholesale_request',
      entityId: requestRow.id,
      summary: `${nextStatus} wholesale request`,
      details: {
        previous_status: requestRow.status,
        new_status: nextStatus,
        business_name: requestRow.business_name,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await isAdminFromRequest()
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data: requestRow } = await supabaseAdmin
      .from('wholesale_requests')
      .select('*')
      .eq('id', id)
      .single()

    const { error } = await supabaseAdmin
      .from('wholesale_requests')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (requestRow) {
      await logAdminActivity({
        adminUserId: adminUser.id,
        eventType: 'wholesale_request_deleted',
        entityType: 'wholesale_request',
        entityId: id,
        summary: `Deleted wholesale request`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    )
  }
}