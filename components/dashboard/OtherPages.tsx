'use client'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import TopBar from '@/components/shared/TopBar'
import { StatusBadge, EmptyState, Spinner, AgentStatusDot } from '@/components/shared'
import { formatDate, timeAgo, getAgentIcon, getAgentColor, cn } from '@/lib/utils'
import { AGENTS } from '@/constants'

// ── Tasks Page ─────────────────────────────────────────────────
export function TasksPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .not('status', 'eq', 'completed')
        .order('due_at', { ascending: true, nullsFirst: false })
      return data || []
    },
  })

  const byAgent = AGENTS.reduce((acc, a) => {
    acc[a.id] = (data || []).filter(t => t.assigned_to === a.id)
    return acc
  }, {} as Record<string, any[]>)

  const isOverdue = (task: any) => task.due_at && new Date(task.due_at) < new Date()

  return (
    <div className="animate-fade-in">
      <TopBar title="Tasks" subtitle="Agent task queue" />
      <div className="p-6 space-y-4">
        {isLoading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> :
          AGENTS.map(agent => {
            const tasks = byAgent[agent.id] || []
            if (!tasks.length) return null
            return (
              <div key={agent.id} className="card overflow-hidden">
                <div className="flex items-center gap-3 p-4 border-b border-border">
                  <span className="text-xl">{agent.icon}</span>
                  <span className="font-semibold text-sm text-text-primary">{agent.name}</span>
                  <span className="badge text-[10px] bg-white/5 text-text-secondary border-white/10 ml-auto">{tasks.length}</span>
                </div>
                <div className="divide-y divide-border">
                  {tasks.map((task: any) => (
                    <div key={task.id} className={cn('flex items-center gap-4 px-4 py-3', isOverdue(task) && 'bg-danger/5')}>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium truncate', isOverdue(task) ? 'text-danger' : 'text-text-primary')}>{task.title}</p>
                        {task.description && <p className="text-xs text-text-secondary truncate mt-0.5">{task.description}</p>}
                      </div>
                      <span className={cn('badge text-[10px]',
                        task.priority === 'urgent' ? 'text-danger bg-danger/10 border-danger/20' :
                        task.priority === 'high' ? 'text-warning bg-warning/10 border-warning/20' :
                        'text-text-secondary bg-white/5 border-white/10'
                      )}>{task.priority}</span>
                      <StatusBadge status={task.status} />
                      {task.due_at && (
                        <span className={cn('text-xs', isOverdue(task) ? 'text-danger' : 'text-text-secondary')}>
                          {isOverdue(task) ? '⚠ ' : ''}{formatDate(task.due_at)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        }
        {!isLoading && !data?.length && <EmptyState icon="✅" title="No pending tasks" description="All caught up!" />}
      </div>
    </div>
  )
}

// ── Agent Monitor Page ─────────────────────────────────────────
export function AgentMonitorPage() {
  const { data: lastActivity } = useQuery({
    queryKey: ['agent-last-activity'],
    queryFn: async () => {
      const results: Record<string, any> = {}
      for (const agent of AGENTS) {
        const { data } = await supabase
          .from('activities')
          .select('created_at, action, summary')
          .eq('agent', agent.id)
          .order('created_at', { ascending: false })
          .limit(1)
        results[agent.id] = data?.[0] || null
      }
      return results
    },
    refetchInterval: 30000,
  })

  const { data: taskCounts } = useQuery({
    queryKey: ['agent-task-counts'],
    queryFn: async () => {
      const results: Record<string, number> = {}
      for (const agent of AGENTS) {
        const { count } = await supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('assigned_to', agent.id)
          .eq('status', 'pending')
        results[agent.id] = count || 0
      }
      return results
    },
  })

  const { data: errors } = useQuery({
    queryKey: ['agent-errors'],
    queryFn: async () => {
      const { data } = await supabase
        .from('activities')
        .select('*')
        .or('action.ilike.%error%,action.ilike.%failed%,status.eq.failed')
        .order('created_at', { ascending: false })
        .limit(20)
      return data || []
    },
  })

  const getStatus = (agentId: string) => {
    const la = lastActivity?.[agentId]
    if (!la) return { label: 'Never Active', color: 'text-text-secondary' }
    const hours = (Date.now() - new Date(la.created_at).getTime()) / (1000 * 60 * 60)
    if (hours < 1) return { label: 'Active', color: 'text-success' }
    if (hours < 24) return { label: 'Idle', color: 'text-warning' }
    return { label: 'Offline', color: 'text-danger' }
  }

  return (
    <div className="animate-fade-in">
      <TopBar title="Agent Monitor" subtitle="Real-time agent health and activity" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENTS.map(agent => {
            const status = getStatus(agent.id)
            const la = lastActivity?.[agent.id]
            return (
              <div key={agent.id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{agent.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{agent.name}</p>
                      <p className="text-xs text-text-secondary">{agent.role}</p>
                    </div>
                  </div>
                  <AgentStatusDot lastActivity={la?.created_at || null} />
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Status</span>
                    <span className={status.color}>{status.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Pending tasks</span>
                    <span className="text-text-primary">{taskCounts?.[agent.id] || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Last action</span>
                    <span className="text-text-primary truncate max-w-32 text-right">
                      {la ? timeAgo(la.created_at) : '—'}
                    </span>
                  </div>
                  {la?.summary && (
                    <p className="text-text-secondary/70 text-[10px] mt-2 truncate">{la.summary}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">⚠️ Error Log</h2>
          {errors?.length ? (
            <div className="space-y-2">
              {errors.map(e => (
                <div key={e.id} className="flex items-start gap-3 p-3 bg-danger/5 rounded-lg border border-danger/10">
                  <span className="text-sm">{getAgentIcon(e.agent)}</span>
                  <div>
                    <p className="text-xs text-danger">{e.action}</p>
                    {e.summary && <p className="text-xs text-text-secondary mt-0.5">{e.summary}</p>}
                    <p className="text-[10px] text-text-secondary mt-1">{timeAgo(e.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState icon="✅" title="No errors" description="All agents running clean" />}
        </div>
      </div>
    </div>
  )
}

// ── Notifications Page ─────────────────────────────────────────
export function NotificationsPage() {
  const { data: approvals } = useQuery({
    queryKey: ['approvals'],
    queryFn: async () => {
      const { data } = await supabase
        .from('approvals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      return data || []
    },
  })

  return (
    <div className="animate-fade-in">
      <TopBar title="Notifications" subtitle="Approvals and alerts" />
      <div className="p-6">
        <div className="card overflow-hidden">
          {!approvals?.length ? (
            <EmptyState icon="🔔" title="No notifications" description="Alerts will appear here" />
          ) : (
            <div className="divide-y divide-border">
              {approvals.map(a => (
                <div key={a.id} className={cn('flex items-start gap-4 p-4', a.status === 'pending' && 'bg-warning/3')}>
                  <div className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0',
                    a.status === 'pending' ? 'bg-warning animate-pulse-slow' :
                    a.status === 'approved' ? 'bg-success' : 'bg-danger'
                  )} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{a.title}</p>
                    {a.description && <p className="text-xs text-text-secondary mt-0.5">{a.description}</p>}
                    <p className="text-[10px] text-text-secondary mt-1">{timeAgo(a.created_at)}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Settings Page ──────────────────────────────────────────────
export function SettingsPage() {
  const integrations = [
    { name: 'Supabase', icon: '🗄️', status: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
    { name: 'Twilio', icon: '📱', status: false, note: 'Configure in .env' },
    { name: 'Google Calendar', icon: '📅', status: false, note: 'Configure in .env' },
    { name: 'RentCast', icon: '🏠', status: false, note: 'Configure in .env' },
    { name: 'ATTOM Data', icon: '📊', status: false, note: 'Configure in .env' },
    { name: 'Tracerfy', icon: '🔍', status: false, note: 'Configure in .env' },
  ]

  return (
    <div className="animate-fade-in">
      <TopBar title="Settings" subtitle="System configuration — managed by Mini" />
      <div className="p-6 space-y-6 max-w-2xl">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Company</h2>
          <div className="space-y-3 text-sm">
            {[['Company', 'Aramco Properties'], ['Owner', 'Hamza'], ['Market', 'Maryland (6 Counties)'], ['System', 'OpenClaw + Supabase + Vercel']].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-border last:border-0">
                <span className="text-text-secondary">{k}</span>
                <span className="text-text-primary">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Integrations</h2>
          <div className="space-y-3">
            {integrations.map(i => (
              <div key={i.name} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <span className="text-xl">{i.icon}</span>
                <span className="text-sm text-text-primary flex-1">{i.name}</span>
                {i.note && <span className="text-xs text-text-secondary">{i.note}</span>}
                <span className={cn('badge text-[10px]', i.status ? 'text-success bg-success/10 border-success/20' : 'text-text-secondary bg-white/5 border-white/10')}>
                  {i.status ? '✓ Connected' : 'Not configured'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 border-warning/20">
          <h2 className="text-sm font-semibold text-warning mb-2">⚙️ System Admin</h2>
          <p className="text-xs text-text-secondary">Settings are managed by Mini (System Admin agent) via OpenClaw. To change configuration, talk to Mini in your Discord server.</p>
        </div>
      </div>
    </div>
  )
}
