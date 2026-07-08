import { Routes, Route } from 'react-router-dom'
import SideRail from '@/components/layout/SideRail'
import BottomNav from '@/components/layout/BottomNav'
import TopNav from '@/components/layout/TopNav'
import Dashboard from '@/pages/Dashboard'
import Produtos from '@/pages/Produtos'

export default function App() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-bg-primary">
      <SideRail />
      <TopNav />
      <main className="pt-14 md:ml-16 md:pt-16">
        <div className="mx-auto max-w-[1600px] px-3 pb-24 pt-3 sm:px-6 sm:pt-4 md:pb-4 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/produtos" element={<Produtos />} />
          </Routes>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
