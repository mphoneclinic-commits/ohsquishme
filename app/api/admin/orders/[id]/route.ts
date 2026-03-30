import { NextResponse } from 'next/server'
import { isAdminFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  sendOrderCompletedNotification,
  sendOrderShippedNotification,
} from '@/lib/notifications'

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

    const { data: existingOrder, error: existingError } = await supabaseAdmin
      .from('orders')
      .select(
        `
        id,
        status,
        email,
        phone,
        shipping_name,
        notify_sms,
        notify_email
      `
      )
      .eq('id', id)
      .single()

    if (existingError || !existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const status = String(body?.status || '').trim() || null

    const updates: Record<string, string | null> = {
      email: String(body?.email || '').trim() || null,
      phone: String(body?.phone || '').trim() || null,
      status,
      internal_note: String(body?.internal_note || '').trim() || null,
      shipping_name: String(body?.shipping_name || '').trim() || null,
      shipping_phone: String(body?.shipping_phone || '').trim() || null,
      shipping_address_line1:
        String(body?.shipping_address_line1 || '').trim() || null,
      shipping_address_line2:
        String(body?.shipping_address_line2 || '').trim() || null,
      shipping_suburb: String(body?.shipping_suburb || '').trim() || null,
      shipping_state: String(body?.shipping_state || '').trim() || null,
      shipping_postcode: String(body?.shipping_postcode || '').trim() || null,
      delivery_notes: String(body?.delivery_notes || '').trim() || null,
      courier: String(body?.courier || '').trim() || null,
      tracking_number: String(body?.tracking_number || '').trim() || null,
    }

    if (status === 'packed') {
      updates.packed_at = new Date().toISOString()
    }

    if (status === 'shipped') {
      updates.shipped_at = new Date().toISOString()
    }

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const statusChanged = existingOrder.status !== status

    const finalEmail = updates.email || existingOrder.email
    const finalPhone = updates.phone || existingOrder.phone
    const finalShippingName = updates.shipping_name || existingOrder.shipping_name

    if (statusChanged && status === 'shipped') {
      await sendOrderShippedNotification({
        orderId: id,
        email: finalEmail,
        phone: finalPhone,
        shippingName: finalShippingName,
        courier: updates.courier,
        trackingNumber: updates.tracking_number,
        notifySms: existingOrder.notify_sms === true,
        notifyEmail: existingOrder.notify_email === true,
      })
    }

    if (statusChanged && status === 'completed') {
      await sendOrderCompletedNotification({
        orderId: id,
        email: finalEmail,
        phone: finalPhone,
        shippingName: finalShippingName,
        notifySms: existingOrder.notify_sms === true,
        notifyEmail: existingOrder.notify_email === true,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Order edit error:', error)
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    )
  }
}