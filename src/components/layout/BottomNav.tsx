import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Store,
  FileBarChart2,
  MoreHorizontal,
  Boxes,
  Wallet,
  Megaphone,
  Star,
  DownloadCloud,
  Settings,
  HelpCircle,
  X,
} from 'lucide-react'

type Primary = { icon: typeof Package; label: string; to?: string }

const primary: Primary[] = [
  { icon: LayoutDashboard, label: 'Visão Geral', to: '/' },
  { icon: Package, label: 'Produtos', to: '/produtos' },
  { icon: Store, label: 'Canais' },
  { icon: FileBarChart2, label: 'Relatórios' },
]

const secondary = [
  { icon: Boxes, label: 'Estoque' },
  { icon: Wallet, label: 'Financeiro' },
  { icon: Megaphone, label: 'Marketing' },
  { icon: Star, label: 'Avaliações' },
  { icon: DownloadCloud, label: 'Importações' },
  { icon: Settings, label: 'Configurações' },
  { icon: HelpCircle, label: 'Ajuda' },
]

export default function BottomNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* "Mais" drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-border-subtle bg-bg-secondary pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-2xl">
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border-default" />
            <div className="flex items-center justify-between px-5 pb-3 pt-4">
              <h3 className="text-sm font-semibold text-text-primary">Mais seções</h3>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:text-text-primary"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 px-4 pb-2">
              {secondary.map((s) => {
                const Icon = s.icon
                return (
                  <button
                    key={s.label}
                    onClick={() => setOpen(false)}
                    className="flex flex-col items-center gap-2 rounded-xl border border-border-subtle/60 bg-bg-card/40 p-3 text-[11px] font-medium text-text-secondary transition-colors hover:border-border-default hover:text-text-primary"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-card-hover text-text-secondary">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border-subtle bg-bg-secondary/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        {primary.map((item) => {
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

        {/* Mais */}
        <button
          onClick={() => setOpen(true)}
          className={`flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
            open ? 'text-accent-blue' : 'text-text-muted'
          }`}
        >
          <span className={`flex h-8 w-12 items-center justify-center rounded-lg ${open ? 'bg-accent-blue/15' : ''}`}>
            <MoreHorizontal className="h-5 w-5" />
          </span>
          Mais
        </button>
      </nav>
    </>
  )
}
