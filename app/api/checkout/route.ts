import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()

  const { items, email } = body

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'Cart empty' }, { status: 400 })
  }

  const total = items.reduce(
    (sum: number, item: any) =>
      sum + item.price * item.quantity,
    0
  )

  // create order
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      email,
      total,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // insert items
  const orderItems = items.map((item: any) => ({
    order_id: order.id,
    product_id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
  }))

  await supabase.from('order_items').insert(orderItems)

  return NextResponse.json({
    success: true,
    orderId: order.id,
  })
}