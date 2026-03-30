import { NextResponse } from 'next/server'
import { isAdminFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { logAdminActivity } from '@/lib/adminActivity'

const ALLOWED_ROLES = new Set(['customer', 'wholesale', 'admin'])

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
    const role = String(body?.role || '').trim()

    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const { data: existingProfile, error: existingProfileError } =
      await supabaseAdmin
        .from('profiles')
        .select('id, email, role')
        .eq('id', id)
        .single()

    if (existingProfileError || !existingProfile) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const previousRole = existingProfile.role

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (previousRole === 'wholesale' && role === 'customer') {
      await supabaseAdmin
        .from('wholesale_requests')
        .update({ status: 'revoked' })
        .eq('user_id', id)
        .eq('status', 'approved')

      await logAdminActivity({
        adminUserId: adminUser.id,
        eventType: 'wholesale_access_removed',
        entityType: 'user',
        entityId: id,
        summary: 'Removed wholesale access',
        details: {
          previous_role: previousRole,
          new_role: role,
          email: existingProfile.email || null,
        },
      })
    } else {
      await logAdminActivity({
        adminUserId: adminUser.id,
        eventType: 'customer_role_updated',
        entityType: 'user',
        entityId: id,
        summary: `Updated customer role to ${role}`,
        details: {
          previous_role: previousRole,
          new_role: role,
          email: existingProfile.email || null,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Customer role update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected server error' },
      { status: 500 }
    )
  }
}