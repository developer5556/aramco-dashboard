'use client'
import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { formatCounty } from '@/lib/utils'
import Link from 'next/link'
import { fixLeafletIcons } from '@/lib/leaflet-fix'

type MapLead = {
  id: string; property_id: string; address: string; city: string; county: string;
  state: string; zip: string; latitude: number; longitude: number;
  score_tier: string | null; score: number | null; owner_full_name: string | null;
  status: string; phone_primary: string | null; arv_mid: number | null; mao_standard: number | null;
}

const TIER_COLORS: Record<string, string> = {
  hot: '#EF4444', warm: '#F59E0B', cool: '#6366F1', watch: '#94A3B8', skip: '#475569',
}
const STATUS_COLORS: Record<string, string> = {
  under_contract: '#10B981', closed: '#8B5CF6',
}
const TIER_LABELS: Record<string, string> = {
  hot: '🔴 HOT', warm: '🟠 WARM', cool: '🔵 COOL', watch: '⬜ WATCH', skip: '❌ SKIP',
}

function getMarkerColor(lead: MapLead): string {
  if (lead.status === 'under_contract') return STATUS_COLORS.under_contract
  if (lead.status === 'closed') return STATUS_COLORS.closed
  if (lead.status === 'no_lead') return '#334155'
  return TIER_COLORS[lead.score_tier || ''] || '#94A3B8'
}

function getMarkerRadius(tier: string | null): number {
  if (tier === 'hot') return 10
  if (tier === 'warm') return 8
  return 6
}

function MapBoundsFitter({ leads }: { leads: MapLead[] }) {
  const map = useMap()
  useEffect(() => {
    if (leads.length === 0) return
    const bounds = leads.map(l => [l.latitude, l.longitude] as [number, number])
    if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
    else map.setView(bounds[0], 14)
  }, [leads, map])
  return null
}

function formatCurrency(val: number | null): string {
  if (!val) return '—'
  return '$' + val.toLocaleString()
}

export default function PropertyMap({ leads }: { leads: MapLead[] }) {
  useEffect(() => { fixLeafletIcons() }, [])

  const zillowUrl = (lead: MapLead) => {
    const parts = [lead.address, lead.city, lead.county, lead.state, lead.zip].filter(Boolean)
    return `https://www.zillow.com/homes/${parts.map(s => encodeURIComponent(s)).join('-')}_rb/`
  }

  return (
    <div className="relative w-full h-full">
      <div className="absolute bottom-6 left-3 z-[1000] bg-surface border border-border rounded-xl p-2.5 shadow-xl">
        <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Legend</p>
        {[
          { color: '#EF4444', label: 'HOT', size: 10 },
          { color: '#F59E0B', label: 'WARM', size: 8 },
          { color: '#6366F1', label: 'COOL', size: 6 },
          { color: '#10B981', label: 'Under Contract', size: 6 },
          { color: '#8B5CF6', label: 'Closed', size: 6 },
          { color: '#334155', label: 'Unlinked', size: 4 },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2 mb-1">
            <div className="rounded-full border border-white/20 flex-shrink-0"
              style={{ width: item.size, height: item.size, background: item.color }} />
            <span className="text-[10px] text-text-secondary">{item.label}</span>
          </div>
        ))}
      </div>

      <MapContainer
        center={[39.29, -76.61]}
        zoom={11}
        style={{ height: '100%', width: '100%', borderRadius: '0.75rem', background: '#13131A' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapBoundsFitter leads={leads} />
        {leads.map(lead => (
          <CircleMarker
            key={lead.id}
            center={[lead.latitude, lead.longitude]}
            radius={getMarkerRadius(lead.score_tier)}
            pathOptions={{ color: getMarkerColor(lead), fillColor: getMarkerColor(lead), fillOpacity: 0.85, weight: 2 }}
          >
            <Popup>
              <div style={{ minWidth: '240px', fontFamily: 'Inter, sans-serif' }}>
                <p style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#F1F5F9' }}>
                  {lead.address}
                </p>
                <p style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '6px' }}>
                  {lead.city}{lead.zip ? ` ${lead.zip}` : ''} · {lead.county ? formatCounty(lead.county) : ''}
                </p>
                {lead.owner_full_name && (
                  <p style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>👤 {lead.owner_full_name}</p>
                )}
                {lead.phone_primary && (
                  <p style={{ fontSize: '11px', color: '#6366F1', marginBottom: '6px' }}>📞 {lead.phone_primary}</p>
                )}
                {lead.score_tier && (
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: `${TIER_COLORS[lead.score_tier]}20`, color: TIER_COLORS[lead.score_tier], border: `1px solid ${TIER_COLORS[lead.score_tier]}40` }}>
                    {TIER_LABELS[lead.score_tier]} {lead.score ? `· ${lead.score}` : ''}
                  </span>
                )}
                {lead.arv_mid || lead.mao_standard ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '8px', marginBottom: '8px' }}>
                    <div><p style={{ fontSize: '9px', color: '#94A3B8', textTransform: 'uppercase' }}>ARV</p><p style={{ fontSize: '12px', fontWeight: 600, color: '#10B981' }}>{formatCurrency(lead.arv_mid)}</p></div>
                    <div><p style={{ fontSize: '9px', color: '#94A3B8', textTransform: 'uppercase' }}>MAO</p><p style={{ fontSize: '12px', fontWeight: 600, color: '#F1F5F9' }}>{formatCurrency(lead.mao_standard)}</p></div>
                  </div>
                ) : null}
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  {lead.status !== 'no_lead' && (
                    <Link href={`/seller-leads/${lead.id}`} style={{ flex: 1, textAlign: 'center', padding: '6px', background: '#6366F1', color: 'white', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>
                      View Lead →
                    </Link>
                  )}
                  <a href={zillowUrl(lead)} target="_blank" rel="noopener noreferrer"
                    style={{ padding: '6px 10px', background: '#1E3A5F', color: '#60A5FA', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textDecoration: 'none', border: '1px solid #1E3A5F' }}>
                    🏠 Zillow
                  </a>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}