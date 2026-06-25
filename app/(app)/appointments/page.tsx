'use client'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import TopBar from '@/components/shared/TopBar'
import { StatusBadge, EmptyState, Spinner } from '@/components/shared'
import { formatDateTime, timeAgo, cn } from '@/lib/utils'

export default function AppointmentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*, seller_leads(owner_full_name, phone_primary), properties(address, city)')
        .order('scheduled_at', { ascending: true })
        .limit(100)
      return data || []
    },
  })

  const upcoming = (data || []).filter(a => new Date(a.scheduled_at) >= new Date() && a.status === 'scheduled')
  const past = (data || []).filter(a => new Date(a.scheduled_at) < new Date() || a.status !== 'scheduled')

  const ApptCard = ({ a }: { a: any }) => (
    <div className={cn('card p-4 flex gap-4', a.status === 'scheduled' && new Date(a.scheduled_at) >= new Date() && 'border-primary/20')}>
      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-primary font-bold text-sm leading-none">{new Date(a.scheduled_at).getDate()}</span>
        <span className="text-primary/70 text-[10px]">{new Date(a.scheduled_at).toLocaleString('en-US', { month: 'short' })}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono font-medium text-text-primary truncate">{a.properties?.address || '—'}</p>
        <p className="text-xs text-text-secondary mt-0.5">{a.seller_leads?.owner_full_name} · {a.seller_leads?.phone_primary}</p>
        <p className="text-xs text-text-secondary mt-0.5">{formatDateTime(a.scheduled_at)}</p>
        <div className="flex gap-2 mt-2">
          <StatusBadge status={a.status} />
          {a.reminder_24h_sent && <span className="badge text-[10px] text-success bg-success/10 border-success/20">24h ✓</span>}
          {a.reminder_1h_sent && <span className="badge text-[10px] text-success bg-success/10 border-success/20">1h ✓</span>}
        </div>
      </div>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <TopBar title="Appointments" subtitle={`${upcoming.length} upcoming`} />
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Upcoming</h2>
          {isLoading ? <Spinner /> :
            upcoming.length ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {upcoming.map(a => <ApptCard key={a.id} a={a} />)}
              </div>
            ) : <EmptyState icon="📅" title="No upcoming appointments" description="Mason will schedule them" />
          }
        </div>
        {past.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Past</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {past.slice(0, 10).map(a => <ApptCard key={a.id} a={a} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
