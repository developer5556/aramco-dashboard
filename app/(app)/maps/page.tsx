'use client'
import TopBar from '@/components/shared/TopBar'

export default function MapsPage() {
  return (
    <div className="animate-fade-in">
      <TopBar title="Property Map" subtitle="All properties across 6 Maryland counties" />
      <div className="p-6">
        <div className="card p-8 text-center">
          <span className="text-4xl mb-4 block">🗺️</span>
          <h2 className="text-text-primary font-semibold mb-2">Maps Ready to Configure</h2>
          <p className="text-text-secondary text-sm max-w-md mx-auto">
            Add your <code className="bg-bg px-1.5 py-0.5 rounded text-primary font-mono text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your environment variables to enable the interactive property map.
          </p>
          <p className="text-text-secondary/60 text-xs mt-4">
            Jake: integrate @vis.gl/react-google-maps here with property pins from the Supabase properties table.
            Pin colors: red=HOT, orange=WARM, blue=COOL, green=under_contract, purple=closed.
          </p>
        </div>
      </div>
    </div>
  )
}
