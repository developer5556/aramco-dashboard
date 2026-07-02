'use client'
import { useState, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import TopBar from '@/components/shared/TopBar'
import { ScoreBadge, StatusBadge, EmptyState, Spinner } from '@/components/shared'
import { timeAgo, formatCounty, cn } from '@/lib/utils'
import { COUNTIES } from '@/constants'

function ContactedLeadsContent() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [countyFilter, setCountyFilter] = useState<string[]>([])
  const [hasPhone, setHasPhone] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 25

  const { data, isLoading } = useQuery({
    queryKey: ['contacted-leads', search, tierFilter, statusFilter, sourceFilter, countyFilter, hasPhone, dateFrom, dateTo, page],
    queryFn: async () => {
      let q = supabase
        .from('seller_leads')
        .select('*, properties(address, city, county, state, zip)', { count: 'exact' })
        .not('last_contacted_at', 'is', null)
        .order('last_contacted_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (tierFilter) q = q.eq('score_tier', tierFilter)
      if (statusFilter) q = q.eq('status', statusFilter)
      if (sourceFilter) q = q.eq('lead_source', sourceFilter)
      if (hasPhone) q = q.not('phone_primary', 'is', null)
      if (dateFrom) q = q.gte('created_at', new Date(dateFrom).toISOString())
      if (dateTo) q = q.lte('created_at', new Date(dateTo + 'T23:59:59').toISOString())
      if (countyFilter.length) q = q.in('properties.county', countyFilter)

      const { data, count, error } = await q
      return { leads: data || [], total: count || 0 }
    },
  })

  const filtered = data?.leads.filter(l => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      l.properties?.address?.toLowerCase().includes(s) ||
      l.owner_full_name?.toLowerCase().includes(s) ||
      l.owner_entity_name?.toLowerCase().includes(s) ||
      l.phone_primary?.toLowerCase().includes(s)
    )
  }) || []

  return (
    <div className="animate-fade-in">
      <TopBar title="Contacted Leads" subtitle={`${data?.total || 0} leads with contact history`} />

      <div className="p-6">
        <div className="card p-4 mb-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-48">
            <input
              type="text"
              placeholder="Search address, owner, or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>

          <select
            value={tierFilter}
            onChange={e => { setTierFilter(e.target.value); setPage(0) }}
            className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all"
          >
            <option value="">All Tiers</option>
            <option value="hot">🔴 HOT</option>
            <option value="warm">🟠 WARM</option>
            <option value="cool">🔵 COOL</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
            className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all"
          >
            <option value="">All Statuses</option>
            <option value="contacted">contacted</option>
            <option value="warm">warm</option>
            <option value="hot">hot</option>
            <option value="appointment_set">appointment_set</option>
            <option value="appointment_done">appointment_done</option>
            <option value="offer_submitted">offer_submitted</option>
            <option value="under_contract">under_contract</option>
          </select>

          <select
            value={sourceFilter}
            onChange={e => { setSourceFilter(e.target.value); setPage(0) }}
            className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all"
          >
            <option value="">All Sources</option>
            <option value="atlas_scrape">Atlas Scrape</option>
            <option value="socrata_counties">Socrata Counties</option>
            <option value="baltimore_city_open_data">Baltimore City</option>
            <option value="socrata_eviction">Eviction Records</option>
            <option value="manual">Manual Entry</option>
          </select>

          <select
            onChange={e => { setCountyFilter(e.target.value ? [e.target.value] : []); setPage(0) }}
            className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all"
          >
            <option value="">All Counties</option>
            {COUNTIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          <button
            onClick={() => { setHasPhone(h => !h); setPage(0) }}
            className={cn(
              'px-3 py-2 text-xs rounded-lg border transition-all whitespace-nowrap',
              hasPhone
                ? 'bg-primary/20 border-primary/50 text-primary'
                : 'bg-bg border-border text-text-secondary hover:text-text-primary'
            )}
          >
            📞 Has Phone
          </button>

          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(0) }}
              className="bg-bg border border-border rounded-lg px-2 py-2 text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all w-[130px]"
              placeholder="From"
            />
            <span>→</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(0) }}
              className="bg-bg border border-border rounded-lg px-2 py-2 text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all w-[130px]"
              placeholder="To"
            />
          </div>

          <span className="text-xs text-text-secondary ml-auto">{filtered.length} results</span>
        </div>

        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="📞" title="No contacted leads yet" description="Leads appear here once you log contact with them" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Score</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Address</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Owner</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">City/County</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Last Contact</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(lead => (
                    <tr
                      key={lead.id}
                      className="table-row-hover transition-colors"
                      onClick={() => router.push(`/seller-leads/${lead.id}`)}
                    >
                      <td className="px-4 py-3">
                        <ScoreBadge tier={lead.score_tier} score={lead.score} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-text-primary">
                          {lead.properties?.address || lead.mailing_address || lead.mailing_city || 'No address'}
                        </span>
                        {lead.properties?.city && (
                          <span className="text-text-secondary text-xs ml-1">{lead.properties.city}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs">
                        {lead.owner_full_name || lead.owner_entity_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs font-mono">
                        {lead.phone_primary || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs">
                        {lead.properties?.county ? formatCounty(lead.properties.county) : lead.mailing_city || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {lead.last_contacted_at ? (
                          <span className="text-primary-400 text-xs font-medium">{timeAgo(lead.last_contacted_at)}</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs">
                        {lead.lead_source || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {data && data.total > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-text-secondary">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data.total)} of {data.total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-xs rounded-lg border border-border text-text-secondary hover:text-text-primary disabled:opacity-30 transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * PAGE_SIZE >= data.total}
                className="px-3 py-1.5 text-xs rounded-lg border border-border text-text-secondary hover:text-text-primary disabled:opacity-30 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ContactedLeadsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Spinner /></div>}>
      <ContactedLeadsContent />
    </Suspense>
  )
}