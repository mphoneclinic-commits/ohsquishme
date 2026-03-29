import { NextResponse } from 'next/server'
import { isAdminFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { logAdminActivity } from '@/lib/adminActivity'

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

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, email, status, total')
      .eq('id', id)
      .single()

    const { error: deleteItemsError } = await supabaseAdmin
      .from('order_items')
      .delete()
      .eq('order_id', id)

    if (deleteItemsError) {
      return NextResponse.json(
        { error: `Failed to delete order items: ${deleteItemsError.message}` },
        { status: 500 }
      )
    }

    const { error: deleteRefundLogsError } = await supabaseAdmin
      .from('refund_logs')
      .delete()
      .eq('order_id', id)

    if (deleteRefundLogsError) {
      return NextResponse.json(
        { error: `Failed to delete refund logs: ${deleteRefundLogsError.message}` },
        { status: 500 }
      )
    }

    const { error: deleteOrderError } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', id)

    if (deleteOrderError) {
      return NextResponse.json(
        { error: `Failed to delete order: ${deleteOrderError.message}` },
        { status: 500 }
      )
    }

    await logAdminActivity({
      adminUserId: adminUser.id,
      eventType: 'order_deleted',
      entityType: 'order',
      entityId: id,
      summary: `Deleted order ${id.slice(0, 8)}`,
      details: {
        email: order?.email || null,
        previous_status: order?.status || null,
        total: order?.total ?? null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete order error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected server error' },
      { status: 500 }
    )
  }
}