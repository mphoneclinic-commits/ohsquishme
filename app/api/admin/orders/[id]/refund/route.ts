import { NextResponse } from 'next/server'
import { isAdminFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { stripe } from '@/lib/stripe'
import { logAdminActivity } from '@/lib/adminActivity'

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

    const restock = Boolean(body?.restock)
    const reason = String(body?.reason || '').trim() || null

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, stripe_session_id, refund_status, email')
      .eq('id', id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: orderError?.message || 'Order not found' },
        { status: 404 }
      )
    }

    if (order.refund_status === 'refunded') {
      return NextResponse.json({ error: 'Order already refunded' }, { status: 400 })
    }

    if (!order.stripe_session_id) {
      return NextResponse.json({ error: 'Missing Stripe session id' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id)
    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing Stripe payment intent' },
        { status: 400 }
      )
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
    })

    if (restock) {
      const { data: items } = await supabaseAdmin
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', id)

      for (const item of items || []) {
        if (!item.product_id) continue

        const { data: product } = await supabaseAdmin
          .from('products')
          .select('stock, name')
          .eq('id', item.product_id)
          .single()

        const nextStock = Number(product?.stock || 0) + Number(item.quantity || 0)

        await supabaseAdmin
          .from('products')
          .update({
            stock: nextStock,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.product_id)

        await supabaseAdmin.from('stock_adjustments').insert({
          product_id: item.product_id,
          admin_user_id: adminUser.id,
          delta: Number(item.quantity || 0),
          reason: `Refund restock for order ${id}`,
        })

        await logAdminActivity({
          adminUserId: adminUser.id,
          eventType: 'stock_restocked',
          entityType: 'product',
          entityId: item.product_id,
          summary: `Restocked product from refunded order ${id.slice(0, 8)}`,
          details: {
            order_id: id,
            delta: Number(item.quantity || 0),
            reason: `Refund restock for order ${id}`,
            product_name: product?.name || null,
          },
        })
      }
    }

    await supabaseAdmin
      .from('orders')
      .update({
        refund_status: 'refunded',
        status: 'cancelled',
        refunded_at: new Date().toISOString(),
      })
      .eq('id', id)

    await supabaseAdmin.from('refund_logs').insert({
      order_id: id,
      admin_user_id: adminUser.id,
      stripe_payment_intent_id: paymentIntentId,
      amount: 0,
      refund_type: 'full',
      restock,
      reason,
    })

    await logAdminActivity({
      adminUserId: adminUser.id,
      eventType: 'order_refunded',
      entityType: 'order',
      entityId: id,
      summary: `Refunded order ${id.slice(0, 8)}${restock ? ' and restocked items' : ''}`,
      details: {
        restock,
        reason,
        stripe_payment_intent_id: paymentIntentId,
        refund_id: refund.id,
        email: order.email || null,
      },
    })

    return NextResponse.json({ success: true, refundId: refund.id })
  } catch (error) {
    console.error('Refund error:', error)
    return NextResponse.json({ error: 'Refund failed' }, { status: 500 })
  }
}