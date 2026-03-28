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

    const delta = Number(body?.delta || 0)
    const reason = String(body?.reason || '').trim()

    if (!id) {
      return NextResponse.json({ error: 'Missing product id' }, { status: 400 })
    }

    if (!Number.isInteger(delta) || delta === 0) {
      return NextResponse.json({ error: 'Delta must be a non-zero integer' }, { status: 400 })
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, stock')
      .eq('id', id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: productError?.message || 'Product not found' }, { status: 404 })
    }

    const currentStock = Number(product.stock || 0)
    const nextStock = currentStock + delta

    if (nextStock < 0) {
      return NextResponse.json({ error: 'Stock cannot go below zero' }, { status: 400 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({
        stock: nextStock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const { error: logError } = await supabaseAdmin
      .from('stock_adjustments')
      .insert({
        product_id: id,
        admin_user_id: adminUser.id,
        delta,
        reason: reason || null,
      })

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, stock: nextStock })
  } catch (error) {
    console.error('Stock adjustment error:', error)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}