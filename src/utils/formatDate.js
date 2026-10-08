// "2026-10-08T10:15:00Z" → "Oct 8, 2026"
const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

export function formatDate(value) {
  return dateFormatter.format(new Date(value))
}
