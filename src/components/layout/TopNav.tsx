import { NavLink } from 'react-router-dom'
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
  Search,
  Upload,
  Bell,
} from 'lucide-react'
import logoUrl from '@/assets/acelera-logo.png'

type Item = { icon: typeof Package; label: string; to: string }

const navItems: Item[] = [
  { icon: LayoutDashboard, label: 'Visão Geral', to: '/' },
  { icon: Store, label: 'Marketplaces', to: '/marketplaces' },
  { icon: Package, label: 'Produtos', to: '/produtos' },
  { icon: Boxes, label: 'Estoque', to: '/estoque' },
  { icon: Wallet, label: 'Financeiro', to: '/financeiro' },
  { icon: Megaphone, label: 'Marketing', to: '/marketing' },
  { icon: Star, label: 'Avaliações', to: '/avaliacoes' },
  { icon: DownloadCloud, label: 'Importações', to: '/importacoes' },
  { icon: FileBarChart2, label: 'Relatórios', to: '/relatorios' },
]

// Unified top navigation bar. Replaces the old fixed sidebar (SideRail) on
// desktop, and the slim brand-only bar on mobile. Mobile section links still
// live in BottomNav; here on mobile we only show brand + actions.
export default function TopNav() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rail-item group relative flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${
      isActive ? 'topnav-item-active text-accent-blue' : 'text-text-muted hover:text-text-primary'
    }`

  return (
    <header className="topnav-surface fixed inset-x-0 top-0 z-40 flex h-12 items-center gap-2 border-b border-border-subtle px-3 backdrop-blur-2xl md:h-14 md:px-4 lg:px-6">
      {/* Brand */}
      <div className="flex shrink-0 items-center gap-2.5">
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#0a0e1c] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] md:h-9 md:w-9">
          <img src={logoUrl} alt="Acelera" className="brand-logo h-full w-full scale-[1.6] object-cover" draggable={false} />
          <span className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/[0.06]" />
        </div>
        <div className="hidden min-w-0 flex-col leading-none sm:flex">
          <span className="truncate text-sm font-semibold text-text-primary">Acelera</span>
          <span className="truncate text-[10px] text-text-muted">Intelligence</span>
        </div>
      </div>

      <span className="mx-1 hidden h-6 w-px shrink-0 bg-border-subtle md:block" />

      {/* Section nav — desktop only, horizontally scrollable if the viewport is tight */}
      <nav className="hide-scrollbar hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto md:flex">
        {navItems.map((item) => (
          <NavLink key={item.label} to={item.to} end={item.to === '/'} className={linkClass}>
            {() => (
              <>
                <item.icon className="h-[17px] w-[17px] shrink-0" />
                <span className="whitespace-nowrap">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Spacer keeps actions pinned right on mobile, where nav is hidden */}
      <div className="min-w-0 flex-1 md:hidden" />

      {/* Actions cluster */}
      <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
        <button title="Buscar" className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-bg-card/60 text-text-muted transition-colors hover:text-text-primary">
          <Search className="h-[18px] w-[18px]" />
        </button>

        <button
          title="Importar / Conectar"
          className="hidden items-center gap-2 rounded-lg border border-accent-violet/25 bg-accent-violet/[0.12] px-3 text-accent-violet shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-all duration-200 hover:border-accent-violet/45 hover:bg-accent-violet/[0.18] lg:flex lg:h-9"
        >
          <Upload className="h-[17px] w-[17px]" />
          <span className="whitespace-nowrap text-sm font-semibold text-text-primary">Importar dados</span>
        </button>
        <button
          title="Importar / Conectar"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent-violet/25 bg-accent-violet/[0.12] text-accent-violet transition-colors hover:bg-accent-violet/[0.18] lg:hidden"
        >
          <Upload className="h-[18px] w-[18px]" />
        </button>

        <button title="Notificações" className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-bg-card/60 text-text-muted transition-colors hover:text-text-primary">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full border-2 border-bg-secondary bg-accent-rose" />
        </button>

        <span className="mx-0.5 hidden h-6 w-px shrink-0 bg-border-subtle sm:block" />

        <NavLink
          to="/configuracoes"
          title="Configurações"
          className={({ isActive }) =>
            `hidden h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-bg-card/60 text-text-muted transition-colors hover:text-text-primary sm:flex ${
              isActive ? 'text-accent-blue' : ''
            }`
          }
        >
          <Settings className="h-[18px] w-[18px]" />
        </NavLink>

        <button title="Gabriel · Admin" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent-violet/25 bg-bg-elevated text-xs font-bold text-accent-violet">
          GA
        </button>
      </div>
    </header>
  )
}
