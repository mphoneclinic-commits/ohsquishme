import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()

  const { data: order } = await supabase
    .from('orders')
    .insert({
      user_id: body.user_id,
      total: body.total,
    })
    .select()
    .single()

  for (const item of body.items) {
    await supabase.from('order_items').insert({
      order_id: order.id,
      product_id: item.id,
      quantity: 1,
      price: item.price,
    })
  }

  return NextResponse.json({ success: true })
}