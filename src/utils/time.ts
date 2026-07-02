/** "just now", "12 minutes ago", "3 hours ago", "2 days ago"… */
export const formatRelativeTime = (timestamp: number): string => {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (seconds < 60) return 'just now'

  const units: Array<[label: string, seconds: number]> = [
    ['year', 31_557_600],
    ['month', 2_629_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ]
  for (const [label, unitSeconds] of units) {
    const amount = Math.floor(seconds / unitSeconds)
    if (amount >= 1) return `${amount} ${label}${amount > 1 ? 's' : ''} ago`
  }
  return 'just now'
}
