export interface Tier {
  name: string
  color: string
  bgColor: string
  min: number
}

const TIERS: Tier[] = [
  { name: 'Master', color: 'text-red-400', bgColor: 'bg-red-400/10', min: 1800 },
  { name: 'Diamond', color: 'text-cyan-300', bgColor: 'bg-cyan-300/10', min: 1600 },
  { name: 'Platinum', color: 'text-emerald-300', bgColor: 'bg-emerald-300/10', min: 1400 },
  { name: 'Gold', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', min: 1200 },
  { name: 'Silver', color: 'text-gray-300', bgColor: 'bg-gray-300/10', min: 1000 },
  { name: 'Bronze', color: 'text-amber-600', bgColor: 'bg-amber-600/10', min: 0 },
]

export function getTier(elo: number): Tier {
  return TIERS.find((t) => elo >= t.min) || TIERS[TIERS.length - 1]
}

export function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export function formatSolveTime(ms: number): string {
  if (!ms) return '-'
  const secs = Math.floor(ms / 1000)
  const mins = Math.floor(secs / 60)
  const remainSecs = secs % 60
  return `${mins}:${String(remainSecs).padStart(2, '0')}`
}
