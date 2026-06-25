'use client'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import TopBar from '@/components/shared/TopBar'
import { StatusBadge, EmptyState, Spinner } from '@/components/shared'
import { formatDate, timeAgo, cn } from '@/lib/utils'

export default function ContractsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('contracts')
        .select('*, properties(address)')
        .order('created_at', { ascending: false })
      return data || []
    },
  })

  return (
    <div className="animate-fade-in">
      <TopBar title="Contracts & Documents" subtitle={`${data?.length || 0} documents`} />
      <div className="p-6">
        <div className="card overflow-hidden">
          {isLoading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> :
            !data?.length ? <EmptyState icon="📄" title="No documents yet" description="Nadia will generate these when deals progress" /> :
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Type', 'Property', 'Price', 'Approval', 'Created', 'By'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map(doc => (
                    <tr key={doc.id} className="table-row-hover">
                      <td className="px-4 py-3">
                        <span className="badge text-[10px] text-primary bg-primary/10 border-primary/20">
                          {doc.contract_type?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-primary">{doc.properties?.address || '—'}</td>
                      <td className="px-4 py-3 text-text-secondary text-xs">
                        {doc.price ? `$${doc.price.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={doc.approval_status} /></td>
                      <td className="px-4 py-3 text-text-secondary text-xs">{formatDate(doc.created_at)}</td>
                      <td className="px-4 py-3 text-text-secondary text-xs capitalize">{doc.created_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </div>
  )
}
