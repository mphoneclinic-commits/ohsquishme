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
      product_images (
        id,
        image_url,
        sort_order
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const adminUser = await isAdminFromRequest()

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, imageId } = await params
    const body = await req.json()
    const action = String(body?.action || '').trim()

    if (!id || !imageId) {
      return NextResponse.json(
        { error: 'Missing product or image id' },
        { status: 400 }
      )
    }

    const { data: imageRows, error: imagesError } = await supabaseAdmin
      .from('product_images')
      .select('id, product_id, image_url, sort_order')
      .eq('product_id', id)
      .order('sort_order', { ascending: true })

    if (imagesError) {
      return NextResponse.json({ error: imagesError.message }, { status: 500 })
    }

    const rows = imageRows || []
    const currentIndex = rows.findIndex((row) => row.id === imageId)

    if (currentIndex === -1) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    const currentRow = rows[currentIndex]

    if (action === 'set_featured') {
      const { error: updateFeaturedError } = await supabaseAdmin
        .from('products')
        .update({ image_url: currentRow.image_url })
        .eq('id', id)

      if (updateFeaturedError) {
        return NextResponse.json(
          { error: updateFeaturedError.message },
          { status: 500 }
        )
      }
    } else if (action === 'move_left' || action === 'move_right') {
      const swapIndex = action === 'move_left' ? currentIndex - 1 : currentIndex + 1

      if (swapIndex < 0 || swapIndex >= rows.length) {
        return NextResponse.json({ error: 'Invalid move' }, { status: 400 })
      }

      const swapRow = rows[swapIndex]
      const currentSort = Number(currentRow.sort_order || 0)
      const swapSort = Number(swapRow.sort_order || 0)

      const { error: firstUpdateError } = await supabaseAdmin
        .from('product_images')
        .update({ sort_order: swapSort })
        .eq('id', currentRow.id)

      if (firstUpdateError) {
        return NextResponse.json({ error: firstUpdateError.message }, { status: 500 })
      }

      const { error: secondUpdateError } = await supabaseAdmin
        .from('product_images')
        .update({ sort_order: currentSort })
        .eq('id', swapRow.id)

      if (secondUpdateError) {
        return NextResponse.json({ error: secondUpdateError.message }, { status: 500 })
      }

      const normalizeError = await normalizeSortOrder(id)

      if (normalizeError) {
        return NextResponse.json({ error: normalizeError.message }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { data: product, error: fetchError } = await fetchProductWithImages(id)

    if (fetchError || !product) {
      return NextResponse.json(
        { error: fetchError?.message || 'Failed to reload product' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error) {
    console.error('Gallery image update error:', error)
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const adminUser = await isAdminFromRequest()

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, imageId } = await params

    if (!id || !imageId) {
      return NextResponse.json(
        { error: 'Missing product or image id' },
        { status: 400 }
      )
    }

    const { data: imageRow, error: imageError } = await supabaseAdmin
      .from('product_images')
      .select('id, product_id, image_url')
      .eq('id', imageId)
      .eq('product_id', id)
      .single()

    if (imageError || !imageRow) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    const { data: productRow, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, image_url')
      .eq('id', id)
      .single()

    if (productError || !productRow) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const { error: deleteError } = await supabaseAdmin
      .from('product_images')
      .delete()
      .eq('id', imageId)
      .eq('product_id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    const normalizeError = await normalizeSortOrder(id)

    if (normalizeError) {
      return NextResponse.json({ error: normalizeError.message }, { status: 500 })
    }

    if (productRow.image_url === imageRow.image_url) {
      const { data: remainingImages, error: remainingError } = await supabaseAdmin
        .from('product_images')
        .select('image_url, sort_order')
        .eq('product_id', id)
        .order('sort_order', { ascending: true })

      if (remainingError) {
        return NextResponse.json({ error: remainingError.message }, { status: 500 })
      }

      const nextFeatured = remainingImages?.[0]?.image_url || null

      const { error: updateFeaturedError } = await supabaseAdmin
        .from('products')
        .update({ image_url: nextFeatured })
        .eq('id', id)

      if (updateFeaturedError) {
        return NextResponse.json(
          { error: updateFeaturedError.message },
          { status: 500 }
        )
      }
    }

    const { data: product, error: fetchError } = await fetchProductWithImages(id)

    if (fetchError || !product) {
      return NextResponse.json(
        { error: fetchError?.message || 'Failed to reload product' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error) {
    console.error('Gallery image delete error:', error)
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    )
  }
}