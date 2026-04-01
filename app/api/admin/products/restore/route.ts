import { NextResponse } from 'next/server'
import { isAdminFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const adminUser = await isAdminFromRequest()

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const product = body?.product
    const stockAdjustments = Array.isArray(body?.stock_adjustments)
      ? body.stock_adjustments
      : []

    if (!product?.id) {
      return NextResponse.json({ error: 'Missing product data' }, { status: 400 })
    }

    const { error: insertProductError } = await supabaseAdmin
      .from('products')
      .insert({
        id: product.id,
        name: product.name,
        description: product.description ?? null,
        price_retail: Number(product.price_retail || 0),
        price_wholesale: Number(product.price_wholesale || 0),
        stock: Number(product.stock || 0),
        image_url: product.image_url ?? null,
        active: Boolean(product.active),
        created_at: product.created_at ?? undefined,
        updated_at: product.updated_at ?? undefined,
      })

    if (insertProductError) {
      return NextResponse.json(
        { error: insertProductError.message },
        { status: 500 }
      )
    }

    const productImages = Array.isArray(product.product_images)
      ? product.product_images
      : []

    if (productImages.length > 0) {
      const { error: insertImagesError } = await supabaseAdmin
        .from('product_images')
        .insert(
          productImages.map((image: any) => ({
            id: image.id,
            product_id: product.id,
            image_url: image.image_url,
            sort_order: Number(image.sort_order || 0),
            created_at: image.created_at ?? undefined,
          }))
        )

      if (insertImagesError) {
        return NextResponse.json(
          { error: insertImagesError.message },
          { status: 500 }
        )
      }
    }

    if (stockAdjustments.length > 0) {
      const { error: insertAdjustmentsError } = await supabaseAdmin
        .from('stock_adjustments')
        .insert(
          stockAdjustments.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            admin_user_id: item.admin_user_id ?? null,
            delta: Number(item.delta || 0),
            reason: item.reason ?? null,
            created_at: item.created_at ?? undefined,
          }))
        )

      if (insertAdjustmentsError) {
        return NextResponse.json(
          { error: insertAdjustmentsError.message },
          { status: 500 }
        )
      }
    }

    const { data: restoredProduct, error: fetchError } = await supabaseAdmin
      .from('products')
      .select(`
        id,
        name,
        description,
        price_retail,
        price_wholesale,
        stock,
        image_url,
        active,
        created_at,
        updated_at,
        product_images (
          id,
          image_url,
          sort_order,
          created_at
        )
      `)
      .eq('id', product.id)
      .single()

    if (fetchError || !restoredProduct) {
      return NextResponse.json(
        { error: fetchError?.message || 'Failed to reload restored product' },
        { status: 500 }
      )
    }

    const { data: restoredAdjustments } = await supabaseAdmin
      .from('stock_adjustments')
      .select('id, product_id, admin_user_id, delta, reason, created_at')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      success: true,
      product: restoredProduct,
      stock_adjustments: restoredAdjustments || [],
    })
  } catch (error) {
    console.error('Restore product error:', error)
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    )
  }
}