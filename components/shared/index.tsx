'use client'
import { cn, formatCurrency } from '@/lib/utils'

// ── KPI Card ───────────────────────────────────────────────────
interface KPICardProps {
  title: string
  value: string | number
  icon: string
  trend?: string
  trendUp?: boolean
  color?: 'primary' | 'success' | 'warning' | 'danger'
  loading?: boolean
}

export function KPICard({ title, value, icon, trend, trendUp, color = 'primary', loading }: KPICardProps) {
  const colorMap = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    success: 'text-success bg-success/10 border-success/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    danger: 'text-danger bg-danger/10 border-danger/20',
  }

  if (loading) {
    return (
      <div className="card p-5">
        <div className="skeleton h-4 w-24 mb-3" />
        <div className="skeleton h-8 w-16 mb-2" />
        <div className="skeleton h-3 w-20" />
      </div>
    )
  }

  return (
    <div className="card p-5 hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">{title}</span>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-base border', colorMap[color])}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-text-primary mb-1">{value}</div>
      {trend && (
        <div className={cn('text-xs', trendUp ? 'text-success' : 'text-text-secondary')}>
          {trendUp ? '↑' : '→'} {trend}
        </div>
      )}
    </div>
  )
}

// ── Score Badge ────────────────────────────────────────────────
interface ScoreBadgeProps {
  tier: string | null
  score?: number | null
  size?: 'sm' | 'md'
}

export function ScoreBadge({ tier, score, size = 'md' }: ScoreBadgeProps) {
  const config = {
    hot: { label: '🔴 HOT', className: 'text-hot bg-hot/10 border-hot/20' },
    warm: { label: '🟠 WARM', className: 'text-warm bg-warm/10 border-warm/20' },
    cool: { label: '🔵 COOL', className: 'text-cool bg-cool/10 border-cool/20' },
    skip: { label: '⬜ SKIP', className: 'text-text-secondary bg-white/5 border-white/10' },
  }
  const c = config[tier as keyof typeof config] || config.skip
  return (
    <span className={cn('badge', c.className, size === 'sm' ? 'text-[10px] px-1.5' : '')}>
      {c.label} {score != null && <span className="ml-1 opacity-70">{score}</span>}
    </span>
  )
}

// ── Tier Badge ─────────────────────────────────────────────────
export function TierBadge({ tier }: { tier: string | null }) {
  const config = {
    tier1: { label: '🥇 Tier 1', className: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
    tier2: { label: '🥈 Tier 2', className: 'text-slate-300 bg-slate-300/10 border-slate-300/20' },
    tier3: { label: '🥉 Tier 3', className: 'text-amber-600 bg-amber-600/10 border-amber-600/20' },
    inactive: { label: 'Inactive', className: 'text-text-secondary bg-white/5 border-white/10' },
  }
  const c = config[tier as keyof typeof config] || config.inactive
  return <span className={cn('badge', c.className)}>{c.label}</span>
}

// ── Status Badge ───────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const getClass = () => {
    switch (status) {
      case 'hot': case 'urgent': case 'failed': case 'dead': case 'dnc': case 'overdue':
        return 'text-danger bg-danger/10 border-danger/20'
      case 'warm': case 'warning': case 'pending': case 'appointment_set':
        return 'text-warning bg-warning/10 border-warning/20'
      case 'closed': case 'completed': case 'active': case 'under_contract':
        return 'text-success bg-success/10 border-success/20'
      case 'cool': case 'new': case 'in_progress': case 'researching':
        return 'text-primary bg-primary/10 border-primary/20'
      default:
        return 'text-text-secondary bg-white/5 border-white/10'
    }
  }
  return (
    <span className={cn('badge', getClass())}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

// ── Approval Banner ────────────────────────────────────────────
interface ApprovalBannerProps {
  count: number
}

export function ApprovalBanner({ count }: ApprovalBannerProps) {
  if (!count) return null
  return (
    <div className="bg-warning/10 border-b border-warning/20 px-6 py-2.5 flex items-center gap-3">
      <span className="text-warning text-sm">⚠️</span>
      <span className="text-warning text-sm font-medium">
        {count} item{count > 1 ? 's' : ''} need{count === 1 ? 's' : ''} your approval
      </span>
      <span className="text-warning/70 text-sm">→ Check Discord <strong>#approvals</strong></span>
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
}

export function EmptyState({ icon = '📭', title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-4">{icon}</span>
      <h3 className="text-text-primary font-medium mb-1">{title}</h3>
      {description && <p className="text-text-secondary text-sm">{description}</p>}
    </div>
  )
}

// ── Loading Spinner ────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <svg className={cn('animate-spin text-primary', sizeMap[size])} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ── Agent Status Dot ───────────────────────────────────────────
export function AgentStatusDot({ lastActivity }: { lastActivity: string | null }) {
  if (!lastActivity) return <span className="status-dot bg-text-secondary/30" />
  const hours = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60)
  if (hours < 1) return <span className="status-dot bg-success animate-pulse-slow" />
  if (hours < 24) return <span className="status-dot bg-warning" />
  return <span className="status-dot bg-danger" />
}
