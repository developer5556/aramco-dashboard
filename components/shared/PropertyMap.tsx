'use client'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { supabase } from '@/lib/supabase'
import { formatCounty } from '@/lib/utils'
import { COUNTIES } from '@/constants'
import Link from 'next/link'
import { fixLeafletIcons } from '@/lib/leaflet-fix'

type MapLead = {
  id: string
  property_id: string
  address: string
  city: string
  county: string
  latitude: number
  longitude: number
  score_tier: string | null
  score: number | null
  owner_full_name: string | null
  status: string
  arv_mid: number | null
  mao_standard: number | null
}

const TIER_COLORS: Record<string, string> = {
  hot: '#EF4444',
  warm: '#F59E0B',
  cool: '#6366F1',
  watch: '#94A3B8',
  skip: '#475569',
}

const STATUS_COLORS: Record<string, string> = {
  under_contract: '#10B981',
  closed: '#8B5CF6',
}

const TIER_LABELS: Record<string, string> = {
  hot: '🔴 HOT',
  warm: '🟠 WARM',
  cool: '🔵 COOL',
  watch: '⬜ WATCH',
  skip: '❌ SKIP',
}

function getMarkerColor(lead: MapLead): string {
  if (lead.status === 'under_contract') return STATUS_COLORS.under_contract
  if (lead.status === 'closed') return STATUS_COLORS.closed
  if (lead.status === 'no_lead') return '#334155'
  return TIER_COLORS[lead.score_tier || ''] || '#94A3B8'
}

function getMarkerRadius(lead: MapLead): number {
  if (lead.status === 'no_lead') return 4
  if (lead.score_tier === 'hot') return 10
  if (lead.score_tier === 'warm') return 8
  return 6
}

function MapBoundsFitter({ leads }: { leads: MapLead[] }) {
  const map = useMap()
  useEffect(() => {
    if (leads.length === 0) return
    const bounds = leads.map(l => [l.latitude, l.longitude] as [number, number])
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
    }
  }, [leads, map])
  return null
}

function formatCurrency(val: number | null): string {
  if (!val) return '—'
  return '$' + val.toLocaleString()
}

