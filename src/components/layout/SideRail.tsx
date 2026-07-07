import { useState } from 'react'
import {
  LayoutDashboard,
  Store,
  Package,
  Boxes,
  Wallet,
  Megaphone,
  Star,
  DownloadCloud,
  FileBarChart2,
  Settings,
  Zap,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Visão Geral', active: true },
  { icon: Store, label: 'Marketplaces' },
  { icon: Package, label: 'Produtos' },
  { icon: Boxes, label: 'Estoque' },
  { icon: Wallet, label: 'Financeiro' },
  { icon: Megaphone, label: 'Marketing' },
  { icon: Star, label: 'Avaliações' },
  { icon: DownloadCloud, label: 'Importações' },
  { icon: FileBarChart2, label: 'Relatórios' },
]

const bottomItem = { icon: Settings, label: 'Configurações' }

export default function SideRail() {
  const [expanded, setExpanded] = useState(false)

  const NavButton = ({ item }: { item: { icon: typeof Zap; label: string; active?: boolean } }) => (
    <button
      title={expanded ? undefined : item.label}
      className={`group relative flex h-11 cursor-pointer items-center rounded-xl transition-all duration-200 ${
        expanded ? 'w-full gap-3 px-3' : 'w-11 justify-center'
      } ${
        item.active
          ? 'bg-accent-blue/15 text-accent-blue'
          : 'text-text-muted hover:bg-bg-card-hover hover:text-text-secondary'
      }`}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      {expanded && <span className="truncate text-sm font-medium">{item.label}</span>}
      {item.active && !expanded && (
        <span className="absolute -left-[9px] h-5 w-1 rounded-full bg-accent-blue" />
      )}
      {!expanded && (
        <span className="pointer-events-none absolute left-14 z-50 whitespace-nowrap rounded-lg border border-border-subtle bg-bg-card px-3 py-1.5 text-xs font-medium text-text-primary opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100">
          {item.label}
        </span>
      )}
    </button>
  )

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border-subtle bg-bg-secondary py-4 transition-[width] duration-300 ease-out ${
        expanded ? 'w-56 px-3 shadow-2xl shadow-black/50' : 'w-16 items-center px-0'
      }`}
    >
      {/* Brand */}
      <div className={`mb-6 flex items-center ${expanded ? 'w-full gap-3 px-1' : 'justify-center'}`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-blue to-accent-violet shadow-[0_0_20px_-4px_rgba(76,130,247,0.7)]">
          <Zap className="h-5 w-5 text-white" />
        </div>
        {expanded && (
          <div className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-sm font-semibold text-text-primary">Acelera</span>
            <span className="truncate text-[10px] text-text-muted">Intelligence</span>
          </div>
        )}
      </div>

      {/* Main navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => (
          <NavButton key={item.label} item={item} />
        ))}
      </nav>

      {/* Bottom: settings + collapse toggle */}
      <div className="mt-2 flex flex-col gap-1 border-t border-border-subtle pt-2">
        <NavButton item={bottomItem} />
        <button
          onClick={() => setExpanded((v) => !v)}
          title={expanded ? undefined : 'Expandir'}
          className={`group relative flex h-11 cursor-pointer items-center rounded-xl text-text-muted transition-all duration-200 hover:bg-bg-card-hover hover:text-text-secondary ${
            expanded ? 'w-full gap-3 px-3' : 'w-11 justify-center'
          }`}
        >
          {expanded ? <PanelLeftClose className="h-5 w-5 shrink-0" /> : <PanelLeftOpen className="h-5 w-5 shrink-0" />}
          {expanded && <span className="truncate text-sm font-medium">Recolher</span>}
          {!expanded && (
            <span className="pointer-events-none absolute left-14 z-50 whitespace-nowrap rounded-lg border border-border-subtle bg-bg-card px-3 py-1.5 text-xs font-medium text-text-primary opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100">
              Expandir
            </span>
          )}
        </button>
      </div>
    </aside>
  )
}
