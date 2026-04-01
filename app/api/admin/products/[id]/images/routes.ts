import { NextResponse } from 'next/server'
import { isAdminFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

async function fetchProductWithImages(id: string) {
  const { data, error } = await supabaseAdmin
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
    .eq('id', id)
    .single()

  return { data, error }
}

async function normalizeSortOrder(productId: string) {
  const { data: rows, error } = await supabaseAdmin
    .from('product_images')
    .select('id, sort_order')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  if (error) return error

  for (let index = 0; index < (rows || []).length; index += 1) {
    const row = rows![index]
    const targetSort = index

    if (Number(row.sort_order || 0) !== targetSort) {
      const { error: updateError } = await supabaseAdmin
        .from('product_images')
        .update({ sort_order: targetSort })
        .eq('id', row.id)

      if (updateError) return updateError
    }
  }

  return null
}

export async function POST(
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
    const imageUrl = String(body?.image_url || '').trim()
    const requestedSortOrder =
      body?.sort_order === null || body?.sort_order === undefined
        ? null
        : Number(body.sort_order)
    const setFeatured = Boolean(body?.set_featured)

    if (!id) {
      return NextResponse.json({ error: 'Missing product id' }, { status: 400 })
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, image_url')
      .eq('id', id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const { data: existingImages, error: existingError } = await supabaseAdmin
      .from('product_images')
      .select('id, sort_order')
      .eq('product_id', id)
      .order('sort_order', { ascending: true })

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 })
    }

    let nextSortOrder =
      existingImages && existingImages.length > 0
        ? Math.max(...existingImages.map((item) => Number(item.sort_order || 0))) + 1
        : 0

    if (requestedSortOrder !== null && Number.isInteger(requestedSortOrder) && requestedSortOrder >= 0) {
      nextSortOrder = requestedSortOrder
    }

    const { error: insertError } = await supabaseAdmin
      .from('product_images')
      .insert({
        product_id: id,
        image_url: imageUrl,
        sort_order: nextSortOrder,
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const normalizeError = await normalizeSortOrder(id)

    if (normalizeError) {
      return NextResponse.json({ error: normalizeError.message }, { status: 500 })
    }

    if (!product.image_url || setFeatured) {
      const { error: updateFeaturedError } = await supabaseAdmin
        .from('products')
        .update({ image_url: imageUrl })
        .eq('id', id)

      if (updateFeaturedError) {
        return NextResponse.json(
          { error: updateFeaturedError.message },
          { status: 500 }
        )
      }
    }

    const { data: updatedProduct, error: fetchError } = await fetchProductWithImages(id)

    if (fetchError || !updatedProduct) {
      return NextResponse.json(
        { error: fetchError?.message || 'Failed to reload product' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      product: updatedProduct,
    })
  } catch (error) {
    console.error('Gallery image create error:', error)
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    )
  }
}