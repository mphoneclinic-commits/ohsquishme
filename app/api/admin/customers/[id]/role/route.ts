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

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role')
      .eq('id', id)
      .single()

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logAdminActivity({
      adminUserId: adminUser.id,
      eventType: 'customer_role_updated',
      entityType: 'customer',
      entityId: id,
      summary: `Changed customer role to ${role}`,
      details: {
        email: existingProfile?.email || null,
        previous_role: existingProfile?.role || null,
        new_role: role,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Customer role update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected server error' },
      { status: 500 }
    )
  }
}