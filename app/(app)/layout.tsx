import Sidebar from '@/components/shared/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {/* On mobile: full width (no margin). On md+: offset by sidebar width (w-56 = 14rem = ml-56) */}
      <main className="flex-1 md:ml-56 min-h-screen">
        {children}
      </main>
    </div>
  )
}
