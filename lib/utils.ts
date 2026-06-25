import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isAfter, isBefore, addHours } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'MMM d, yyyy h:mm a')
}

export function timeAgo(date: string | null | undefined): string {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function getScoreColor(tier: string | null): string {
  switch (tier) {
    case 'hot': return 'text-hot bg-hot/10 border-hot/20'
    case 'warm': return 'text-warm bg-warm/10 border-warm/20'
    case 'cool': return 'text-cool bg-cool/10 border-cool/20'
    default: return 'text-text-secondary bg-white/5 border-white/10'
  }
}

export function getScoreLabel(tier: string | null): string {
  switch (tier) {
    case 'hot': return '🔴 HOT'
    case 'warm': return '🟠 WARM'
    case 'cool': return '🔵 COOL'
    default: return '— —'
  }
}

export function getTierColor(tier: string | null): string {
  switch (tier) {
    case 'tier1': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    case 'tier2': return 'text-slate-300 bg-slate-300/10 border-slate-300/20'
    case 'tier3': return 'text-amber-600 bg-amber-600/10 border-amber-600/20'
    default: return 'text-text-secondary bg-white/5 border-white/10'
  }
}

export function getTierLabel(tier: string | null): string {
  switch (tier) {
    case 'tier1': return '🥇 Tier 1'
    case 'tier2': return '🥈 Tier 2'
    case 'tier3': return '🥉 Tier 3'
    default: return 'Inactive'
  }
}

export function getAgentColor(agent: string): string {
  const colors: Record<string, string> = {
    director: '#6366F1',
    atlas: '#06B6D4',
    mason: '#10B981',
    nadia: '#F59E0B',
    sentinel: '#8B5CF6',
    phoenix: '#EF4444',
    mini: '#EC4899',
  }
  return colors[agent] || '#94A3B8'
}

export function getAgentIcon(agent: string): string {
  const icons: Record<string, string> = {
    director: '🎯',
    atlas: '🔍',
    mason: '📞',
    nadia: '📋',
    sentinel: '📊',
    phoenix: '🏆',
    mini: '⚙️',
  }
  return icons[agent] || '🤖'
}

export function getPipelineStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    lead_qualified: 'Lead Qualified',
    appointment_done: 'Appointment Done',
    offer_submitted: 'Offer Submitted',
    under_contract: 'Under Contract',
    buyer_matching: 'Buyer Matching',
    buyer_under_contract: 'Buyer Under Contract',
    inspection_period: 'Inspection Period',
    closing_scheduled: 'Closing Scheduled',
    closed: 'Closed',
    dead: 'Dead',
  }
  return labels[stage] || stage
}

export function getDeadlineUrgency(date: string | null): 'overdue' | 'urgent' | 'soon' | 'ok' | 'none' {
  if (!date) return 'none'
  const d = new Date(date)
  const now = new Date()
  if (isBefore(d, now)) return 'overdue'
  if (isBefore(d, addHours(now, 72))) return 'urgent'
  if (isBefore(d, addHours(now, 168))) return 'soon'
  return 'ok'
}

export function getDeadlineColor(urgency: string): string {
  switch (urgency) {
    case 'overdue': return 'text-danger bg-danger/10'
    case 'urgent': return 'text-warning bg-warning/10'
    case 'soon': return 'text-yellow-300 bg-yellow-300/10'
    default: return 'text-success bg-success/10'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'hot': case 'urgent': case 'failed': case 'dead': case 'dnc':
      return 'text-danger bg-danger/10'
    case 'warm': case 'warning': case 'pending':
      return 'text-warning bg-warning/10'
    case 'closed': case 'completed': case 'active':
      return 'text-success bg-success/10'
    case 'cool': case 'new': case 'in_progress':
      return 'text-primary bg-primary/10'
    default:
      return 'text-text-secondary bg-white/5'
  }
}

export function formatCounty(county: string): string {
  return county
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

export function getDaysInStage(createdAt: string): number {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
  return days
}
