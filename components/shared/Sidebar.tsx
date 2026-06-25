'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/seller-leads', icon: '👥', label: 'Seller Leads', badge: 'hot' },
  { href: '/pipeline', icon: '💰', label: 'Pipeline', badge: 'pipeline' },
  { href: '/buyer-leads', icon: '🏆', label: 'Buyer Leads' },
  { href: '/appointments', icon: '📅', label: 'Appointments' },
  { href: '/tasks', icon: '✅', label: 'Tasks', badge: 'tasks' },
]

const secondaryNav = [
  { href: '/analytics', icon: '📊', label: 'Analytics' },
  { href: '/maps', icon: '🗺️', label: 'Maps' },
  { href: '/contracts', icon: '📄', label: 'Contracts' },
  { href: '/agent-monitor', icon: '🤖', label: 'Agent Monitor' },
  { href: '/notifications', icon: '🔔', label: 'Notifications', badge: 'approvals' },
]

export default function Sidebar() {
  const pathname = usePathname()

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

  return (
    <aside className="w-56 min-h-screen bg-surface border-r border-border flex flex-col fixed left-0 top-0 z-40">
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
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-text-secondary hover:text-text-primary transition-colors"
            title="Sign out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
