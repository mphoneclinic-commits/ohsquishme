import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'

type CheckoutItem = {
  id: string
  name: string
  price: number
  quantity: number
  image_url?: string | null
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { items, email } = body as {
      items?: CheckoutItem[]
      email?: string
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart empty' }, { status: 400 })
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const total = items.reduce((sum, item) => {
      return sum + Number(item.price) * Number(item.quantity)
    }, 0)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        email: email.trim(),
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

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Order items insert error:', itemsError)
      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

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
      },
    })

    const { error: updateOrderError } = await supabase
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