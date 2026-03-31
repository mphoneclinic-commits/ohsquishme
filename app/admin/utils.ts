export function formatDateTime(value: string | null) {
  if (!value) return '—'

  return new Date(value).toLocaleString('en-AU', {
    timeZone: 'Australia/Melbourne',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatDate(value: string | null) {
  if (!value) return '—'

  return new Date(value).toLocaleDateString('en-AU', {
    timeZone: 'Australia/Melbourne',
    dateStyle: 'medium',
  })
}

export function formatTime(value: string | null) {
  if (!value) return '—'

  return new Date(value).toLocaleTimeString('en-AU', {
    timeZone: 'Australia/Melbourne',
    timeStyle: 'short',
  })
}

export function formatRelativeTime(value: string | null) {
  if (!value) return '—'

  const now = Date.now()
  const target = new Date(value).getTime()
  const diff = Math.floor((now - target) / 1000)

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)} day ago`

  return formatDateTime(value)
}