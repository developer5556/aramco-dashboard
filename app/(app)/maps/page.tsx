'use client'
import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import TopBar from '@/components/shared/TopBar'
import { cn } from '@/lib/utils'
import { COUNTIES } from '@/constants'

const PropertyMap = dynamic(() => import('@/components/shared/PropertyMap'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-text-secondary text-sm">Loading map...</p>
      </div>
    </div>
  )
})

type MapLead = {
  id: string; property_id: string; address: string; city: string; county: string;
  state: string; zip: string; latitude: number; longitude: number;
  score_tier: string | null; score: number | null; owner_full_name: string | null;
  status: string; phone_primary: string | null; last_contacted_at: string | null;
  lead_source: string | null; arv_mid: number | null; mao_standard: number | null;
}

export default function MapsPage() {
  const [streetFilter, setStreetFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [zipFilter, setZipFilter] = useState('')
  const [countyFilter, setCountyFilter] = useState<string[]>([])
  const [tierFilter, setTierFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [hasPhone, setHasPhone] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [geoResult, setGeoResult] = useState('')

  const { data: allLeads = [], isLoading } = useQuery({
    queryKey: ['map-data'],
    queryFn: async () => {
      const res = await fetch('/api/map-data')
      return (await res.json()) as MapLead[]
    },
  })

  const filtered = allLeads.filter(l => {
    if (tierFilter && l.score_tier !== tierFilter) return false
    if (statusFilter && l.status !== statusFilter) return false
    if (countyFilter.length && !countyFilter.includes(l.county)) return false
    if (streetFilter && !l.address?.toLowerCase().includes(streetFilter.toLowerCase())) return false
    if (cityFilter && !l.city?.toLowerCase().includes(cityFilter.toLowerCase())) return false
    if (zipFilter && !l.zip?.includes(zipFilter)) return false
    if (hasPhone && !l.phone_primary?.trim()) return false
    return true
  })

  const geocodeAll = useCallback(async () => {
    setGeocoding(true)
    setGeoResult('Geocoding...')
    try {
      const res = await fetch('/api/geocode-properties', { method: 'POST' })
      const data = await res.json()
      setGeoResult(`Geocoded ${data.geocoded || 0} properties`)
    } catch {
      setGeoResult('Geocoding failed')
    }
    setGeocoding(false)
  }, [])

  const clearFilters = () => {
    setStreetFilter(''); setCityFilter(''); setZipFilter('')
    setCountyFilter([]); setTierFilter(''); setStatusFilter(''); setHasPhone(false)
  }

  const hasActiveFilters = streetFilter || cityFilter || zipFilter || countyFilter.length || tierFilter || statusFilter || hasPhone

  return (
    <div className="animate-fade-in flex flex-col h-screen">
      <TopBar title="Property Map" subtitle={`${filtered.length} of ${allLeads.length} leads mapped`} />
      <div className="flex-1 p-6 min-h-0 flex flex-col gap-4">
        {/* Filter bar */}
        <div className="card p-3 flex flex-wrap items-center gap-2">
          <input type="text" placeholder="Street..." value={streetFilter} onChange={e => setStreetFilter(e.target.value)}
            className="bg-bg border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary/50 transition-all w-[110px]" />
          <input type="text" placeholder="City..." value={cityFilter} onChange={e => setCityFilter(e.target.value)}
            className="bg-bg border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary/50 transition-all w-[100px]" />
          <input type="text" placeholder="ZIP..." value={zipFilter} onChange={e => setZipFilter(e.target.value)}
            className="bg-bg border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary/50 transition-all w-[80px]" />
          <select onChange={e => setCountyFilter(e.target.value ? [e.target.value] : [])}
            className="bg-bg border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all max-w-[140px]">
            <option value="">All Counties</option>
            {COUNTIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
            className="bg-bg border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all">
            <option value="">All Tiers</option>
            <option value="hot">🔴 HOT</option>
            <option value="warm">🟠 WARM</option>
            <option value="cool">🔵 COOL</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-bg border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all">
            <option value="">All Statuses</option>
            <option value="contacted">contacted</option>
            <option value="warm">warm</option>
            <option value="hot">hot</option>
            <option value="appointment_set">appointment_set</option>
            <option value="appointment_done">appointment_done</option>
            <option value="offer_submitted">offer_submitted</option>
            <option value="under_contract">under_contract</option>
          </select>
          <button onClick={() => setHasPhone(h => !h)}
            className={cn('px-2 py-1.5 text-xs rounded-lg border transition-all whitespace-nowrap', hasPhone ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-bg border-border text-text-secondary hover:text-text-primary')}>📞 Has Phone</button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="px-2 py-1.5 text-xs rounded-lg border border-danger/30 text-danger hover:bg-danger/10 transition-all whitespace-nowrap">✕ Clear</button>
          )}
          <span className="text-xs text-text-secondary ml-auto">{filtered.length} pins</span>
        </div>

        {/* Map */}
        <div className="flex-1 min-h-0 relative">
          {isLoading ? (
            <div className="flex items-center justify-center h-full"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>
          ) : allLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full bg-surface rounded-xl border border-border gap-3">
              <span className="text-4xl">🗺️</span>
              <p className="text-text-secondary text-sm">No geocoded properties yet</p>
              <button onClick={geocodeAll} disabled={geocoding}
                className="px-4 py-2 text-xs rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-all">
                {geocoding ? 'Geocoding...' : '🔧 Geocode All Properties'}
              </button>
              {geoResult && <p className="text-xs text-text-secondary">{geoResult}</p>}
            </div>
          ) : (
            <PropertyMap leads={filtered} />
          )}
        </div>
      </div>
    </div>
  )
}