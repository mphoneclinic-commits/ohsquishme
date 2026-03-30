import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type CheckoutItem = {
  id: string
  name: string
  price: number
  quantity: number
  image_url?: string | null
}

type ProductRow = {
  id: string
  name: string
  stock: number
  active: boolean
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      items,
      email,
      phone,
      shipping_name,
      shipping_phone,
      shipping_address_line1,
      shipping_address_line2,
      shipping_suburb,
      shipping_state,
      shipping_postcode,
      delivery_notes,
      notify_sms,
      notify_email,
    } = body as {
      items?: CheckoutItem[]
      email?: string
      phone?: string
      shipping_name?: string
      shipping_phone?: string
      shipping_address_line1?: string
      shipping_address_line2?: string
      shipping_suburb?: string
      shipping_state?: string
      shipping_postcode?: string
      delivery_notes?: string
      notify_sms?: boolean
      notify_email?: boolean
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart empty' }, { status: 400 })
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    if (!shipping_name?.trim()) {
      return NextResponse.json(
        { error: 'Shipping name is required' },
        { status: 400 }
      )
    }

    if (!shipping_phone?.trim()) {
      return NextResponse.json(
        { error: 'Shipping phone is required' },
        { status: 400 }
      )
    }

    if (!shipping_address_line1?.trim()) {
      return NextResponse.json(
        { error: 'Address line 1 is required' },
        { status: 400 }
      )
    }

    if (!shipping_suburb?.trim()) {
      return NextResponse.json(
        { error: 'Suburb is required' },
        { status: 400 }
      )
    }

    if (!shipping_state?.trim()) {
      return NextResponse.json(
        { error: 'State is required' },
        { status: 400 }
      )
    }

    if (!shipping_postcode?.trim()) {
      return NextResponse.json(
        { error: 'Postcode is required' },
        { status: 400 }
      )
    }

    const wantsSms = notify_sms !== false
    const wantsEmail = notify_email !== false

    if (!wantsSms && !wantsEmail) {
      return NextResponse.json(
        { error: 'Select at least one notification method' },
        { status: 400 }
      )
    }

    const productIds = items.map((item) => item.id)

    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, stock, active')
      .in('id', productIds)

    if (productsError) {
      console.error('Product lookup error:', productsError)
      return NextResponse.json(
        { error: productsError.message },
        { status: 500 }
      )
    }

    const productMap = new Map(
      (products || []).map((p: ProductRow) => [p.id, p])
    )

    for (const item of items) {
      const dbProduct = productMap.get(item.id)

      if (!dbProduct) {
        return NextResponse.json(
          { error: `Product not found: ${item.name}` },
          { status: 400 }
        )
      }

      if (!dbProduct.active) {
        return NextResponse.json(
          { error: `${dbProduct.name} is no longer available` },
          { status: 400 }
        )
      }

      if (Number(dbProduct.stock) < Number(item.quantity)) {
        return NextResponse.json(
          {
            error: `Not enough stock for ${dbProduct.name}. Available: ${dbProduct.stock}`,
          },
          { status: 400 }
        )
      }
    }

    const total = items.reduce((sum, item) => {
      return sum + Number(item.price) * Number(item.quantity)
    }, 0)

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        email: email.trim(),
        phone: phone.trim(),
        shipping_name: shipping_name.trim(),
        shipping_phone: shipping_phone.trim(),
        shipping_address_line1: shipping_address_line1.trim(),
        shipping_address_line2: shipping_address_line2?.trim() || null,
        shipping_suburb: shipping_suburb.trim(),
        shipping_state: shipping_state.trim(),
        shipping_postcode: shipping_postcode.trim(),
        delivery_notes: delivery_notes?.trim() || null,
        notify_sms: wantsSms,
        notify_email: wantsEmail,
        total,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order insert error:', orderError)
      return NextResponse.json(
        { error: orderError?.message || 'Failed to create order' },
        { status: 500 }
      )
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity),
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Order items insert error:', itemsError)
      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

    if (!siteUrl) {
      return NextResponse.json(
        { error: 'Missing NEXT_PUBLIC_SITE_URL' },
        { status: 500 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email.trim(),
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout/cancel?order_id=${order.id}`,
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: 'aud',
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(Number(item.price) * 100),
        },
      })),
      metadata: {
        order_id: order.id,
        email: email.trim(),
        phone: phone.trim(),
        shipping_name: shipping_name.trim(),
        shipping_suburb: shipping_suburb.trim(),
        shipping_state: shipping_state.trim(),
        shipping_postcode: shipping_postcode.trim(),
        notify_sms: wantsSms ? 'true' : 'false',
        notify_email: wantsEmail ? 'true' : 'false',
      },
    })

    const { error: updateOrderError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'awaiting_payment',
        stripe_session_id: session.id,
      })
      .eq('id', order.id)

    if (updateOrderError) {
      console.error('Order update error:', updateOrderError)
      return NextResponse.json(
        { error: updateOrderError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url: session.url,
      orderId: order.id,
    })
  } catch (error) {
    console.error('Checkout route error:', error)
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    )
  }
}