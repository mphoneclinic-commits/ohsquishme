import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { isAdminFromRequest } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const adminUser = await isAdminFromRequest()

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const name = String(body?.name || '').trim()
    const description = String(body?.description || '').trim()
    const priceRetail = Number(body?.price_retail || 0)
    const priceWholesale = Number(body?.price_wholesale || 0)
    const stock = Number(body?.stock || 0)
    const imageUrl = body?.image_url ? String(body.image_url).trim() : null
    const active = Boolean(body?.active)

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        name,
        description: description || null,
        price_retail: priceRetail,
        price_wholesale: priceWholesale,
        stock,
        image_url: imageUrl,
        active,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ product: data })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    )
  }
}