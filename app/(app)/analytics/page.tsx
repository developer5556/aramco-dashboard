'use client'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import TopBar from '@/components/shared/TopBar'
import { Spinner } from '@/components/shared'
import { formatCurrency, formatCounty, getAgentIcon, getAgentColor } from '@/lib/utils'
import { PIPELINE_STAGES, AGENTS, COUNTIES } from '@/constants'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, FunnelChart, Funnel,
  LabelList, Legend
} from 'recharts'
import { subWeeks, startOfWeek, format } from 'date-fns'

const CHART_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
const tooltipStyle = { background: '#13131A', border: '1px solid #1E1E2E', borderRadius: '8px', color: '#F1F5F9', fontSize: '12px' }

export default function AnalyticsPage() {
  const { data: leadVelocity } = useQuery({
    queryKey: ['lead-velocity'],
    queryFn: async () => {
      const weeks = []
      for (let i = 11; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(new Date(), i))
        const weekEnd = startOfWeek(subWeeks(new Date(), i - 1))
        const { count } = await supabase
          .from('seller_leads')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', weekStart.toISOString())
          .lt('created_at', weekEnd.toISOString())
        weeks.push({ week: format(weekStart, 'MMM d'), leads: count || 0 })
      }
      return weeks
    },
  })

  const { data: conversionData } = useQuery({
    queryKey: ['conversion-funnel'],
    queryFn: async () => {
      const stages = ['new', 'contacted', 'warm', 'hot', 'offer_submitted', 'under_contract']
      const counts = await Promise.all(stages.map(s =>
        supabase.from('seller_leads').select('id', { count: 'exact', head: true }).eq('status', s)
      ))
      const labels = ['New Lead', 'Contacted', 'Warm', 'Hot', 'Offer Made', 'Under Contract']
      return stages.map((s, i) => ({ name: labels[i], value: counts[i].count || 0 }))
    },
  })

  const { data: revenueData } = useQuery({
    queryKey: ['revenue-monthly'],
    queryFn: async () => {
      const months = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString()
        const { data } = await supabase
          .from('pipeline')
          .select('net_to_aramco')
          .eq('stage', 'closed')
          .gte('closed_at', start)
          .lte('closed_at', end)
        const total = (data || []).reduce((sum, d) => sum + (d.net_to_aramco || 0), 0)
        months.push({ month: format(new Date(d.getFullYear(), d.getMonth(), 1), 'MMM'), revenue: total })
      }
      return months
    },
  })

  const { data: sourceData } = useQuery({
    queryKey: ['lead-sources'],
    queryFn: async () => {
      const { data } = await supabase.from('seller_leads').select('lead_source')
      const counts: Record<string, number> = {}
      ;(data || []).forEach(d => {
        const src = d.lead_source || 'unknown'
        counts[src] = (counts[src] || 0) + 1
      })
      return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6)
    },
  })

  const { data: countyData } = useQuery({
    queryKey: ['county-performance'],
    queryFn: async () => {
      return Promise.all(COUNTIES.map(async c => {
        const [leads, deals] = await Promise.all([
          supabase.from('seller_leads').select('id', { count: 'exact', head: true }),
          supabase.from('pipeline').select('id', { count: 'exact', head: true }).not('stage', 'in', '("dead")'),
        ])
        return { county: c.label.replace(' County', '').replace(' City', ' City'), leads: leads.count || 0, deals: deals.count || 0 }
      }))
    },
  })

  const { data: agentData } = useQuery({
    queryKey: ['agent-activity-chart'],
    queryFn: async () => {
      return Promise.all(AGENTS.map(async agent => {
        const { count } = await supabase
          .from('activities')
          .select('id', { count: 'exact', head: true })
          .eq('agent', agent.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        return { name: agent.name, icon: agent.icon, count: count || 0, color: agent.color }
      }))
    },
  })

  const ChartCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-text-primary mb-4">{title}</h2>
      {children}
    </div>
  )

  return (
    <div className="animate-fade-in">
      <TopBar title="Analytics" subtitle="Business intelligence and performance metrics" />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

        <ChartCard title="📈 Lead Velocity (12 weeks)">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={leadVelocity || []}>
              <XAxis dataKey="week" tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#6366F1', strokeWidth: 1 }} />
              <Line type="monotone" dataKey="leads" stroke="#6366F1" strokeWidth={2} dot={{ fill: '#6366F1', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="🔄 Conversion Funnel">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={conversionData || []} layout="vertical">
              <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#94A3B8', fontSize: 10 }} width={100} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]}>
                {(conversionData || []).map((_, i) => (
                  <Cell key={i} fill={`hsl(${245 + i * 15}, 70%, ${60 - i * 5}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="💰 Revenue by Month">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData || []}>
              <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} tickFormatter={v => `$${v/1000}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="📍 Lead Sources">
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={sourceData || []} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {(sourceData || []).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {(sourceData || []).map((s, i) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-text-secondary capitalize">{s.name}</span>
                  </div>
                  <span className="text-text-primary font-medium">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="🗺️ County Performance">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={countyData || []}>
              <XAxis dataKey="county" tick={{ fill: '#94A3B8', fontSize: 9 }} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '10px', color: '#94A3B8' }} />
              <Bar dataKey="leads" name="Leads" fill="#6366F1" radius={[2, 2, 0, 0]} />
              <Bar dataKey="deals" name="Deals" fill="#10B981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="🤖 Agent Activity (30 days)">
          <div className="space-y-3">
            {(agentData || []).map(agent => (
              <div key={agent.name} className="flex items-center gap-3">
                <span className="text-base w-6 text-center">{agent.icon}</span>
                <span className="text-xs text-text-secondary w-16">{agent.name}</span>
                <div className="flex-1 bg-bg rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (agent.count / Math.max(1, Math.max(...(agentData || []).map(a => a.count)))) * 100)}%`,
                      background: agent.color
                    }}
                  />
                </div>
                <span className="text-xs text-text-secondary w-8 text-right">{agent.count}</span>
              </div>
            ))}
          </div>
        </ChartCard>

      </div>
    </div>
  )
}
