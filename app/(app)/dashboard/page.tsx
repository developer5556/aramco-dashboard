'use client'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import TopBar from '@/components/shared/TopBar'
import { KPICard, ScoreBadge, StatusBadge, ApprovalBanner, EmptyState, Spinner, AgentStatusDot } from '@/components/shared'
import { formatCurrency, formatDate, timeAgo, getAgentIcon, getAgentColor, getPipelineStageLabel } from '@/lib/utils'
import { AGENTS, PIPELINE_STAGES } from '@/constants'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: async () => {
      const now = new Date()
      const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const [activeLeads, hotLeads, pipeline, appointments, approvals] = await Promise.all([
        supabase.from('seller_leads').select('id', { count: 'exact', head: true }).not('status', 'in', '("dead","dnc")'),
        supabase.from('seller_leads').select('id', { count: 'exact', head: true }).eq('score_tier', 'hot'),
        supabase.from('pipeline').select('assignment_fee, net_to_aramco').not('stage', 'in', '("closed","dead")'),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'scheduled').gte('scheduled_at', now.toISOString()).lte('scheduled_at', weekEnd),
        supabase.from('approvals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ])

      const pipelineValue = (pipeline.data || []).reduce((sum, d) => sum + (d.net_to_aramco || d.assignment_fee || 0), 0)

      return {
        activeLeads: activeLeads.count || 0,
        hotLeads: hotLeads.count || 0,
        pipelineValue,
        appointments: appointments.count || 0,
        approvals: approvals.count || 0,
      }
    },
    refetchInterval: 30000,
  })

  const { data: pipelineStages } = useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: async () => {
      const { data } = await supabase.from('pipeline').select('stage').not('stage', 'in', '("closed","dead")')
      const counts: Record<string, number> = {}
      ;(data || []).forEach(d => { counts[d.stage] = (counts[d.stage] || 0) + 1 })
      return PIPELINE_STAGES.map(s => ({ name: s.label.replace(' ', '\n'), value: counts[s.value] || 0, stage: s.value }))
    },
  })

  const { data: activities } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      const { data } = await supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(20)
      return data || []
    },
    refetchInterval: 30000,
  })

  const { data: hotLeads } = useQuery({
    queryKey: ['hot-leads-top5'],
    queryFn: async () => {
      const { data } = await supabase
        .from('seller_leads')
        .select('*, properties(*)')
        .eq('score_tier', 'hot')
        .order('score', { ascending: false })
        .limit(5)
      return data || []
    },
  })

  const { data: upcomingAppts } = useQuery({
    queryKey: ['upcoming-appointments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*, seller_leads(owner_full_name), properties(address, city)')
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at')
        .limit(5)
      return data || []
    },
  })

  const { data: agentActivity } = useQuery({
    queryKey: ['agent-activity'],
    queryFn: async () => {
      const results: Record<string, string | null> = {}
      for (const agent of AGENTS) {
        const { data } = await supabase
          .from('activities')
          .select('created_at')
          .eq('agent', agent.id)
          .order('created_at', { ascending: false })
          .limit(1)
        results[agent.id] = data?.[0]?.created_at || null
      }
      return results
    },
  })

  return (
    <div className="animate-fade-in">
      {kpis?.approvals ? <ApprovalBanner count={kpis.approvals} /> : null}
      <TopBar title="Command Center" subtitle="Aramco Properties — Live Operations" />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard title="Active Leads" value={kpis?.activeLeads ?? '—'} icon="👥" color="primary" loading={kpiLoading} />
          <KPICard title="Hot Leads" value={kpis?.hotLeads ?? '—'} icon="🔥" color="danger" loading={kpiLoading} />
          <KPICard title="Pipeline Value" value={kpis ? formatCurrency(kpis.pipelineValue) : '—'} icon="💰" color="success" loading={kpiLoading} />
          <KPICard title="Appts This Week" value={kpis?.appointments ?? '—'} icon="📅" color="warning" loading={kpiLoading} />
          <KPICard title="Pending Approvals" value={kpis?.approvals ?? '—'} icon="⚠️" color={kpis?.approvals ? 'danger' : 'primary'} loading={kpiLoading} />
        </div>

        {/* Pipeline funnel + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline chart */}
          <div className="card p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Pipeline Overview</h2>
            {pipelineStages ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={pipelineStages} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: '8px', color: '#F1F5F9', fontSize: '12px' }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {(pipelineStages || []).map((entry, i) => (
                      <Cell key={i} fill={entry.value > 0 ? '#6366F1' : '#1E1E2E'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center"><Spinner /></div>
            )}
          </div>

          {/* Activity feed */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Live Activity</h2>
            <div className="space-y-3 overflow-y-auto max-h-52">
              {activities?.length ? activities.map(a => (
                <div key={a.id} className="flex items-start gap-3">
                  <span className="text-sm w-5 text-center flex-shrink-0 mt-0.5">{getAgentIcon(a.agent)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-primary truncate">{a.summary || a.action}</p>
                    <p className="text-[10px] text-text-secondary mt-0.5">{timeAgo(a.created_at)}</p>
                  </div>
                </div>
              )) : <EmptyState icon="🤖" title="No activity yet" description="Agents will log here" />}
            </div>
          </div>
        </div>

        {/* Hot leads + Appointments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hot Leads */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-primary">🔥 Hot Leads</h2>
              <Link href="/seller-leads?tier=hot" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {hotLeads?.length ? hotLeads.map(lead => (
                <Link key={lead.id} href={`/seller-leads/${lead.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-bg hover:bg-white/3 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary font-medium truncate font-mono">
                      {lead.properties?.address || lead.mailing_address || 'Unknown Address'}
                    </p>
                    <p className="text-xs text-text-secondary truncate">{lead.owner_full_name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <ScoreBadge tier={lead.score_tier} score={lead.score} size="sm" />
                  </div>
                </Link>
              )) : <EmptyState icon="🔍" title="No hot leads" description="Atlas is searching" />}
            </div>
          </div>

          {/* Upcoming appointments */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-primary">📅 Upcoming Appointments</h2>
              <Link href="/appointments" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {upcomingAppts?.length ? upcomingAppts.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-bg">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0 flex items-center justify-center text-xs font-bold text-primary">
                    {new Date(a.scheduled_at).getDate()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate font-mono">
                      {a.properties?.address || 'Unknown Property'}
                    </p>
                    <p className="text-xs text-text-secondary">{a.seller_leads?.owner_full_name} · {new Date(a.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                  </div>
                </div>
              )) : <EmptyState icon="📅" title="No upcoming appointments" description="Mason will schedule them" />}
            </div>
          </div>
        </div>

        {/* Agent Status */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">🤖 Agent Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {AGENTS.map(agent => (
              <div key={agent.id} className="flex flex-col items-center p-3 rounded-lg bg-bg border border-border text-center">
                <span className="text-2xl mb-1">{agent.icon}</span>
                <span className="text-xs font-medium text-text-primary">{agent.name}</span>
                <span className="text-[10px] text-text-secondary mb-2">{agent.role}</span>
                <AgentStatusDot lastActivity={agentActivity?.[agent.id] || null} />
                <span className="text-[10px] text-text-secondary mt-1">
                  {agentActivity?.[agent.id] ? timeAgo(agentActivity[agent.id]) : 'No activity'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
