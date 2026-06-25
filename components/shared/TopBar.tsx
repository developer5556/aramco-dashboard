'use client'
import { useState, useEffect } from 'react'
import { formatDateTime } from '@/lib/utils'

interface TopBarProps {
  title: string
  subtitle?: string
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  const [lastRefresh, setLastRefresh] = useState(new Date().toISOString())
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    setLastRefresh(new Date().toISOString())
    setTimeout(() => setRefreshing(false), 1000)
    window.location.reload()
  }

  return (
    <header className="h-14 border-b border-border bg-surface/50 backdrop-blur flex items-center px-6 gap-4 sticky top-0 z-30">
      <div className="flex-1">
        <h1 className="text-sm font-semibold text-text-primary">{title}</h1>
        {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3 text-xs text-text-secondary">
        <span>Updated {formatDateTime(lastRefresh)}</span>
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          title="Refresh"
        >
          <svg
            className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </header>
  )
}
