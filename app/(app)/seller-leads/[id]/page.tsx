'use client'
import { useState, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ScoreBadge, StatusBadge, EmptyState, Spinner } from '@/components/shared'
import { formatDate, timeAgo, formatCounty, cn } from '@/lib/utils'

function LeadDetailContent() {
  const params = useParams()
  const router = useRouter()
  const leadId = params.id as string
  const [saving, setSaving] = useState(false)
  const [editStatus, setEditStatus] = useState(false)

  const { data: lead, isLoading, refetch } = useQuery({
    queryKey: ['seller-lead', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seller_leads')
        .select('*, properties(*)')
        .eq('id', leadId)
        .single()
      if (error) throw error
      return data
    },
  })

  const { data: activities } = useQuery({
    queryKey: ['lead-activities', leadId],
    queryFn: async () => {
      const { data } = await supabase
        .from('activities')
        .select('*')
        .eq('entity_id', leadId)
        .order('created_at', { ascending: false })
        .limit(20)
      return data || []
    },
  })

  const updateStatus = async (newStatus: string) => {
    setSaving(true)
    await supabase
      .from('seller_leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', leadId)
    await refetch()
    setSaving(false)
    setEditStatus(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="p-6">
        <EmptyState icon="🔍" title="Lead not found" description="This lead may have been deleted." />
        <button
          onClick={() => router.push('/seller-leads')}
          className="mt-4 px-4 py-2 text-sm rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all mx-auto block"
        >
          ← Back to Leads
        </button>
      </div>
    )
  }

  const property = lead.properties
  const address = property?.address || lead.mailing_address || 'No address on file'
  const city = property?.city || lead.mailing_city || ''
  const county = property?.county || ''

  const statusOptions = [
    'new', 'researching', 'no_contact', 'contacted', 'warm',
    'hot', 'appointment_set', 'appointment_done', 'offer_submitted',
    'under_contract', 'dead', 'dnc'
  ]

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/seller-leads')}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            ← Back
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-text-primary truncate">{address}</h1>
            <p className="text-xs text-text-secondary">
              {city}{city && county ? ', ' : ''}{county ? formatCounty(county) : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ScoreBadge tier={lead.score_tier} score={lead.score} />
            {editStatus ? (
              <select
                value={lead.status}
                onChange={e => updateStatus(e.target.value)}
                onBlur={() => setEditStatus(false)}
                autoFocus
                disabled={saving}
                className="bg-bg border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary/50"
              >
                {statusOptions.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            ) : (
              <button onClick={() => setEditStatus(true)} disabled={saving}>
                <StatusBadge status={lead.status} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Owner Card */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">Owner Information</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-secondary text-xs">Full Name</span>
                  <p className="text-text-primary">{lead.owner_full_name || lead.owner_entity_name || '—'}</p>
                </div>
                <div>
                  <span className="text-text-secondary text-xs">Entity</span>
                  <p className="text-text-primary">{lead.owner_is_entity ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <span className="text-text-secondary text-xs">Phone</span>
                  <p className="text-text-primary font-mono text-xs">{lead.phone_primary || '—'}</p>
                </div>
                <div>
                  <span className="text-text-secondary text-xs">Email</span>
                  <p className="text-text-primary text-xs">{lead.email || '—'}</p>
                </div>
                <div>
                  <span className="text-text-secondary text-xs">Mailing Address</span>
                  <p className="text-text-primary text-xs">
                    {lead.mailing_address || '—'}
                    {lead.mailing_city && `, ${lead.mailing_city}`}
                    {lead.mailing_state && ` ${lead.mailing_state}`}
                    {lead.mailing_zip && ` ${lead.mailing_zip}`}
                  </p>
                </div>
                <div>
                  <span className="text-text-secondary text-xs">Contact Status</span>
                  <p className="text-text-primary text-xs">{lead.contact_status?.replace(/_/g, ' ') || '—'}</p>
                </div>
              </div>
            </div>

            {/* Property Card */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">Property Details</h2>
              {property ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-text-secondary text-xs">Address</span>
                    <p className="text-text-primary">
                      {property?.address || lead.mailing_address || 'No address'}
                      {(() => {
                        const addr = property?.address && property?.city && property?.state && property?.zip
                          ? [property.address, property.city, property.state, property.zip].map(s => s.replace(/\s+/g, '-').replace(/[#?,]/g, '')).join('-')
                          : property?.address
                            ? property.address.replace(/\s+/g, '-').replace(/[#?,]/g, '')
                            : lead.mailing_address
                              ? lead.mailing_address.replace(/\s+/g, '-').replace(/[#?,]/g, '')
                              : null
                        return addr ? (
                          <> {' '}
                            <a
                              href={`https://www.zillow.com/homes/${addr}_rb/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-400 hover:text-primary-300 underline text-[11px]"
                            >
                              Zillow ↗
                            </a>
                          </>
                        ) : null
                      })()}
                    </p>
                  </div>
                  <div>
                    <span className="text-text-secondary text-xs">City</span>
                    <p className="text-text-primary">{property.city}</p>
                  </div>
                  <div>
                    <span className="text-text-secondary text-xs">County</span>
                    <p className="text-text-primary">{formatCounty(property.county)}</p>
                  </div>
                  <div>
                    <span className="text-text-secondary text-xs">Type</span>
                    <p className="text-text-primary">{property.property_type || '—'}</p>
                  </div>
                  <div>
                    <span className="text-text-secondary text-xs">Bedrooms</span>
                    <p className="text-text-primary">{property.bedrooms ?? '—'}</p>
                  </div>
                  <div>
                    <span className="text-text-secondary text-xs">Bathrooms</span>
                    <p className="text-text-primary">{property.bathrooms ?? '—'}</p>
                  </div>
                  <div>
                    <span className="text-text-secondary text-xs">Square Feet</span>
                    <p className="text-text-primary">{property.square_feet?.toLocaleString() || '—'}</p>
                  </div>
                  <div>
                    <span className="text-text-secondary text-xs">Year Built</span>
                    <p className="text-text-primary">{property.year_built || '—'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-text-secondary text-sm">No property record linked</p>
              )}
            </div>

            {/* Valuation Card */}
            {property && (property.arv_mid || property.mao_conservative) ? (
              <div className="card p-5">
                <h2 className="text-sm font-semibold text-text-primary mb-4">Valuation & MAO</h2>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {property.arv_mid && (
                    <div>
                      <span className="text-text-secondary text-xs">ARV (Mid)</span>
                      <p className="text-text-primary font-semibold">${property.arv_mid.toLocaleString()}</p>
                    </div>
                  )}
                  {property.repair_cost_high && (
                    <div>
                      <span className="text-text-secondary text-xs">Est. Repairs</span>
                      <p className="text-text-primary">${property.repair_cost_high.toLocaleString()}</p>
                    </div>
                  )}
                  {property.mao_conservative && (
                    <div>
                      <span className="text-text-secondary text-xs">MAO (Conservative)</span>
                      <p className="text-success font-semibold">${property.mao_conservative.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Activity Card */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">Activity Log</h2>
              {activities?.length ? (
                <div className="space-y-3">
                  {activities.map(a => (
                    <div key={a.id} className="flex items-start gap-3 p-3 bg-white/3 rounded-lg border border-border/50">
                      <div className={cn(
                        'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                        a.action?.includes('error') ? 'bg-danger' : 'bg-primary'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-text-primary">{a.summary || a.action}</p>
                        <p className="text-[10px] text-text-secondary mt-0.5">{timeAgo(a.created_at)} · {a.agent}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary text-sm">No activity recorded</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Score Card */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">Score Breakdown</h2>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-text-primary">{lead.score ?? '—'}</div>
                <ScoreBadge tier={lead.score_tier} size="md" />
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Source</span>
                  <span className="text-text-primary">{lead.lead_source || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Created</span>
                  <span className="text-text-primary">{formatDate(lead.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Last Contact</span>
                  <span className="text-text-primary">{lead.last_contacted_at ? timeAgo(lead.last_contacted_at) : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Follow-ups</span>
                  <span className="text-text-primary">{lead.followup_count}</span>
                </div>
              </div>
            </div>

            {/* Signals Card */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">Signals</h2>
              <div className="space-y-2">
                {[
                  { label: 'Absentee Owner', active: lead.is_absentee_owner },
                  { label: 'Tax Delinquent', active: lead.tax_delinquent },
                  { label: 'Pre-Foreclosure', active: lead.pre_foreclosure },
                  { label: 'Probate', active: lead.probate },
                  { label: 'Code Violations', active: lead.code_violations },
                  { label: 'Vacant', active: lead.vacant },
                  { label: 'Divorce Filing', active: lead.divorce_filing },
                  { label: 'Out of State Owner', active: lead.out_of_state_owner },
                  { label: 'MLS Expired', active: lead.mls_expired },
                ].map(signal => (
                  <div key={signal.label} className="flex items-center gap-2">
                    <span className={cn(
                      'w-2 h-2 rounded-full',
                      signal.active ? 'bg-success' : 'bg-white/10'
                    )} />
                    <span className={cn(
                      'text-xs',
                      signal.active ? 'text-text-primary' : 'text-text-secondary/50'
                    )}>
                      {signal.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Card */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">Financials</h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Asking Price</span>
                  <span className="text-text-primary">{lead.asking_price ? `$${lead.asking_price.toLocaleString()}` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Mortgage Balance</span>
                  <span className="text-text-primary">{lead.mortgage_balance ? `$${lead.mortgage_balance.toLocaleString()}` : '—'}</span>
                </div>
                {lead.seller_motivation && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-text-secondary text-xs">Motivation</span>
                    <p className="text-text-primary text-xs mt-0.5">{lead.seller_motivation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LeadDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Spinner /></div>}>
      <LeadDetailContent />
    </Suspense>
  )
}
