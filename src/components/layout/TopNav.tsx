import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Store,
  Package,
  Boxes,
  Wallet,
  Megaphone,
  Star,
  Link2,
  FileBarChart2,
  Settings,
  LogOut,
  User,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Brand from '@/components/layout/Brand'
import SearchMenu from '@/components/layout/SearchMenu'
import NotificationsMenu from '@/components/layout/NotificationsMenu'

type Item = { icon: typeof Package; label: string; to: string }

const navItems: Item[] = [
  { icon: LayoutDashboard, label: 'Visão Geral', to: '/' },
  { icon: Store, label: 'Marketplaces', to: '/marketplaces' },
  { icon: Package, label: 'Produtos', to: '/produtos' },
  { icon: Boxes, label: 'Estoque', to: '/estoque' },
  { icon: Wallet, label: 'Financeiro', to: '/financeiro' },
  { icon: Megaphone, label: 'Marketing', to: '/marketing' },
  { icon: Star, label: 'Avaliações', to: '/avaliacoes' },
  { icon: Link2, label: 'Conexões', to: '/importacoes' },
  { icon: FileBarChart2, label: 'Relatórios', to: '/relatorios' },
]

// Unified top navigation bar. Replaces the old fixed sidebar (SideRail) on
// desktop, and the slim brand-only bar on mobile. Mobile section links still
// live in BottomNav; here on mobile we only show brand + actions.
export default function TopNav() {
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'US'

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rail-item group relative flex h-9 shrink-0 items-center gap-1 rounded-lg px-1.5 text-[12.5px] font-medium transition-colors lg:gap-1.5 lg:px-2 ${
      isActive ? 'topnav-item-active text-accent-blue' : 'text-text-muted hover:text-text-primary'
    }`

  return (
    <header className="topnav-surface fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-1.5 border-b border-border-subtle px-3 backdrop-blur-2xl md:h-16 md:px-4 lg:px-6">
      <Brand />

      <span className="mx-1 hidden h-6 w-px shrink-0 bg-border-subtle md:block" />

      {/* Section nav — desktop only, all items on one line, no horizontal scroll */}
      <nav className="hide-scrollbar hidden min-w-0 flex-1 items-center gap-0 overflow-x-auto md:flex">
        {navItems.map((item) => (
          <NavLink key={item.label} to={item.to} end={item.to === '/'} title={item.label} className={linkClass}>
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="hidden whitespace-nowrap sm:inline">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Spacer keeps actions pinned right on mobile, where nav is hidden */}
      <div className="min-w-0 flex-1 md:hidden" />

      {/* Actions cluster */}
      <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
        <SearchMenu />
        <NotificationsMenu />

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

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setShowUserMenu(v => !v)}
            title={user?.name ?? 'Usuário'}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-accent-violet/25 bg-bg-elevated text-xs font-bold text-accent-violet"
          >
            {initials}
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border-subtle bg-bg-card shadow-2xl">
              <div className="border-b border-border-subtle px-4 py-3">
                <p className="truncate text-sm font-medium text-text-primary">{user?.name}</p>
                <p className="truncate text-[11px] text-text-muted">{user?.email}</p>
              </div>
              <NavLink
                to="/configuracoes"
                onClick={() => setShowUserMenu(false)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[12.5px] font-medium text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
              >
                <User className="h-4 w-4" />
                Minha Conta
              </NavLink>
              <button
                onClick={() => { setShowUserMenu(false); logout() }}
                className="flex w-full cursor-pointer items-center gap-2.5 border-t border-border-subtle px-4 py-2.5 text-[12.5px] font-medium text-accent-rose transition-colors hover:bg-accent-rose/10"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
