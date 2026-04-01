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

    if (!id) {
      return NextResponse.json({ error: 'Missing product id' }, { status: 400 })
    }

    const name = String(body?.name || '').trim()
    const description = body?.description ? String(body.description).trim() : null
    const image_url = body?.image_url ? String(body.image_url).trim() : null
    const active = typeof body?.active === 'boolean' ? body.active : true

    const price_retail = Number(body?.price_retail ?? 0)
    const price_wholesale = Number(body?.price_wholesale ?? 0)
    const stock = Number(body?.stock ?? 0)

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (Number.isNaN(price_retail) || price_retail < 0) {
      return NextResponse.json(
        { error: 'Retail price must be 0 or more' },
        { status: 400 }
      )
    }

    if (Number.isNaN(price_wholesale) || price_wholesale < 0) {
      return NextResponse.json(
        { error: 'Wholesale price must be 0 or more' },
        { status: 400 }
      )
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        { error: 'Stock must be a whole number 0 or greater' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('products')
      .update({
        name,
        description,
        price_retail,
        price_wholesale,
        stock,
        image_url,
        active,
      })
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to update product' },
        { status: 500 }
      )
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
    console.error('Product update error:', error)
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

    if (!id) {
      return NextResponse.json({ error: 'Missing product id' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Product delete error:', error)
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    )
  }
}