import { NextResponse } from 'next/server'
import { isAdminFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete order error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected server error' },
      { status: 500 }
    )
  }
}