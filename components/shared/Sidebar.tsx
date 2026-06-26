'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/seller-leads', icon: '👥', label: 'Seller Leads', badge: 'hot' },
  { href: '/pipeline', icon: '💰', label: 'Pipeline', badge: 'pipeline' },
  { href: '/buyer-leads', icon: '🏆', label: 'Buyer Leads' },
  { href: '/appointments', icon: '📅', label: 'Appointments' },
  { href: '/tasks', icon: '✅', label: 'Tasks', badge: 'tasks' },
]

const secondaryNav = [
  { href: '/analytics', icon: '�', label: 'Analytics' },
  { href: '/maps', icon: '�️', label: 'Maps' },
  { href: '/contracts', icon: '�', label: 'Contracts' },
  { href: '/agent-monitor', icon: '🤖', label: 'Agent Monitor' },
  { href: '/notifications', icon: '🔔', label: 'Notifications', badge: 'approvals' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const toggleMobile = useCallback(() => setMobileOpen(prev => !prev), [])

  const { data: badges } = useQuery({
    queryKey: ['sidebar-badges'],
    queryFn: async () => {
      const [hotLeads, pipeline, tasks, approvals] = await Promise.all([
        supabase.from('seller_leads').select('id', { count: 'exact' }).eq('score_tier', 'hot'),
        supabase.from('pipeline').select('id', { count: 'exact' }).not('stage', 'in', '(closed,dead)'),
        supabase.from('tasks').select('id', { count: 'exact' }).eq('status', 'pending').lt('due_at', new Date().toISOString()),
        supabase.from('approvals').select('id', { count: 'exact' }).eq('status', 'pending'),
      ])
      return {
        hot: hotLeads.count || 0,
        pipeline: pipeline.count || 0,
        tasks: tasks.count || 0,
        approvals: approvals.count || 0,
      }
    },
    refetchInterval: 60000,
  })

  const getBadge = (key: string) => {
    if (!badges) return null
    const count = badges[key as keyof typeof badges]
    if (!count) return null
    return (
      <span className={cn(
        'ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
        key === 'approvals' ? 'bg-danger text-white' :
        key === 'tasks' ? 'bg-warning text-bg' :
        key === 'hot' ? 'bg-hot text-white' :
        'bg-primary/20 text-primary'
      )}>
        {count}
      </span>
    )
  }

  // Shared nav content — rendered inside both desktop and mobile
  const renderNavContent = () => (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-lg">
            🏠
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary leading-none">Aramco</div>
            <div className="text-xs text-text-secondary leading-none mt-0.5">Properties</div>
          </div>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/3'
            )}
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge && getBadge(item.badge)}
          </Link>
        ))}

        <div className="my-3 border-t border-border" />

        {secondaryNav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/3'
            )}
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge && getBadge(item.badge)}
          </Link>
        ))}

        <div className="my-3 border-t border-border" />

        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
            pathname === '/settings'
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/3'
          )}
        >
          <span className="text-base w-5 text-center">⚙️</span>
          <span>Settings</span>
        </Link>
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">H</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-text-primary truncate">Hamza</div>
            <div className="text-xs text-text-secondary truncate">Owner</div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger — placed in TopBar via sibling, but we render the toggle here for independence */}
      <button
        onClick={toggleMobile}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
        aria-label="Toggle navigation menu"
      >
        {mobileOpen ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Desktop sidebar — always visible on md+ */}
      <aside className="hidden md:flex w-56 min-h-screen bg-surface border-r border-border flex-col fixed left-0 top-0 z-40">
        {renderNavContent()}
      </aside>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 animate-fade-in"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile slide-in sidebar */}
      <aside
        className={cn(
          'md:hidden fixed left-0 top-0 z-50 w-72 h-full bg-surface border-r border-border flex flex-col transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {renderNavContent()}
      </aside>
    </>
  )
}