export default function PropertyMap({ initialLeads = [] }: { initialLeads?: any[] }) {
  const [allLeads, setAllLeads] = useState<MapLead[]>(initialLeads as MapLead[])
  const [initialized, setInitialized] = useState(false)
  const [filtered, setFiltered] = useState<MapLead[]>([])
  const [loading, setLoading] = useState(true)
  const [tierFilters, setTierFilters] = useState<string[]>(['hot', 'warm', 'cool', 'watch'])
  const [countyFilters, setCountyFilters] = useState<string[]>([])
  const [stats, setStats] = useState({ total: 0, hot: 0, warm: 0, cool: 0 })

  useEffect(() => {
    fixLeafletIcons()
    if (initialLeads.length === 0) {
      loadLeads()
    } else {
      setInitialized(true)
    }
  }, [])

  useEffect(() => {
    applyFilters()
  }, [allLeads, tierFilters, countyFilters])

  async function loadLeads() {
    setLoading(true)
    const { data, error } = await supabase
      .from('properties')
      .select(`
        id,
        address,
        city,
        county,
        latitude,
        longitude,
        arv_mid,
        mao_standard,
        seller_leads (
          id,
          score_tier,
          score,
          owner_full_name,
          status
        )
      `)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (error) {
      console.error('Map data error:', error)
      setLoading(false)
      return
    }

    // Map ALL properties regardless of seller_leads linkage
    const mapped: MapLead[] = (data || []).map(p => {
      const lead = (p.seller_leads as any[])?.[0] || null
      return {
        id: lead?.id || `prop-${p.id}`,
        property_id: p.id,
        address: p.address,
        city: p.city,
        county: p.county,
        latitude: p.latitude,
        longitude: p.longitude,
        score_tier: lead?.score_tier || null,
        score: lead?.score || null,
        owner_full_name: lead?.owner_full_name || null,
        status: lead?.status || 'no_lead',
        arv_mid: p.arv_mid,
        mao_standard: p.mao_standard,
      }
    })

    setAllLeads(mapped)
    setStats({
      total: mapped.length,
      hot: mapped.filter(l => l.score_tier === 'hot').length,
      warm: mapped.filter(l => l.score_tier === 'warm').length,
      cool: mapped.filter(l => l.score_tier === 'cool').length,
    })
    setLoading(false)
  }

  function applyFilters() {
    let result = allLeads
    if (tierFilters.length > 0) {
      result = result.filter(l => tierFilters.includes(l.score_tier || 'watch'))
    }
    if (countyFilters.length > 0) {
      result = result.filter(l => countyFilters.includes(l.county))
    }
    setFiltered(result)
  }

  function toggleTier(tier: string) {
    setTierFilters(prev =>
      prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]
    )
  }

  function toggleCounty(county: string) {
    setCountyFilters(prev =>
      prev.includes(county) ? prev.filter(c => c !== county) : [...prev, county]
    )
  }

  if (loading && !initialized) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface rounded-xl border border-border">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-text-secondary text-sm">Loading property map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Stats bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
        {[
          { label: 'Total', value: stats.total, color: 'bg-surface' },
          { label: '🔴 Hot', value: stats.hot, color: 'bg-hot/20 text-hot' },
          { label: '🟠 Warm', value: stats.warm, color: 'bg-warm/20 text-warm' },
          { label: '🔵 Cool', value: stats.cool, color: 'bg-cool/20 text-cool' },
        ].map(s => (
          <div key={s.label} className={`${s.color} border border-border rounded-lg px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur`}>
            {s.label}: <span className="font-bold">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filter panel */}
      <div className="absolute top-3 left-3 z-[1000] bg-surface border border-border rounded-xl p-4 shadow-xl w-48">
        <p className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Filter Leads</p>

        <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-2">Score Tier</p>
        {['hot', 'warm', 'cool', 'watch'].map(tier => (
          <label key={tier} className="flex items-center gap-2 mb-1.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={tierFilters.includes(tier)}
              onChange={() => toggleTier(tier)}
              className="rounded border-border"
            />
            <span className="flex items-center gap-1.5 text-xs text-text-secondary group-hover:text-text-primary transition-colors">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: TIER_COLORS[tier] }} />
              {TIER_LABELS[tier]}
            </span>
          </label>
        ))}

        <div className="my-3 border-t border-border" />

        <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-2">County</p>
        {COUNTIES.map(c => (
          <label key={c.value} className="flex items-center gap-2 mb-1.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={countyFilters.includes(c.value)}
              onChange={() => toggleCounty(c.value)}
              className="rounded border-border"
            />
            <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors truncate">
              {c.label.replace(' County', '').replace(' City', ' City')}
            </span>
          </label>
        ))}

        <div className="my-3 border-t border-border" />

        <p className="text-[10px] text-text-secondary mb-2">{filtered.length} pins showing</p>
        <button
          onClick={() => { setTierFilters(['hot', 'warm', 'cool', 'watch']); setCountyFilters([]) }}
          className="w-full text-xs text-primary hover:text-primary/80 transition-colors text-left"
        >
          Reset filters
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-3 z-[1000] bg-surface border border-border rounded-xl p-3 shadow-xl">
        <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Legend</p>
        {[
          { color: '#EF4444', label: 'HOT lead', size: 10 },
          { color: '#F59E0B', label: 'WARM lead', size: 8 },
          { color: '#6366F1', label: 'COOL lead', size: 6 },
          { color: '#10B981', label: 'Under Contract', size: 6 },
          { color: '#8B5CF6', label: 'Closed', size: 6 },
          { color: '#94A3B8', label: 'Watch / Other', size: 6 },
          { color: '#334155', label: 'No Lead Yet', size: 4 },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2 mb-1.5">
            <div className="rounded-full border border-white/20 flex-shrink-0"
              style={{ width: item.size, height: item.size, background: item.color }} />
            <span className="text-[10px] text-text-secondary">{item.label}</span>
          </div>
        ))}
      </div>

      {/* The actual map */}
      <MapContainer
        center={[39.0458, -76.6413]}
        zoom={9}
        style={{ height: '100%', width: '100%', borderRadius: '0.75rem', background: '#13131A' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapBoundsFitter leads={filtered} />

        {filtered.map(lead => (
          <CircleMarker
            key={lead.id}
            center={[lead.latitude, lead.longitude]}
            radius={getMarkerRadius(lead.score_tier)}
            pathOptions={{
              color: getMarkerColor(lead),
              fillColor: getMarkerColor(lead),
              fillOpacity: 0.85,
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ minWidth: '240px', fontFamily: 'Inter, sans-serif' }}>
                <p style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#F1F5F9' }}>
                  {lead.address}
                </p>
                <p style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '6px' }}>
                  {lead.city} · {formatCounty(lead.county)}
                  {lead.status === 'no_lead' && (
                    <span style={{ marginLeft: '6px', fontSize: '10px', color: '#64748B', fontStyle: 'italic' }}>(unlinked)</span>
                  )}
                </p>

                {/* Zillow thumbnail */}
                {lead.address && (
                  <a
                    href={`https://www.zillow.com/homes/${[lead.address, lead.city, lead.county || ''].map(s => s.replace(/\s+/g, '-').replace(/[#?,]/g, '')).join('-')}_rb/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', marginBottom: '8px' }}
                  >
                    <div style={{
                      width: '100%', height: '100px', borderRadius: '6px', overflow: 'hidden',
                      background: 'linear-gradient(135deg, #1e40af20, #7c3aed20)',
                      border: '1px solid #334155',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative'
                    }}>
                      <span style={{ fontSize: '32px' }}>🏠</span>
                      <span style={{
                        position: 'absolute', bottom: '6px', right: '8px',
                        fontSize: '9px', color: '#6366F1', fontWeight: 600,
                        background: '#1e1e2e', padding: '2px 6px', borderRadius: '4px'
                      }}>
                        Zillow ↗
                      </span>
                    </div>
                  </a>
                )}

                {lead.score_tier && (
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                      borderRadius: '9999px', background: `${TIER_COLORS[lead.score_tier]}20`,
                      color: TIER_COLORS[lead.score_tier], border: `1px solid ${TIER_COLORS[lead.score_tier]}40`
                    }}>
                      {TIER_LABELS[lead.score_tier]} {lead.score && ` · ${lead.score}`}
                    </span>
                  </div>
                )}

                {lead.arv_mid || lead.mao_standard ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '8px' }}>
                    <div>
                      <p style={{ fontSize: '9px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ARV</p>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#10B981' }}>{formatCurrency(lead.arv_mid)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '9px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MAO</p>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#F1F5F9' }}>{formatCurrency(lead.mao_standard)}</p>
                    </div>
                  </div>
                ) : null}

                {lead.owner_full_name && (
                  <p style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '8px' }}>
                    👤 {lead.owner_full_name}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '6px' }}>
                  {lead.status !== 'no_lead' && (
                    <Link
                      href={`/seller-leads/${lead.id}`}
                      style={{
                        flex: 1, textAlign: 'center', padding: '6px',
                        background: '#6366F1', color: 'white', borderRadius: '6px',
                        fontSize: '11px', fontWeight: 600, textDecoration: 'none'
                      }}
                    >
                      View Lead →
                    </Link>
                  )}
                  {lead.address && (
                    <a
                      href={`https://www.zillow.com/homes/${[lead.address, lead.city, lead.county || ''].map(s => s.replace(/\s+/g, '-').replace(/[#?,]/g, '')).join('-')}_rb/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 10px',
                        background: '#1E3A5F', color: '#60A5FA', borderRadius: '6px',
                        fontSize: '11px', fontWeight: 600, textDecoration: 'none',
                        border: '1px solid #1E3A5F'
                      }}
                    >
                      🏠 Zillow
                    </a>
                  )}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
