import { useState } from 'react'
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
  Zap,
  Search,
  Upload,
  Bell,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react'
import logoUrl from '@/assets/acelera-logo.png'

type Item = { icon: typeof Zap; label: string; to?: string }

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

export default function SideRail() {
  const [expanded, setExpanded] = useState(false)

  const rowClass = (active: boolean) =>
    `rail-item group flex h-11 cursor-pointer items-center rounded-xl ${
      expanded ? 'w-full gap-3 px-3' : 'w-11 justify-center'
    } ${active ? 'rail-item-active text-accent-blue' : 'text-text-muted hover:text-text-primary'}`

  const Tooltip = ({ label }: { label: string }) =>
    !expanded ? (
      <span className="pointer-events-none absolute left-14 z-50 whitespace-nowrap rounded-lg border border-border-default bg-bg-card px-3 py-1.5 text-xs font-medium text-text-primary opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100">
        {label}
      </span>
    ) : null

  return (
    <aside
      className={`rail-surface fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-border-subtle py-3 transition-[width] duration-300 ease-out md:flex ${
        expanded ? 'w-56 px-3' : 'w-16 items-center px-0'
      }`}
    >
      {/* Brand */}
      <div className={`mb-3 flex items-center ${expanded ? 'w-full gap-3 px-1' : 'justify-center'}`}>
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#0a0e1c] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_4px_12px_-4px_rgba(0,0,0,0.65)]">
          <img src={logoUrl} alt="Acelera" className="brand-logo h-full w-full scale-[1.6] object-cover" draggable={false} />
          <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/[0.06]" />
        </div>
        {expanded && (
          <div className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-sm font-semibold text-text-primary">Acelera</span>
            <span className="truncate text-[10px] text-text-muted">Intelligence</span>
          </div>
        )}
      </div>

      {/* Action cluster: search · import · notifications */}
      <div className={`flex flex-col gap-1 border-t border-border-subtle pt-3 ${expanded ? '' : 'items-center'}`}>
        <button title={expanded ? undefined : 'Buscar'} className={rowClass(false)}>
          <Search className="h-5 w-5 shrink-0" />
          {expanded && (
            <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">Buscar</span>
              <kbd className="rounded-md border border-border-default bg-bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-text-muted">⌘K</kbd>
            </span>
          )}
          <Tooltip label="Buscar" />
        </button>

        <button
          title={expanded ? undefined : 'Importar / Conectar'}
          className={`group relative flex h-11 cursor-pointer items-center rounded-xl border border-accent-violet/25 bg-accent-violet/[0.12] text-accent-violet shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] outline-none transition-all duration-200 hover:border-accent-violet/45 hover:bg-accent-violet/[0.18] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_0_22px_-6px_rgba(144,97,249,0.55)] focus-visible:shadow-[0_0_0_2px_rgba(144,97,249,0.55)] ${
            expanded ? 'w-full gap-3 px-3' : 'w-11 justify-center'
          }`}
        >
          <Upload className="h-5 w-5 shrink-0" />
          {expanded && <span className="truncate text-sm font-semibold text-text-primary">Importar dados</span>}
          <Tooltip label="Importar / Conectar" />
        </button>

        <button title={expanded ? undefined : 'Notificações'} className={rowClass(false)}>
          <span className="relative">
            <Bell className="h-5 w-5 shrink-0" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-bg-secondary bg-accent-rose" />
          </span>
          {expanded && <span className="truncate text-sm font-medium">Notificações</span>}
          <Tooltip label="Notificações" />
        </button>
      </div>

      {/* Main navigation */}
      <nav className="mt-3 flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden border-t border-border-subtle pt-3">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to!}
            end={item.to === '/'}
            title={expanded ? undefined : item.label}
            className={({ isActive }) => rowClass(isActive)}
          >
            {() => (
              <>
                <item.icon className="h-5 w-5 shrink-0" />
                {expanded && <span className="truncate text-sm font-medium">{item.label}</span>}
                <Tooltip label={item.label} />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: settings · profile · collapse */}
      <div className={`mt-2 flex flex-col gap-1 border-t border-border-subtle pt-2 ${expanded ? '' : 'items-center'}`}>
        <NavLink
          to="/configuracoes"
          title={expanded ? undefined : 'Configurações'}
          className={({ isActive }) => rowClass(isActive)}
        >
          {() => (
            <>
              <Settings className="h-5 w-5 shrink-0" />
              {expanded && <span className="truncate text-sm font-medium">Configurações</span>}
              <Tooltip label="Configurações" />
            </>
          )}
        </NavLink>

        <button
          title={expanded ? undefined : 'Gabriel · Admin'}
          className={`rail-item group flex h-11 cursor-pointer items-center rounded-xl text-text-muted ${
            expanded ? 'w-full gap-3 px-2.5' : 'w-11 justify-center'
          }`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent-violet/25 bg-bg-elevated text-xs font-bold text-accent-violet">
            GA
          </span>
          {expanded && (
            <span className="flex min-w-0 flex-col items-start leading-none">
              <span className="text-xs font-medium text-text-primary">Gabriel</span>
              <span className="text-[10px] text-text-muted">Admin</span>
            </span>
          )}
          <Tooltip label="Gabriel · Admin" />
        </button>

        <button
          onClick={() => setExpanded((v) => !v)}
          title={expanded ? undefined : 'Expandir'}
          className={`rail-item group flex h-11 cursor-pointer items-center rounded-xl text-text-muted hover:text-text-primary ${
            expanded ? 'w-full gap-3 px-3' : 'w-11 justify-center'
          }`}
        >
          {expanded ? <PanelLeftClose className="h-5 w-5 shrink-0" /> : <PanelLeftOpen className="h-5 w-5 shrink-0" />}
          {expanded && <span className="truncate text-sm font-medium">Recolher</span>}
          <Tooltip label="Expandir" />
        </button>
      </div>
    </aside>
  )
}
