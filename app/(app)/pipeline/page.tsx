'use client'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import TopBar from '@/components/shared/TopBar'
import { StatusBadge, EmptyState, Spinner } from '@/components/shared'
import { formatCurrency, getDaysInStage, getDeadlineUrgency, cn } from '@/lib/utils'
import { PIPELINE_STAGES } from '@/constants'

export default function PipelinePage() {
  const router = useRouter()

  const { data: deals, isLoading } = useQuery({
    queryKey: ['pipeline-deals'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pipeline')
        .select('*, properties(address, city, county), seller_leads(owner_full_name)')
        .not('stage', 'in', '("dead")')
        .order('created_at', { ascending: false })
      return data || []
    },
    refetchInterval: 30000,
  })

  const byStage = PIPELINE_STAGES.reduce((acc, s) => {
    acc[s.value] = (deals || []).filter(d => d.stage === s.value)
    return acc
  }, {} as Record<string, any[]>)

  const totalValue = (deals || []).reduce((sum, d) => sum + (d.net_to_aramco || d.assignment_fee || 0), 0)

  const getCardUrgency = (deal: any) => {
    const closing = getDeadlineUrgency(deal.closing_date)
    const inspection = getDeadlineUrgency(deal.inspection_period_end)
    if (closing === 'overdue' || inspection === 'overdue') return 'overdue'
    if (closing === 'urgent' || inspection === 'urgent') return 'urgent'
    return 'ok'
  }

  return (
    <div className="animate-fade-in">
      <TopBar title="Pipeline" subtitle={`${deals?.length || 0} active deals · ${formatCurrency(totalValue)} projected`} />

      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
      ) : (
        <div className="p-6 overflow-x-auto">
          <div className="flex gap-4 min-w-max">
            {PIPELINE_STAGES.map(stage => {
              const stageDeal = byStage[stage.value] || []
              const stageValue = stageDeal.reduce((sum: number, d: any) => sum + (d.net_to_aramco || d.assignment_fee || 0), 0)

              return (
                <div key={stage.value} className="w-64 flex-shrink-0">
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-xs font-semibold text-text-primary">{stage.label}</h3>
                      {stageValue > 0 && <p className="text-[10px] text-success">{formatCurrency(stageValue)}</p>}
                    </div>
                    <span className="text-xs bg-white/5 text-text-secondary px-2 py-0.5 rounded-full">
                      {stageDeal.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-2">
                    {stageDeal.length === 0 ? (
                      <div className="border-2 border-dashed border-border rounded-xl p-4 text-center">
                        <p className="text-xs text-text-secondary/50">Empty</p>
                      </div>
                    ) : stageDeal.map((deal: any) => {
                      const urgency = getCardUrgency(deal)
                      const days = getDaysInStage(deal.created_at)

                      return (
                        <div
                          key={deal.id}
                          onClick={() => router.push(`/pipeline/${deal.id}`)}
                          className={cn(
                            'card p-3 cursor-pointer hover:border-white/10 transition-all hover:translate-y-[-1px]',
                            urgency === 'overdue' && 'border-danger/30',
                            urgency === 'urgent' && 'border-warning/30',
                          )}
                        >
                          <p className="text-xs font-mono text-text-primary truncate mb-1">
                            {deal.properties?.address || '—'}
                          </p>
                          <p className="text-[10px] text-text-secondary mb-2">
                            {deal.seller_leads?.owner_full_name || '—'}
                          </p>
                          <div className="flex items-center justify-between">
                            {deal.net_to_aramco || deal.assignment_fee ? (
                              <span className="text-[10px] text-success font-medium">
                                {formatCurrency(deal.net_to_aramco || deal.assignment_fee)}
                              </span>
                            ) : <span />}
                            <span className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded',
                              days > 14 ? 'text-danger bg-danger/10' :
                              days > 7 ? 'text-warning bg-warning/10' :
                              'text-text-secondary bg-white/5'
                            )}>
                              {days}d
                            </span>
                          </div>
                          {urgency === 'overdue' && (
                            <div className="mt-2 text-[10px] text-danger">⚠ Deadline overdue</div>
                          )}
                          {urgency === 'urgent' && (
                            <div className="mt-2 text-[10px] text-warning">⏰ Deadline soon</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
