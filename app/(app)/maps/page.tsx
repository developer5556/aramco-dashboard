'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import TopBar from '@/components/shared/TopBar'

const PropertyMap = dynamic(
  () => import('@/components/shared/PropertyMap'),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-text-secondary text-sm">Loading map...</p>
        </div>
      </div>
    )
  }
)

export default function MapsPage() {
  const [counts, setCounts] = useState<{ total: number; noCoords: number }>({ total: 0, noCoords: 0 })

  useEffect(() => {
    fetch('/api/map-data')
      .then(r => r.json())
      .then((data: any[]) => {
        const noCoords = data.filter((p: any) => !p.seller_leads || p.seller_leads.length === 0).length
        setCounts({ total: data.length, noCoords })
      })
      .catch(() => {})
  }, [])

  return (
    <div className="animate-fade-in flex flex-col h-screen">
      <TopBar
        title="Property Map"
        subtitle={`${counts.total} leads mapped · ${counts.noCoords} properties without linked leads`}
      />
      <div className="flex-1 p-6 min-h-0">
        <PropertyMap />
      </div>
    </div>
  )
}
