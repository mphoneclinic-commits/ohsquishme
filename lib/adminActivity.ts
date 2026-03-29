import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function logAdminActivity({
  adminUserId,
  eventType,
  entityType,
  entityId,
  summary,
  details,
}: {
  adminUserId?: string | null
  eventType: string
  entityType: string
  entityId: string
  summary: string
  details?: Record<string, unknown> | null
}) {
  const { error } = await supabaseAdmin.from('admin_activity_logs').insert({
    admin_user_id: adminUserId || null,
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    summary,
    details: details || null,
  })

  if (error) {
    console.error('Failed to log admin activity:', error)
  }
}