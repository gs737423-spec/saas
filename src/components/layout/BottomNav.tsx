import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, Store, FileBarChart2 } from 'lucide-react'

type Item = { icon: typeof Package; label: string; to?: string }

const items: Item[] = [
  { icon: LayoutDashboard, label: 'Visão Geral', to: '/' },
  { icon: Package, label: 'Produtos', to: '/produtos' },
  { icon: Store, label: 'Canais' },
  { icon: FileBarChart2, label: 'Relatórios' },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border-subtle bg-bg-secondary/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      {items.map((item) => {
        const Icon = item.icon
        if (item.to) {
          return (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-accent-blue' : 'text-text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`flex h-8 w-12 items-center justify-center rounded-lg ${isActive ? 'bg-accent-blue/15' : ''}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          )
        }
        return (
          <button key={item.label} className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium text-text-muted">
            <span className="flex h-8 w-12 items-center justify-center rounded-lg">
              <Icon className="h-5 w-5" />
            </span>
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
