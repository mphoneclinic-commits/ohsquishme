import { NextResponse } from 'next/server'
import { isAdminFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
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

    const delta = Number(body?.delta)
    const reason = String(body?.reason || '').trim()

    if (!Number.isInteger(delta) || delta === 0) {
      return NextResponse.json(
        { error: 'Delta must be a non-zero integer' },
        { status: 400 }
      )
    }

    const { data: product, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('id, name, stock')
      .eq('id', id)
      .single()

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const currentStock = Number(product.stock || 0)
    const nextStock = currentStock + delta

    if (nextStock < 0) {
      return NextResponse.json(
        { error: 'Stock cannot go below zero' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({
        stock: nextStock,
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    const { error: stockLogError } = await supabaseAdmin
      .from('stock_adjustments')
      .insert({
        product_id: id,
        admin_user_id: adminUser.id,
        delta,
        reason: reason || null,
      })

    if (stockLogError) {
      console.error('Failed to write stock adjustment log:', stockLogError)
    }

    await logAdminActivity({
      adminUserId: adminUser.id,
      eventType: 'stock_adjusted',
      entityType: 'product',
      entityId: id,
      summary: `Adjusted stock for ${product.name || 'product'} by ${delta}`,
      details: {
        product_name: product.name || null,
        previous_stock: currentStock,
        new_stock: nextStock,
        delta,
        reason: reason || null,
      },
    })

    return NextResponse.json({
      success: true,
      stock: nextStock,
      reason: reason || null,
    })
  } catch (error) {
    console.error('Stock adjust error:', error)
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    )
  }
}