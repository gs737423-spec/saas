import SideRail from '@/components/layout/SideRail'
import TopNav from '@/components/layout/TopNav'
import Dashboard from '@/pages/Dashboard'

export default function App() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-bg-primary">
      <SideRail />
      <TopNav />
      <main className="ml-16 pt-16">
        <div className="mx-auto max-w-[1600px] px-8 py-4">
          <Dashboard />
        </div>
      </main>
    </div>
  )
}
