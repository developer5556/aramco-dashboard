'use client'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import TopBar from '@/components/shared/TopBar'
import { TierBadge, StatusBadge, EmptyState, Spinner } from '@/components/shared'
import { formatCurrency, timeAgo, formatCounty } from '@/lib/utils'

export default function BuyerLeadsPage() {
  const router = useRouter()
  const { data, isLoading } = useQuery({
    queryKey: ['buyer-leads'],
    queryFn: async () => {
      const { data } = await supabase
        .from('buyer_leads')
        .select('*')
        .eq('is_active', true)
        .order('tier')
      return data || []
    },
  })

  return (
    <div className="animate-fade-in">
      <TopBar title="Buyer Leads" subtitle={`${data?.length || 0} active buyers`} />
      <div className="p-6">
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
          ) : !data?.length ? (
            <EmptyState icon="🏆" title="No buyers yet" description="Phoenix will build this list" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Tier', 'Name / Entity', 'Phone', 'Strategy', 'Max Price', 'POF', 'Last Contact'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map(buyer => (
                    <tr key={buyer.id} className="table-row-hover" onClick={() => router.push(`/buyer-leads/${buyer.id}`)}>
                      <td className="px-4 py-3"><TierBadge tier={buyer.tier} /></td>
                      <td className="px-4 py-3">
                        <p className="text-text-primary text-sm">{buyer.full_name || buyer.entity_name || '—'}</p>
                        {buyer.entity_name && buyer.full_name && <p className="text-text-secondary text-xs">{buyer.entity_name}</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">{buyer.phone}</td>
                      <td className="px-4 py-3 text-text-secondary text-xs capitalize">{buyer.strategy?.replace(/_/g, ' ') || '—'}</td>
                      <td className="px-4 py-3 text-text-secondary text-xs">{formatCurrency(buyer.max_price)}</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-[10px] ${buyer.pof_verified ? 'text-success bg-success/10 border-success/20' : 'text-text-secondary bg-white/5 border-white/10'}`}>
                          {buyer.pof_verified ? '✓ Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs">{buyer.last_contact_date ? timeAgo(buyer.last_contact_date) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
