import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

type CheckoutItem = {
  id: string
  name: string
  price: number
  quantity: number
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

    const total = items.reduce((sum, item) => {
      return sum + Number(item.price) * Number(item.quantity)
    }, 0)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        email: email || null,
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

    const { error: itemsError, data: insertedItems } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select()

    if (itemsError) {
      console.error('Order items insert error:', itemsError)
      return NextResponse.json(
        {
          error: itemsError.message,
          orderId: order.id,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      itemsInserted: insertedItems?.length || 0,
    })
  } catch (error) {
    console.error('Checkout route unexpected error:', error)
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    )
  }
}